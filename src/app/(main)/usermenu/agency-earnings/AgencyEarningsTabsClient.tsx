"use client";

import { useState, useEffect, Suspense } from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useSearchParams, useRouter } from "next/navigation";
import LoadingSpinner from "@/app/(main)/admin/service/components/LoadingSpinner";
import { BarChart3, CreditCard } from "lucide-react";

// 포인트 통계 탭 컴포넌트 (업로더와 동일한 컴포넌트 재사용)
import PointsStatistics from '../earnings/PointsStatistics';
// 포인트 신청 탭 컴포넌트 (업로더와 동일한 컴포넌트 재사용)
import PointsApplication from '../earnings/PointsApplication';

interface AgencyEarningsTabsClientProps {
  userId: string;
  userRole: number; // 20: 영업 멤버
}

export default function AgencyEarningsTabsClient({ userId, userRole }: AgencyEarningsTabsClientProps) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const currentTab = searchParams.get("tab") || "statistics";

  const handleTabChange = (value: string) => {
    // 현재 URL 가져오기
    const url = new URL(window.location.href);
    
    // 쿼리 파라미터 설정
    url.searchParams.set("tab", value);
    
    // 히스토리 업데이트 (페이지 새로고침 없이 URL 변경)
    router.push(url.pathname + url.search);
  };

  return (
    <div className="space-y-6">
      <Tabs defaultValue={currentTab} onValueChange={handleTabChange}>
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="statistics" className="flex items-center gap-2">
            <BarChart3 className="h-4 w-4" />
            <span>포인트 통계</span>
          </TabsTrigger>
          <TabsTrigger value="application" className="flex items-center gap-2">
            <CreditCard className="h-4 w-4" />
            <span>포인트 신청</span>
          </TabsTrigger>
        </TabsList>
        
        <TabsContent value="statistics" className="mt-6">
          <Suspense fallback={<LoadingSpinner />}>
            <PointsStatistics userId={userId} userRole={userRole} />
          </Suspense>
        </TabsContent>
        
        <TabsContent value="application" className="mt-6">
          <Suspense fallback={<LoadingSpinner />}>
            <PointsApplication userId={userId} userRole={userRole} />
          </Suspense>
        </TabsContent>
      </Tabs>
    </div>
  );
}
