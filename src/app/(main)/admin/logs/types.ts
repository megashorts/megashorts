import { ActivityLog } from '@/lib/activity-logger/types';

export interface LogFiltersState {
  startDate: Date;
  endDate: Date;
  userId: string;
  types: string[];     // 타입 기반 필터링
  country: string;
  page: number;
  perPage: number;
}

export interface LogFiltersProps {
  filters: LogFiltersState;
  onFiltersChange: (filters: LogFiltersState) => void;
}

export interface LogTableProps {
  logs: ActivityLog[];
  loading: boolean;
  onViewDetails: (log: ActivityLog) => void;
  onSort?: (field: string) => void;
  sortField?: string;
  sortOrder?: 'asc' | 'desc';
}

export interface FilterType {
  id: string;
  label: string;
}
