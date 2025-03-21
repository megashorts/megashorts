'use client';

import { useEffect, useState } from 'react';
import { LogTable } from './LogTable';
import { LogFilters } from './LogFilters';
import { LogModal } from './LogModal';
import { ActivityLog } from '@/lib/activity-logger/types';
import { CONFIG, TYPE_DISPLAY_NAMES } from '@/lib/activity-logger/constants';
import { LogFiltersState } from '../types';

export default function LogsClient() {
  const [logs, setLogs] = useState<ActivityLog[]>([]);
  const [loading, setLoading] = useState(false);
  const [selectedLog, setSelectedLog] = useState<ActivityLog | null>(null);
  const [sortField, setSortField] = useState<string>('timestamp');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');
  
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

  const formatDateForWorker = (date: Date) => {
    // YYYY-MM-DD 형식으로 변환
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  };

  const fetchLogs = async () => {
    // timestamp가 없으면 조회하지 않음 (검색 버튼 클릭 전)
    if (!filters.timestamp) return;

    // 워커는 단일 타입만 지원하므로, 여러 타입이 선택된 경우 각 타입별로 별도 요청
    const allLogs: ActivityLog[] = [];
    setLoading(true);
    
    try {
      // 디버깅 정보 출력
      console.log('Fetching logs with filters:', {
        startDate: formatDateForWorker(filters.startDate),
        endDate: formatDateForWorker(filters.endDate),
        types: filters.types,
        userId: filters.userId,
        country: filters.country
      });
      console.log('Worker URL:', CONFIG.WORKER_URL);
      
      // 디버깅용 - 모든 파일 목록 조회 요청
      try {
        const debugResponse = await fetch(`${CONFIG.WORKER_URL}/debug-list-files`);
        if (debugResponse.ok) {
          const debugData = await debugResponse.json();
          console.log('All files in bucket:', debugData);
        }
      } catch (debugError) {
        console.error('Debug request failed:', debugError);
      }
      
      // 타입이 선택되지 않았거나 모든 타입이 선택된 경우 단일 요청
      if (filters.types.length === 0 || filters.types.length === Object.keys(TYPE_DISPLAY_NAMES).length) {
        const searchParams = new URLSearchParams({
          startDate: formatDateForWorker(filters.startDate),
          endDate: formatDateForWorker(filters.endDate),
          ...(filters.userId && { userId: filters.userId }),
          ...(filters.country && { country: filters.country })
        });
        
        console.log('Fetching all types with URL:', `${CONFIG.WORKER_URL}?${searchParams}`);
        const response = await fetch(`${CONFIG.WORKER_URL}?${searchParams}`);
        if (!response.ok) {
          console.error('Failed to fetch logs:', response.status, response.statusText);
          throw new Error('Failed to fetch logs');
        }
        
        const data = await response.json();
        console.log('Received data for all types:', data.length);
        allLogs.push(...data);
      } else {
        // 선택된 각 타입별로 요청
        for (const type of filters.types) {
          const searchParams = new URLSearchParams({
            startDate: formatDateForWorker(filters.startDate),
            endDate: formatDateForWorker(filters.endDate),
            type,
            ...(filters.userId && { userId: filters.userId }),
            ...(filters.country && { country: filters.country })
          });
          
          console.log(`Fetching type ${type} with URL:`, `${CONFIG.WORKER_URL}?${searchParams}`);
          const response = await fetch(`${CONFIG.WORKER_URL}?${searchParams}`);
          if (!response.ok) {
            console.error(`Failed to fetch logs for type ${type}:`, response.status, response.statusText);
            throw new Error(`Failed to fetch logs for type: ${type}`);
          }
          
          const data = await response.json();
          console.log(`Received data for type ${type}:`, data.length);
          allLogs.push(...data);
        }
      }
      
      console.log('Total logs fetched:', allLogs.length);
      
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
      
      console.log('Paginated logs:', paginatedLogs.length);
      setLogs(paginatedLogs);
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
