// 기본 로그 구조
export interface ActivityLog {
  // 기본 정보
  timestamp: string;
  type: LogType;
  method: string;      // HTTP 메서드 또는 커스텀 액션
  path: string;        // API 경로
  status: number;      // 상태 코드
  event?: string;      // 이벤트 타입
  
  // 사용자 정보
  userId?: string;
  username?: string;
  
  // 환경 정보
  ip: string;
  country: string;
  city: string;
  device: DeviceInfo;  // DeviceInfo 인터페이스 사용

  // 요청/응답 데이터
  request?: {
    query?: any;
    body?: any;
    path?: string;     // 요청 경로
  };
  response?: {
    data?: any;
    error?: string;
    status?: number;   // 응답 상태
  };

  // 이전 버전 호환성
  requestId?: string;  // 기존 코드 호환용
  details?: any;       // 추가 정보
}

// 로그 카테고리 (파일 관리용)
export type LogCategory = 
  | 'auth'      // 인증 관련
  | 'video'     // 비디오 관련
  | 'post'      // 게시물 관련
  | 'payment'   // 결제 관련
  | 'system'    // 시스템 관련;

// LogType은 LogCategory와 동일 (이전 코드 호환성)
export type LogType = LogCategory | string;     // 확장 가능성

// HTTP 메서드
export type HttpMethod = 'GET' | 'POST' | 'PUT' | 'DELETE';

// 커스텀 메서드
export type CustomMethod = 
  // 인증 관련
  | 'LOGIN' 
  | 'LOGOUT' 
  | 'SIGNUP' 
  | 'PASSWORD_CHANGE'
  // 비디오 관련
  | 'VIDEO_VIEW' 
  | 'VIDEO_PROGRESS'
  // 결제 관련
  | 'PAYMENT' 
  | 'SUBSCRIPTION'
  // 확장 가능성
  | string;

export type Method = HttpMethod | CustomMethod;

// 디바이스 타입
export interface DeviceInfo {
  browser: string;
  os: string;
  type: 'desktop' | 'mobile' | 'tablet';
}

// 위치 정보
export interface LocationInfo {
  ip: string;
  country: string;
  city: string;
}

// 조회용 표시 정보
export interface LogDisplay {
  timestamp: string;
  type: string;
  action: string;
  summary: string;
  status: string;
  location: string;
  details: string;
}

// 로그인 이벤트 로그 (간소화된 버전)
export interface LoginLog {
  type: 'login';
  category: 'login';
  event: 'attempt' | 'success' | 'failure';
  method: 'email' | 'google' | 'kakao' | 'naver';
  ip: string;
  userAgent: string;
}

// 전체 로그인 활동 로그 (상세 버전)
export interface LoginActivityLog extends Omit<ActivityLog, 'type' | 'method' | 'device'> {
  type: 'login';
  category: 'login';
  event: 'attempt' | 'success' | 'failure';
  method: 'email' | 'google' | 'kakao' | 'naver';
  userAgent: string;  // device 정보 대신 userAgent 직접 사용
}
