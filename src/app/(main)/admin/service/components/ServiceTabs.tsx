"use client";

import { lazy, Suspense, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Separator } from "@/components/ui/separator";
import LoadingSpinner from "./LoadingSpinner";
import { FileClock, Headset, SquareStack } from "lucide-react";
import { useSession } from "@/components/SessionProvider";

const NoticeModalClient = lazy(() => import("./NoticeModalClient"));
const LogsClient = lazy(() => import("./LogsClient"));
const AdminInquiryList = lazy(() => import("./inquiry/AdminInquiryList"));

export default function ServiceTabs() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const currentTab = searchParams.get("tab") || "notice";
  const { user } = useSession();
  const displayName = user?.displayName;

  const handleTabChange = (value: string) => {
    const params = new URLSearchParams(searchParams);
    params.set("tab", value);
    router.push(`?${params.toString()}`, { scroll: false });
  };

  return (
    <div>
      <Tabs value={currentTab} onValueChange={handleTabChange}>
        <TabsList>
          <TabsTrigger value="notice" className="flex items-center gap-2">
            <SquareStack className="w-5 h-5 md:w-6 md:h-6" />
            <p className="pl-1 hidden md:block">Main modal</p>
          </TabsTrigger>
          <TabsTrigger value="inquiry" className="flex items-center gap-2">
            <Headset className="w-5 h-5 md:w-6 md:h-6" />
            <p className="pl-1 hidden md:block">inquiry</p>
          </TabsTrigger>
          <TabsTrigger value="logs" className="flex items-center gap-2">
            <FileClock className="w-5 h-5 md:w-6 md:h-6" />
            <p className="pl-1 hidden md:block">logs system</p>
          </TabsTrigger>
        </TabsList>
        <TabsContent value="notice" className="space-y-4">
          {currentTab === "notice" && (
            <Suspense fallback={<LoadingSpinner />}>
              <NoticeModalClient currentUser={displayName ? { displayName } : undefined} />
            </Suspense>
          )}
        </TabsContent>
        <TabsContent value="inquiry" className="space-y-4">
          {currentTab === "inquiry" && (
            <Suspense fallback={<LoadingSpinner />}>
              <AdminInquiryList />
            </Suspense>
          )}
        </TabsContent>
        <TabsContent value="logs" className="space-y-4">
          {currentTab === "logs" && (
            <Suspense fallback={<LoadingSpinner />}>
              <LogsClient />
            </Suspense>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}