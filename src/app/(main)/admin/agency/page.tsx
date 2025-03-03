import { TooltipProvider } from '@/components/ui/tooltip';
import AgencyTabs from './components/AgencyTabs';

export default function AgencyPage() {
  return (
    <TooltipProvider>
      <main className="flex w-full min-w-0 gap-5">
        <div className="w-full min-w-0 space-y-2 mx-5 md:mx-1 lg:mx-1 xl:mx-1">
          <div className="flex items-center justify-center rounded-xl bg-card p-2 md:p-3 mx-auto shadow-sm hidden md:block">
            <h1 className="text-center text-base sm:text-xl font-bold">Agency</h1>
          </div>
          <AgencyTabs />
        </div>
      </main>
    </TooltipProvider>
  );
}
