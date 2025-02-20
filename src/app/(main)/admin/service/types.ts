import { Language } from '@prisma/client';

export interface DateRange {
  from: Date;
  to: Date;
}

export interface LogFiltersState {
  startDate: Date;
  endDate: Date;
  userId: string;
  types: string[];
  country: Language | '';
  page: number;
  perPage: number;
  timestamp?: string;  // 강제 리프레시용
}

export interface LogFiltersProps {
  filters: LogFiltersState;
  onFiltersChange: (filters: LogFiltersState) => void;
}

export interface LogTableProps {
  logs: any[];
  loading: boolean;
  onViewDetails: (log: any) => void;
  onSort?: (field: string) => void;
  sortField?: string;
  sortOrder?: 'asc' | 'desc';
}
