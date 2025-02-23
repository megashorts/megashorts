import { TooltipProvider } from '@/components/ui/tooltip';
import { LogsClient } from './components/LogsClient';
import { Binoculars, CircleDollarSign, ClipboardList, Headset, PartyPopper } from 'lucide-react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';

export default function LogsPage() {
  return (
    <TooltipProvider>
      {/* <div className="container py-6">
        <div className="flex items-center gap-2 mb-6">
          <ClipboardList className="w-6 h-6" />
          <div>
            <h1 className="text-2xl font-bold">시스템 로그</h1>
            <p className="text-sm text-muted-foreground">
              시스템 활동 로그를 조회하고 관리합니다.
            </p>
          </div>
        </div>
        <LogsClient />
      </div>
    </TooltipProvider> */}

      <main className="flex w-full min-w-0 gap-5">
        <div className="w-full min-w-0 space-y-2 mx-5 md:mx-1 lg:mx-1 xl:mx-1">
          <div className="flex items-center justify-center rounded-xl bg-card p-2 md:p-3 mx-auto shadow-sm hidden md:block">
            <h1 className="text-center text-base sm:text-xl font-bold">Service</h1>
          </div>
          <Tabs defaultValue="noticemodal">
            <TabsList>
              <TabsTrigger value="noticemodal"><PartyPopper className="w-6 h-6" /></TabsTrigger>
              <TabsTrigger value="inquiry"><Headset className="w-6 h-6" /></TabsTrigger>
              <TabsTrigger value="logs"><ClipboardList className="w-6 h-6" /><p className="pl-1 hidden md:block">Logs</p></TabsTrigger>
            </TabsList>
            <TabsContent value="noticemodal">
              {/* <Bookmarks /> */}
            </TabsContent>
            <TabsContent value="inquiry">
              {/* <Bookmarks /> */}
            </TabsContent>
            <TabsContent value="logs">
              <LogsClient />
            </TabsContent>
          </Tabs>
        </div>
      </main>

    </TooltipProvider>

  );
}