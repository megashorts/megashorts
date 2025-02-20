'use client';

import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { format } from 'date-fns';
import { ko } from 'date-fns/locale';
import { ActivityLog } from '@/lib/activity-logger/types';
import { LogIn, CreditCard, FileText, Video, Settings2, Globe, User2, Clock } from 'lucide-react';
import { TYPE_DISPLAY_NAMES } from '@/lib/activity-logger/constants';

interface LogModalProps {
  log: ActivityLog;
  onClose: () => void;
}

const typeIcons = {
  auth: { icon: <LogIn className="w-5 h-5" />, label: TYPE_DISPLAY_NAMES.auth },
  payment: { icon: <CreditCard className="w-5 h-5" />, label: TYPE_DISPLAY_NAMES.payment },
  post: { icon: <FileText className="w-5 h-5" />, label: TYPE_DISPLAY_NAMES.post },
  video: { icon: <Video className="w-5 h-5" />, label: TYPE_DISPLAY_NAMES.video },
  system: { icon: <Settings2 className="w-5 h-5" />, label: TYPE_DISPLAY_NAMES.system }
} as const;

function getTypeIcon(type: string) {
  return (typeIcons[type as keyof typeof typeIcons]?.icon || typeIcons.system.icon);
}

function getTypeLabel(type: string) {
  return (typeIcons[type as keyof typeof typeIcons]?.label || TYPE_DISPLAY_NAMES.system);
}

function formatLogDetails(log: ActivityLog) {
  const details = {
    요청: {
      메서드: log.method,
      경로: log.path,
      쿼리: log.request?.query,
      바디: log.request?.body
    },
    응답: {
      상태: log.status,
      데이터: log.response?.data,
      에러: log.response?.error
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2">
        {getTypeIcon(log.type)}
        <span>{log.method} {log.path}</span>
      </div>
      
      <pre className="text-sm bg-muted p-2 rounded-md overflow-auto">
        {JSON.stringify(details, null, 2)}
      </pre>
    </div>
  );
}

export function LogModal({ log, onClose }: LogModalProps) {
  return (
    <Dialog open onOpenChange={onClose}>
      <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            {getTypeIcon(log.type)}
            <span>{getTypeLabel(log.type)}</span>
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="flex items-center gap-2">
              <Clock className="w-4 h-4" />
              <span>{format(new Date(log.timestamp), 'PPP p', { locale: ko })}</span>
            </div>
            <div className="flex items-center gap-2">
              <Globe className="w-4 h-4" />
              <span>{log.ip || '-'}</span>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <User2 className="w-4 h-4" />
            <span>{log.username || '-'}</span>
          </div>

          <div className="pt-4">
            {formatLogDetails(log)}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
