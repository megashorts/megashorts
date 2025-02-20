// 커스텀 로그 구조 (보기 좋은 순서로 정렬)
export interface CustomActivityLog {
  // 주요 식별 정보
  type: LogType;           // 로그 타입 (auth, video, post 등)
  event: string;           // 이벤트 이름 (login_success, video_upload 등)
  username?: string;       // 사용자명 (관리자 식별용)
  
  // 액션 상세
  details?: {
    action?: string;      // 수행된 작업
    result?: string;      // 작업 결과
    userId?: string;      // 사용자 ID
    target?: string;      // 작업 대상
    error?: string;       // 에러 메시지
  }
  
  // 시간 정보
  timestamp: string;       // 타임스탬프
  
  // 환경 정보
  ip?: string;            // IP 주소
  country?: string;       // 국가
  city?: string;          // 도시
  device?: DeviceInfo;    // 디바이스 정보
}

// 기존 호환성을 위한 ActivityLog 인터페이스
export interface ActivityLog extends Omit<CustomActivityLog, 'details'> {
  method: string;      // HTTP 메서드 또는 커스텀 액션
  path: string;        // API 경로
  status: number;      // 상태 코드
  
  // 요청/응답 데이터
  request?: {
    query?: any;
    body?: any;
    path?: string;
  };
  response?: {
    data?: any;
    error?: string;
    status?: number;
  };

  // 이전 버전 호환성
  requestId?: string;
  details?: any;
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
