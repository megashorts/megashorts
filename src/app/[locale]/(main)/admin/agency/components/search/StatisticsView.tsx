import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { formatNumber } from "@/lib/utils";
import { CreditCard, Users } from "lucide-react";
import PointDistributionView from "./PointDistributionView";
import type { ReactNode } from "react";

interface StatisticsData {
  source?: string;
  totalMembers: number;
  totalAgencies: number;
  totalManagers: number;
  totalPoints: number;
  totalViews?: number;
  subscriptionViews?: number;
  coinViews?: number;
  payoutMembers?: number;
  membersByLevel: { level: number; count: number; label?: string }[];
  membersByRole?: { level: number; count: number; label?: string }[];
  pointsByLevel: { level: number; points: number; label?: string }[];
  topMembers?: { userId?: string; name?: string; totalPoints?: number; points?: number; totalViews?: number }[];
}

interface StatisticsViewProps {
  data: StatisticsData;
  distributionData?: any;
  controls?: ReactNode;
}

export default function StatisticsView({ data, distributionData, controls }: StatisticsViewProps) {
  const roleBreakdown = (data.membersByRole || [])
    .map((item) => `${item.label || `Role ${item.level}`} ${formatNumber(item.count)}`)
    .join(" / ");

  return (
    <div className="space-y-2">
      <div className="grid gap-2 md:grid-cols-2">
        <SummaryCard
          title="Members"
          icon={Users}
          value={formatNumber(data.totalMembers || 0)}
          note={roleBreakdown || "Total agency members"}
        />
        <SummaryCard
          title="Points"
          icon={CreditCard}
          value={`${formatNumber(data.totalPoints || 0)} P`}
          note={`Completed cumulative payout / Paid recipients ${formatNumber(data.payoutMembers || 0)}`}
        />
      </div>

      <div className="grid gap-2 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle className="text-sm">Distribution by Group</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Group</TableHead>
                  <TableHead className="text-right">Members</TableHead>
                  <TableHead className="text-right">Points</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {data.pointsByLevel.map((item) => {
                  const member = data.membersByLevel.find((candidate) => candidate.level === item.level);
                  return (
                    <TableRow key={item.level}>
                      <TableCell>{item.label || member?.label || `Level ${item.level}`}</TableCell>
                      <TableCell className="text-right">{formatNumber(member?.count || 0)}</TableCell>
                      <TableCell className="text-right">{formatNumber(item.points || 0)} P</TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-sm">Top Marketers</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>User</TableHead>
                  <TableHead className="text-right">Views</TableHead>
                  <TableHead className="text-right">Points</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {(data.topMembers || []).map((member, index) => (
                  <TableRow key={member.userId || member.name || index}>
                    <TableCell className="max-w-[220px] truncate" title={member.name || member.userId || "-"}>{member.name || member.userId || "-"}</TableCell>
                    <TableCell className="text-right">{formatNumber(member.totalViews || 0)}</TableCell>
                    <TableCell className="text-right">{formatNumber(member.totalPoints || member.points || 0)} P</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
            </div>
          </CardContent>
        </Card>
      </div>

      {controls && (
        <Card>
          <CardHeader>
            <CardTitle className="text-sm">Selected Period Lookup</CardTitle>
          </CardHeader>
          <CardContent>{controls}</CardContent>
        </Card>
      )}

      <Card>
        <CardHeader>
          <CardTitle className="text-sm">Selected Period Payout Detail</CardTitle>
        </CardHeader>
        <CardContent>
          {distributionData ? (
            <PointDistributionView data={distributionData} />
          ) : (
            <div className="rounded-md border p-4 text-sm text-muted-foreground">
              Select a period and run lookup to load stored payout details.
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

function SummaryCard({ title, icon: Icon, value, note }: { title: string; icon: any; value: string; note: string }) {
  return (
    <Card>
      <CardHeader className="pb-2">
        <CardTitle className="flex items-center text-sm font-medium">
          <Icon className="mr-2 h-4 w-4" />
          {title}
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="text-2xl font-bold">{value}</div>
        <p className="mt-1 text-xs text-muted-foreground">{note}</p>
      </CardContent>
    </Card>
  );
}
