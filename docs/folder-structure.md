# 폴더 및 라우터 구조 총정리

## 1. API 라우터 (/src/app/api)

### 1.1 인증 관련 (/api/auth)
- `route.ts`: 기본 인증 처리
- `callback/google/route.ts`: 구글 OAuth 콜백 처리
- `signout/route.ts`: 로그아웃 처리

### 1.2 이미지 관련 (/api/images)
- `upload/route.ts`: 이미지 업로드 및 처리 (Cloudflare Images 사용)

### 1.3 문의 관련 (/api/inquiry)
- `route.ts`: 문의사항 제출 및 처리

### 1.4 알림 관련 (/api/notifications)
- `route.ts`: 알림 목록 조회 및 삭제
- `mark-as-read/route.ts`: 특정 알림 읽음 처리
- `read/route.ts`: 모든 알림 읽음 처리
- `unread-count/route.ts`: 읽지 않은 알림 수 조회

### 1.5 결제 관련 (/api/payments)
- `billing/success/route.ts`: 정기 결제 성공 처리
- `billing/fail/route.ts`: 정기 결제 실패 처리
- `success/route.ts`: 일반 결제 성공 처리
- `fail/route.ts`: 일반 결제 실패 처리

### 1.6 포스트 관련 (/api/posts)
- `[postId]/route.ts`: 포스트 CRUD
- `[postId]/likes/route.ts`: 좋아요 처리
- `[postId]/bookmark/route.ts`: 북마크 처리
- `[postId]/comments/route.ts`: 댓글 관리
- `blog/route.ts`: 블로그 포스트 관리
- `bookmarked/route.ts`: 북마크된 포스트 조회
- `by-category/route.ts`: 카테고리별 포스트 조회
- `following/route.ts`: 팔로우 중인 사용자의 포스트
- `for-you/route.ts`: 개인화된 포스트 피드
- `next/route.ts`: 다음 포스트 조회
- `recommended/route.ts`: 추천 포스트 조회

### 1.7 비밀번호 초기화 (/api/reset-password)
- `route.ts`: 비밀번호 재설정 처리

### 1.8 재검증 (/api/revalidate)
- `route.ts`: Next.js ISR 재검증

### 1.9 검색 (/api/search)
- `route.ts`: 통합 검색 (포스트, 사용자)

### 1.10 구독 관련 (/api/subscription)
- `status/route.ts`: 구독 상태 조회
- `cancel/route.ts`: 구독 취소
- `webhook/route.ts`: 구독 웹훅 처리

### 1.11 사용자 관련 (/api/user, /api/users)
- `user/coinpay/route.ts`: 코인 결제 처리
- `user/coins/route.ts`: 코인 잔액 관리
- `user/delete/route.ts`: 계정 삭제
- `user/email/route.ts`: 이메일 변경
- `user/password/route.ts`: 비밀번호 변경
- `user/subscription/cancel/route.ts`: 구독 취소

- `users/[userId]/auth/route.ts`: 사용자 인증 관리
- `users/[userId]/followers/route.ts`: 팔로워 관리
- `users/[userId]/posts/route.ts`: 사용자 포스트 관리
- `users/role/route.ts`: 사용자 역할 관리
- `users/username/[username]/route.ts`: 사용자명으로 정보 조회

### 1.12 비디오 관련 (/api/videos)
- `route.ts`: 기본 비디오 관리
- `[postId]/route.ts`: 포스트별 비디오 관리
- `view/route.ts`: 시청 기록 관리
- `sync/route.ts`: 시청 기록 동기화
- `subtitle/route.ts`: 자막 업로드/관리
- `subtitle/delete/route.ts`: 자막 삭제
- `purchase/route.ts`: 비디오 구매
- `purchase/[videoId]/route.ts`: 특정 비디오 구매
- `progress/route.ts`: 시청 진행 상태 관리
- `upload/route.ts`: 비디오 업로드
- `delete/route.ts`: 비디오 삭제
- `watching/route.ts`: 현재 시청 중인 비디오 관리

## 2. 페이지 라우터 (/src/app)

### 2.1 인증 페이지 (/app/(auth))
- `signin/page.tsx`: 로그인
- `signup/page.tsx`: 회원가입
- `reset-password/page.tsx`: 비밀번호 재설정

### 2.2 메인 페이지 (/app/(main))
- `page.tsx`: 홈페이지
- `layout.tsx`: 메인 레이아웃
- `loading.tsx`: 로딩 UI
- `not-found.tsx`: 404 페이지
- `FollowingFeed.tsx`: 팔로잉 피드
- `ForYouFeed.tsx`: 추천 피드
- `MenuBar.tsx`: 메뉴 바
- `MessagesButton.tsx`: 메시지 버튼
- `Navbar.tsx`: 네비게이션 바
- `NotificationsButton.tsx`: 알림 버튼

- `admin/`: 관리자 페이지
- `bookmarks/`: 북마크 페이지
- `foryou/`: 추천 피드 페이지
- `recommended-videos/`: 추천 비디오 페이지
- `search/`: 검색 결과 페이지
- `usermenu/`: 사용자 메뉴 페이지
- `video-view/`: 비디오 시청 페이지
- `videos/`: 비디오 목록 페이지
- `watch/`: 비디오 시청 페이지 (레거시)

### 2.3 정적 페이지 (/app/(main)/(static))
- `blog/`: 블로그 페이지
- `categories/`: 카테고리별 페이지
- `company/`: 회사 소개 페이지
- `notice/`: 공지사항 페이지
- `posts/`: 포스트 상세 페이지
- `subscription/`: 구독 관련 페이지

### 2.4 사용자 메뉴 (/app/(main)/usermenu)
- `layout.tsx`: 사용자 메뉴 레이아웃
- `bookmarks/`: 북마크한 포스트 목록
- `notifications/`: 알림 목록
- `payments/`: 결제 및 구독 관리
- `postnew/`: 새 포스트 작성
- `posts/`: 포스트 관리
- `users/`: 사용자 프로필
- `yourposts/`: 내 포스트 목록

## 3. 컴포넌트 (/src/components)

### 3.1 공통 컴포넌트
- `AuthMenuItems.tsx`: 인증 메뉴 아이템
- `CropImageDialog.tsx`: 이미지 크롭 다이얼로그
- `CustomUserTrigger.tsx`: 사용자 트리거
- `FollowButton.tsx`: 팔로우 버튼
- `FollowerCount.tsx`: 팔로워 수 표시
- `footer.tsx`: 푸터
- `ImageUploader.tsx`: 이미지 업로더
- `InfiniteScrollContainer.tsx`: 무한 스크롤
- `LanguageFlag.tsx`: 언어 플래그
- `Linkify.tsx`: 링크 변환
- `LoadingButton.tsx`: 로딩 버튼
- `MainContent.tsx`: 메인 컨텐츠
- `MainPopupModal.tsx`: 메인 팝업 모달
- `MovieVideo.tsx`: 동영상 플레이어
- `NavLinks.tsx`: 네비게이션 링크
- `NoticeSidebar.tsx`: 알림 사이드바
- `OrientationModal.tsx`: 화면 방향 모달
- `PasswordInput.tsx`: 비밀번호 입력
- `PostGrid.tsx`: 포스트 그리드
- `SearchField.tsx`: 검색 필드
- `SessionProvider.tsx`: 세션 프로바이더
- `TrendsSidebar.tsx`: 트렌드 사이드바
- `UserAvatar.tsx`: 사용자 아바타
- `UserButton.tsx`: 사용자 버튼
- `UserLinkWithTooltip.tsx`: 툴팁 포함 사용자 링크
- `UserTooltip.tsx`: 사용자 툴팁
- `UserWelcome.tsx`: 사용자 환영 메시지

### 3.2 인증 관련 (/components/auth)
- `AuthTitle.tsx`: 인증 페이지 타이틀
- `CancelSubscriptionDialog.tsx`: 구독 취소 다이얼로그
- `DeleteAccountDialog.tsx`: 계정 삭제 다이얼로그
- `ProfileActionButtons.tsx`: 프로필 액션 버튼
- `ResetPasswordForm.tsx`: 비밀번호 재설정 폼
- `UserPasswordReset.tsx`: 사용자 비밀번호 재설정

### 3.3 댓글 관련 (/components/comments)
- `actions.ts`: 댓글 액션
- `Comment.tsx`: 댓글 컴포넌트
- `CommentInput.tsx`: 댓글 입력
- `CommentMoreButton.tsx`: 댓글 더보기 버튼
- `Comments.tsx`: 댓글 목록
- `DeleteCommentDialog.tsx`: 댓글 삭제 다이얼로그
- `mutations.ts`: 댓글 뮤테이션

### 3.4 포스트 관련 (/components/posts)
- `actions.ts`: 포스트 액션
- `BlogCard.tsx`: 블로그 카드
- `BookmarkButton.tsx`: 북마크 버튼
- `CategorySelect.tsx`: 카테고리 선택
- `ClientPostActions.tsx`: 클라이언트 포스트 액션
- `DeletePostDialog.tsx`: 포스트 삭제 다이얼로그
- `GridPostsSkeleton.tsx`: 그리드 포스트 스켈레톤
- `LikeButton.tsx`: 좋아요 버튼
- `LikeButtonOnly.tsx`: 좋아요 버튼만
- `mutations.ts`: 포스트 뮤테이션
- `Post.tsx`: 포스트 컴포넌트
- `PostActions.tsx`: 포스트 액션
- `PostCard.tsx`: 포스트 카드
- `PostModal.tsx`: 포스트 모달
- `PostMoreButton.tsx`: 포스트 더보기 버튼
- `PostsLoadingSkeleton.tsx`: 포스트 로딩 스켈레톤
- `PublicActions.tsx`: 공개 액션
- `ReportDialog.tsx`: 신고 다이얼로그
- `SimpleDeleteDialog.tsx`: 간단 삭제 다이얼로그
- `UserActions.tsx`: 사용자 액션
- `editor/`: 포스트 에디터 관련

### 3.5 슬라이더 관련 (/components/slider)
- `FeaturedPostSlider.tsx`: 추천 포스트 슬라이더
- `PostSlider.tsx`: 포스트 슬라이더
- `RankedPostSlider.tsx`: 랭킹 포스트 슬라이더

### 3.6 UI 컴포넌트 (/components/ui)
- `accordion.tsx`: 아코디언
- `AlertModal.tsx`: 알림 모달
- `button.tsx`: 버튼
- `card.tsx`: 카드
- `checkbox.tsx`: 체크박스
- `dialog.tsx`: 다이얼로그
- `dropdown-menu.tsx`: 드롭다운 메뉴
- `form.tsx`: 폼
- `input.tsx`: 입력
- `label.tsx`: 레이블
- `progress.tsx`: 프로그레스
- `ResumeModal.tsx`: 이어보기 모달
- `select.tsx`: 선택
- `separator.tsx`: 구분선
- `sheet.tsx`: 시트
- `sidebar.tsx`: 사이드바
- `skeleton.tsx`: 스켈레톤
- `table.tsx`: 테이블
- `tabs.tsx`: 탭
- `textarea.tsx`: 텍스트 영역
- `toast.tsx`: 토스트
- `toaster.tsx`: 토스터
- `Toolbar.tsx`: 툴바
- `tooltip.tsx`: 툴팁
- `use-toast.ts`: 토스트 훅
- `visually-hidden.tsx`: 시각적 숨김

### 3.7 비디오 관련 (/components/videos)
- `CustomVideoControls.tsx`: 커스텀 비디오 컨트롤
- `FullScreenVideo.tsx`: 전체화면 비디오
- `MobileVideoEditor.tsx`: 모바일 비디오 에디터
- `MobileVideoUploader.tsx`: 모바일 비디오 업로더
- `PlayPermissionCheck.tsx`: 재생 권한 체크
- `VideoButtons.tsx`: 비디오 버튼
- `VideoControls.tsx`: 비디오 컨트롤
- `VideoItem.tsx`: 비디오 아이템
- `VideoNavigation.tsx`: 비디오 네비게이션
- `VideoPermissionCheck.tsx`: 비디오 권한 체크
- `VideoPlayer.tsx`: 비디오 플레이어
- `VideoSection.tsx`: 비디오 섹션
- `VideoUploader.tsx`: 비디오 업로더
- `WatchVideoPlayer.tsx`: 시청용 비디오 플레이어

## 4. 훅 (/src/hooks)

### 4.1 일반 훅
- `use-mobile.tsx`: 모바일 감지
- `useDebounce.ts`: 디바운스 처리
- `useFollowerInfo.ts`: 팔로워 정보
- `usePosts.ts`: 포스트 관리
- `useSubscription.ts`: 구독 관리
- `useUploader.ts`: 업로드 관리
- `useVideoSync.ts`: 비디오 동기화

### 4.2 쿼리 훅 (/hooks/queries)
- React Query 관련 커스텀 훅

## 5. 유틸리티 (/src/lib)

### 5.1 핵심 유틸리티
- `constants.ts`: 상수 정의
- `prisma.ts`: Prisma 클라이언트
- `types.ts`: 타입 정의
- `utils.ts`: 유틸리티 함수
- `validation.ts`: 유효성 검사

### 5.2 기능별 유틸리티
- `videoTracking.ts`: 비디오 추적
- `indexedDB.ts`: IndexedDB 관리
- `ky.ts`: HTTP 클라이언트

## 6. 상태 관리 (/src/store)
- `videoStore.ts`: 비디오 관련 상태 관리

## 7. 이메일 템플릿 (/src/lib/email)
- 이메일 알림 템플릿

## 8. 공개 파일 (/public)
- 이미지, 아이콘, 로고 등 정적 파일
- 다국어 리소스 (/locales)
