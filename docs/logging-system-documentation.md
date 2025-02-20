# 로깅 시스템 구조

## 1. 시스템 개요

### A. 핵심 기능
- API 요청 자동 로깅
- 컴포넌트 이벤트 수동 로깅
- 위치 정보 수집
- 로그 일괄 전송

### B. 로그 환경 구분
1. 시스템 로그
   - 개발 환경에서만 기록
   - API 요청/응답, 에러 등 시스템 동작 관련 로그
   - 환경변수 SYSTEM_LOG=true 일 때만 활성화

2. 서비스 로그
   - 프로덕션 환경에서 기록되는 주요 로그
   - 사용자 행동, 비즈니스 로직 관련 로그
   - 환경변수 SERVICE_LOG=true 일 때만 활성화
   - 시도-결과 세트 패턴으로 기록

### C. 주요 파일
- `src/lib/activity-logger/client.ts`: 로그 생성/전송 클라이언트
- `src/lib/activity-logger/constants.ts`: 설정값
- `src/lib/activity-logger/types.ts`: 타입 정의
- `src/lib/activity-logger/location-manager.ts`: 위치 정보 관리
- `src/lib/logging-wrapper.ts`: API 요청 인터셉터

## 2. 로그 구조 및 패턴

### A. 시도-결과 세트 패턴
1. 기본 구조
   ```typescript
   // 1) 기본 정보 저장 (로그로 기록하지 않음)
   const baseInfo = {
     type: 'auth',
     username: string,
     details: {
       action: string,    // 수행하는 작업
       target?: string    // 작업 대상 (예: 추천인)
     }
   };

   // 2) 결과에 따라 로그 기록
   // 성공 시
   logActivity({
     ...baseInfo,
     event: `${action}_success`,
     details: {
       ...baseInfo.details,
       result: 'success'
     }
   });

   // 실패 시
   logActivity({
     ...baseInfo,
     event: `${action}_failure`,
     details: {
       ...baseInfo.details,
       result: 'failure',
       error: string
     }
   });
   ```

2. 주의사항
   - 시도 정보는 저장만 하고 로그로 기록하지 않음
   - 결과(성공/실패)에 따라 한 번만 로그 기록
   - 리다이렉트가 필요한 경우 로그 기록 완료 후 실행

### B. 로그 타입 정의

### A. 기본 로그 구조
```typescript
interface ActivityLog {
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
  device: DeviceInfo;

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

  details?: any;       // 추가 정보
}
```

### B. 메서드 타입
```typescript
// HTTP 메서드
type HttpMethod = 'GET' | 'POST' | 'PUT' | 'DELETE';

// 커스텀 메서드
type CustomMethod = 
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
```

### C. 디바이스 정보
```typescript
interface DeviceInfo {
  browser: string;  // Chrome|Firefox|Safari|Edge|Other
  os: string;       // Windows|MacOS|Linux|Android|iOS|Other
  type: 'desktop' | 'mobile' | 'tablet';
}
```

## 3. 로그 생성 지점

### A. 자동 로깅 (API 요청)
1. 세션/인증
   - 위치: `src/app/layout.tsx`
   - 경로: `/api/auth/session`
   - 용도: 세션 체크, 인증 상태 확인

2. 알림
   - 위치: `src/app/(main)/NotificationsButton.tsx`
   - 경로: `/api/notifications/unread-count`
   - 용도: 읽지 않은 알림 개수 조회

3. 비디오 시청
   - 위치: `src/app/(main)/video-view/*`
   - 경로: `/api/videos/view`, `/api/videos/progress`
   - 용도: 시청 기록 생성, 진행률 업데이트

### B. 수동 로깅 방법
```typescript
// 1. 기본 형태
logActivity({
  timestamp?: string,     // ISO 시간 (기본값: 현재 시간)
  type: LogType,         // 필수: auth|video|post|payment|system
  method?: string,       // HTTP 메서드 또는 커스텀 액션
  path?: string,         // API 경로
  status?: number,       // 상태 코드 (기본값: 200)
  event?: string,        // 이벤트 종류
  userId?: string,       // 사용자 ID
  username?: string,     // 사용자명
  request?: object,      // 요청 데이터
  response?: object      // 응답 데이터
});

// 2. 실제 사용 예시

// 2.1 기본 로깅
// 비디오 시청 시작
logActivity({
  type: 'video',
  method: 'VIDEO_VIEW',
  event: 'view_start',
  details: {
    videoId: '123',
    startTime: 0
  }
});

// 진행률 업데이트
logActivity({
  type: 'video',
  method: 'VIDEO_PROGRESS',
  event: 'progress_update',
  details: {
    videoId: '123',
    progress: 0.5,
    currentTime: 30
  }
});

// 2.2 시도-결과 세트 패턴
// 회원가입 예시:
// 1) 기본 정보 저장 (로그로 기록하지 않음)
const baseInfo = {
  type: 'auth',
  username: 'user123',
  details: {
    action: 'signup',
    target: 'referrer123'  // 추천인 ID
  }
};

// 2) 실패 시 - 기본 정보에 실패 결과 추가
logActivity({
  ...baseInfo,
  event: 'signup_failure',
  details: {
    ...baseInfo.details,
    result: 'failure',
    error: 'Username already taken'
  }
});

// 3) 성공 시 - 기본 정보에 성공 결과 추가
logActivity({
  ...baseInfo,
  event: 'signup_success',
  details: {
    ...baseInfo.details,
    result: 'success'
  }
});

// 회원 탈퇴 예시:
// 1) 기본 정보 저장 (로그로 기록하지 않음)
const baseInfo = {
  type: 'auth',
  username: 'user123',
  details: {
    action: 'delete_account'
  }
};

// 2) 실패 시
logActivity({
  ...baseInfo,
  event: 'delete_account_failure',
  details: {
    ...baseInfo.details,
    result: 'failure',
    error: 'Authentication failed'
  }
});

// 3) 성공 시
logActivity({
  ...baseInfo,
  event: 'delete_account_success',
  details: {
    ...baseInfo.details,
    result: 'success'
  }
});
```

## 4. 저장소 관리

### A. 임시 저장
- 저장소: localStorage
- 키: activity_logger_pending_logs
- 제한: 500KB
- 초과 시: 즉시 전송

### B. 캐시 관리
- 위치 정보: 1시간 캐시
- 디바이스 정보: 세션별 저장
- 마지막 전송 시간 기록

## 5. Worker 시스템

### A. Worker 구성
- 플랫폼: Cloudflare Workers
- 저장소: R2 Bucket
- CORS 허용:
  ```typescript
  const ALLOWED_ORIGINS = [
    'https://www.megashorts.com',
    'https://megashorts.com',
    'http://localhost:3000'
  ];
  ```

### B. 로그 저장 구조
1. 기본 경로
   ```
   logs/[type]/[date]/[hour]-[index].json
   예: logs/video/2025-02-14/15-1.json
   ```

2. 파일 관리
   - 최대 크기: 5MB
   - 초과 시: 새 파일 생성 (-2.json, -3.json...)
   - 저장 형식: JSON (들여쓰기 포함)

### C. 일일 처리
1. DuckDB 변환
   ```
   duckdb/[date]-[index].duckdb
   예: duckdb/2025-02-14-1.duckdb
   ```

2. 용량 관리
   - DuckDB 파일 크기: 최대 2GB
   - 초과 시: 새 파일 생성
   - 검증 후 원본 삭제

### D. 조회 기능
1. 필터링 옵션
   - 날짜 범위 (startDate, endDate)
   - 로그 타입 (type)
   - 사용자 ID (userId)
   - 국가 (country)

2. 조회 프로세스
   ```typescript
   // 1. JSON 파일 조회
   const jsonPrefix = type ? `logs/${type}/` : 'logs/';
   const jsonFiles = await bucket.list({ prefix: jsonPrefix });

   // 2. DuckDB 파일 조회
   const duckdbPrefix = 'duckdb/';
   const duckdbFiles = await bucket.list({ prefix: duckdbPrefix });

   // 3. 필터링
   let filteredLogs = logs;
   if (userId) {
     filteredLogs = filteredLogs.filter(log => log.userId === userId);
   }
   if (country) {
     filteredLogs = filteredLogs.filter(log => log.country === country);
   }
   ```

### E. 스케줄링
1. 일일 작업
   ```typescript
   // 매일 실행
   const dummyEvent = {
     cron: '0 0 * * *',
     scheduledTime: Date.now(),
     type: 'scheduled'
   };
   ```

2. 작업 내용
   - 어제 날짜 로그 처리
   - JSON -> DuckDB 변환
   - 원본 파일 정리
