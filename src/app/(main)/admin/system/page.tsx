import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { MainSettings } from "./components/MainSettings";
import { SystemSettings } from "./components/SystemSettings";
import { Settings, Layout, BarChart, DollarSign } from 'lucide-react';
import { SystemStats } from "./components/SystemStats";
import { PointWithdrawalManagement } from "./components/PointWithdrawalManagement";

export default function SettingsPage() {
  return (
    <main className="flex w-full min-w-0 gap-5">
      <div className="w-full min-w-0 space-y-2 mx-5 md:mx-1 lg:mx-1 xl:mx-1">
        <div className="flex items-center justify-center rounded-xl bg-card p-2 md:p-3 mx-auto shadow-sm hidden md:block">
          <h1 className="text-center text-base sm:text-xl font-bold">System</h1>
        </div>
        <Tabs defaultValue="mainpage">
          <TabsList>
            <TabsTrigger value="mainpage" className="flex items-center gap-2">
              <Layout className="w-5 h-5 md:w-6 md:h-6" />
              <p className="pl-1 hidden md:block">Main page</p>
            </TabsTrigger>
            <TabsTrigger value="settings" className="flex items-center gap-2">
              <Settings className="w-5 h-5 md:w-6 md:h-6" />
              <p className="pl-1 hidden md:block">Settings</p>
            </TabsTrigger>
            <TabsTrigger value="stats" className="flex items-center gap-2">
              <BarChart className="w-5 h-5 md:w-6 md:h-6" />
              <p className="pl-1 hidden md:block">통계</p>
            </TabsTrigger>
            <TabsTrigger value="withdrawals" className="flex items-center gap-2">
              <DollarSign className="w-5 h-5 md:w-6 md:h-6" />
              <p className="pl-1 hidden md:block">포인트 출금</p>
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
      </div>
    </main>
  );
}
