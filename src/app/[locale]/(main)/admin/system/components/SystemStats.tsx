"use client";

import { useEffect, useMemo, useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import CountryBubbleMap from "@/components/stats/CountryBubbleMap";
import { formatNumber } from "@/lib/utils";
import { getCurrentStatsPeriod, getRecentStatsPeriods, inferStatsPeriodUnit, type StatsPeriodUnit } from "@/lib/stats-period";
import { BarChart, Coins, DollarSign, Eye, Play, TrendingUp, Users } from "lucide-react";
import { useRouter, useSearchParams } from "next/navigation";

const unitLabels: Record<StatsPeriodUnit, string> = {
  daily: "Day",
  weekly: "Week",
  monthly: "Month",
};

export function SystemStats() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const initialPeriod = searchParams.get("period") || getCurrentStatsPeriod("weekly");
  const initialUnit = inferStatsPeriodUnit(initialPeriod);
  const [periodUnit, setPeriodUnit] = useState<StatsPeriodUnit>(initialUnit);
  const [selectedPeriod, setSelectedPeriod] = useState(initialPeriod === "current" ? getCurrentStatsPeriod(initialUnit) : initialPeriod);
  const [cumulativeData, setCumulativeData] = useState<any>(null);
  const [statsData, setStatsData] = useState<any>(null);
  const [reportData, setReportData] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isCumulativeLoading, setIsCumulativeLoading] = useState(false);
  const [mounted, setMounted] = useState(false);

  const periodOptions = useMemo(() => {
    const options = getRecentStatsPeriods(periodUnit, 12, "en");
    return options.some((option) => option.value === selectedPeriod)
      ? options
      : [{ value: selectedPeriod, key: selectedPeriod, label: selectedPeriod }, ...options];
  }, [periodUnit, selectedPeriod]);

  const updateUrl = (period: string, unit = periodUnit) => {
    const params = new URLSearchParams(searchParams);
    params.set("tab", "stats");
    params.set("period", period);
    params.set("unit", unit);
    router.push(`?${params.toString()}`, { scroll: false });
  };

  const fetchCumulative = async () => {
    setIsCumulativeLoading(true);
    try {
      const [statsResponse, cfResponse] = await Promise.all([
        fetch(`/api/stats/admin?period=all`, { cache: "no-store" }),
        fetch(`/api/stats/cloudflare?period=all`, { cache: "no-store" }),
      ]);
      const statsResult = statsResponse.ok ? await statsResponse.json() : null;
      const cfResult = cfResponse.ok ? await cfResponse.json() : null;
      const nextStats = statsResult?.success ? statsResult.data : null;

      if (cfResult?.success && nextStats) {
        nextStats.viewerDistribution = cfResult.data?.viewerDistribution || [];
        nextStats.cloudflareSource = cfResult.data?.source || "-";
      }

      setCumulativeData(nextStats);
    } finally {
      setIsCumulativeLoading(false);
    }
  };

  const fetchStatistics = async (period: string) => {
    setIsLoading(true);
    try {
      const [statsResponse, reportResponse] = await Promise.all([
        fetch(`/api/stats/admin?period=${period}`, { cache: "no-store" }),
        fetch(`/api/stats/reports?period=${period}`, { cache: "no-store" }),
      ]);
      const statsResult = statsResponse.ok ? await statsResponse.json() : null;
      const reportResult = reportResponse.ok ? await reportResponse.json() : null;
      const nextStats = statsResult?.success ? statsResult.data : null;

      setStatsData(nextStats);
      setReportData(reportResult?.success ? reportResult.data : null);
    } finally {
      setIsLoading(false);
    }
  };

  const handleUnitChange = (unit: StatsPeriodUnit) => {
    const period = getCurrentStatsPeriod(unit);
    setPeriodUnit(unit);
    setSelectedPeriod(period);
    updateUrl(period, unit);
    fetchStatistics(period);
  };

  const handlePeriodChange = (period: string) => {
    setSelectedPeriod(period);
    updateUrl(period);
    fetchStatistics(period);
  };

  useEffect(() => {
    setMounted(true);
    fetchCumulative();
    fetchStatistics(selectedPeriod);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const cards = [
    { title: "Users", icon: Users, value: `${formatNumber(cumulativeData?.users?.total || 0)} / ${formatNumber(cumulativeData?.users?.yesterdayNew || 0)}`, note: "Total / Yesterday" },
    { title: "Content", icon: BarChart, value: `${formatNumber(cumulativeData?.content?.totalPosts || 0)} / ${formatNumber(cumulativeData?.content?.totalVideos || 0)} / ${formatNumber(cumulativeData?.content?.totalPaidVideos || 0)}`, note: "Post / Videos / Paid" },
    { title: "Paid Streaming", icon: Play, value: `${formatNumber(cumulativeData?.cumulative?.subscriptionViews ?? 0)} / ${formatNumber(cumulativeData?.cumulative?.coinViews ?? 0)}`, note: "Sub / Coin" },
    { title: "Points", icon: Coins, value: `${formatNumber(cumulativeData?.cumulative?.revenuePoints || 0)} / ${formatNumber(cumulativeData?.cumulative?.creatorPaidPoints || 0)} / ${formatNumber(cumulativeData?.cumulative?.agencyPaidPoints || 0)}`, note: "Revenue Points / Creator / Agency" },
    { title: "Revenue", icon: DollarSign, value: `${formatNumber(cumulativeData?.cumulative?.totalRevenue || 0)} / ${formatNumber(cumulativeData?.cumulative?.yesterdayRevenue || 0)}`, note: "Total Revenue / Yesterday" },
  ];

  if (!mounted) {
    return <SystemStatsInitialSkeleton />;
  }

  return (
    <div className="space-y-2">
      <div className="grid gap-2 md:grid-cols-2 xl:grid-cols-5">
        {isCumulativeLoading ? (
          <>
            <Skeleton className="h-28 rounded-lg" />
            <Skeleton className="h-28 rounded-lg" />
            <Skeleton className="h-28 rounded-lg" />
            <Skeleton className="h-28 rounded-lg" />
            <Skeleton className="h-28 rounded-lg" />
          </>
        ) : (
          cards.map((card) => {
            const Icon = card.icon;
            return (
              <Card key={card.title}>
                <CardHeader className="pb-2">
                  <CardTitle className="flex items-center text-sm font-medium">
                    <Icon className="mr-2 h-4 w-4" />
                    {card.title}
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{card.value}</div>
                  <p className="mt-1 text-xs text-muted-foreground">{card.note}</p>
                </CardContent>
              </Card>
            );
          })
        )}
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center text-base">
            <Eye className="mr-2 h-4 w-4" />
            Global Streaming Map (Free + Paid)
          </CardTitle>
          <p className="text-xs text-muted-foreground">Cumulative through the latest stored Cloudflare worker result. Timezone: Asia/Seoul.</p>
        </CardHeader>
        <CardContent>
          {isCumulativeLoading ? (
            <Skeleton className="h-[360px] rounded-md" />
          ) : (
            <CountryBubbleMap
              data={cumulativeData?.viewerDistribution || []}
              metricLabel="Total streaming"
              emptyLabel="No stored Cloudflare country stats available."
            />
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Stored Statistics Lookup</CardTitle>
          <p className="text-xs text-muted-foreground">Timezone: {statsData?.timezone || cumulativeData?.timezone || "Asia/Seoul"}</p>
        </CardHeader>
        <CardContent className="flex flex-col gap-2 md:flex-row md:items-end">
          <div className="grid grid-cols-3 gap-2 md:w-72">
            {(Object.keys(unitLabels) as StatsPeriodUnit[]).map((unit) => (
              <Button key={unit} variant={periodUnit === unit ? "default" : "outline"} onClick={() => handleUnitChange(unit)}>
                {unitLabels[unit]}
              </Button>
            ))}
          </div>
          <div className="w-full md:max-w-sm">
            <Select value={selectedPeriod} onValueChange={handlePeriodChange}>
              <SelectTrigger>
                <SelectValue placeholder="Select period" />
              </SelectTrigger>
              <SelectContent>
                {periodOptions.map((option) => (
                  <SelectItem key={option.value} value={option.value}>
                    {option.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <Button onClick={() => fetchStatistics(selectedPeriod)}>Search</Button>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center text-base">
            <TrendingUp className="mr-2 h-4 w-4" />
            Stored Settlement Report
          </CardTitle>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <Skeleton className="h-[220px] rounded-md" />
          ) : reportData ? (
            <div className="space-y-2">
              <div className="grid gap-2 md:grid-cols-2 lg:grid-cols-3">
                {(reportData.cards || []).map((item: any) => (
                  <div key={item.title} className="rounded-md border p-4">
                    <p className="text-sm font-medium">{item.title}</p>
                    <p className="mt-2 text-xl font-semibold">{item.value}</p>
                    <p className="mt-1 text-xs text-muted-foreground">{item.note}</p>
                  </div>
                ))}
              </div>
              <ReportList title="Top Paid Posts" items={reportData.topPaidPosts || reportData.items || []} />
              <ViewBasisTable items={reportData.viewBasisDetails || []} />
              <ReportList title="Top Creator Payouts" items={reportData.topCreators || []} nameKey="name" />
              <ReportList title="Top Marketer Payouts (Excluding Masters)" items={reportData.topAgencyMembers || []} nameKey="name" />
              <PostPayoutTable items={reportData.items || []} />
              <BreakdownList title="Agency Payout by Type" items={reportData.agencyTypeBreakdown || []} />
              <PayoutDetailTable title="Creator Payout Detail" items={reportData.creatorPayoutDetails || []} showPost />
              <PayoutDetailTable title="Agency Payout Detail" items={reportData.agencyPayoutDetails || []} showPost />
            </div>
          ) : (
            <div className="flex h-[220px] items-center justify-center rounded-md bg-muted p-4 text-sm text-muted-foreground">
              No stored report result is available.
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

function ViewBasisTable({ items }: { items: any[] }) {
  return (
    <div className="overflow-hidden rounded-md border">
      <div className="border-b bg-muted p-3 text-sm font-medium">Paid View Basis Detail</div>
      <div className="hidden grid-cols-[minmax(0,1.2fr)_minmax(0,1fr)_100px_80px_80px] gap-2 border-b bg-muted/60 p-3 text-sm font-medium md:grid">
        <div>Post</div>
        <div>Video</div>
        <div>Method</div>
        <div className="text-right">Viewers</div>
        <div className="text-right">Views</div>
      </div>
      {items.length > 0 ? items.map((item: any, index: number) => (
        <div key={`${item.postId}-${item.videoId}-${item.accessMethod}-${index}`} className="grid gap-2 border-b p-3 text-sm last:border-0 md:grid-cols-[minmax(0,1.2fr)_minmax(0,1fr)_100px_80px_80px]">
          <div className="min-w-0 truncate font-medium" title={item.postTitle || item.postId || "-"}>{item.postTitle || item.postId || "-"}</div>
          <div className="min-w-0 truncate" title={item.videoId || "-"}>{item.videoLabel || item.videoId || "-"}</div>
          <div className="truncate">{item.accessMethod || "-"}</div>
          <div className="flex justify-between md:block md:text-right">
            <span className="text-muted-foreground md:hidden">Viewers</span>
            <span>{formatNumber(item.viewers || 0)}</span>
          </div>
          <div className="flex justify-between md:block md:text-right">
            <span className="text-muted-foreground md:hidden">Views</span>
            <span>{formatNumber(item.views || 0)}</span>
          </div>
        </div>
      )) : (
        <div className="p-3 text-sm text-muted-foreground">
          No stored video-level view detail rows. This appears after viewgroup writes `grouped_view_details`.
        </div>
      )}
    </div>
  );
}

function PostPayoutTable({ items }: { items: any[] }) {
  return (
    <div className="overflow-hidden rounded-md border">
      <div className="hidden grid-cols-[minmax(0,1.5fr)_100px_100px_110px] gap-2 border-b bg-muted p-3 text-sm font-medium md:grid">
        <div>Post</div>
        <div className="text-right">Sub Views</div>
        <div className="text-right">Coin Views</div>
        <div className="text-right">Points</div>
      </div>
      {items.map((item: any) => (
        <div key={item.id || item.title} className="grid gap-2 border-b p-3 text-sm last:border-0 md:grid-cols-[minmax(0,1.5fr)_100px_100px_110px]">
          <div className="min-w-0 truncate font-medium" title={item.title || item.id || "-"}>{item.title || item.id || "-"}</div>
          <div className="flex justify-between md:block md:text-right">
            <span className="text-muted-foreground md:hidden">Sub Views</span>
            <span>{formatNumber(item.subscriptionViews || 0)}</span>
          </div>
          <div className="flex justify-between md:block md:text-right">
            <span className="text-muted-foreground md:hidden">Coin Views</span>
            <span>{formatNumber(item.coinViews || 0)}</span>
          </div>
          <div className="flex justify-between md:block md:text-right">
            <span className="text-muted-foreground md:hidden">Points</span>
            <span>{formatNumber(item.points || 0)} P</span>
          </div>
        </div>
      ))}
      <div className="grid gap-2 bg-muted p-3 text-sm font-medium md:grid-cols-[minmax(0,1.5fr)_100px_100px_110px]">
        <div>Total</div>
        <div className="md:text-right">{formatNumber(items.reduce((sum: number, item: any) => sum + Number(item.subscriptionViews || 0), 0))}</div>
        <div className="md:text-right">{formatNumber(items.reduce((sum: number, item: any) => sum + Number(item.coinViews || 0), 0))}</div>
        <div className="md:text-right">{formatNumber(items.reduce((sum: number, item: any) => sum + Number(item.points || 0), 0))} P</div>
      </div>
    </div>
  );
}

function BreakdownList({ title, items }: { title: string; items: any[] }) {
  return (
    <div className="rounded-md border">
      <div className="border-b bg-muted p-3 text-sm font-medium">{title}</div>
      {items.length > 0 ? (
        <div className="divide-y">
          {items.map((item: any) => (
            <div key={item.id || item.label} className="grid grid-cols-[minmax(0,1fr)_90px_90px_110px] gap-2 p-3 text-sm">
              <div className="min-w-0 truncate" title={item.label || item.id}>{item.label || item.id}</div>
              <div className="text-right">{formatNumber(item.subscriptionViews || 0)}</div>
              <div className="text-right">{formatNumber(item.coinViews || 0)}</div>
              <div className="text-right">{formatNumber(item.points || 0)} P</div>
            </div>
          ))}
        </div>
      ) : (
        <div className="p-3 text-sm text-muted-foreground">No stored agency payout rows.</div>
      )}
    </div>
  );
}

function PayoutDetailTable({ title, items, showPost = false }: { title: string; items: any[]; showPost?: boolean }) {
  const desktopGrid = showPost
    ? "md:grid-cols-[minmax(0,1.1fr)_120px_minmax(0,1.2fr)_80px_80px_100px]"
    : "md:grid-cols-[minmax(0,1.2fr)_140px_80px_80px_110px]";

  return (
    <div className="overflow-hidden rounded-md border">
      <div className="border-b bg-muted p-3 text-sm font-medium">{title}</div>
      <div className={`hidden gap-2 border-b bg-muted/60 p-3 text-sm font-medium md:grid ${desktopGrid}`}>
        <div>Recipient</div>
        <div>Type</div>
        {showPost && <div>Post</div>}
        <div className="text-right">Sub</div>
        <div className="text-right">Coin</div>
        <div className="text-right">Points</div>
      </div>
      {items.length > 0 ? items.map((item: any, index: number) => (
        <div key={`${item.recipientId}-${item.postId}-${item.type}-${index}`} className={`grid gap-2 border-b p-3 text-sm last:border-0 ${desktopGrid}`}>
          <div className="min-w-0 truncate font-medium" title={item.recipientName || item.recipientId || "-"}>{item.recipientName || item.recipientId || "-"}</div>
          <div className="truncate" title={item.label || item.type || "-"}>{item.label || item.type || "-"}</div>
          {showPost && <div className="min-w-0 truncate" title={item.postTitle || item.postId || "-"}>{item.postTitle || item.postId || "-"}</div>}
          <div className="flex justify-between md:block md:text-right">
            <span className="text-muted-foreground md:hidden">Sub</span>
            <span>{formatNumber(item.subscriptionViews || 0)}</span>
          </div>
          <div className="flex justify-between md:block md:text-right">
            <span className="text-muted-foreground md:hidden">Coin</span>
            <span>{formatNumber(item.coinViews || 0)}</span>
          </div>
          <div className="flex justify-between md:block md:text-right">
            <span className="text-muted-foreground md:hidden">Points</span>
            <span>{formatNumber(item.totalPoints || 0)} P</span>
          </div>
        </div>
      )) : (
        <div className="p-3 text-sm text-muted-foreground">No stored payout detail rows.</div>
      )}
    </div>
  );
}

function SystemStatsInitialSkeleton() {
  return (
    <div className="space-y-2">
      <div className="grid gap-2 md:grid-cols-2 xl:grid-cols-5">
        <Skeleton className="h-28 rounded-lg" />
        <Skeleton className="h-28 rounded-lg" />
        <Skeleton className="h-28 rounded-lg" />
        <Skeleton className="h-28 rounded-lg" />
        <Skeleton className="h-28 rounded-lg" />
      </div>
      <Skeleton className="h-[360px] rounded-lg" />
      <Skeleton className="h-24 rounded-lg" />
      <Skeleton className="h-[260px] rounded-lg" />
    </div>
  );
}

function ReportList({ title, items, nameKey = "title" }: { title: string; items: any[]; nameKey?: string }) {
  return (
    <div className="rounded-md border">
      <div className="border-b bg-muted p-3 text-sm font-medium">{title}</div>
      <div className="divide-y">
        {items.length > 0 ? items.slice(0, 5).map((item, index) => (
          <div key={`${item.id || item[nameKey] || index}`} className="grid grid-cols-[32px_minmax(0,1fr)_90px_90px] gap-2 p-3 text-sm">
            <div className="text-muted-foreground">{index + 1}</div>
            <div className="min-w-0 truncate" title={item[nameKey] || item.id || "-"}>{item[nameKey] || item.id || "-"}</div>
            <div className="text-right">{formatNumber(item.views || item.totalViews || 0)}</div>
            <div className="text-right">{formatNumber(item.points || item.totalPoints || 0)} P</div>
          </div>
        )) : (
          <div className="p-3 text-sm text-muted-foreground">No stored result.</div>
        )}
      </div>
    </div>
  );
}
