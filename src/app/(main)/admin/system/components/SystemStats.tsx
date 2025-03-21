"use client";

import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { formatNumber } from '@/lib/utils';
import { 
  BarChart, 
  Users, 
  UserCheck, 
  Calendar, 
  Coins, 
  DollarSign, 
  Play, 
  Eye, 
  TrendingUp 
} from 'lucide-react';

export function SystemStats() {
  const [selectedPeriod, setSelectedPeriod] = useState<string>('current');
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [statsData, setStatsData] = useState<any>(null);
  const [weeklyData, setWeeklyData] = useState<any>(null);

  // 기간 옵션
  const periodOptions = [
    { value: 'current', label: '현재 주차 (진행중)' },
    { value: '2025-W09', label: '2025년 9주차 (2/24 ~ 3/2)' },
    { value: '2025-W08', label: '2025년 8주차 (2/17 ~ 2/23)' },
    { value: '2025-W07', label: '2025년 7주차 (2/10 ~ 2/16)' },
  ];

  // 통계 데이터 조회 함수
  const fetchStatistics = async (period: string) => {
    setIsLoading(true);
    try {
      // 관리자 통계 API 호출
      const response = await fetch(`${process.env.NEXT_PUBLIC_STATS_API_URL}/api/stats/admin`);
      
      if (!response.ok) {
        console.error(`API 호출 실패: ${response.status} ${response.statusText}`);
        throw new Error(`통계 데이터 조회 실패: ${response.status} ${response.statusText}`);
      }
      
      const result = await response.json();
      
      if (result.success) {
        setStatsData(result.data);
      } else {
        console.error('통계 데이터 조회 실패:', result.error);
      }
      
      // 주간 정산 데이터 조회 (현재가 아닌 경우)
      if (period !== 'current') {
        const weeklyResponse = await fetch(`${process.env.NEXT_PUBLIC_STATS_API_URL}/api/stats/reports?period=${period}`);
        
        if (weeklyResponse.ok) {
          const weeklyResult = await weeklyResponse.json();
          if (weeklyResult.success) {
            setWeeklyData(weeklyResult.data);
          }
        } else {
          console.error(`주간 정산 데이터 조회 실패: ${weeklyResponse.status} ${weeklyResponse.statusText}`);
        }
      } else {
        setWeeklyData(null);
      }
      
      // Cloudflare 통계 데이터 조회 (글로벌 접속자 지도 등)
      try {
        const cloudflareResponse = await fetch(`${process.env.NEXT_PUBLIC_STATS_API_URL}/api/stats/cloudflare`);
        
        if (cloudflareResponse.ok) {
          const cloudflareResult = await cloudflareResponse.json();
          if (cloudflareResult.success && cloudflareResult.data) {
            // 기존 statsData에 Cloudflare 통계 데이터 추가
            setStatsData((prevData: any) => ({
              ...prevData,
              viewerDistribution: cloudflareResult.data.viewerDistribution,
              cloudflareStats: cloudflareResult.data
            }));
          }
        }
      } catch (cloudflareError) {
        console.error('Cloudflare 통계 데이터 조회 실패:', cloudflareError);
        // Cloudflare 통계 실패는 전체 통계 조회에 영향을 주지 않음
      }
      
      setIsLoading(false);
    } catch (error) {
      console.error('통계 데이터 조회 실패:', error);
      setIsLoading(false);
    }
  };

  // 캐시 무효화 함수
  const invalidateCache = async () => {
    try {
      if (confirm('모든 통계 캐시를 무효화하시겠습니까? 다음 조회 시 최신 데이터를 가져옵니다.')) {
        const response = await fetch(`${process.env.NEXT_PUBLIC_STATS_API_URL}/api/stats/cache/invalidate`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          }
        });
        
        if (response.ok) {
          alert('캐시가 성공적으로 무효화되었습니다.');
          // 데이터 다시 조회
          fetchStatistics(selectedPeriod);
        } else {
          console.error(`캐시 무효화 실패: ${response.status} ${response.statusText}`);
          alert(`캐시 무효화 중 오류가 발생했습니다: ${response.status} ${response.statusText}`);
        }
      }
    } catch (error) {
      console.error('캐시 무효화 오류:', error);
      alert('캐시 무효화 중 오류가 발생했습니다.');
    }
  };

  // 기간 선택 시 호출
  const handlePeriodChange = (value: string) => {
    setSelectedPeriod(value);
    fetchStatistics(value);
  };

  // 컴포넌트 마운트 시 데이터 조회
  useEffect(() => {
    fetchStatistics(selectedPeriod);
  }, []);

  return (
    <div className="space-y-6">
      {/* 상단 통계 카드 - 첫 번째 줄 */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {isLoading ? (
          // 로딩 중 스켈레톤 UI
          <>
            <Skeleton className="h-32 rounded-lg" />
            <Skeleton className="h-32 rounded-lg" />
            <Skeleton className="h-32 rounded-lg" />
            <Skeleton className="h-32 rounded-lg" />
          </>
        ) : statsData ? (
          <>
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium flex items-center">
                  <Users className="w-4 h-4 mr-2" />
                  회원
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{formatNumber(statsData.users?.total || 0)}</div>
                <p className="text-xs text-muted-foreground">
                  누적 가입자 (오늘 +{statsData.users?.todayNew || 0}) / 탈퇴 {formatNumber(statsData.users?.deleted || 0)}
                </p>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium flex items-center">
                  <UserCheck className="w-4 h-4 mr-2" />
                  구독자
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  {formatNumber((statsData.users?.weeklySubscribers || 0) + (statsData.users?.yearlySubscribers || 0))}
                </div>
                <p className="text-xs text-muted-foreground">
                  주간 {formatNumber(statsData.users?.weeklySubscribers || 0)} / 연간 {formatNumber(statsData.users?.yearlySubscribers || 0)}
                </p>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium flex items-center">
                  <Coins className="w-4 h-4 mr-2" />
                  코인
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{formatNumber(statsData.coins?.totalPurchased || 0)}</div>
                <p className="text-xs text-muted-foreground">
                  구매 수량 / 사용 {formatNumber(statsData.coins?.totalUsed || 0)}
                </p>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium flex items-center">
                  <DollarSign className="w-4 h-4 mr-2" />
                  매출
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{formatNumber(statsData.coins?.totalPurchaseAmount || 0)}</div>
                <p className="text-xs text-muted-foreground">
                  코인 구매 금액 (원)
                </p>
              </CardContent>
            </Card>
          </>
        ) : (
          // 데이터 없음
          <div className="col-span-4 text-center py-8">
            <p className="text-muted-foreground">통계 데이터를 불러올 수 없습니다.</p>
          </div>
        )}
      </div>

      {/* 상단 통계 카드 - 두 번째 줄 */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {isLoading ? (
          // 로딩 중 스켈레톤 UI
          <>
            <Skeleton className="h-32 rounded-lg" />
            <Skeleton className="h-32 rounded-lg" />
            <Skeleton className="h-32 rounded-lg" />
            <Skeleton className="h-32 rounded-lg" />
          </>
        ) : statsData ? (
          <>
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium flex items-center">
                  <BarChart className="w-4 h-4 mr-2" />
                  콘텐츠
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{formatNumber(statsData.content?.totalPosts || 0)}</div>
                <p className="text-xs text-muted-foreground">
                  전체 포스트 / 동영상 {formatNumber(statsData.content?.totalVideos || 0)}개 (유료 {formatNumber(statsData.content?.totalPaidVideos || 0)}개)
                </p>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium flex items-center">
                  <Play className="w-4 h-4 mr-2" />
                  스트리밍
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{formatNumber(statsData.views?.totalStreamingRequests || 0)}</div>
                <p className="text-xs text-muted-foreground">
                  누적 스트리밍 요청 수
                </p>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium flex items-center">
                  <Eye className="w-4 h-4 mr-2" />
                  유료 시청
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  {formatNumber((statsData.views?.subscriptionViews || 0) + (statsData.views?.coinViews || 0))}
                </div>
                <p className="text-xs text-muted-foreground">
                  구독 {formatNumber(statsData.views?.subscriptionViews || 0)} / 코인 {formatNumber(statsData.views?.coinViews || 0)}
                </p>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium flex items-center">
                  <TrendingUp className="w-4 h-4 mr-2" />
                  오늘 시청
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{formatNumber(statsData.views?.todayViews || 0)}</div>
                <p className="text-xs text-muted-foreground">
                  오늘 발생한 시청 수
                </p>
              </CardContent>
            </Card>
          </>
        ) : null}
      </div>

      {/* 글로벌 접속자 지도맵 */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center">
            <span className="i-lucide-globe w-5 h-5 mr-2"></span>
            글로벌 접속자 지도
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="h-[300px] bg-muted rounded-md flex items-center justify-center">
            {isLoading ? (
              <Skeleton className="w-full h-full rounded-md" />
            ) : statsData?.viewerDistribution ? (
              <div id="global-map" className="w-full h-full">
                {/* 지도 컴포넌트가 여기에 렌더링됩니다 */}
                {/* 실제 구현 시에는 Cloudflare 통계 API에서 가져온 데이터로 지도 렌더링 */}
              </div>
            ) : (
              <p className="text-muted-foreground">Cloudflare 통계 API 연동 예정</p>
            )}
          </div>
        </CardContent>
      </Card>

      {/* 랭킹 정보 */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {isLoading ? (
          <>
            <Skeleton className="h-64 rounded-lg" />
            <Skeleton className="h-64 rounded-lg" />
            <Skeleton className="h-64 rounded-lg" />
          </>
        ) : statsData?.topItems ? (
          <>
            <Card>
              <CardHeader>
                <CardTitle className="text-sm">인기 포스트 TOP 5</CardTitle>
              </CardHeader>
              <CardContent>
                <ul className="space-y-2">
                  {statsData.topItems.posts?.map((post: any, index: number) => (
                    <li key={post.id} className="flex justify-between items-center text-sm">
                      <span className="flex items-center">
                        <span className="w-5 text-center font-bold">{index + 1}</span>
                        <span className="ml-2 truncate max-w-[150px]">{post.title}</span>
                      </span>
                      <span className="text-muted-foreground">{formatNumber(post.views)}</span>
                    </li>
                  ))}
                </ul>
              </CardContent>
            </Card>
            <Card>
              <CardHeader>
                <CardTitle className="text-sm">유료 시청 TOP 5</CardTitle>
              </CardHeader>
              <CardContent>
                <ul className="space-y-2">
                  {statsData.topItems.paidPosts?.map((post: any, index: number) => (
                    <li key={post.id} className="flex justify-between items-center text-sm">
                      <span className="flex items-center">
                        <span className="w-5 text-center font-bold">{index + 1}</span>
                        <span className="ml-2 truncate max-w-[150px]">{post.title}</span>
                      </span>
                      <span className="text-muted-foreground">{formatNumber(post.views)}</span>
                    </li>
                  ))}
                </ul>
              </CardContent>
            </Card>
            <Card>
              <CardHeader>
                <CardTitle className="text-sm">포인트 TOP 5 업로더</CardTitle>
              </CardHeader>
              <CardContent>
                <ul className="space-y-2">
                  {statsData.topItems.uploaders?.map((uploader: any, index: number) => (
                    <li key={uploader.id} className="flex justify-between items-center text-sm">
                      <span className="flex items-center">
                        <span className="w-5 text-center font-bold">{index + 1}</span>
                        <span className="ml-2 truncate max-w-[150px]">{uploader.name}</span>
                      </span>
                      <span className="text-muted-foreground">{formatNumber(uploader.points)}</span>
                    </li>
                  ))}
                </ul>
              </CardContent>
            </Card>
          </>
        ) : null}
      </div>

      {/* 랭킹 정보 - 두 번째 줄 */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {isLoading ? (
          <>
            <Skeleton className="h-64 rounded-lg" />
            <Skeleton className="h-64 rounded-lg" />
            <Skeleton className="h-64 rounded-lg" />
          </>
        ) : statsData?.topItems ? (
          <>
            <Card>
              <CardHeader>
                <CardTitle className="text-sm">포인트 TOP 5 영업자</CardTitle>
              </CardHeader>
              <CardContent>
                <ul className="space-y-2">
                  {statsData.topItems.agencyMembers?.map((member: any, index: number) => (
                    <li key={member.id} className="flex justify-between items-center text-sm">
                      <span className="flex items-center">
                        <span className="w-5 text-center font-bold">{index + 1}</span>
                        <span className="ml-2 truncate max-w-[150px]">{member.name}</span>
                      </span>
                      <span className="text-muted-foreground">{formatNumber(member.points)}</span>
                    </li>
                  ))}
                </ul>
              </CardContent>
            </Card>
            <Card>
              <CardHeader>
                <CardTitle className="text-sm">추천인 TOP 5</CardTitle>
              </CardHeader>
              <CardContent>
                <ul className="space-y-2">
                  {statsData.topItems.referrers?.map((referrer: any, index: number) => (
                    <li key={referrer.id} className="flex justify-between items-center text-sm">
                      <span className="flex items-center">
                        <span className="w-5 text-center font-bold">{index + 1}</span>
                        <span className="ml-2 truncate max-w-[150px]">{referrer.name}</span>
                      </span>
                      <span className="text-muted-foreground">{formatNumber(referrer.count)}</span>
                    </li>
                  ))}
                </ul>
              </CardContent>
            </Card>
            <Card>
              <CardHeader>
                <CardTitle className="text-sm">급상승 포스트</CardTitle>
              </CardHeader>
              <CardContent>
                <ul className="space-y-2">
                  {statsData.topItems.risingPosts?.map((post: any, index: number) => (
                    <li key={post.id} className="flex justify-between items-center text-sm">
                      <span className="flex items-center">
                        <span className="w-5 text-center font-bold">{index + 1}</span>
                        <span className="ml-2 truncate max-w-[150px]">{post.title}</span>
                      </span>
                      <span className="text-muted-foreground">+{formatNumber(post.growth)}%</span>
                    </li>
                  ))}
                </ul>
              </CardContent>
            </Card>
          </>
        ) : null}
      </div>

      {/* 정산 조회 필터 */}
      <Card>
        <CardHeader>
          <CardTitle>정산 내역 조회</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col md:flex-row gap-4 mb-4">
            <div className="w-full md:w-1/3">
              <label className="text-sm font-medium mb-1 block">정산 주차</label>
              <Select value={selectedPeriod} onValueChange={handlePeriodChange}>
                <SelectTrigger>
                  <SelectValue placeholder="정산 주차 선택" />
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
            <div className="flex items-end gap-2">
              <Button onClick={() => fetchStatistics(selectedPeriod)}>
                조회
              </Button>
              <Button 
                variant="outline" 
                onClick={invalidateCache}
              >
                캐시 무효화
              </Button>
            </div>
          </div>

          {/* 조회 결과 */}
          {isLoading ? (
            <Skeleton className="h-[200px] rounded-lg" />
          ) : weeklyData ? (
            <div className="border rounded-md">
              <div className="grid grid-cols-4 gap-4 p-4 font-medium border-b">
                <div>구분</div>
                <div>항목</div>
                <div>수량</div>
                <div>포인트</div>
              </div>
              {weeklyData.items?.map((item: any, index: number) => (
                <div key={index} className="grid grid-cols-4 gap-4 p-4 border-b last:border-0">
                  <div className="text-sm">{item.category || '-'}</div>
                  <div className="text-sm">{item.name || '-'}</div>
                  <div className="text-sm">{formatNumber(item.count || 0)}</div>
                  <div className="text-sm">{formatNumber(item.points || 0)}</div>
                </div>
              ))}
              {/* 합계 행 */}
              <div className="grid grid-cols-4 gap-4 p-4 font-medium bg-muted">
                <div>합계</div>
                <div></div>
                <div>{formatNumber(weeklyData.totalCount || 0)}</div>
                <div>{formatNumber(weeklyData.totalPoints || 0)}</div>
              </div>
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
