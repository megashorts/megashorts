# 비디오 API 상세 구현

구현 파일:
- src/app/api/videos/view/route.ts
- src/app/api/videos/sync/route.ts
- src/app/api/videos/subtitle/route.ts
- src/lib/videoTracking.ts
- src/hooks/useVideoSync.ts
- src/components/videos/VideoPlayer.tsx

## 1. 시청 기록 API (/api/videos/view)

### 1.1 구독 상태 캐싱
```typescript
const getActiveSubscription = unstable_cache(
  async (userId: string) => {
    return await prisma.subscription.findFirst({
      where: {
        userId: userId,
        status: 'active'
      }
    });
  },
  ['active-subscription'],
  {
    revalidate: 60 * 60 * 12,  // 12시간
    tags: ['subscription']
  }
);
```

### 1.2 요청 처리 흐름
```typescript
1. 사용자 인증
   - validateRequest()로 현재 사용자 확인
   - 미인증 시 401 Unauthorized 반환

2. 요청 데이터 검증
   {
     videoId: string;    // Cloudflare Stream ID
     postId: string;     // 포스트 ID
     sequence: number;   // 비디오 순서
     timestamp: number;  // 시청 시간(초)
   }

3. 시청 시간 검증
   - 5초 미만 시청은 기록하지 않음
   - "Duration too short" 메시지 반환

4. 포스트/비디오 조회
   - 포스트 존재 확인
   - 비디오 URL에서 ID 매칭
   - 없으면 404 Not Found 반환
```

### 1.3 접근 권한 처리
```typescript
접근 방식(AccessMethod) 결정:
1. FREE: 기본값, 무료 컨텐츠
2. SUBSCRIPTION: 프리미엄 컨텐츠 + 구독 상태
3. POINT_PAYMENT: 프리미엄 컨텐츠 + 코인 결제

프리미엄 컨텐츠 처리:
- 구독 상태 캐시에서 확인
- 구독 없으면 "Premium content" 메시지 반환
- coinpay API에서 별도 처리
```

### 1.4 데이터베이스 처리
```typescript
트랜잭션 처리:
1. 시청 기록 생성/업데이트
   - 무료 시청: viewCount 증가
   - 구독 시청: 새 기록 생성

2. 진행 상태 업데이트
   UserVideoProgress 테이블:
   {
     userId: string;
     postId: string;
     lastVideoSequence: number;
   }
```

### 1.5 에러 처리
```typescript
try-catch 계층:
1. 최상위: 서버 에러
   - 500 Internal Server Error
   - 에러 메시지 로깅

2. 데이터베이스: 쿼리 에러
   - 트랜잭션 롤백
   - 상세 에러 로깅

3. 비즈니스 로직: 검증 실패
   - 401: 인증 실패
   - 404: 리소스 없음
   - 400: 잘못된 요청
```

### 1.6 성능 최적화
```typescript
1. 구독 상태 캐싱
   - 12시간 캐시
   - subscription 태그로 무효화
   - 메모리 캐시 사용

2. 데이터베이스 최적화
   - 복합 인덱스: (userId, videoId)
   - 트랜잭션 사용으로 정합성 보장
   - 필요한 필드만 select

3. 에러 처리 최적화
   - 조기 반환으로 불필요한 처리 방지
   - 구체적인 에러 메시지
   - 상황별 적절한 HTTP 상태 코드
```

### 1.7 호출 예시
```typescript
// src/lib/videoTracking.ts
async function trackView(params: TrackViewParams) {
  const response = await fetch('/api/videos/view', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      videoId: params.videoId,
      postId: params.postId,
      sequence: params.sequence,
      timestamp: params.timestamp
    })
  });

  const data = await response.json();
  if (!data.success) {
    throw new Error(data.error || 'Failed to track view');
  }
}
```

### 1.8 개선 가능 사항
```typescript
1. 성능 개선
   - 벌크 업데이트 지원
   - 배치 처리 도입
   - 비동기 처리 확대

2. 모니터링 강화
   - 상세 메트릭 수집
   - 성능 프로파일링
   - 에러 추적 개선

3. 캐싱 전략
   - 다층 캐싱 도입
   - 캐시 무효화 최적화
   - 분산 캐시 고려
```

## 2. 시청 기록 동기화 API (/api/videos/sync)

### 2.1 개요
```typescript
목적:
- 사용자 로그인 시 서버의 시청 기록을 브라우저 IndexedDB로 동기화
- 브라우저 데이터가 없으면 서버 데이터로 생성
- 브라우저와 서버 데이터가 다르면 서버 데이터 우선

호출 시점:
1. 사용자 로그인 시
2. 세션 복구 시
3. 브라우저 IndexedDB 초기화 후
```

### 2.2 데이터 조회
```typescript
// 시청한 유료 동영상 목록
const watchedVideos = await prisma.videoView.findMany({
  where: {
    userId: user.id,
    video: {
      sequence: { gt: 1 }  // 첫 번째 영상 제외
    }
  },
  select: {
    videoId: true  // 필요한 필드만 선택
  }
});

// 포스트별 마지막 시청 정보
const lastViews = await prisma.userVideoProgress.findMany({
  where: {
    userId: user.id
  },
  select: {
    postId: true,
    lastVideoSequence: true
  }
});
```

### 2.3 응답 구조
```typescript
interface SyncResponse {
  watchedVideos: {
    videoId: string;
  }[];
  lastViews: {
    postId: string;
    sequence: number;
    timestamp: number;  // 브라우저에서만 관리
  }[];
}
```

### 2.4 에러 처리
```typescript
try {
  // 사용자 인증
  const { user } = await validateRequest();
  if (!user) {
    return Response.json(
      { error: "Unauthorized" }, 
      { status: 401 }
    );
  }

  // 데이터베이스 에러
  try {
    const data = await getData();
    return Response.json(data);
  } catch (error) {
    console.error('Database error:', error);
    return Response.json(
      { error: "Internal error" }, 
      { status: 500 }
    );
  }
} catch (error) {
  console.error('Server error:', error);
  return Response.json(
    { error: "Server error" }, 
    { status: 500 }
  );
}
```

### 2.5 성능 최적화
```typescript
1. 데이터베이스
   - 필요한 필드만 select
   - 복합 인덱스 활용
   - 첫 번째 영상 제외로 데이터 최소화

2. 응답 크기
   - 필수 필드만 포함
   - timestamp는 브라우저 관리
   - 증분 동기화 가능성

3. 캐싱 전략
   - 브라우저 IndexedDB 활용
   - 서버 응답 캐싱 검토
   - 동기화 주기 최적화
```

### 2.6 호출 예시
```typescript
// src/hooks/useVideoSync.ts
async function syncWithServer() {
  const response = await fetch('/api/videos/sync');
  const data = await response.json();
  
  if (!response.ok) {
    throw new Error(data.error || 'Sync failed');
  }

  // IndexedDB 업데이트
  await videoDB.syncWithServer(data);
}
```

## 3. 자막 관리 API (/api/videos/subtitle)

### 3.1 언어 코드 변환
```typescript
function toBCP47(language: string): string {
  const languageMap: Record<string, string> = {
    'KOREAN': 'ko',
    'ENGLISH': 'en',
    'CHINESE': 'zh',
    'JAPANESE': 'ja',
    'THAI': 'th',
    'SPANISH': 'es',
    'INDONESIAN': 'id',
    'VIETNAMESE': 'vi'
  };
  return languageMap[language] || language.toLowerCase();
}
```

### 3.2 자막 업로드 (/api/videos/subtitle)
```typescript
요청 형식:
FormData {
  file: File;          // VTT 파일
  videoId: string;     // Cloudflare Stream ID
  language: string;    // 언어 코드
}

처리 과정:
1. 사용자 인증
2. 파일 형식 검증
3. 언어 코드 변환 (BCP47)
4. Cloudflare API 호출

Cloudflare API 요청:
PUT https://api.cloudflare.com/client/v4/accounts/${accountId}/stream/${videoId}/captions/${language}
Headers:
  Authorization: Bearer ${token}
Body:
  FormData with VTT file
```

### 3.3 자막 삭제 (/api/videos/subtitle/delete)
```typescript
요청 형식:
{
  videoId: string;     // Cloudflare Stream ID
  language: string;    // 언어 코드
}

처리 과정:
1. 사용자 인증
2. 파라미터 검증
3. 언어 코드 변환
4. Cloudflare API 호출

Cloudflare API 요청:
DELETE https://api.cloudflare.com/client/v4/accounts/${accountId}/stream/${videoId}/captions/${language}
Headers:
  Authorization: Bearer ${token}
```

### 3.4 에러 처리
```typescript
1. 입력 검증
   - 필수 필드 누락: 400 Bad Request
   - 인증 실패: 401 Unauthorized

2. Cloudflare API 에러
   - 업로드 실패
   - 삭제 실패 (404는 무시)
   - 상세 에러 로깅

3. 응답 형식
   성공:
   {
     success: true,
     result?: {
       generated: boolean,
       label: string,
       language: string,
       status: string
     }
   }

   실패:
   {
     success: false,
     errors: [{
       code: number,
       message: string
     }]
   }
```

### 3.5 호출 예시
```typescript
// 업로드
const formData = new FormData();
formData.append('file', vttFile);
formData.append('videoId', cloudflareId);
formData.append('language', 'KOREAN');

const response = await fetch('/api/videos/subtitle', {
  method: 'POST',
  body: formData
});

// 삭제
const response = await fetch('/api/videos/subtitle/delete', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json'
  },
  body: JSON.stringify({
    videoId: cloudflareId,
    language: 'KOREAN'
  })
});
```

### 3.6 성능 고려사항
```typescript
1. 파일 처리
   - 적절한 크기 제한
   - 메모리 효율적 처리
   - 스트림 활용 가능성

2. API 요청
   - 비동기 처리
   - 타임아웃 설정
   - 재시도 전략

3. 에러 처리
   - 세부적인 에러 구분
   - 적절한 로깅 레벨
   - 사용자 피드백
```

## 4. 비디오 업로드 API (/api/videos/upload)

### 4.1 개요
```typescript
목적:
- Cloudflare Stream 직접 업로드 URL 발급
- 비디오 ID 및 스트리밍 URL 생성
- 업로드 메타데이터 관리

특징:
- force-dynamic 라우트
- 직접 업로드 방식 사용
- HLS 스트리밍 지원
```

### 4.2 Cloudflare Stream 설정
```typescript
직접 업로드 URL 요청:
POST https://api.cloudflare.com/client/v4/accounts/${accountId}/stream/direct_upload
Headers:
  Authorization: Bearer ${token}
Body:
{
  maxDurationSeconds: 3600,
  creator: string,
  requireSignedURLs: false
}

응답:
{
  result: {
    uploadURL: string,  // 업로드 URL
    uid: string        // 비디오 ID
  }
}
```

### 4.3 URL 생성
```typescript
1. 업로드 URL
   - Cloudflare API에서 발급
   - 1시간 유효
   - 직접 업로드 지원

2. 스트리밍 URL
   const hlsUrl = `https://videodelivery.net/${videoId}/manifest/video.m3u8`;
   - HLS 프로토콜
   - 적응형 비트레이트
   - CDN 배포
```

### 4.4 응답 구조
```typescript
interface UploadResponse {
  uploadUrl: string;     // Cloudflare 업로드 URL
  id: string;           // 비디오 ID (Cloudflare UID)
  url: string;          // HLS 스트리밍 URL
  filename: string;     // 원본 파일명 (빈 문자열)
  sequence: number;     // 시퀀스 번호 (0)
  isPremium: boolean;   // 프리미엄 여부 (true)
  createdAt: Date;      // 생성 시간
  subtitle: any[];      // 자막 정보 (빈 배열)
  views: any[];         // 조회 정보 (빈 배열)
}
```

### 4.5 에러 처리
```typescript
1. 인증 검증
   if (!user) {
     return NextResponse.json(
       { error: "Unauthorized" },
       { status: 401 }
     );
   }

2. 환경 변수 검증
   if (!accountId || !apiToken) {
     throw new Error("Cloudflare credentials not found");
   }

3. API 응답 검증
   if (!result || !result.uploadURL || !result.uid) {
     throw new Error('Invalid response from Cloudflare');
   }

4. 상세 로깅
   console.log('Cloudflare raw response:', responseText);
   console.error('Upload error:', error);
```

### 4.6 호출 예시
```typescript
// src/components/videos/VideoUploader.tsx
async function getUploadUrl() {
  const response = await fetch('/api/videos/upload', {
    method: 'POST'
  });

  if (!response.ok) {
    throw new Error('Failed to get upload URL');
  }

  const data = await response.json();
  return {
    uploadUrl: data.uploadUrl,
    videoId: data.id,
    streamUrl: data.url
  };
}

// 실제 업로드
const formData = new FormData();
formData.append('file', videoFile);

const uploadResponse = await fetch(uploadUrl, {
  method: 'POST',
  body: formData
});
```

### 4.7 성능 고려사항
```typescript
1. 업로드 최적화
   - 최대 파일 크기 제한
   - 업로드 진행률 표시
   - 청크 업로드 지원

2. 에러 복구
   - 업로드 재시도
   - 실패 지점부터 재개
   - 임시 파일 정리

3. 리소스 관리
   - URL 유효 기간 관리
   - 미사용 리소스 정리
   - 동시 업로드 제한
```

## 5. 비디오 삭제 API (/api/videos/delete)

### 5.1 개요
```typescript
목적:
- Cloudflare Stream에서 비디오 삭제
- 안전한 리소스 정리
- 삭제 실패 처리

특징:
- 단순 삭제 방식
- 404 응답 허용 (이미 삭제된 경우)
- 상세 로깅
```

### 5.2 요청 구조
```typescript
POST /api/videos/delete
{
  videoId: string;  // Cloudflare Stream ID
}

응답:
{
  success: boolean;
}
```

### 5.3 Cloudflare API 호출
```typescript
DELETE https://api.cloudflare.com/client/v4/accounts/${accountId}/stream/${videoId}
Headers:
  Authorization: Bearer ${token}
  Content-Type: application/json

응답 처리:
- 200: 성공
- 404: 이미 삭제됨 (성공으로 처리)
- 기타: 에러
```

### 5.4 에러 처리
```typescript
1. 입력 검증
   if (!videoId) {
     console.error('Missing videoId:', { videoId });
     return new Response("Video ID is required", { status: 400 });
   }

2. 인증 검증
   if (!user) {
     return new Response("Unauthorized", { status: 401 });
   }

3. 환경 변수
   if (!accountId) {
     throw new Error("Cloudflare account ID not found");
   }

4. API 에러
   if (!response.ok && response.status !== 404) {
     throw new Error('Failed to delete video');
   }
```

### 5.5 호출 예시
```typescript
// src/components/videos/VideoUploader.tsx
async function deleteVideo(videoId: string) {
  const response = await fetch('/api/videos/delete', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({ videoId })
  });

  if (!response.ok) {
    throw new Error('Failed to delete video');
  }

  const data = await response.json();
  return data.success;
}
```

### 5.6 성능 고려사항
```typescript
1. 에러 처리
   - 404 응답 허용
   - 상세 로깅 구현
   - 재시도 불필요

2. 리소스 정리
   - 비동기 처리
   - 순차적 삭제
   - 롤백 고려

3. 모니터링
   - 삭제 성공률 추적
   - 응답 시간 측정
   - 에러 패턴 분석
```

## 6. 비디오 구매 API (/api/videos/purchase)

### 6.1 개요
```typescript
목적:
- 코인으로 비디오 구매
- 시청 권한 부여
- 트랜잭션 처리

특징:
- 2코인 차감
- 트랜잭션 보장
- POINT_PAYMENT 접근 방식
```

### 6.2 요청 구조
```typescript
POST /api/videos/purchase/[videoId]
응답:
{
  updatedUser: {
    id: string;
    mscoin: number;  // 차감된 코인
    ...
  },
  videoView: {
    userId: string;
    videoId: string;
    accessMethod: 'POINT_PAYMENT';
  }
}
```

### 6.3 데이터베이스 처리
```typescript
const result = await prisma.$transaction(async (tx) => {
  // 1. 코인 차감
  const updatedUser = await tx.user.update({
    where: { id: user.id },
    data: {
      mscoin: { decrement: 2 },
    },
  });

  // 2. 시청 권한 기록
  const videoView = await tx.videoView.create({
    data: {
      userId: user.id,
      videoId: params.videoId,
      accessMethod: AccessMethod.POINT_PAYMENT,
    },
  });

  return { updatedUser, videoView };
});
```

### 6.4 에러 처리
```typescript
1. 인증 검증
   if (!user) {
     return Response.json(
       { error: "Unauthorized" }, 
       { status: 401 }
     );
   }

2. 트랜잭션 실패
   - 코인 부족
   - 이미 구매한 비디오
   - DB 오류

3. 응답 처리
   - 성공: 업데이트된 사용자 정보
   - 실패: 에러 메시지
```

### 6.5 호출 예시
```typescript
// src/components/videos/VideoPlayer.tsx
async function purchaseVideo(videoId: string) {
  const response = await fetch(`/api/videos/purchase/${videoId}`, {
    method: 'POST'
  });

  if (!response.ok) {
    throw new Error('Failed to purchase video');
  }

  const data = await response.json();
  return {
    remainingCoins: data.updatedUser.mscoin,
    accessGranted: true
  };
}
```

### 6.6 성능 고려사항
```typescript
1. 트랜잭션 관리
   - 원자성 보장
   - 롤백 처리
   - 데드락 방지

2. 동시성 제어
   - 코인 차감 경쟁 조건
   - 중복 구매 방지
   - 락 최소화

3. 모니터링
   - 구매 성공률
   - 코인 소비 패턴
   - 트랜잭션 시간
```
