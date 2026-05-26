'use client';

import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { ActivityLog } from '@/lib/activity-logger/types';
import { LogIn, CreditCard, FileText, Video, Settings2, Globe, User2, Clock, MapPin, Laptop } from 'lucide-react';
import { TYPE_DISPLAY_NAMES } from '@/lib/activity-logger/constants';
import { DEFAULT_ANALYTICS_TIME_ZONE } from '@/lib/analytics-timezone';

interface LogModalProps {
  log: ActivityLog;
  onClose: () => void;
  timeZone?: string;
}

const typeIcons = {
  auth: { icon: <LogIn className="w-5 h-5" />, label: TYPE_DISPLAY_NAMES.auth },
  payment: { icon: <CreditCard className="w-5 h-5" />, label: TYPE_DISPLAY_NAMES.payment },
  post: { icon: <FileText className="w-5 h-5" />, label: TYPE_DISPLAY_NAMES.post },
  video: { icon: <Video className="w-5 h-5" />, label: TYPE_DISPLAY_NAMES.video },
  system: { icon: <Settings2 className="w-5 h-5" />, label: TYPE_DISPLAY_NAMES.system }
} as const;

function translateWorkerText(text: string): string {
  return text
    .replace(/로그인/g, 'Login')
    .replace(/로그아웃/g, 'Logout')
    .replace(/회원가입/g, 'Sign Up')
    .replace(/코인 지급/g, 'Coin Grant')
    .replace(/포인트 지급/g, 'Point Grant')
    .replace(/출금 신청/g, 'Withdrawal Request')
    .replace(/출금 승인/g, 'Withdrawal Approved')
    .replace(/출금 거부/g, 'Withdrawal Rejected')
    .replace(/결제 성공/g, 'Payment Success')
    .replace(/결제 실패/g, 'Payment Failed');
}

function getTypeIcon(type: string) {
  return (typeIcons[type as keyof typeof typeIcons]?.icon || typeIcons.system.icon);
}

function getTypeLabel(type: string) {
  return (typeIcons[type as keyof typeof typeIcons]?.label || TYPE_DISPLAY_NAMES.system);
}

function formatTimestamp(dateInput: string, timeZone: string) {
  return new Intl.DateTimeFormat('en-CA', {
    timeZone,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
    hour12: false,
  }).format(new Date(dateInput));
}

function formatLogDetails(log: ActivityLog) {
  // 커스텀 로그 형식 처리 (event 필드가 있는 경우)
  if (log.event) {
    const eventText = log.eventI18n?.en || translateWorkerText(log.event);

    return (
      <div className="space-y-4">
        <div className="flex items-center gap-2">
          {getTypeIcon(log.type)}
          <span className="text-sm">{eventText}</span>
        </div>
        {log.eventI18n?.ko && log.eventI18n.ko !== eventText && (
          <div className="rounded-md border px-2 py-2 text-xs text-muted-foreground">
            Original: {log.eventI18n.ko}
          </div>
        )}
        
        {log.details && (
          <div className="rounded-md border py-3 px-2 space-y-3">
            {Object.entries(log.details).map(([key, value]) => (
              <div key={key} className="grid grid-cols-6 gap-0">
                <div className="text-xs font-medium text-muted-foreground">{key} :</div>
                <div className="col-span-5 text-xs break-all">
                  {typeof value === 'object' 
                    ? JSON.stringify(value) 
                    : translateWorkerText(String(value))}
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
    Request: {
      Method: log.method,
      Path: log.path,
      Query: log.request?.query,
      Body: log.request?.body
    },
    Response: {
      Status: log.status,
      Data: log.response?.data,
      Error: log.response?.error
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2">
        {getTypeIcon(log.type)}
        <span className="font-medium">{log.method} {log.path}</span>
      </div>
      
      <div className="rounded-md border overflow-hidden">
        <div className="bg-muted px-3 py-2 text-sm font-medium">Request Information</div>
        <div className="p-3 space-y-2">
          <div className="grid grid-cols-3 gap-2">
            <div className="text-sm font-medium text-muted-foreground">Method:</div>
            <div className="col-span-2 text-sm">{log.method || '-'}</div>
          </div>
          <div className="grid grid-cols-3 gap-2">
            <div className="text-sm font-medium text-muted-foreground">Path:</div>
            <div className="col-span-2 text-sm break-all">{log.path || '-'}</div>
          </div>
          {log.request?.query && (
            <div className="grid grid-cols-3 gap-2">
              <div className="text-sm font-medium text-muted-foreground">Query:</div>
              <div className="col-span-2 text-sm">
                <pre className="text-xs bg-muted p-2 rounded-md overflow-auto">
                  {JSON.stringify(log.request.query, null, 2)}
                </pre>
              </div>
            </div>
          )}
          {log.request?.body && (
            <div className="grid grid-cols-3 gap-2">
              <div className="text-sm font-medium text-muted-foreground">Body:</div>
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
        <div className="bg-muted px-3 py-2 text-sm font-medium">Response Information</div>
        <div className="p-3 space-y-2">
          <div className="grid grid-cols-3 gap-2">
            <div className="text-sm font-medium text-muted-foreground">Status:</div>
            <div className="col-span-2 text-sm">{log.status || '-'}</div>
          </div>
          {log.response?.error && (
            <div className="grid grid-cols-3 gap-2">
              <div className="text-sm font-medium text-muted-foreground">Error:</div>
              <div className="col-span-2 text-sm text-red-500">{translateWorkerText(log.response.error)}</div>
            </div>
          )}
          {log.response?.data && (
            <div className="grid grid-cols-3 gap-2">
              <div className="text-sm font-medium text-muted-foreground">Data:</div>
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

export function LogModal({ log, onClose, timeZone = DEFAULT_ANALYTICS_TIME_ZONE }: LogModalProps) {
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
               <span className="text-sm break-all">
                 {formatTimestamp(log.timestamp, timeZone)} ({timeZone})
               </span>
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

          {/* 전체 로그 정보 표시 섹션 추가 */}
          <div className="rounded-md border overflow-hidden mt-4">
            <div className="p-3">
              <pre className="text-xs bg-muted p-2 rounded-md overflow-auto max-h-[300px]">
                {JSON.stringify(log, null, 2)}
              </pre>
            </div>
          </div>

        </div>
      </DialogContent>
    </Dialog>
  );
}
