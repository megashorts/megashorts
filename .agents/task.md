# 작업 체크리스트

## Phase 4: 다국어(next-intl) 및 PWA
- `[x]` next-intl 패키지 설치 및 설정 (`i18n.ts`, `middleware.ts` 등)
- `[x]` 다국어 리소스 파일 생성 (en, ko, zh)
- `[x]` PWA 설정 (`manifest.json`, Service Worker, next-pwa)
- `[x]` PWA 설치 유도 스낵바(`PWAInstallPrompt.tsx`) 구현

## Phase 5: 시청 권한 최적화 (Two-track 캐싱)
- `[x]` `store/useAuthStore.ts` 구현 (Zustand) 또는 캐시 구조 변경
- `[x]` 로그인/앱 진입 시 보유 코인 및 소장 목록(`purchasedVideoIds`) 로드
- `[x]` `PlayPermissionCheck.tsx` 리팩토링 (Optimistic UI 코인 차감 적용)

## Phase 6: 글로벌 성인인증 UI/UX
- `[x]` `VerifyAgeModal.tsx` 컴포넌트 생성 (Framer Motion 바텀시트)
- `[x]` 모달 내 생년월일 입력 및 18세 이상 동의 로직 구현
- `[x]` `PlayPermissionCheck.tsx`에서 모달 렌더링 연동

## 에러 체크: 타입스크립트 이슈 해결
- `[ ]` `FullScreenVideo.tsx` 내 `url` 프로퍼티 조회 에러 수정 (`filename` 등 올바른 속성 사용으로 수정 추정)
- `[ ]` `Post.tsx` 등 내 `@prisma/client` `Media` 부재 에러 등 핵심 에러 해결
