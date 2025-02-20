'use client';

import { useEffect, useState } from 'react';
import { LogTable } from './LogTable';
import { LogFilters } from './LogFilters';
import { LogModal } from './LogModal';
import { ActivityLog } from '@/lib/activity-logger/types';
import { CONFIG, TYPE_DISPLAY_NAMES } from '@/lib/activity-logger/constants';
import { LogFiltersState } from '../types';

export function LogsClient() {
  const [logs, setLogs] = useState<ActivityLog[]>([]);
  const [loading, setLoading] = useState(false);
  const [selectedLog, setSelectedLog] = useState<ActivityLog | null>(null);
  const [sortField, setSortField] = useState<string>('timestamp');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');
  
  const [filters, setFilters] = useState<LogFiltersState>({
    startDate: new Date(),
    endDate: new Date(),
    userId: '',
    types: Object.keys(TYPE_DISPLAY_NAMES),
    country: '',
    page: 1,
    perPage: 50
  });

  const fetchLogs = async () => {
    // timestamp가 없으면 조회하지 않음 (검색 버튼 클릭 전)
    if (!filters.timestamp) return;

    setLoading(true);
    try {
      const searchParams = new URLSearchParams({
        startDate: filters.startDate.toISOString(),
        endDate: filters.endDate.toISOString(),
        ...(filters.userId && { userId: filters.userId }),
        ...(filters.types.length && { types: filters.types.join(',') }),
        ...(filters.country && { country: filters.country }),
        page: filters.page.toString(),
        perPage: filters.perPage.toString(),
        sortField,
        sortOrder
      });

      const response = await fetch(`${CONFIG.WORKER_URL}/logs?${searchParams}`);
      if (!response.ok) throw new Error('Failed to fetch logs');
      
      const data = await response.json();
      // 중복 키 방지를 위해 타임스탬프와 인덱스 조합으로 고유 ID 생성
      setLogs(data.map((log: ActivityLog, index: number) => ({
        ...log,
        uniqueId: `${log.timestamp}_${log.path}_${index}`
      })));
    } catch (error) {
      console.error('Error fetching logs:', error);
      setLogs([]);
    } finally {
      setLoading(false);
    }
  };

  // filters.timestamp가 변경될 때만 fetchLogs 실행
  useEffect(() => {
    fetchLogs();
  }, [filters.timestamp, sortField, sortOrder]);

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
      />
      {selectedLog && (
        <LogModal log={selectedLog} onClose={handleCloseModal} />
      )}
    </div>
  );
}
