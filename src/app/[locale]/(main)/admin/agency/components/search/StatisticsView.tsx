// src/app/(main)/admin/agency/components/search/StatisticsView.tsx

import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { BarChart, Users, CreditCard, TrendingUp } from "lucide-react";

interface StatisticsData {
  totalMembers: number;
  totalAgencies: number;
  totalManagers: number;
  totalPoints: number;
  membersByLevel: { level: number; count: number }[];
  pointsByLevel: { level: number; points: number }[];
  // 추가 데이터
  weeklyStats?: {
    week: string;
    totalViews: number;
    totalPoints: number;
    topMembers: { name: string; points: number }[];
  }[];
  dailyStats?: { label: string; newMembers: number; points: number; applications: number }[];
  monthlyStats?: { label: string; newMembers: number; points: number; applications: number }[];
  topMembers?: { name: string; points: number }[];
}

interface StatisticsViewProps {
  data: StatisticsData;
}

export default function StatisticsView({ data }: StatisticsViewProps) {
  const [selectedWeek, setSelectedWeek] = useState<string>("");
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [reportData, setReportData] = useState<any>(null);

  const weekOptions = (data.weeklyStats || []).map((item: any) => ({
    value: item.label || item.week,
    label: item.label || item.week,
  }));

  // 리포트 데이터 조회 함수
  const fetchReportData = async (week: string) => {
    if (!week) return;
    
    setIsLoading(true);
    try {
      const selected = (data.weeklyStats || []).find((item: any) => (item.label || item.week) === week);
      const totalPoints = (selected as any)?.points || selected?.totalPoints || 0;

      setReportData({
        week,
        totalViews: selected?.totalViews || 0,
        totalPoints,
        dailyStats: data.dailyStats || [],
        topMembers: data.topMembers || [],
        distributionByLevel: data.pointsByLevel.map((item) => ({
          level: item.level,
          points: item.points,
          percentage: data.totalPoints > 0 ? Number(((item.points / data.totalPoints) * 100).toFixed(1)) : 0
        }))
      });
      setIsLoading(false);
    } catch (error) {
      console.error('리포트 데이터 조회 실패:', error);
      setIsLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* 기본 통계 정보 */}
      <div className="grid grid-cols-2 gap-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium flex items-center">
              <Users className="w-4 h-4 mr-2" />
              전체 통계
            </CardTitle>
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
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium flex items-center">
              <BarChart className="w-4 h-4 mr-2" />
              단계별 회원 수
            </CardTitle>
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
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium flex items-center">
              <CreditCard className="w-4 h-4 mr-2" />
              단계별 포인트
            </CardTitle>
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
                      {data.totalPoints > 0 ? ((item.points / data.totalPoints) * 100).toFixed(1) : "0.0"}%
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      </div>

      {/* 주간 리포트 */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center">
            <TrendingUp className="w-5 h-5 mr-2" />
            주간 리포트
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col md:flex-row gap-4 mb-4">
            <div className="w-full md:w-1/3">
              <label className="text-sm font-medium mb-1 block">정산 주차</label>
              <Select value={selectedWeek} onValueChange={(value) => {
                setSelectedWeek(value);
                fetchReportData(value);
              }}>
                <SelectTrigger>
                  <SelectValue placeholder="정산 주차 선택" />
                </SelectTrigger>
                <SelectContent>
                  {weekOptions.map((option) => (
                    <SelectItem key={option.value} value={option.value}>
                      {option.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="flex items-end">
              <Button onClick={() => fetchReportData(selectedWeek)} disabled={!selectedWeek || isLoading}>
                {isLoading ? "로딩 중..." : "조회"}
              </Button>
            </div>
          </div>

          {isLoading ? (
            <div className="h-[200px] flex items-center justify-center">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900"></div>
            </div>
          ) : reportData ? (
            <div className="space-y-6">
              {/* 주간 요약 */}
              <div className="grid grid-cols-2 gap-4">
                <Card>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm font-medium">주간 요약</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-2">
                      <div className="flex justify-between">
                        <span>총 시청 수:</span>
                        <span className="font-medium">{reportData.totalViews.toLocaleString()}</span>
                      </div>
                      <div className="flex justify-between">
                        <span>총 포인트:</span>
                        <span className="font-medium">{reportData.totalPoints.toLocaleString()}P</span>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm font-medium">단계별 분배</CardTitle>
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
                        {reportData.distributionByLevel.map((item: any, index: number) => (
                          <TableRow key={index}>
                            <TableCell>{item.level}단계</TableCell>
                            <TableCell className="text-right">{item.points.toLocaleString()}P</TableCell>
                            <TableCell className="text-right">{item.percentage}%</TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </CardContent>
                </Card>
              </div>

              {/* 일별 통계 */}
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-medium">일별 통계</CardTitle>
                </CardHeader>
                <CardContent>
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>날짜</TableHead>
                        <TableHead className="text-right">신규 회원</TableHead>
                        <TableHead className="text-right">신청</TableHead>
                        <TableHead className="text-right">포인트</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {reportData.dailyStats.map((day: any, index: number) => (
                        <TableRow key={index}>
                          <TableCell>{day.label || day.date}</TableCell>
                          <TableCell className="text-right">{(day.newMembers || 0).toLocaleString()}</TableCell>
                          <TableCell className="text-right">{(day.applications || 0).toLocaleString()}</TableCell>
                          <TableCell className="text-right">{day.points.toLocaleString()}P</TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </CardContent>
              </Card>

              {/* TOP 5 영업자 */}
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-medium">TOP 5 영업자</CardTitle>
                </CardHeader>
                <CardContent>
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>순위</TableHead>
                        <TableHead>이름</TableHead>
                        <TableHead className="text-right">포인트</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {reportData.topMembers.map((member: any, index: number) => (
                        <TableRow key={index}>
                          <TableCell>{index + 1}</TableCell>
                          <TableCell>{member.name}</TableCell>
                          <TableCell className="text-right">{member.points.toLocaleString()}P</TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </CardContent>
              </Card>
            </div>
          ) : (
            <div className="h-[200px] bg-muted rounded-md flex items-center justify-center">
              <p className="text-muted-foreground">정산 주차를 선택하면 상세 내역이 표시됩니다.</p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
