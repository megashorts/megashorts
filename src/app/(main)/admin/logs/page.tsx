import { TooltipProvider } from '@/components/ui/tooltip';
import { LogsClient } from './components/LogsClient';
import { ClipboardList } from 'lucide-react';

export default function LogsPage() {
  return (
    <TooltipProvider>
      <div className="container py-6">
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
    </TooltipProvider>
  );
}