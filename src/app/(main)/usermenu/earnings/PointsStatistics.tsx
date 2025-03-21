"use client";

import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { formatNumber } from '@/lib/utils';

interface PointsStatisticsProps {
  userId: string;
  userRole: number; // 40: 업로더, 20: 영업 멤버
}

export default function PointsStatistics({ userId, userRole }: PointsStatisticsProps) {
  const [selectedWeek, setSelectedWeek] = useState<string>('current');
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [statsData, setStatsData] = useState<any>(null);
  const [weeklyData, setWeeklyData] = useState<any>(null);

  // 업로더인지 영업 멤버인지 확인
  // 20-34: 업로더, 40-50: 영업팀, 60 이상: 관리자 그룹 (업로더 기준으로 렌더링)
  const isUploader = (userRole >= 20 && userRole < 40) || userRole >= 60;
  const isAgency = userRole >= 40 && userRole <= 50;

  // 주간 정산 목록 (예시)
  const weekOptions = [
    { value: 'current', label: '현재 주차 (진행중)' },
    { value: '2025-W09', label: '2025년 9주차 (2/24 ~ 3/2)' },
    { value: '2025-W08', label: '2025년 8주차 (2/17 ~ 2/23)' },
    { value: '2025-W07', label: '2025년 7주차 (2/10 ~ 2/16)' },
  ];

  // 통계 데이터 조회 함수
  const fetchStatistics = async (week: string) => {
    setIsLoading(true);
    
    try {
      // 업로더 또는 에이전시 통계 API 호출
      const endpoint = isUploader 
        ? `${process.env.NEXT_PUBLIC_STATS_API_URL}/api/stats/uploader` 
        : `${process.env.NEXT_PUBLIC_STATS_API_URL}/api/stats/agency`;
      
      const response = await fetch(`${endpoint}?userId=${userId}&period=${week}`);
      
      if (!response.ok) {
        console.error(`API 호출 실패: ${response.status} ${response.statusText}`);
        // 오류가 발생해도 빈 데이터로 초기화하여 UI가 깨지지 않도록 함
        setStatsData({
          postsCount: 0,
          videosCount: 0,
          paidVideosCount: 0,
          totalViews: 0,
          subscriptionViews: 0,
          coinViews: 0,
          totalPoints: 0,
          lastWeekPoints: 0,
          todayViews: 0,
          totalReferredUsers: 0,
          todayReferredUsers: 0,
          activeViewers: 0
        });
        return;
      }
      
      const data = await response.json();
      
      if (data.success) {
        // API 응답 구조에 맞게 데이터 설정
        // API 응답에 누락된 필드가 있을 경우 기본값 설정
        const defaultData = {
          postsCount: 0,
          videosCount: 0,
          paidVideosCount: 0,
          totalViews: 0,
          subscriptionViews: 0,
          coinViews: 0,
          totalPoints: 0,
          lastWeekPoints: 0,
          todayViews: 0,
          totalReferredUsers: 0,
          todayReferredUsers: 0,
          activeViewers: 0
        };
        
        // API 응답 데이터와 기본값 병합
        setStatsData({...defaultData, ...data.data});
        
        // 디버깅용 로그
        console.log('API 응답 데이터:', data.data);
        console.log('병합된 데이터:', {...defaultData, ...data.data});
        
        // 주간 데이터 설정 (현재가 아닌 경우)
        if (week !== 'current') {
          try {
            // 주간 정산 데이터 조회
            const weeklyEndpoint = `${process.env.NEXT_PUBLIC_STATS_API_URL}/api/stats/weekly`;
            const weeklyResponse = await fetch(`${weeklyEndpoint}?userId=${userId}&period=${week}&type=${isUploader ? 'uploader' : 'agency'}`);
            
            if (weeklyResponse.ok) {
              const weeklyResult = await weeklyResponse.json();
              if (weeklyResult.success) {
                setWeeklyData(weeklyResult.data);
              } else {
                console.error('주간 정산 데이터 조회 실패:', weeklyResult.error);
                setWeeklyData(null);
              }
            } else {
              console.error(`주간 정산 데이터 API 호출 실패: ${weeklyResponse.status} ${weeklyResponse.statusText}`);
              setWeeklyData(null);
            }
          } catch (weeklyError) {
            console.error('주간 정산 데이터 조회 오류:', weeklyError);
            setWeeklyData(null);
          }
        } else {
          setWeeklyData(null);
        }
      } else {
        console.error('통계 데이터 조회 실패:', data.error);
        // 오류가 발생해도 빈 데이터로 초기화하여 UI가 깨지지 않도록 함
        setStatsData({
          postsCount: 0,
          videosCount: 0,
          paidVideosCount: 0,
          totalViews: 0,
          subscriptionViews: 0,
          coinViews: 0,
          totalPoints: 0,
          lastWeekPoints: 0,
          todayViews: 0,
          totalReferredUsers: 0,
          todayReferredUsers: 0,
          activeViewers: 0
        });
      }
      
      // Cloudflare 통계 데이터 조회 (글로벌 접속자 지도 등)
      try {
        const cloudflareEndpoint = `${process.env.NEXT_PUBLIC_STATS_API_URL}/api/stats/cloudflare`;
        
        const cloudflareResponse = await fetch(`${cloudflareEndpoint}?userId=${userId}`);
        
        if (cloudflareResponse.ok) {
          const cloudflareData = await cloudflareResponse.json();
          if (cloudflareData.success && cloudflareData.data) {
            // 기존 statsData에 Cloudflare 통계 데이터 추가
            setStatsData((prevData: any) => ({
              ...prevData,
              viewerDistribution: cloudflareData.data.viewerDistribution,
              cloudflareStats: cloudflareData.data
            }));
          }
        }
      } catch (cloudflareError) {
        console.error('Cloudflare 통계 데이터 조회 실패:', cloudflareError);
        // Cloudflare 통계 실패는 전체 통계 조회에 영향을 주지 않음
      }
    } catch (error) {
      console.error('통계 데이터 조회 오류:', error);
      // 오류가 발생해도 빈 데이터로 초기화하여 UI가 깨지지 않도록 함
      setStatsData({
        postsCount: 0,
        videosCount: 0,
        paidVideosCount: 0,
        totalViews: 0,
        subscriptionViews: 0,
        coinViews: 0,
        totalPoints: 0,
        lastWeekPoints: 0,
        todayViews: 0,
        totalReferredUsers: 0,
        todayReferredUsers: 0,
        activeViewers: 0
      });
    } finally {
      setIsLoading(false);
    }
  };

  // 주간 정산 선택 시 호출
  const handleWeekChange = (value: string) => {
    setSelectedWeek(value);
    fetchStatistics(value);
  };

  // 컴포넌트 마운트 시 데이터 조회
  useEffect(() => {
    fetchStatistics(selectedWeek);
  }, []);

  return (
    <div className="space-y-6">
      {/* 상단 통계 카드 */}
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
          // 업로더와 영업 멤버에 따라 다른 통계 카드 표시
          isUploader ? (
            // 업로더 통계 카드
            <>
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-medium">콘텐츠</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{statsData.postsCount || 0}</div>
                  <p className="text-xs text-muted-foreground">
                    전체 포스트 수 / 동영상 {statsData.videosCount || 0}개 (유료 {statsData.paidVideosCount || 0}개)
                  </p>
                </CardContent>
              </Card>
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-medium">시청 수</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{formatNumber(statsData.totalViews || 0)}</div>
                  <p className="text-xs text-muted-foreground">
                    누적 유료 시청 수 (오늘 +{statsData.todayViews || 0})
                  </p>
                </CardContent>
              </Card>
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-medium">시청 유형</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">
                    {formatNumber(statsData.subscriptionViews || 0)}/{formatNumber(statsData.coinViews || 0)}
                  </div>
                  <p className="text-xs text-muted-foreground">
                    구독 시청 / 코인 시청
                  </p>
                </CardContent>
              </Card>
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-medium">포인트</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{formatNumber(statsData.totalPoints || 0)}</div>
                  <p className="text-xs text-muted-foreground">
                    누적 포인트 (전주 +{formatNumber(statsData.lastWeekPoints || 0)})
                  </p>
                </CardContent>
              </Card>
            </>
          ) : (
            // 영업 멤버 통계 카드
            <>
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-medium">추천인</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{statsData.totalReferredUsers || 0}</div>
                  <p className="text-xs text-muted-foreground">
                    전체 추천 회원 수 (오늘 +{statsData.todayReferredUsers || 0})
                  </p>
                </CardContent>
              </Card>
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-medium">시청 활동</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{formatNumber(statsData.activeViewers || 0)}</div>
                  <p className="text-xs text-muted-foreground">
                    유료 시청 발생 회원 수
                  </p>
                </CardContent>
              </Card>
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-medium">포인트</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{formatNumber(statsData.totalPoints || 0)}</div>
                  <p className="text-xs text-muted-foreground">
                    누적 포인트 (전주 +{formatNumber(statsData.lastWeekPoints || 0)})
                  </p>
                </CardContent>
              </Card>
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-medium">안내</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-sm text-muted-foreground">
                    추천인으로 등록된 회원의 유료 시청 활동에 따라 포인트가 적립됩니다.
                  </p>
                </CardContent>
              </Card>
            </>
          )
        ) : (
          // 데이터 없음
          <div className="col-span-4 text-center py-8">
            <p className="text-muted-foreground">통계 데이터를 불러올 수 없습니다.</p>
          </div>
        )}
      </div>

      {/* 글로벌 접속자 지도맵 */}
      <Card>
        <CardHeader>
          <CardTitle>글로벌 접속자 지도</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="h-[300px] bg-muted rounded-md flex items-center justify-center">
            {isLoading ? (
              <Skeleton className="w-full h-full rounded-md" />
            ) : statsData?.viewerDistribution ? (
              <div id="global-map" className="w-full h-full relative">
                {/* 실제 세계 지도 이미지와 데이터 포인트 */}
                <div className="absolute inset-0 rounded-md overflow-hidden">
                  {/* 세계 지도 이미지 배경 */}
                  <div 
                    className="absolute inset-0 bg-contain bg-center"
                    style={{ 
                      backgroundImage: 'url(/world-map.svg)',
                      backgroundRepeat: 'no-repeat',
                      backgroundPosition: 'center'
                    }}
                  />
                  
                  {/* 국가별 데이터 포인트 */}
                  {statsData.viewerDistribution.map((item: any, index: number) => (
                    <div 
                      key={index}
                      className="absolute w-3 h-3 bg-blue-600 rounded-full transform -translate-x-1/2 -translate-y-1/2 shadow-lg cursor-pointer hover:z-10"
                      style={{
                        left: `${((item.longitude + 180) / 360) * 100}%`,
                        top: `${((90 - item.latitude) / 180) * 100}%`,
                        opacity: Math.min(1, item.count / 500),
                        width: `${Math.max(6, Math.min(20, item.count / 100))}px`,
                        height: `${Math.max(6, Math.min(20, item.count / 100))}px`,
                        boxShadow: '0 0 8px rgba(0, 0, 255, 0.5)'
                      }}
                      onMouseEnter={(e) => {
                        // 툴팁 표시
                        const tooltip = document.getElementById(`tooltip-${index}`);
                        if (tooltip) {
                          tooltip.style.display = 'block';
                        }
                      }}
                      onMouseLeave={(e) => {
                        // 툴팁 숨김
                        const tooltip = document.getElementById(`tooltip-${index}`);
                        if (tooltip) {
                          tooltip.style.display = 'none';
                        }
                      }}
                      onClick={(e) => {
                        // 모바일에서 클릭 시 툴팁 토글
                        const tooltip = document.getElementById(`tooltip-${index}`);
                        if (tooltip) {
                          const currentDisplay = tooltip.style.display;
                          tooltip.style.display = currentDisplay === 'block' ? 'none' : 'block';
                        }
                      }}
                    />
                  ))}
                  
                  {/* 툴팁 */}
                  {statsData.viewerDistribution.map((item: any, index: number) => (
                    <div 
                      key={`tooltip-${index}`}
                      id={`tooltip-${index}`}
                      className="absolute bg-white p-2 rounded shadow-lg text-xs z-50"
                      style={{
                        display: 'none',
                        left: `${((item.longitude + 180) / 360) * 100}%`,
                        top: `${((90 - item.latitude) / 180) * 100 - 5}%`,
                        transform: 'translateX(-50%)',
                        minWidth: '100px'
                      }}
                    >
                      <strong>{item.country}</strong><br />
                      시청자 수: {formatNumber(item.count)}명
                    </div>
                  ))}
                  
                  {/* 범례 */}
                  <div className="absolute bottom-2 right-2 bg-white p-2 rounded shadow text-xs">
                    <div className="flex items-center">
                      <div className="w-3 h-3 bg-blue-600 rounded-full mr-1 shadow-sm"></div>
                      <span>시청자 분포</span>
                    </div>
                  </div>
                </div>
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center">
                <p className="text-muted-foreground mb-2">Cloudflare 통계 데이터를 불러올 수 없습니다.</p>
                <Button 
                  variant="outline" 
                  size="sm"
                  onClick={() => {
                    // Cloudflare 통계 데이터 조회
                    try {
                      fetch(`${process.env.NEXT_PUBLIC_STATS_API_URL}/api/stats/cloudflare?userId=${userId}`)
                        .then(response => {
                          if (response.ok) return response.json();
                          throw new Error(`API 오류: ${response.status}`);
                        })
                        .then(data => {
                          if (data.success && data.data) {
                            setStatsData((prevData: any) => ({
                              ...prevData,
                              viewerDistribution: data.data.viewerDistribution,
                              cloudflareStats: data.data
                            }));
                          }
                        });
                    } catch (error) {
                      console.error('Cloudflare 통계 조회 오류:', error);
                    }
                  }}
                >
                  다시 시도
                </Button>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* 정산 조회 필터 */}
      <Card>
        <CardHeader>
          <CardTitle>정산 내역 조회</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col md:flex-row gap-4 mb-4">
            <div className="w-full md:w-1/3">
              <label className="text-sm font-medium mb-1 block">정산 주차</label>
              <Select value={selectedWeek} onValueChange={handleWeekChange}>
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
              <Button onClick={() => fetchStatistics(selectedWeek)}>
                조회
              </Button>
            </div>
          </div>

          {/* 조회 결과 */}
          {isLoading ? (
            <Skeleton className="h-[200px] rounded-lg" />
          ) : weeklyData ? (
            <div className="border rounded-md">
              <div className="grid grid-cols-4 gap-4 p-4 font-medium border-b">
                <div>항목</div>
                <div>날짜</div>
                <div>수량</div>
                <div>포인트</div>
              </div>
              {isUploader ? (
                // 업로더 정산 내역
                <>
                  {weeklyData.items?.map((item: any, index: number) => (
                    <div key={index} className="grid grid-cols-4 gap-4 p-4 border-b last:border-0">
                      <div className="text-sm">{item.postTitle || '포스트'}</div>
                      <div className="text-sm">{item.date || '-'}</div>
                      <div className="text-sm">{formatNumber(item.viewCount || 0)}</div>
                      <div className="text-sm">{formatNumber(item.points || 0)}</div>
                    </div>
                  ))}
                  {/* 합계 행 */}
                  <div className="grid grid-cols-4 gap-4 p-4 font-medium bg-muted">
                    <div>합계</div>
                    <div></div>
                    <div>{formatNumber(weeklyData.totalViewCount || 0)}</div>
                    <div>{formatNumber(weeklyData.totalPoints || 0)}</div>
                  </div>
                </>
              ) : (
                // 영업 멤버 정산 내역 - 요약 정보만 표시
                <div className="p-4 space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-1">
                      <p className="text-sm font-medium">소속 회원 수</p>
                      <p className="text-lg">{formatNumber(weeklyData.totalMembers || 0)}명</p>
                    </div>
                    <div className="space-y-1">
                      <p className="text-sm font-medium">유료 시청 발생 회원</p>
                      <p className="text-lg">{formatNumber(weeklyData.activeViewers || 0)}명</p>
                    </div>
                  </div>
                  
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-1">
                      <p className="text-sm font-medium">구독 시청</p>
                      <p className="text-lg">{formatNumber(weeklyData.subscriptionViews || 0)}회</p>
                    </div>
                    <div className="space-y-1">
                      <p className="text-sm font-medium">코인 시청</p>
                      <p className="text-lg">{formatNumber(weeklyData.coinViews || 0)}회</p>
                    </div>
                  </div>
                  
                  <div className="pt-4 border-t">
                    <div className="space-y-1">
                      <p className="text-sm font-medium">정산 포인트</p>
                      <p className="text-xl font-bold">{formatNumber(weeklyData.totalPoints || 0)} P</p>
                    </div>
                  </div>
                </div>
              )}
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
