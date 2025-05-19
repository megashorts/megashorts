'use client';

import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { LogTableProps } from "../types";
import { Button } from "@/components/ui/button";
import { ArrowUpDown, Info, LogIn, CreditCard, FileText, Video, Settings2, User2, Globe, MapPin, Laptop, Timer, Pen } from 'lucide-react';
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
  // 커스텀 로그 형식 처리 (event 필드가 있는 경우)
  if (log.event) {
    return log.event;
  }
  
  // 기존 API 로그 형식 처리
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
            <TableHead className="w-[80px] md:w-[120px]">
              <Button
                variant="ghost"
                onClick={() => handleSort('timestamp')}
                className="h-8 px-2 -ml-4"
              >
                <Timer className="ml-2 h-4 w-4" />
                <ArrowUpDown className="ml-2 h-4 w-4" />
              </Button>
            </TableHead>
            <TableHead className="hidden md:table-cell w-[60px]">
              <Tooltip>
                <TooltipTrigger asChild>
                  <div className="flex justify-center">
                    <span className="sr-only">타입</span>
                  </div>
                </TooltipTrigger>
                <TooltipContent>로그 타입</TooltipContent>
              </Tooltip>
            </TableHead>
            <TableHead className="hidden md:table-cell w-[60px]">
              <Tooltip>
                <TooltipTrigger asChild>
                  <div className="flex justify-center">
                  <Globe className="h-4 w-4" />
                  </div>
                </TooltipTrigger>
                <TooltipContent>국가</TooltipContent>
              </Tooltip>
            </TableHead>
            <TableHead className="hidden md:table-cell w-[100px]">
              <Tooltip>
                <TooltipTrigger asChild>
                  <div className="flex justify-center">
                    <MapPin className="h-4 w-4" />
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
                  </div>
                </TooltipTrigger>
                <TooltipContent>사용자</TooltipContent>
              </Tooltip>
            </TableHead>
            <TableHead>
              <Pen className="h-4 w-4" />
            </TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {logs.length === 0 ? (
            <TableRow>
              <TableCell colSpan={6} className="text-center">
                No data.
              </TableCell>
            </TableRow>
          ) : (
            logs.map((log: ActivityLog & { uniqueId?: string }) => (
              <TableRow 
                key={log.uniqueId}
                className="cursor-pointer hover:bg-muted/50"
                onClick={() => onViewDetails(log)}
              >
                {/* <TableCell className="font-mono whitespace-nowrap">
                  {format(new Date(log.timestamp), 'HH:mm:ss', { locale: ko })}
                </TableCell> */}
                <TableCell className="font-mono whitespace-nowrap">
                  {/* <span className="text-xs text-gray-500 mr-1"> */}
                  <span className="mr-2">
                    {format(new Date(log.timestamp), 'MM-dd', { locale: ko })}
                  </span>
                  {format(new Date(log.timestamp), 'HH:mm:ss', { locale: ko })}
                </TableCell>
                <TableCell className="hidden md:table-cell text-center">
                  <Tooltip>
                    <TooltipTrigger>
                      <div className="flex justify-center">
                        {getTypeIcon(log.type)}
                      </div>
                    </TooltipTrigger>
                    <TooltipContent>
                      {isValidLogType(log.type) ? typeIcons[log.type as LogType].label : TYPE_DISPLAY_NAMES.system}
                    </TooltipContent>
                  </Tooltip>
                </TableCell>
                <TableCell className="hidden md:table-cell text-center">
                  <Tooltip>
                    <TooltipTrigger>
                      <div className="flex justify-center">
                        {log.country ? (
                          <span className="text-xs">{log.country.slice(0, 2)}</span>
                        ) : (
                          <MapPin className="h-3 w-3 text-muted-foreground" />
                        )}
                      </div>
                    </TooltipTrigger>
                    <TooltipContent>
                      {log.country || '알 수 없음'}
                      {log.city ? ` (${log.city})` : ''}
                    </TooltipContent>
                  </Tooltip>
                </TableCell>
                <TableCell className="hidden md:table-cell">
                  <div className="text-xs font-mono truncate">
                    {log.ip || '-'}
                  </div>
                </TableCell>
                <TableCell>
                  <div className="flex items-center gap-1">
                    <span className="md:hidden">
                      {getTypeIcon(log.type)}
                    </span>
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
                  </div>
                </TableCell>
                <TableCell>
                  <div className="truncate">
                    {getLogDescription(log)}
                  </div>
                </TableCell>
              </TableRow>
            ))
          )}
        </TableBody>
      </Table>
    </div>
  );
}
