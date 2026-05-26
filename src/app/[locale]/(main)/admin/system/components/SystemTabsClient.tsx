"use client";

import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { MainSettings } from "./MainSettings";
import { SystemSettings } from "./SystemSettings";
import { Layout, Settings, BarChart, DollarSign } from "lucide-react";
import { SystemStats } from "./SystemStats";
import { PointWithdrawalManagement } from "./PointWithdrawalManagement";
import { useRouter, useSearchParams } from "next/navigation";

export default function SystemTabsClient() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const currentTab = searchParams.get("tab") || "mainpage";

  const handleTabChange = (value: string) => {
    const params = new URLSearchParams(searchParams);
    params.set("tab", value);
    router.push(`?${params.toString()}`, { scroll: false });
  };

  return (
    <Tabs value={currentTab} onValueChange={handleTabChange}>
      <TabsList>
        <TabsTrigger value="mainpage" className="flex items-center gap-2">
          <Layout className="h-5 w-5 md:h-6 md:w-6" />
          <p className="hidden pl-1 md:block">Main page</p>
        </TabsTrigger>
        <TabsTrigger value="settings" className="flex items-center gap-2">
          <Settings className="h-5 w-5 md:h-6 md:w-6" />
          <p className="hidden pl-1 md:block">Settings</p>
        </TabsTrigger>
        <TabsTrigger value="stats" className="flex items-center gap-2">
          <BarChart className="h-5 w-5 md:h-6 md:w-6" />
          <p className="hidden pl-1 md:block">Stats</p>
        </TabsTrigger>
        <TabsTrigger value="withdrawals" className="flex items-center gap-2">
          <DollarSign className="h-5 w-5 md:h-6 md:w-6" />
          <p className="hidden pl-1 md:block">Point Withdrawals</p>
        </TabsTrigger>
      </TabsList>

      <TabsContent value="mainpage">
        <MainSettings />
      </TabsContent>
      <TabsContent value="settings">
        <SystemSettings />
      </TabsContent>
      <TabsContent value="stats">
        <SystemStats />
      </TabsContent>
      <TabsContent value="withdrawals">
        <PointWithdrawalManagement />
      </TabsContent>
    </Tabs>
  );
}
