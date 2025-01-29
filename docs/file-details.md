# 파일별 상세 기능 설명

## API 라우터 상세 기능

### 인증 관련
```typescript
/api/auth/route.ts
- 기능: 기본 인증 처리 (로그인/회원가입)
- 사용처: 로그인 페이지, 회원가입 페이지
- 특징: Lucia 인증 라이브러리 사용

/api/auth/callback/google/route.ts
- 기능: 구글 OAuth 인증 처리
- 사용처: 구글 로그인 버튼 클릭 시
- 특징: Arctic 라이브러리로 OAuth 구현

/api/auth/signout/route.ts
- 기능: 로그아웃 처리
- 사용처: 로그아웃 버튼 클릭 시
- 특징: 세션 삭제 및 쿠키 제거
```

### 이미지 관련
```typescript
/api/images/upload/route.ts
- 기능: 이미지 업로드 처리
- 사용처: 프로필 이미지, 포스트 썸네일
- 특징: Cloudflare Images 서비스 사용, 이미지 최적화 지원
```

### 알림 관련
```typescript
/api/notifications/route.ts
- 기능: 알림 목록 조회/삭제
- 사용처: 알림 사이드바, 알림 페이지
- 특징: 페이지네이션 지원

/api/notifications/mark-as-read/route.ts
- 기능: 알림 읽음 처리
- 사용처: 알림 클릭 시
- 특징: 벌크 업데이트 지원
```

### 결제 관련
```typescript
/api/payments/route.ts
- 기능: 토스페이먼츠 결제 처리
- 사용처: 코인 구매, 구독 결제
- 특징: 결제 위젯 연동

/api/payments/webhook/route.ts
- 기능: 결제 웹훅 처리
- 사용처: 결제 상태 업데이트
- 특징: 비동기 결제 처리
```

### 포스트 관련
```typescript
/api/posts/[postId]/route.ts
- 기능: 포스트 CRUD
- 사용처: 포스트 작성/수정/삭제
- 특징: 트랜잭션 처리

/api/posts/[postId]/likes/route.ts
- 기능: 좋아요 처리
- 사용처: 좋아요 버튼
- 특징: 알림 자동 생성

/api/posts/[postId]/bookmark/route.ts
- 기능: 북마크 처리
- 사용처: 북마크 버튼
- 특징: 사용자별 북마크 관리

/api/posts/by-category/route.ts
- 기능: 카테고리별 포스트 조회
- 사용처: 카테고리 페이지
- 특징: 무한 스크롤 지원
```

### 비디오 관련
```typescript
/api/videos/view/route.ts
- 기능: 시청 기록 관리
- 사용처: 비디오 플레이어
- 특징: 프리미엄 컨텐츠 접근 제어

/api/videos/sync/route.ts
- 기능: 시청 기록 동기화
- 사용처: 로그인 시, IndexedDB 초기화 시
- 특징: 브라우저-서버 동기화

/api/videos/subtitle/route.ts
- 기능: 자막 파일 업로드/관리
- 사용처: 비디오 업로드 시
- 특징: Cloudflare Stream 연동
```

## 컴포넌트 상세 기능

### 비디오 관련
```typescript
/components/videos/VideoPlayer.tsx
- 기능: HLS 비디오 플레이어
- 사용처: 비디오 시청 페이지
- 특징: 자막, 품질 선택 지원

/components/videos/VideoControls.tsx
- 기능: 비디오 컨트롤 UI
- 사용처: 비디오 플레이어 내부
- 특징: 커스텀 컨트롤러

/components/videos/VideoUploader.tsx
- 기능: 비디오 업로드 UI
- 사용처: 포스트 작성 페이지
- 특징: 드래그 앤 드롭 지원
```

### 포스트 관련
```typescript
/components/posts/PostGrid.tsx
- 기능: 포스트 그리드 레이아웃
- 사용처: 메인 페이지, 카테고리 페이지
- 특징: 반응형 그리드

/components/posts/PostModal.tsx
- 기능: 포스트 상세 모달
- 사용처: 포스트 클릭 시
- 특징: 댓글, 좋아요 기능

/components/posts/editor/PostEditor.tsx
- 기능: 포스트 작성/수정 에디터
- 사용처: 포스트 작성/수정 페이지
- 특징: 마크다운 지원
```

### 인증 관련
```typescript
/components/auth/ProfileActionButtons.tsx
- 기능: 프로필 관련 액션 버튼
- 사용처: 프로필 페이지
- 특징: 팔로우, 메시지 기능

/components/auth/DeleteAccountDialog.tsx
- 기능: 계정 삭제 다이얼로그
- 사용처: 계정 설정 페이지
- 특징: 2단계 확인
```

## 유틸리티 상세 기능

### 비디오 관련
```typescript
/lib/videoTracking.ts
- 기능: 비디오 시청 추적
- 사용처: 비디오 플레이어
- 특징: 시청 시간, 진행률 추적

/lib/indexedDB.ts
- 기능: IndexedDB 관리
- 사용처: 오프라인 시청 기록
- 특징: 브라우저 저장소 관리
```

### API 관련
```typescript
/lib/ky.ts
- 기능: HTTP 클라이언트 설정
- 사용처: API 호출
- 특징: 인터셉터, 재시도 로직

/lib/validation.ts
- 기능: 입력값 검증
- 사용처: 폼 제출, API 요청
- 특징: Zod 스키마 정의
```

## 훅 상세 기능

### 비디오 관련
```typescript
/hooks/useVideoSync.ts
- 기능: 비디오 동기화 관리
- 사용처: 비디오 플레이어
- 특징: 자동 동기화

/hooks/useUploader.ts
- 기능: 파일 업로드 관리
- 사용처: 비디오/이미지 업로드
- 특징: 업로드 진행률 관리
```

### 데이터 관련
```typescript
/hooks/usePosts.ts
- 기능: 포스트 데이터 관리
- 사용처: 포스트 목록/상세
- 특징: React Query 사용

/hooks/useSubscription.ts
- 기능: 구독 상태 관리
- 사용처: 프리미엄 컨텐츠
- 특징: 실시간 상태 관리
