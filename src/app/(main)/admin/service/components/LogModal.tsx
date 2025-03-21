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
import { LogIn, CreditCard, FileText, Video, Settings2, Globe, User2, Clock, MapPin, Laptop } from 'lucide-react';
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
  // 커스텀 로그 형식 처리 (event 필드가 있는 경우)
  if (log.event) {
    return (
      <div className="space-y-4">
        <div className="flex items-center gap-2">
          {getTypeIcon(log.type)}
          <span className="text-sm">{log.event}</span>
        </div>
        
        {log.details && (
          <div className="rounded-md border py-3 px-2 space-y-3">
            {Object.entries(log.details).map(([key, value]) => (
              <div key={key} className="grid grid-cols-6 gap-0">
                <div className="text-xs font-medium text-muted-foreground">{key} :</div>
                <div className="col-span-5 text-xs break-all">
                  {typeof value === 'object' 
                    ? JSON.stringify(value) 
                    : String(value)}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    );
  }
  
  // 기존 API 로그 형식 처리
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
        <span className="font-medium">{log.method} {log.path}</span>
      </div>
      
      <div className="rounded-md border overflow-hidden">
        <div className="bg-muted px-3 py-2 text-sm font-medium">요청 정보</div>
        <div className="p-3 space-y-2">
          <div className="grid grid-cols-3 gap-2">
            <div className="text-sm font-medium text-muted-foreground">메서드:</div>
            <div className="col-span-2 text-sm">{log.method || '-'}</div>
          </div>
          <div className="grid grid-cols-3 gap-2">
            <div className="text-sm font-medium text-muted-foreground">경로:</div>
            <div className="col-span-2 text-sm break-all">{log.path || '-'}</div>
          </div>
          {log.request?.query && (
            <div className="grid grid-cols-3 gap-2">
              <div className="text-sm font-medium text-muted-foreground">쿼리:</div>
              <div className="col-span-2 text-sm">
                <pre className="text-xs bg-muted p-2 rounded-md overflow-auto">
                  {JSON.stringify(log.request.query, null, 2)}
                </pre>
              </div>
            </div>
          )}
          {log.request?.body && (
            <div className="grid grid-cols-3 gap-2">
              <div className="text-sm font-medium text-muted-foreground">바디:</div>
              <div className="col-span-2 text-sm">
                <pre className="text-xs bg-muted p-2 rounded-md overflow-auto">
                  {JSON.stringify(log.request.body, null, 2)}
                </pre>
              </div>
            </div>
          )}
        </div>
      </div>
      
      <div className="rounded-md border overflow-hidden">
        <div className="bg-muted px-3 py-2 text-sm font-medium">응답 정보</div>
        <div className="p-3 space-y-2">
          <div className="grid grid-cols-3 gap-2">
            <div className="text-sm font-medium text-muted-foreground">상태:</div>
            <div className="col-span-2 text-sm">{log.status || '-'}</div>
          </div>
          {log.response?.error && (
            <div className="grid grid-cols-3 gap-2">
              <div className="text-sm font-medium text-muted-foreground">에러:</div>
              <div className="col-span-2 text-sm text-red-500">{log.response.error}</div>
            </div>
          )}
          {log.response?.data && (
            <div className="grid grid-cols-3 gap-2">
              <div className="text-sm font-medium text-muted-foreground">데이터:</div>
              <div className="col-span-2 text-sm">
                <pre className="text-xs bg-muted p-2 rounded-md overflow-auto">
                  {JSON.stringify(log.response.data, null, 2)}
                </pre>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export function LogModal({ log, onClose }: LogModalProps) {
  return (
    <Dialog open onOpenChange={onClose}>
      <DialogContent className="max-w-[95vw] md:max-w-2xl max-h-[90vh] overflow-y-auto rounded-lg">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            {getTypeIcon(log.type)}
            <span>{getTypeLabel(log.type)}</span>
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="flex items-center gap-2">
              <Clock className="w-4 h-4 flex-shrink-0" />
              <span className="text-sm break-all">{format(new Date(log.timestamp), 'PPP p', { locale: ko })}</span>
            </div>
            <div className="flex items-center gap-2">
              <Globe className="w-4 h-4 flex-shrink-0" />
              <span className="text-sm break-all">{log.ip || '-'}</span>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <User2 className="w-4 h-4 flex-shrink-0" />
            <span className="text-sm break-all">{log.username || '-'}</span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {log.country && (
              <div className="flex items-center gap-2">
                <MapPin className="w-4 h-4 flex-shrink-0" />
                <span className="text-sm">
                  {log.country}
                  {log.city ? ` (${log.city})` : ''}
                </span>
              </div>
            )}
            
            {log.device && (
              <div className="flex items-center gap-2">
                <Laptop className="w-4 h-4 flex-shrink-0" />
                <span className="text-sm">
                  {log.device.browser} / {log.device.os} / {log.device.type}
                </span>
              </div>
            )}
          </div>

          <div className="pt-2">
            {formatLogDetails(log)}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
