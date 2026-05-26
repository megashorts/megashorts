// 로그 저장 관련 설정
export const STORAGE_KEYS = {
  PENDING_LOGS: 'activity_logger_pending_logs',
  LAST_SENT: 'activity_logger_last_sent'
};

// 로그 전송 설정
export const CONFIG = {
  BATCH_INTERVAL: 5 * 60 * 1000,  // 5분
  MAX_BATCH_SIZE: 500000,         // 500KB
  WORKER_URL: process.env.NEXT_PUBLIC_LOGS_WORKER_URL,  // 기본값 추가 NEXT_PUBLIC_LOGS_WORKER_URL
  // WORKER_URL: 'http://localhost:8787',
  LOG_PROXY_URL: '/api/logs',
  SERVICE_LOG_ENABLED: process.env.NEXT_PUBLIC_SYSTEM_SERVICELOGENABLED !== 'false', 
  LOG_WRITE_KEY: process.env.NEXT_PUBLIC_LOG_WRITE_KEY
} as const;

// 로그인 상태 확인
export const isUserLoggedIn = (): boolean => {
  if (typeof window === 'undefined') return false;
  return document.cookie.includes('auth_session');
};

// 로깅 제외 경로
export const EXCLUDED_ROUTES = [
  '/_next',               // Next.js 내부 요청
  '/static',              // 정적 파일
  '/api/admin/ip',        // 위치 정보 조회 (무한 루프 방지)
  '/api/logs'             // 로그 전송 요청 (무한 루프 방지)
];

// HTTP 상태 코드 메시지
export const STATUS_MESSAGES = {
  200: 'Success',
  201: 'Created',
  400: 'Bad Request',
  401: 'Unauthorized',
  403: 'Forbidden',
  404: 'Not Found',
  500: 'Internal Server Error'
} as const;

// 로그 타입별 표시 이름
export const TYPE_DISPLAY_NAMES = {
  auth: 'Authentication',
  video: 'Video',
  post: 'Post',
  payment: 'Payment',
  system: 'System'
} as const;

// 기본 조회 설정
export const DEFAULT_QUERY = {
  limit: 50,              // 페이지당 항목 수
  timeRange: '1h',        // 시간 범위
  types: ['auth', 'video', 'post', 'payment']  // 기본 타입
} as const;
