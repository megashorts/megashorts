import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { MainSettings } from "./components/MainSettings";
import { SystemSettings } from "./components/SystemSettings";
import { Settings, Layout, Headset } from 'lucide-react';

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
          </TabsList>

          <TabsContent value="mainpage">
            <MainSettings />
          </TabsContent>

          <TabsContent value="settings">
            <SystemSettings />
          </TabsContent>

        </Tabs>
      </div>
    </main>
  );
}
