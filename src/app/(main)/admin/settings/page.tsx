import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { MainSettings } from "./components/MainSettings";
import { SystemSettings } from "./components/SystemSettings";
import { Settings, Layout } from 'lucide-react';

export default function SettingsPage() {
  return (
    <div className="container mx-auto py-6">
      <div className="flex items-center gap-2 mb-6">
        <Settings className="w-6 h-6" />
        <h1 className="text-2xl font-bold">관리자 설정</h1>
      </div>
      
      <Tabs defaultValue="main" className="w-full">
        <TabsList>
          <TabsTrigger value="main" className="flex items-center gap-2">
            <Layout className="w-4 h-4" />
            <span className="hidden sm:inline">메인페이지</span>
          </TabsTrigger>
          <TabsTrigger value="system" className="flex items-center gap-2">
            <Settings className="w-4 h-4" />
            <span className="hidden sm:inline">시스템</span>
          </TabsTrigger>
        </TabsList>

        <TabsContent value="main">
          <MainSettings />
        </TabsContent>

        <TabsContent value="system">
          <SystemSettings />
        </TabsContent>
      </Tabs>
    </div>
  );
}
