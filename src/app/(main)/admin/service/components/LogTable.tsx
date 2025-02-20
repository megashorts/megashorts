'use client';

import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { LogTableProps } from "../types";
import { Button } from "@/components/ui/button";
import { ArrowUpDown, Info, LogIn, CreditCard, FileText, Video, Settings2, User2, Globe } from 'lucide-react';
import { format } from 'date-fns';
import { ko } from 'date-fns/locale';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';
import { ActivityLog } from '@/lib/activity-logger/types';
import { TYPE_DISPLAY_NAMES } from '@/lib/activity-logger/constants';

type LogType = keyof typeof TYPE_DISPLAY_NAMES;

const typeIcons = {
  auth: { icon: <LogIn className="w-4 h-4" />, label: TYPE_DISPLAY_NAMES.auth },
  payment: { icon: <CreditCard className="w-4 h-4" />, label: TYPE_DISPLAY_NAMES.payment },
  post: { icon: <FileText className="w-4 h-4" />, label: TYPE_DISPLAY_NAMES.post },
  video: { icon: <Video className="w-4 h-4" />, label: TYPE_DISPLAY_NAMES.video },
  system: { icon: <Settings2 className="w-4 h-4" />, label: TYPE_DISPLAY_NAMES.system }
} as const;

function isValidLogType(type: string): type is LogType {
  return type in typeIcons;
}

function getLogDescription(log: ActivityLog): string {
  const method = log.method || '-';
  const path = log.path || '';
  const status = log.status ? `(${log.status})` : '';
  
  if (log.response?.error) {
    return `${method} ${path} ${status} - ${log.response.error}`;
  }
  
  return `${method} ${path} ${status}`;
}

function getTypeIcon(type: string) {
  if (isValidLogType(type)) {
    return typeIcons[type].icon;
  }
  return typeIcons.system.icon;
}

export function LogTable({ logs, loading, onViewDetails, onSort, sortField, sortOrder }: LogTableProps) {
  const handleSort = (field: string) => {
    if (onSort) {
      onSort(field);
    }
  };

  if (loading) {
    return <div className="text-center py-4">로그를 불러오는 중...</div>;
  }

  return (
    <div className="rounded-md border">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead className="w-[180px]">
              <Button
                variant="ghost"
                onClick={() => handleSort('timestamp')}
                className="h-8 px-2 -ml-4"
              >
                시간
                <ArrowUpDown className="ml-2 h-4 w-4" />
              </Button>
            </TableHead>
            <TableHead className="w-[120px]">
              <Tooltip>
                <TooltipTrigger asChild>
                  <div className="flex items-center gap-2">
                    <Globe className="h-4 w-4" />
                    <span className="hidden sm:inline">IP</span>
                  </div>
                </TooltipTrigger>
                <TooltipContent>IP 주소</TooltipContent>
              </Tooltip>
            </TableHead>
            <TableHead className="w-[120px]">
              <Tooltip>
                <TooltipTrigger asChild>
                  <div className="flex items-center gap-2">
                    <User2 className="h-4 w-4" />
                    <span className="hidden sm:inline">사용자</span>
                  </div>
                </TooltipTrigger>
                <TooltipContent>사용자 정보</TooltipContent>
              </Tooltip>
            </TableHead>
            <TableHead>활동</TableHead>
            <TableHead className="w-[100px] text-right">상세</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {logs.length === 0 ? (
            <TableRow>
              <TableCell colSpan={5} className="text-center">
                로그가 없습니다.
              </TableCell>
            </TableRow>
          ) : (
            logs.map((log: ActivityLog & { uniqueId?: string }) => (
              <TableRow key={log.uniqueId}>
                <TableCell className="font-mono">
                  {format(new Date(log.timestamp), 'HH:mm:ss', { locale: ko })}
                </TableCell>
                <TableCell>
                  <Tooltip>
                    <TooltipTrigger>
                      <span className="truncate max-w-[120px] block">
                        {log.ip || '-'}
                      </span>
                    </TooltipTrigger>
                    <TooltipContent>
                      {log.ip || '알 수 없음'}
                    </TooltipContent>
                  </Tooltip>
                </TableCell>
                <TableCell>
                  <Tooltip>
                    <TooltipTrigger>
                      <span className="truncate max-w-[120px] block">
                        {log.username || '-'}
                      </span>
                    </TooltipTrigger>
                    <TooltipContent>
                      {log.username || '비로그인 사용자'}
                    </TooltipContent>
                  </Tooltip>
                </TableCell>
                <TableCell>
                  <div className="flex items-center gap-2">
                    {getTypeIcon(log.type)}
                    <span className="hidden sm:inline">{getLogDescription(log)}</span>
                    <span className="sm:hidden">
                      {getLogDescription(log).slice(0, 10)}...
                    </span>
                  </div>
                </TableCell>
                <TableCell className="text-right">
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => onViewDetails(log)}
                  >
                    <Info className="h-4 w-4" />
                  </Button>
                </TableCell>
              </TableRow>
            ))
          )}
        </TableBody>
      </Table>
    </div>
  );
}
