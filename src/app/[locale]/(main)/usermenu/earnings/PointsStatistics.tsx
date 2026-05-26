"use client";

import { useEffect, useMemo, useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import CountryBubbleMap from "@/components/stats/CountryBubbleMap";
import { formatNumber } from "@/lib/utils";
import { getCurrentStatsPeriod, getRecentStatsPeriods, inferStatsPeriodUnit, type StatsPeriodUnit } from "@/lib/stats-period";
import { useLocale, useTranslations } from "next-intl";
import { useRouter, useSearchParams } from "next/navigation";

interface PointsStatisticsProps {
  userId: string;
  userRole: number;
  type?: "creator" | "agency";
}

const units: StatsPeriodUnit[] = ["weekly", "monthly"];

export default function PointsStatistics({ userId, type }: PointsStatisticsProps) {
  const t = useTranslations("Earnings");
  const locale = useLocale();
  const router = useRouter();
  const searchParams = useSearchParams();
  const initialPeriod = searchParams.get("period") || getCurrentStatsPeriod("weekly");
  const inferredInitialUnit = inferStatsPeriodUnit(initialPeriod);
  const initialUnit = inferredInitialUnit === "daily" ? "weekly" : inferredInitialUnit;
  const normalizedInitialPeriod = inferredInitialUnit === "daily" ? getCurrentStatsPeriod("weekly") : initialPeriod;
  const [periodUnit, setPeriodUnit] = useState<StatsPeriodUnit>(initialUnit);
  const [selectedPeriod, setSelectedPeriod] = useState(normalizedInitialPeriod === "current" ? getCurrentStatsPeriod(initialUnit) : normalizedInitialPeriod);
  const [cumulativeData, setCumulativeData] = useState<any>(null);
  const [statsData, setStatsData] = useState<any>(null);
  const [detailData, setDetailData] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isCumulativeLoading, setIsCumulativeLoading] = useState(false);
  const [showCumulativeDetails, setShowCumulativeDetails] = useState(false);
  const [mounted, setMounted] = useState(false);
  const isCreator = type === "creator";

  const periodOptions = useMemo(() => {
    const options = getRecentStatsPeriods(periodUnit, 12, locale);
    return options.some((option) => option.value === selectedPeriod)
      ? options
      : [{ value: selectedPeriod, key: selectedPeriod, label: selectedPeriod }, ...options];
  }, [locale, periodUnit, selectedPeriod]);

  const updateUrl = (period: string, unit = periodUnit) => {
    const params = new URLSearchParams(searchParams);
    params.set("tab", "statistics");
    params.set("period", period);
    params.set("unit", unit);
    router.push(`?${params.toString()}`, { scroll: false });
  };

  const fetchCumulative = async () => {
    setIsCumulativeLoading(true);
    try {
      const endpoint = isCreator ? "/api/stats/uploader" : "/api/stats/agency";
      const [statsResponse, cfResponse] = await Promise.all([
        fetch(`${endpoint}?userId=${userId}&period=all`, { cache: "no-store" }),
        isCreator
          ? fetch(`/api/stats/cloudflare?userId=${userId}&period=all&fallbackPeriod=${encodeURIComponent(selectedPeriod)}`, { cache: "no-store" })
          : Promise.resolve(null),
      ]);
      const statsResult = statsResponse.ok ? await statsResponse.json() : null;
      const cfResult = cfResponse && "json" in cfResponse && cfResponse.ok ? await cfResponse.json() : null;
      const nextStats = statsResult?.success ? statsResult.data : null;

      if (cfResult?.success && nextStats) {
        nextStats.viewerDistribution = cfResult.data?.viewerDistribution || [];
      }

      setCumulativeData(nextStats);
    } finally {
      setIsCumulativeLoading(false);
    }
  };

  const fetchStatistics = async (period: string) => {
    setIsLoading(true);
    try {
      const endpoint = isCreator ? "/api/stats/uploader" : "/api/stats/agency";
      const [statsResponse, detailResponse] = await Promise.all([
        fetch(`${endpoint}?userId=${userId}&period=${period}`, { cache: "no-store" }),
        fetch(`/api/stats/weekly?userId=${userId}&period=${period}&type=${isCreator ? "uploader" : "agency"}`, { cache: "no-store" }),
      ]);

      const statsResult = statsResponse.ok ? await statsResponse.json() : null;
      const detailResult = detailResponse.ok ? await detailResponse.json() : null;

      const nextStats = statsResult?.success ? statsResult.data : null;

      setStatsData(nextStats);
      setDetailData(detailResult?.success ? detailResult.data : null);
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

  const summaryCards = isCreator
    ? [
        { title: t("content"), value: `${formatNumber(cumulativeData?.postsCount || 0)} / ${formatNumber(cumulativeData?.videosCount || 0)} / ${formatNumber(cumulativeData?.paidVideosCount || 0)}`, note: t("postVideosPaid") },
        { title: t("views"), value: `${formatNumber(cumulativeData?.cumulative?.subscriptionViews ?? cumulativeData?.subscriptionViews ?? 0)} / ${formatNumber(cumulativeData?.cumulative?.coinViews ?? cumulativeData?.coinViews ?? 0)}`, note: t("subscriptionViewsCoinViews") },
        { title: t("points"), value: `${formatNumber(cumulativeData?.currentPoints ?? cumulativeData?.totalPoints ?? 0)} P`, note: t("cumulativePaidPoints") },
      ]
    : [
        { title: t("referralsCompact"), value: `${formatNumber(cumulativeData?.totalReferredUsers || 0)}/${formatNumber(cumulativeData?.todayReferredUsers || 0)}`, note: t("referralsCompactDesc") },
        { title: t("viewActivity"), value: `${formatNumber(cumulativeData?.cumulative?.subscriptionViews ?? cumulativeData?.subscriptionViews ?? 0)} / ${formatNumber(cumulativeData?.cumulative?.coinViews ?? cumulativeData?.coinViews ?? 0)}`, note: t("subscriptionViewsCoinViews") },
        { title: t("points"), value: `${formatNumber(cumulativeData?.currentPoints ?? cumulativeData?.totalPoints ?? 0)} P`, note: t("cumulativePaidPoints") },
      ];

  if (!mounted) {
    return <PointsStatsInitialSkeleton />;
  }

  return (
    <div className="space-y-2">
      <div className="grid gap-2 md:grid-cols-3">
        {isCumulativeLoading ? (
          <>
            <Skeleton className="h-28 rounded-lg" />
            <Skeleton className="h-28 rounded-lg" />
            <Skeleton className="h-28 rounded-lg" />
          </>
        ) : (
          summaryCards.map((card) => (
            <Card key={card.title}>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium">{card.title}</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{card.value}</div>
                <p className="mt-1 text-xs text-muted-foreground">{card.note}</p>
              </CardContent>
            </Card>
          ))
        )}
      </div>

      {isCreator && (
        <Card>
          <CardHeader className="flex flex-col gap-2 md:flex-row md:items-center md:justify-between">
            <div>
              <CardTitle className="text-base">{t("cumulativePaidViewDetails")}</CardTitle>
              <p className="text-xs text-muted-foreground">{t("storedByPostOnly")}</p>
            </div>
            <Button variant="outline" size="sm" onClick={() => setShowCumulativeDetails((value) => !value)}>
              {showCumulativeDetails ? t("hide") : t("show")}
            </Button>
          </CardHeader>
          {showCumulativeDetails && (
            <CardContent>
              <CreatorPostBreakdown items={cumulativeData?.cumulative?.topPosts || cumulativeData?.topPosts || []} />
            </CardContent>
          )}
        </Card>
      )}

      {isCreator && (
        <Card>
          <CardHeader>
            <CardTitle className="text-base">{t("globalStreamingMapFreePaid")}</CardTitle>
            <p className="text-xs text-muted-foreground">{t("cumulativeCloudflareTimezone")}</p>
          </CardHeader>
          <CardContent>
            {isCumulativeLoading ? (
              <Skeleton className="h-[360px] rounded-md" />
            ) : (
              <CountryBubbleMap
                data={cumulativeData?.viewerDistribution || []}
                metricLabel={t("totalStreaming")}
                emptyLabel={t("noCreatorCountryStats")}
              />
            )}
          </CardContent>
        </Card>
      )}

      <Card>
        <CardHeader>
          <CardTitle className="text-base">{t("statsPeriodTitle")}</CardTitle>
          <p className="text-xs text-muted-foreground">Timezone: {statsData?.timezone || "Asia/Seoul"}</p>
        </CardHeader>
        <CardContent className="flex flex-col gap-2 md:flex-row md:items-end">
          <div className="grid grid-cols-2 gap-2 md:w-48">
            {units.map((unit) => (
              <Button
                key={unit}
                type="button"
                variant={periodUnit === unit ? "default" : "outline"}
                onClick={() => handleUnitChange(unit)}
              >
                {t(unit === "weekly" ? "unitWeek" : "unitMonth")}
              </Button>
            ))}
          </div>
          <div className="w-full md:max-w-sm">
            <Select value={selectedPeriod} onValueChange={handlePeriodChange}>
              <SelectTrigger>
                <SelectValue placeholder={t("selectStatsPeriod")} />
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
          <Button type="button" onClick={() => fetchStatistics(selectedPeriod)}>
            {t("search")}
          </Button>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">{t("settlementLookup")}</CardTitle>
          <p className="text-xs text-muted-foreground">
            {selectedPeriod} {t("selectedPeriodSettlementDescription")}
          </p>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <Skeleton className="h-[200px] rounded-lg" />
          ) : detailData ? (
            <div className="space-y-2">
              <div className="grid gap-2 md:grid-cols-4">
                <Metric label={t("periodPaidViews")} value={`${formatNumber(detailData.subscriptionViews || 0)} / ${formatNumber(detailData.coinViews || 0)}`} />
                <Metric label={t("periodPaidPoints")} value={`${formatNumber(detailData.totalPoints || 0)} P`} />
                <Metric
                  label={t("subscriptionPointPerView")}
                  value={detailData.pointSettings?.subscriptionPerPoint != null ? `${formatNumber(detailData.pointSettings.subscriptionPerPoint)} P` : "-"}
                />
                <Metric label={t("selectedPeriod")} value={selectedPeriod} />
              </div>
              {isCreator ? (
              <div className="overflow-hidden rounded-md border">
                <div className="hidden grid-cols-[minmax(0,1.5fr)_110px_110px_110px] gap-2 border-b bg-muted p-3 text-sm font-medium md:grid">
                  <div>{t("item")}</div>
                  <div className="text-right">{t("quantity")}</div>
                  <div className="text-right">{t("points")}</div>
                  <div className="text-right">{t("basis")}</div>
                </div>
                {(detailData.items || []).map((item: any) => (
                  <div key={item.postId || item.postTitle} className="grid gap-2 border-b p-3 text-sm last:border-0 md:grid-cols-[minmax(0,1.5fr)_110px_110px_110px]">
                    <TruncatedText value={item.postTitle || item.postId || "-"} />
                    <div className="flex justify-between md:block md:text-right">
                      <span className="text-muted-foreground md:hidden">{t("quantity")}</span>
                      <span>{formatNumber(item.viewCount || 0)}</span>
                    </div>
                    <div className="flex justify-between md:block md:text-right">
                      <span className="text-muted-foreground md:hidden">{t("points")}</span>
                      <span>{formatNumber(item.points || 0)} P</span>
                    </div>
                    <div className="flex justify-between md:block md:text-right">
                      <span className="text-muted-foreground md:hidden">{t("basis")}</span>
                      <span className="text-xs text-muted-foreground">
                        Subscription {formatNumber(item.subscriptionViews || 0)} / Coin {formatNumber(item.coinViews || 0)}
                      </span>
                    </div>
                  </div>
                ))}
                <div className="grid gap-2 bg-muted p-3 text-sm font-medium md:grid-cols-[minmax(0,1.5fr)_110px_110px_110px]">
                  <div>{t("total")}</div>
                  <div className="md:text-right">{formatNumber(detailData.totalViewCount || 0)}</div>
                  <div className="md:text-right">{formatNumber(detailData.totalPoints || 0)} P</div>
                  <div />
                </div>
              </div>
            ) : (
              <AgencySettlementTable items={detailData.items || []} totalPoints={detailData.totalPoints || 0} totalViews={detailData.totalViews || 0} />
            )}
            </div>
          ) : (
            <div className="flex h-[200px] items-center justify-center rounded-md bg-muted p-4 text-center text-sm text-muted-foreground">
              {t("storedStatsUnavailable")}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

function PointsStatsInitialSkeleton() {
  return (
    <div className="space-y-2">
      <div className="grid gap-2 md:grid-cols-3">
        <Skeleton className="h-28 rounded-lg" />
        <Skeleton className="h-28 rounded-lg" />
        <Skeleton className="h-28 rounded-lg" />
      </div>
      <Skeleton className="h-[360px] rounded-lg" />
      <Skeleton className="h-24 rounded-lg" />
      <Skeleton className="h-[220px] rounded-lg" />
    </div>
  );
}

function AgencySettlementTable({ items, totalPoints, totalViews }: { items: any[]; totalPoints: number; totalViews: number }) {
  const t = useTranslations("Earnings");

  return (
    <div className="overflow-hidden rounded-md border">
      <div className="hidden grid-cols-[minmax(0,1fr)_100px_120px_180px] gap-2 border-b bg-muted p-3 text-sm font-medium md:grid">
        <div>{t("settlementType")}</div>
        <div className="text-right">{t("viewsShort")}</div>
        <div className="text-right">{t("points")}</div>
        <div className="text-right">{t("basis")}</div>
      </div>
      {items.map((item, index) => (
        <div key={`${item.type}-${index}`} className="grid gap-2 border-b p-3 text-sm last:border-0 md:grid-cols-[minmax(0,1fr)_100px_120px_180px]">
          <TruncatedText value={item.label || item.type || "-"} />
          <div className="flex justify-between md:block md:text-right">
            <span className="text-muted-foreground md:hidden">{t("viewsShort")}</span>
            <span>{formatNumber(item.totalViews || 0)}</span>
          </div>
          <div className="flex justify-between md:block md:text-right">
            <span className="text-muted-foreground md:hidden">{t("points")}</span>
            <span>{formatNumber(item.points || 0)} P</span>
          </div>
          <div className="flex justify-between md:block md:text-right">
            <span className="text-muted-foreground md:hidden">{t("basis")}</span>
            <span className="text-xs text-muted-foreground">
              Subscription {formatNumber(item.subscriptionViews || 0)} / Coin {formatNumber(item.coinViews || 0)}
            </span>
          </div>
        </div>
      ))}
      <div className="grid gap-2 bg-muted p-3 text-sm font-medium md:grid-cols-[minmax(0,1fr)_100px_120px_180px]">
        <div>{t("total")}</div>
        <div className="md:text-right">{formatNumber(totalViews)}</div>
        <div className="md:text-right">{formatNumber(totalPoints)} P</div>
        <div />
      </div>
    </div>
  );
}

function CreatorPostBreakdown({ items }: { items: any[] }) {
  const t = useTranslations("Earnings");

  if (!items?.length) {
    return (
      <div className="rounded-md bg-muted p-4 text-sm text-muted-foreground">
        {t("noCumulativePostDetail")}
      </div>
    );
  }

  return (
    <div className="overflow-hidden rounded-md border">
      <div className="hidden grid-cols-[minmax(0,1.5fr)_110px_110px_110px] gap-2 border-b bg-muted p-3 text-sm font-medium md:grid">
        <div>Post</div>
        <div className="text-right">Sub</div>
        <div className="text-right">Coin</div>
        <div className="text-right">Points</div>
      </div>
      {items.map((item: any) => (
        <div key={item.postId || item.postTitle} className="grid gap-2 border-b p-3 text-sm last:border-0 md:grid-cols-[minmax(0,1.5fr)_110px_110px_110px]">
          <TruncatedText value={item.postTitle || item.postId || "-"} />
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
            <span>{formatNumber(item.points || 0)} P</span>
          </div>
        </div>
      ))}
    </div>
  );
}

function TruncatedText({ value }: { value: string }) {
  return (
    <div className="min-w-0 truncate font-medium" title={value}>
      {value}
    </div>
  );
}

function Metric({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-md border p-4">
      <p className="text-sm text-muted-foreground">{label}</p>
      <p className="mt-2 text-xl font-semibold">{value}</p>
    </div>
  );
}
