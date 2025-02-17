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
  const [loading, setLoading] = useState(true);
  const [selectedLog, setSelectedLog] = useState<ActivityLog | null>(null);
  const [sortField, setSortField] = useState<string>('timestamp');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');
  
  const [filters, setFilters] = useState<LogFiltersState>({
    startDate: new Date(),
    endDate: new Date(),
    userId: '',
    types: Object.keys(TYPE_DISPLAY_NAMES),  // 모든 타입 기본 선택
    country: '',
    page: 1,
    perPage: 50  // 기본값 50으로 변경
  });

  useEffect(() => {
    fetchLogs();
  }, [filters, sortField, sortOrder]);

  const fetchLogs = async () => {
    setLoading(true);
    try {
      const searchParams = new URLSearchParams({
        startDate: filters.startDate.toISOString().split('T')[0],
        endDate: filters.endDate.toISOString().split('T')[0],
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
      setLogs(data);
    } catch (error) {
      console.error('Error fetching logs:', error);
    } finally {
      setLoading(false);
    }
  };

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

  return (
    <div className="space-y-4">
      <LogFilters filters={filters} onFiltersChange={setFilters} />
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
