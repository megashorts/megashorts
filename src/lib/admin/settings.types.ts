import { LogCategory } from '../activity-logger/types';

// 관리자 설정 타입들
export interface AdminSetting<T = unknown> {
  id: string;
  value: T;
  updatedAt: Date;
  updatedBy?: string;
}

// 로그 설정
export interface LoggingSettingValue {
  categories: Record<LogCategory, boolean>;
  retention: {
    days: number;  // 보관 기간
    maxSize: number;  // 최대 저장 크기 (MB)
  };
  batch: {
    size: number;    // 배치 크기 (KB)
    interval: number;  // 전송 간격 (ms)
  };
}

export type LoggingSetting = AdminSetting<LoggingSettingValue>;

// API 응답 타입
export interface AdminSettingResponse<T> {
  success: boolean;
  data?: AdminSetting<T>;
  error?: string;
}

// API 요청 타입
export interface UpdateSettingRequest<T> {
  value: T;
  updatedBy?: string;
}
