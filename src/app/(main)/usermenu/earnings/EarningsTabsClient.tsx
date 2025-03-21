"use client";

import { lazy, Suspense } from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useSearchParams, useRouter } from "next/navigation";
import LoadingSpinner from "@/app/(main)/admin/service/components/LoadingSpinner";
import { BarChart3, CreditCard } from "lucide-react";

// 포인트 통계 탭 컴포넌트
const PointsStatistics = lazy(() => import('./PointsStatistics'));
// 포인트 신청 탭 컴포넌트
const PointsApplication = lazy(() => import('./PointsApplication'));

interface EarningsTabsClientProps {
  userId: string;
  userRole: number; // 사용자 역할 (40: 업로더, 20: 영업 멤버)
}

export default function EarningsTabsClient({ userId, userRole }: EarningsTabsClientProps) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const currentTab = searchParams.get("tab") || "statistics";

  const handleTabChange = (value: string) => {
    const params = new URLSearchParams(searchParams);
    params.set("tab", value);
    router.push(`?${params.toString()}`, { scroll: false });
  };

  return (
    <Tabs value={currentTab} onValueChange={handleTabChange}>
      <TabsList>
        <TabsTrigger value="statistics" className="flex items-center gap-2">
          <BarChart3 className="w-5 h-5 md:w-6 md:h-6" />
          <p className="pl-1 hidden md:block">포인트통계</p>
        </TabsTrigger>
        <TabsTrigger value="application" className="flex items-center gap-2">
          <CreditCard className="w-5 h-5 md:w-6 md:h-6" />
          <p className="pl-1 hidden md:block">포인트신청</p>
        </TabsTrigger>
      </TabsList>
      <TabsContent value="statistics">
        {currentTab === "statistics" && (
          <Suspense fallback={<LoadingSpinner />}>
            <PointsStatistics userId={userId} userRole={userRole} />
          </Suspense>
        )}
      </TabsContent>
      <TabsContent value="application">
        {currentTab === "application" && (
          <Suspense fallback={<LoadingSpinner />}>
            <PointsApplication userId={userId} userRole={userRole} />
          </Suspense>
        )}
      </TabsContent>
    </Tabs>
  );
}
