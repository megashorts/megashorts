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
}

interface StatisticsViewProps {
  data: StatisticsData;
}

export default function StatisticsView({ data }: StatisticsViewProps) {
  const [selectedWeek, setSelectedWeek] = useState<string>("");
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [reportData, setReportData] = useState<any>(null);

  // 주간 정산 목록 (예시)
  const weekOptions = [
    { value: '2025-W09', label: '2025년 9주차 (2/24 ~ 3/2)' },
    { value: '2025-W08', label: '2025년 8주차 (2/17 ~ 2/23)' },
    { value: '2025-W07', label: '2025년 7주차 (2/10 ~ 2/16)' },
  ];

  // 리포트 데이터 조회 함수
  const fetchReportData = async (week: string) => {
    if (!week) return;
    
    setIsLoading(true);
    try {
      // 실제 구현 시에는 API 호출로 대체
      // const response = await fetch(`/api/agency/reports?week=${week}`);
      // const data = await response.json();
      
      // 임시 데이터
      setTimeout(() => {
        setReportData({
          week,
          totalViews: 1250,
          totalPoints: 45000,
          dailyStats: [
            { date: '2025-02-24', views: 180, points: 6500 },
            { date: '2025-02-25', views: 210, points: 7200 },
            { date: '2025-02-26', views: 195, points: 6800 },
            { date: '2025-02-27', views: 220, points: 7500 },
            { date: '2025-02-28', views: 230, points: 8000 },
            { date: '2025-03-01', views: 120, points: 4500 },
            { date: '2025-03-02', views: 95, points: 4500 },
          ],
          topMembers: [
            { name: '영업자 1', points: 12500 },
            { name: '영업자 2', points: 10800 },
            { name: '영업자 3', points: 9500 },
            { name: '영업자 4', points: 8200 },
            { name: '영업자 5', points: 7500 },
          ],
          distributionByLevel: [
            { level: 1, points: 22500, percentage: 50 },
            { level: 2, points: 13500, percentage: 30 },
            { level: 3, points: 9000, percentage: 20 },
          ]
        });
        setIsLoading(false);
      }, 1000);
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
                      {((item.points / data.totalPoints) * 100).toFixed(1)}%
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
                        <TableHead className="text-right">시청 수</TableHead>
                        <TableHead className="text-right">포인트</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {reportData.dailyStats.map((day: any, index: number) => (
                        <TableRow key={index}>
                          <TableCell>{day.date}</TableCell>
                          <TableCell className="text-right">{day.views.toLocaleString()}</TableCell>
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
