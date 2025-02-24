import { TooltipProvider } from '@/components/ui/tooltip';
import { LogsClient } from './components/LogsClient';
import { NoticeModalClient } from './components/NoticeModalClient';
import { Binoculars, CircleDollarSign, ClipboardList, Headset, PartyPopper } from 'lucide-react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';

export default function ServicePage() {
  return (
    <TooltipProvider>
      <main className="flex w-full min-w-0 gap-5">
        <div className="w-full min-w-0 space-y-2 mx-5 md:mx-1 lg:mx-1 xl:mx-1">
          <div className="flex items-center justify-center rounded-xl bg-card p-2 md:p-3 mx-auto shadow-sm hidden md:block">
            <h1 className="text-center text-base sm:text-xl font-bold">Service</h1>
          </div>
          <Tabs defaultValue="noticemodal">
            <TabsList>
              <TabsTrigger value="noticemodal">
                <PartyPopper className="w-6 h-6" />
                <p className="pl-1 hidden md:block">Notice Modal</p>
              </TabsTrigger>
              <TabsTrigger value="inquiry">
                <Headset className="w-6 h-6" />
                <p className="pl-1 hidden md:block">Inquiry</p>
              </TabsTrigger>
              <TabsTrigger value="logs">
                <ClipboardList className="w-6 h-6" />
                <p className="pl-1 hidden md:block">Logs</p>
              </TabsTrigger>
            </TabsList>
            <TabsContent value="noticemodal">
              <NoticeModalClient />
            </TabsContent>
            <TabsContent value="inquiry">
              {/* <Inquiry /> */}
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
