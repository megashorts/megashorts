"use client";

import { lazy, Suspense } from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useSearchParams, useRouter } from "next/navigation";
import LoadingSpinner from "@/app/[locale]/(main)/admin/service/components/LoadingSpinner";
import { BarChart3, CreditCard } from "lucide-react";
import { useTranslations } from "next-intl";

const PointsStatistics = lazy(() => import('./PointsStatistics'));
const PointsApplication = lazy(() => import('./PointsApplication'));

interface EarningsTabsClientProps {
  userId: string;
  userRole: number;
}

export default function EarningsTabsClient({ userId, userRole }: EarningsTabsClientProps) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const t = useTranslations('Earnings');
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
          <p className="pl-1 hidden md:block">{t('pointsStatistics')}</p>
        </TabsTrigger>
        <TabsTrigger value="application" className="flex items-center gap-2">
          <CreditCard className="w-5 h-5 md:w-6 md:h-6" />
          <p className="pl-1 hidden md:block">{t('pointsApplication')}</p>
        </TabsTrigger>
      </TabsList>
      <TabsContent value="statistics" className="mt-2">
        {currentTab === "statistics" && (
          <Suspense fallback={<LoadingSpinner />}>
            <PointsStatistics userId={userId} userRole={userRole} type="creator" />
          </Suspense>
        )}
      </TabsContent>
      <TabsContent value="application" className="mt-2">
        {currentTab === "application" && (
          <Suspense fallback={<LoadingSpinner />}>
            <PointsApplication userId={userId} userRole={userRole} />
          </Suspense>
        )}
      </TabsContent>
    </Tabs>
  );
}
