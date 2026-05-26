"use client";

import { useState, useEffect, Suspense } from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useSearchParams, useRouter } from "next/navigation";
import LoadingSpinner from "@/app/[locale]/(main)/admin/service/components/LoadingSpinner";
import { BarChart3, CreditCard, Network } from "lucide-react";
import { useTranslations } from "next-intl";

// Reuse the creator statistics component for agency earnings.
import PointsStatistics from '../earnings/PointsStatistics';
// Reuse the shared payout application component.
import PointsApplication from '../earnings/PointsApplication';
import ReferralStructureTab from "./ReferralStructureTab";

interface AgencyEarningsTabsClientProps {
  userId: string;
  userRole: number;
}

export default function AgencyEarningsTabsClient({ userId, userRole }: AgencyEarningsTabsClientProps) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const t = useTranslations('Earnings');
  const currentTab = searchParams.get("tab") || "statistics";

  const handleTabChange = (value: string) => {
    const url = new URL(window.location.href);
    url.searchParams.set("tab", value);
    router.push(url.pathname + url.search);
  };

  return (
    <div className="space-y-2">
      <Tabs defaultValue={currentTab} onValueChange={handleTabChange}>
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="statistics" className="flex items-center gap-2">
            <BarChart3 className="h-4 w-4" />
            <span>{t('pointsStatistics')}</span>
          </TabsTrigger>
          <TabsTrigger value="application" className="flex items-center gap-2">
            <CreditCard className="h-4 w-4" />
            <span>{t('pointsApplication')}</span>
          </TabsTrigger>
          <TabsTrigger value="structure" className="flex items-center gap-2">
            <Network className="h-4 w-4" />
            <span>{t('referralStructure')}</span>
          </TabsTrigger>
        </TabsList>
        
        <TabsContent value="statistics" className="mt-2">
          <Suspense fallback={<LoadingSpinner />}>
            <PointsStatistics userId={userId} userRole={userRole} type="agency" />
          </Suspense>
        </TabsContent>
        
        <TabsContent value="application" className="mt-2">
          <Suspense fallback={<LoadingSpinner />}>
            <PointsApplication userId={userId} userRole={userRole} />
          </Suspense>
        </TabsContent>

        <TabsContent value="structure" className="mt-2">
          <Suspense fallback={<LoadingSpinner />}>
            <ReferralStructureTab userId={userId} />
          </Suspense>
        </TabsContent>
      </Tabs>
    </div>
  );
}
