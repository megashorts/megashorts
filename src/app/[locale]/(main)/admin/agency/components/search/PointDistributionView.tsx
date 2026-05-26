import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { formatNumber } from "@/lib/utils";

interface PointDistributionViewProps {
  data: {
    period: string;
    source: string;
    teamType: string | null;
    teamTotal: number;
    distributions: Array<{
      label: string;
      userCount?: number;
      coinViews?: number;
      subscriptionViews?: number;
      coinPoints?: number;
      subscriptionPoints?: number;
      totalPoints?: number;
    }>;
    topMembers?: Array<{ userId: string; totalPoints: number; totalViews: number }>;
    pointSettings?: {
      subscriptionPerPoint?: number;
      coinPerPoint?: number;
      viewCoinAmount?: number;
      subscriptionRevenue?: { totalWeeklyRevenue?: number; totalSubscriptionViews?: number };
    } | null;
    detailRows?: Array<{
      userId?: string;
      userName?: string;
      commissionType?: string;
      label?: string;
      postId?: string;
      postTitle?: string;
      subscriptionViews?: number;
      coinViews?: number;
      subscriptionPoints?: number;
      coinPoints?: number;
      totalPoints?: number;
    }>;
  } | null;
}

export default function PointDistributionView({ data }: PointDistributionViewProps) {
  if (!data) return null;

  return (
    <div className="space-y-2">
      <div className="rounded-md border bg-muted/30 p-3 text-sm">
        <div className="grid gap-2 md:grid-cols-4">
          <Meta label="Period" value={data.period} />
          <Meta label="Sub / Coin Views" value={`${formatNumber(data.distributions.reduce((sum, item) => sum + Number(item.subscriptionViews || 0), 0))} / ${formatNumber(data.distributions.reduce((sum, item) => sum + Number(item.coinViews || 0), 0))}`} />
          <Meta label="Team Payout" value={`${formatNumber(data.teamTotal || 0)} P`} />
          <Meta
            label="Subscription Point"
            value={data.pointSettings?.subscriptionPerPoint != null ? `${formatNumber(data.pointSettings.subscriptionPerPoint)} P / view` : "-"}
          />
        </div>
      </div>
      <div className="overflow-x-auto rounded-md border">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Group</TableHead>
            <TableHead className="text-right">Users</TableHead>
            <TableHead className="text-right">Sub views</TableHead>
            <TableHead className="text-right">Coin views</TableHead>
            <TableHead className="text-right">Points</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {data.distributions.map((item) => (
            <TableRow key={item.label}>
              <TableCell>{item.label}</TableCell>
              <TableCell className="text-right">{formatNumber(item.userCount || 0)}</TableCell>
              <TableCell className="text-right">{formatNumber(item.subscriptionViews || 0)}</TableCell>
              <TableCell className="text-right">{formatNumber(item.coinViews || 0)}</TableCell>
              <TableCell className="text-right">{formatNumber(item.totalPoints || 0)} P</TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
      </div>
      <div className="overflow-x-auto rounded-md border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Member</TableHead>
              <TableHead>Type</TableHead>
              <TableHead>Post</TableHead>
              <TableHead className="text-right">Sub views</TableHead>
              <TableHead className="text-right">Coin views</TableHead>
              <TableHead className="text-right">Sub P</TableHead>
              <TableHead className="text-right">Coin P</TableHead>
              <TableHead className="text-right">Total P</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {(data.detailRows || []).map((row, index) => (
              <TableRow key={`${row.userId}-${row.postId}-${row.commissionType}-${index}`}>
                <TableCell className="max-w-[180px] truncate" title={row.userName || row.userId || "-"}>
                  {row.userName || row.userId || "-"}
                </TableCell>
                <TableCell className="whitespace-nowrap">{row.label || row.commissionType || "-"}</TableCell>
                <TableCell className="max-w-[220px] truncate" title={row.postTitle || row.postId || "-"}>
                  {row.postTitle || row.postId || "-"}
                </TableCell>
                <TableCell className="text-right">{formatNumber(row.subscriptionViews || 0)}</TableCell>
                <TableCell className="text-right">{formatNumber(row.coinViews || 0)}</TableCell>
                <TableCell className="text-right">{formatNumber(row.subscriptionPoints || 0)}</TableCell>
                <TableCell className="text-right">{formatNumber(row.coinPoints || 0)}</TableCell>
                <TableCell className="text-right">{formatNumber(row.totalPoints || 0)} P</TableCell>
              </TableRow>
            ))}
            {(data.detailRows || []).length === 0 && (
              <TableRow>
                <TableCell colSpan={8} className="py-6 text-center text-sm text-muted-foreground">
                  No stored payout detail rows for this period.
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>
      <div className="overflow-hidden rounded-md border">
        <div className="border-b bg-muted p-3 text-sm font-medium">Top Marketer Payouts</div>
        {(data.topMembers || []).length > 0 ? (
          <div className="divide-y">
            {(data.topMembers || []).map((member: any, index: number) => (
              <div key={member.userId || index} className="grid grid-cols-[32px_minmax(0,1fr)_90px_110px] gap-2 p-3 text-sm">
                <div className="text-muted-foreground">{index + 1}</div>
                <div className="min-w-0 truncate" title={member.name || member.userId}>{member.name || member.userId}</div>
                <div className="text-right">{formatNumber(member.totalViews || 0)}</div>
                <div className="text-right">{formatNumber(member.totalPoints || 0)} P</div>
              </div>
            ))}
          </div>
        ) : (
          <div className="p-3 text-sm text-muted-foreground">No stored payout detail rows.</div>
        )}
      </div>
    </div>
  );
}

function Meta({ label, value }: { label: string; value: string }) {
  return (
    <div className="min-w-0">
      <p className="text-xs text-muted-foreground">{label}</p>
      <p className="mt-1 truncate font-semibold" title={value}>{value}</p>
    </div>
  );
}
