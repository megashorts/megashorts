import type { ActivityLog, LogCategory } from '@/lib/activity-logger/types';

export type FilterCategory = LogCategory | 'all';

export interface LogTableProps {
  logs: ActivityLog[];
  loading: boolean;
  onSort: (field: string) => void;
  sortField: string;
  sortOrder: 'asc' | 'desc';
  onViewDetails: (log: ActivityLog) => void;
}

export interface LogFiltersProps {
  filters: LogFiltersState;
  onChange: (filters: LogFiltersState) => void;
}

export interface LogFiltersState {
  categories: FilterCategory[];
  startDate?: string;
  endDate?: string;
  userId?: string;
  country?: string;
  page: number;
  perPage: number;
}

export interface LogModalProps {
  log: ActivityLog;
  onClose: () => void;
}

