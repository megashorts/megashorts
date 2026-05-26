'use client';

import { useCallback, useEffect, useState } from 'react';
import { LogTable } from './LogTable';
import { LogFilters } from './LogFilters';
import { LogModal } from './LogModal';
import { ActivityLog } from '@/lib/activity-logger/types';
import { TYPE_DISPLAY_NAMES } from '@/lib/activity-logger/constants';
import { LogFiltersState } from '../types';
import {
  DEFAULT_ANALYTICS_TIME_ZONE,
  formatDateInTimeZone,
  normalizeAnalyticsTimeZone,
} from '@/lib/analytics-timezone';

export default function LogsClient() {
  const [logs, setLogs] = useState<ActivityLog[]>([]);
  const [loading, setLoading] = useState(false);
  const [selectedLog, setSelectedLog] = useState<ActivityLog | null>(null);
  const [sortField, setSortField] = useState<string>('timestamp');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');
  const [timeZone, setTimeZone] = useState(DEFAULT_ANALYTICS_TIME_ZONE);
  
  const [filters, setFilters] = useState<LogFiltersState>(() => {
    // 기본값: 지난 1시간
    const now = new Date();
    const oneHourAgo = new Date(now);
    oneHourAgo.setHours(now.getHours() - 1);
    
    return {
      startDate: oneHourAgo,
      endDate: now,
      userId: '',
      types: Object.keys(TYPE_DISPLAY_NAMES),
      country: null,
      page: 1,
      perPage: 50,
      timestamp: now.toISOString() // 페이지 로드 시 자동 조회
    };
  });

  useEffect(() => {
    let mounted = true;

    const loadTimeZone = async () => {
      try {
        const response = await fetch('/api/admin/settings', { cache: 'no-store' });
        if (!response.ok) return;
        const settings = await response.json() as {
          analyticsTimeZone?: { enabled?: boolean; value?: unknown };
        };
        const enabled = settings.analyticsTimeZone?.enabled !== false;
        const selected = enabled
          ? normalizeAnalyticsTimeZone(settings.analyticsTimeZone?.value)
          : DEFAULT_ANALYTICS_TIME_ZONE;
        if (mounted) {
          setTimeZone(selected);
        }
      } catch (error) {
        console.error('Failed to load analytics timezone:', error);
      }
    };

    loadTimeZone();
    return () => {
      mounted = false;
    };
  }, []);

  const fetchLogs = useCallback(async () => {
    // timestamp가 없으면 조회하지 않음 (검색 버튼 클릭 전)
    if (!filters.timestamp) return;

    // 워커는 단일 타입만 지원하므로, 여러 타입이 선택된 경우 각 타입별로 별도 요청
    const allLogs: ActivityLog[] = [];
    setLoading(true);
    
    try {
      const baseParams = {
        startDate: formatDateInTimeZone(filters.startDate, timeZone),
        endDate: formatDateInTimeZone(filters.endDate, timeZone),
        timezone: timeZone,
      };

      // 타입이 선택되지 않았거나 모든 타입이 선택된 경우 단일 요청
      if (filters.types.length === 0 || filters.types.length === Object.keys(TYPE_DISPLAY_NAMES).length) {
        const searchParams = new URLSearchParams({
          ...baseParams,
          ...(filters.userId && { userId: filters.userId }),
          ...(filters.country && { country: filters.country })
        });
        
        const response = await fetch(`/api/admin/service/logs?${searchParams}`, {
          cache: 'no-store'
        });
        if (!response.ok) {
          throw new Error('Failed to fetch logs');
        }
        
        const data = await response.json();
        allLogs.push(...data);
      } else {
        // 선택된 각 타입별로 요청
        for (const type of filters.types) {
          const searchParams = new URLSearchParams({
            ...baseParams,
            type,
            ...(filters.userId && { userId: filters.userId }),
            ...(filters.country && { country: filters.country })
          });
          
          const response = await fetch(`/api/admin/service/logs?${searchParams}`, {
            cache: 'no-store'
          });
          if (!response.ok) {
            throw new Error(`Failed to fetch logs for type: ${type}`);
          }
          
          const data = await response.json();
          allLogs.push(...data);
        }
      }

      // 중복 키 방지를 위해 타임스탬프와 인덱스 조합으로 고유 ID 생성
      const logsWithIds = allLogs.map((log: ActivityLog, index: number) => ({
        ...log,
        uniqueId: `${log.timestamp}_${log.path}_${index}`
      }));
      
      // 클라이언트 측에서 정렬
      const sortedLogs = logsWithIds.sort((a, b) => {
        const aValue = a[sortField as keyof ActivityLog];
        const bValue = b[sortField as keyof ActivityLog];
        
        if (typeof aValue === 'string' && typeof bValue === 'string') {
          return sortOrder === 'asc' 
            ? aValue.localeCompare(bValue) 
            : bValue.localeCompare(aValue);
        }
        
        // 숫자나 날짜 비교
        const aNum = aValue instanceof Date ? aValue.getTime() : Number(aValue);
        const bNum = bValue instanceof Date ? bValue.getTime() : Number(bValue);
        
        return sortOrder === 'asc' ? aNum - bNum : bNum - aNum;
      });
      
      // 페이지네이션 적용
      const startIndex = (filters.page - 1) * filters.perPage;
      const endIndex = startIndex + filters.perPage;
      const paginatedLogs = sortedLogs.slice(startIndex, endIndex);

      setLogs(paginatedLogs);
    } catch (error) {
      console.error('Error fetching logs:', error);
      setLogs([]);
    } finally {
      setLoading(false);
    }
  }, [filters, sortField, sortOrder, timeZone]);

  // filters.timestamp가 변경될 때만 fetchLogs 실행
  useEffect(() => {
    fetchLogs();
  }, [fetchLogs]);

  const handleViewDetails = (log: ActivityLog) => {
    setSelectedLog(log);
  };

  const handleCloseModal = () => {
    setSelectedLog(null);
  };

  const handleSort = (field: string) => {
    setSortOrder(current => {
      if (sortField === field) {
        return current === 'asc' ? 'desc' : 'asc';
      }
      return 'desc';
    });
    setSortField(field);
  };

  const handleFiltersChange = (newFilters: LogFiltersState) => {
    setFilters(newFilters);
  };

  return (
    <div className="space-y-4">
      <LogFilters filters={filters} onFiltersChange={handleFiltersChange} />
      <LogTable
        logs={logs}
        loading={loading}
        onViewDetails={handleViewDetails}
        onSort={handleSort}
        sortField={sortField}
        sortOrder={sortOrder}
        timeZone={timeZone}
      />
      {selectedLog && (
        <LogModal log={selectedLog} onClose={handleCloseModal} timeZone={timeZone} />
      )}
    </div>
  );
}
