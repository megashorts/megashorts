# API 라우터 상세 문서

## 1. 비디오 시스템 (/api/videos)

### 1.1 시청 기록 관리 (/api/videos/view)
```typescript
호출 위치: src/lib/videoTracking.ts의 trackView 함수

기능:
- 비디오 시청 기록 저장
- 시청 시간 추적
- 프리미엄 컨텐츠 접근 관리

구조:
POST /api/videos/view
{
  videoId: string;
  postId: string;
  sequence: number;
  timestamp: number;
}

처리 로직:
1. 사용자 인증 확인
2. 3초 이상 시청 시에만 기록
3. 프리미엄 컨텐츠인 경우 구독 상태 확인
4. VideoView 테이블에 기록
5. UserVideoProgress 업데이트
```

### 1.2 시청 기록 동기화 (/api/videos/sync)
```typescript
호출 위치: 
- src/hooks/useVideoSync.ts
- src/components/SessionProvider.tsx (로그인 시)

기능:
- 브라우저 IndexedDB와 서버 DB 간 시청 기록 동기화
- 디바이스 간 시청 기록 공유

구조:
GET /api/videos/sync

응답:
{
  watchedVideos: { videoId: string }[];
  lastViews: {
    postId: string;
    sequence: number;
    timestamp: number;
  }[];
}

처리 로직:
1. 사용자의 모든 시청 기록 조회
2. 첫 번째 에피소드(sequence: 1) 제외
3. 포스트별 마지막 시청 정보 포함
```

### 1.3 자막 관리 (/api/videos/subtitle)
```typescript
호출 위치: src/components/videos/VideoUploader.tsx

기능:
- 자막 파일 업로드
- 자막 수정/삭제
- 다국어 자막 지원

구조:
POST /api/videos/subtitle
{
  videoId: string;
  language: string;
  content: string;
}

DELETE /api/videos/subtitle/delete
{
  videoId: string;
  language: string;
}

처리 로직:
1. 파일 형식 검증
2. Cloudflare Stream API로 자막 업로드
3. DB에 자막 메타데이터 저장
```

### 1.4 비디오 구매 (/api/videos/purchase)
```typescript
호출 위치: 
- src/components/videos/VideoPlayer.tsx
- src/app/(main)/video-view/[postId]/VideoViewClient.tsx

기능:
- 코인으로 비디오 구매
- 구매 기록 관리
- 접근 권한 부여

구조:
POST /api/videos/purchase
{
  videoId: string;
  postId: string;
}

처리 로직:
1. 사용자 코인 잔액 확인
2. 코인 차감
3. VideoView 테이블에 구매 기록 생성
4. 접근 권한 부여
```

### 1.5 진행 상태 관리 (/api/videos/progress)
```typescript
호출 위치: src/components/videos/VideoPlayer.tsx

기능:
- 시청 진행 상태 저장
- 이어보기 지원
- 디바이스 간 진행 상태 동기화

구조:
POST /api/videos/progress
{
  postId: string;
  sequence: number;
  timestamp: number;
}

처리 로직:
1. UserVideoProgress 테이블 업데이트
2. 마지막 시청 시간 저장
3. 이어보기 정보 제공
```

## 2. 포스트 시스템 (/api/posts)

### 2.1 포스트 기본 CRUD (/api/posts/[postId])
```typescript
호출 위치:
- src/components/posts/actions.ts
- src/components/posts/editor/mutations.ts

기능:
- 포스트 생성/수정/삭제
- 포스트 상세 정보 조회
- 연관 비디오 관리

구조:
GET /api/posts/[postId]
POST /api/posts
PUT /api/posts/[postId]
DELETE /api/posts/[postId]

처리 로직:
1. 권한 검증
2. 포스트 데이터 검증
3. 연관 비디오 처리
4. 태그/카테고리 처리
```

### 2.2 포스트 상호작용 (/api/posts/[postId]/*)
```typescript
호출 위치:
- src/components/posts/LikeButton.tsx
- src/components/posts/BookmarkButton.tsx
- src/components/comments/CommentForm.tsx

기능:
- 좋아요/북마크 관리
- 댓글 CRUD
- 상호작용 알림

하위 엔드포인트:
1. /likes: 좋아요 토글
2. /bookmark: 북마크 토글
3. /comments: 댓글 관리

처리 로직:
1. 사용자 인증
2. 상호작용 처리
3. 알림 생성
4. 실시간 업데이트
```

### 2.3 포스트 피드 (/api/posts/*)
```typescript
호출 위치:
- src/components/MainContent.tsx
- src/components/PostGrid.tsx
- src/hooks/usePosts.ts

기능:
- 다양한 피드 제공
- 무한 스크롤
- 필터링/정렬

하위 엔드포인트:
1. /for-you: 개인화된 피드
2. /recommended: 추천 포스트
3. /following: 팔로우 중인 사용자
4. /by-category: 카테고리별
5. /bookmarked: 북마크한 포스트

처리 로직:
1. 페이지네이션
2. 필터 적용
3. 정렬 처리
4. 캐싱 최적화
```

## 3. 사용자 시스템 (/api/users, /api/user)

### 3.1 사용자 프로필 (/api/users/[userId])
```typescript
호출 위치:
- src/app/(main)/usermenu/users/[username]/mutations.ts
- src/components/auth/ProfileActionButtons.tsx

기능:
- 프로필 정보 관리
- 팔로우/팔로워
- 사용자 포스트 목록

구조:
GET /api/users/[userId]
PUT /api/users/[userId]
GET /api/users/[userId]/followers
GET /api/users/[userId]/posts

처리 로직:
1. 프로필 정보 검증
2. 이미지 처리
3. 권한 관리
4. 관계 처리
```

### 3.2 계정 관리 (/api/user/*)
```typescript
호출 위치:
- src/components/auth/DeleteAccountDialog.tsx
- src/components/auth/ResetPasswordForm.tsx

기능:
- 이메일/비밀번호 관리
- 계정 삭제
- 보안 설정

하위 엔드포인트:
1. /email: 이메일 변경
2. /password: 비밀번호 변경
3. /delete: 계정 삭제

처리 로직:
1. 보안 검증
2. 데이터 백업
3. 연관 데이터 처리
```

### 3.3 결제/코인 (/api/user/*)
```typescript
호출 위치:
- src/app/(main)/usermenu/payments/PaymentModal.tsx
- src/components/videos/VideoPlayer.tsx

기능:
- 코인 결제/환불
- 구독 관리
- 거래 내역

하위 엔드포인트:
1. /coinpay: 코인 결제
2. /coins: 잔액 관리
3. /subscription/cancel: 구독 취소

처리 로직:
1. 결제 처리
2. 잔액 업데이트
3. 거래 기록
4. 알림 발송
```

## 4. 알림 시스템 (/api/notifications)

### 4.1 알림 관리
```typescript
호출 위치:
- src/components/NavLinks.tsx
- src/components/NoticeSidebar.tsx

기능:
- 알림 CRUD
- 읽음 상태 관리
- 실시간 카운트

하위 엔드포인트:
1. /route.ts: 알림 목록
2. /mark-as-read: 읽음 처리
3. /unread-count: 읽지 않은 수

처리 로직:
1. 알림 생성
2. 상태 관리
3. 실시간 업데이트
```

## 5. 인증 시스템 (/api/auth)

### 5.1 기본 인증
```typescript
호출 위치:
- src/components/SessionProvider.tsx
- src/auth.ts

기능:
- 세션 관리
- 권한 검증
- OAuth 연동

하위 엔드포인트:
1. /route.ts: 기본 인증
2. /session: 세션 관리
3. /callback/google: OAuth

처리 로직:
1. 인증 처리
2. 세션 생성
3. 권한 부여
```

## 6. 결제 시스템 (/api/payments)

### 6.1 결제 처리
```typescript
호출 위치:
- src/app/(main)/usermenu/payments/PaymentModal.tsx

기능:
- 결제 처리
- 구독 관리
- 영수증 발행

하위 엔드포인트:
1. /success: 결제 성공
2. /fail: 결제 실패
3. /billing/*: 정기 결제

처리 로직:
1. 결제 검증
2. 상품 제공
3. 기록 관리
```

## 7. 검색 시스템 (/api/search)

### 7.1 통합 검색
```typescript
호출 위치:
- src/components/SearchField.tsx

기능:
- 포스트 검색
- 사용자 검색
- 자동 완성

구조:
GET /api/search?q=검색어

처리 로직:
1. 검색어 처리
2. 결과 필터링
3. 정렬/랭킹
4. 캐싱
```

## 개선 가능 사항

### 1. 성능 최적화
- API 응답 캐싱 전략 개선
- N+1 쿼리 문제 해결
- 불필요한 DB 조회 최소화

### 2. 코드 구조
- 중복 로직 통합 (인증, 검증 등)
- 에러 처리 일관성
- 타입 정의 개선

### 3. 보안
- Rate limiting 구현
- 입력 값 검증 강화
- 권한 체크 강화

### 4. 모니터링
- 에러 로깅 개선
- 성능 메트릭 수집
- 사용량 분석
