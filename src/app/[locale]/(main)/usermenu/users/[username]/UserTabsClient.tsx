"use client";

import { lazy, Suspense } from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useSearchParams, useRouter } from "next/navigation";
import LoadingSpinner from "@/app/[locale]/(main)/admin/service/components/LoadingSpinner";
import { CircleDollarSign, Gem, Headset, MessageCircleMore } from "lucide-react";
import { useTranslations } from "next-intl";

const Notifications = lazy(() => import('./Notifications'));
// const PaymentHistory = lazy(() => import('./PaymentHistory'));
const UserInquiryList = lazy(() => import('./UserInquiryList'));


export default function UserTabsClient() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const tProfile = useTranslations('Profile');
  const tUserMenu = useTranslations('UserMenu');
  const currentTab = searchParams.get("tab") || "notification";

  const handleTabChange = (value: string) => {
    const params = new URLSearchParams(searchParams);
    params.set("tab", value);
    router.push(`?${params.toString()}`, { scroll: false });
  };

  return (
    <Tabs value={currentTab} onValueChange={handleTabChange}>
      <TabsList>
        <TabsTrigger value="notification" className="flex items-center gap-2">
          <MessageCircleMore className="w-5 h-5 md:w-6 md:h-6" />
          <p className="pl-1 hidden md:block">{tProfile('notification')}</p>
        </TabsTrigger>
        <TabsTrigger value="coin" className="flex items-center gap-2">
          <Gem className="w-5 h-5 md:w-6 md:h-6" />
          <p className="pl-1 hidden md:block">{tUserMenu('coinWatch')}</p>
        </TabsTrigger>
        <TabsTrigger value="pay" className="flex items-center gap-2">
          <CircleDollarSign className="w-5 h-5 md:w-6 md:h-6" />
          <p className="pl-1 hidden md:block">{tProfile('paymentHistory')}</p>
        </TabsTrigger>
        {/* <TabsTrigger value="inquiry" className="flex items-center gap-2">
          <Headset className="w-5 h-5 md:w-6 md:h-6" />
          <p className="pl-1 hidden md:block">문의</p>
        </TabsTrigger> */}
      </TabsList>
      <TabsContent value="notification">
        {currentTab === "notification" && (
          <Suspense fallback={<LoadingSpinner />}>
            <Notifications />
          </Suspense>
        )}
      </TabsContent>
      <TabsContent value="coin">
        {currentTab === "coin" && (
          <Suspense fallback={<LoadingSpinner />}>
            <p className="text-center text-muted-foreground mt-8">
              {tUserMenu('paymentRegistrationPending')}
            </p>
          </Suspense>
        )}
      </TabsContent>
      <TabsContent value="pay">
        {currentTab === "pay" && (
          <Suspense fallback={<LoadingSpinner />}>
            <p className="text-center text-muted-foreground mt-8">
              {tUserMenu('paymentRegistrationPending')}
            </p>
          </Suspense>
        )}
      </TabsContent>
      <TabsContent value="inquiry">
        {currentTab === "inquiry" && (
          <Suspense fallback={<LoadingSpinner />}>
            <UserInquiryList />
          </Suspense>
        )}
      </TabsContent>
    </Tabs>
  );
}
