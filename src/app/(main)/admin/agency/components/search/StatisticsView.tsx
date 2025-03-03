// src/app/(main)/admin/agency/components/search/StatisticsView.tsx

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";

interface StatisticsData {
  totalMembers: number;
  totalAgencies: number;
  totalManagers: number;
  totalPoints: number;
  membersByLevel: { level: number; count: number }[];
  pointsByLevel: { level: number; points: number }[];
}

interface StatisticsViewProps {
  data: StatisticsData;
}

export default function StatisticsView({ data }: StatisticsViewProps) {
  return (
    <div className="grid grid-cols-2 gap-4">
      <Card>
        <CardHeader>
          <CardTitle>전체 통계</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            <div className="flex justify-between">
              <span>총 회원 수:</span>
              <span className="font-medium">{data.totalMembers}명</span>
            </div>
            <div className="flex justify-between">
              <span>총 에이전시 수:</span>
              <span className="font-medium">{data.totalAgencies}명</span>
            </div>
            <div className="flex justify-between">
              <span>총 중간관리자 수:</span>
              <span className="font-medium">{data.totalManagers}명</span>
            </div>
            <div className="flex justify-between">
              <span>총 포인트:</span>
              <span className="font-medium">{data.totalPoints.toLocaleString()}P</span>
            </div>
          </div>
        </CardContent>
      </Card>
      
      <Card>
        <CardHeader>
          <CardTitle>단계별 회원 수</CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>단계</TableHead>
                <TableHead className="text-right">회원 수</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {data.membersByLevel.map((item, index) => (
                <TableRow key={index}>
                  <TableCell>{item.level}단계</TableCell>
                  <TableCell className="text-right">{item.count}명</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
      
      <Card className="col-span-2">
        <CardHeader>
          <CardTitle>단계별 포인트</CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>단계</TableHead>
                <TableHead className="text-right">포인트</TableHead>
                <TableHead className="text-right">비율</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {data.pointsByLevel.map((item, index) => (
                <TableRow key={index}>
                  <TableCell>{item.level}단계</TableCell>
                  <TableCell className="text-right">{item.points.toLocaleString()}P</TableCell>
                  <TableCell className="text-right">
                    {((item.points / data.totalPoints) * 100).toFixed(1)}%
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}