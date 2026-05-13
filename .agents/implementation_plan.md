# MegaShorts 프로젝트 개선 및 구현 계획 (Phase 4 ~ Phase 6)

이 문서는 사용자의 요청사항인 **"Phase 4 (다국어/PWA), Phase 5 (시청 권한 최적화), Phase 6 (글로벌 성인인증 UI/UX), 그리고 타입스크립트 에러 전수 조사 및 해결"**에 대한 구체적인 개선 및 구현 계획입니다. (글로벌 엣지 최적화, Zero Hallucination, Production-Ready 원칙 준수)

## 🚨 User Review Required

본 구현을 시작하기 전에 아래 사항에 대한 승인이 필요합니다.
- **다국어(next-intl) 라우팅 구조**: URL Prefix 방식 사용 시, 기본 언어(영어)는 Prefix 생략, 그 외 언어(한국어, 중국어)는 `/ko`, `/zh` prefix를 사용합니다. 이 정책에 동의하시는지 확인 부탁드립니다.
- **비구독자 코인 결제 비동기(Optimistic) 처리**: 스와이프 딜레이를 없애기 위해 코인 소진 및 소장 목록을 메모리에 미리 로드합니다. 유저가 미소장 유료 영상을 스와이프할 때, 메모리에 코인이 충분하면 **즉시 재생(0초)** 시킨 후 **백그라운드로 서버 DB에 코인 차감 요청**을 보냅니다. 만약 서버에서 실패(네트워크 등)하면 다시 영상을 멈추거나 코인을 롤백하는 방식(Optimistic UI)에 동의하시는지 확인이 필요합니다.

## ❓ Open Questions

> [!WARNING]
> 현재 `npx tsc` 전수 조사 결과 `verify-age/route.ts` 파일 자체에는 타입스크립트 에러가 발견되지 않았습니다. 하지만 `src/components/videos/FullScreenVideo.tsx` 파일 등에서 `@prisma/client`의 `Media` 타입 누락이나, `video`의 `url` 프로퍼티 조회와 관련된 다수의 타입 에러(약 65개)가 발견되었습니다. `verify-age` 관련된 다른 프론트엔드 컴포넌트의 에러를 말씀하신 것인지, 혹은 이번 단계에서 전체 프로젝트의 주요 타입 에러를 함께 수정하기 원하시는지 확인 부탁드립니다.

---

## 🛠 Proposed Changes

### 1. Phase 4: 다국어(next-intl) 및 PWA

#### [NEW] 다국어 라우팅 및 번역 파일 (Next-intl)
- **목표**: 영어(기본), 한국어, 중국어 지원 및 구글 SEO 표준 맞춤형 URL Prefix 구성
- **구현 내용**:
  - `i18n.ts` 및 `middleware.ts` 추가: `next-intl` 미들웨어를 사용하여 `localePrefix: 'as-needed'` 설정 (영어는 Prefix 제거)
  - `messages/en.json`, `ko.json`, `zh.json` 사전 생성
  - 주요 페이지(`app/[locale]/...`) 라우팅 구조 리팩토링 (기존 `(main)` 폴더 구조와 병합/조정 필요성 검토)

#### [NEW] PWA (Progressive Web App) 도입
- **목표**: 네이티브 앱 경험 제공 및 오프라인 대비(로딩 최적화)
- **구현 내용**:
  - `manifest.json` 생성: 앱 이름, 아이콘, `display: "standalone"`, `orientation: "portrait"` (세로 고정)
  - `next-pwa`를 활용하여 Service Worker 등록
  - 하단 스낵바 컴포넌트 추가 (`PWAInstallPrompt.tsx`): 저자극형 설치 유도 로직 (사용자가 X를 누르면 7일간 숨김)

---

### 2. Phase 5: 시청 권한 최적화 (Two-Track Caching)

#### [MODIFY] `PlayPermissionCheck.tsx`
- **현재 문제**: 비구독자가 유료 스와이프 시 매번 `/api/user/coinpay` 호출로 인해 200~500ms 지연 발생 (검은 화면 대기)
- **개선 로직**:
  - **로그인 시점 (메모리 로드)**: Zustand Store 또는 React Query를 통해 유저의 `purchasedVideoIds`(소장 목록 배열)와 `mscoin`(보유 코인)을 브라우저 메모리에 단 한 번 로드합니다.
  - **스와이프 시점 (0초 딜레이)**:
    1. 해당 비디오 ID가 `purchasedVideoIds`에 있다면 **즉시 재생**.
    2. 소장하지 않았지만 `mscoin >= 1` 이라면 **즉시 재생** 및 로컬 메모리 코인 1 차감. 이후 백그라운드(`/api/user/coinpay`)로 비동기 서버 동기화.
    3. 코인이 부족하면 즉시 충전 모달 표시.

#### [NEW] `store/useAuthStore.ts` (또는 기존 React Query Hook 확장)
- 유저의 결제 이력, 소장 목록, 잔여 코인을 캐싱하고 관리할 글로벌 상태.

---

### 3. Phase 6: 글로벌 성인인증 UI/UX

#### [NEW] `VerifyAgeModal.tsx`
- **목표**: 모바일 친화적인 Self-declaration 방식 성인인증 인터페이스 구현.
- **구현 내용**:
  - `PlayPermissionCheck.tsx`에서 성인 컨텐츠(ageLimit >= 18) 접근 시 `userAuth.adultauth`가 없으면 호출됨.
  - 생년월일 입력 폼(모바일에서 기본 Date Picker 활용).
  - 18세 이상 확인 및 동의 체크박스.
  - 제출 시 `/api/user/verify-age` POST 호출하여 성공 시 모달 닫기 및 영상 즉시 재생 시작.
  - Framer Motion을 활용한 부드러운 하단 시트(Bottom Sheet) 형태의 애니메이션.

---

### 4. 에러 체크: TypeScript 에러 해결

#### [MODIFY] `verify-age` 연관 에러 및 주요 타입스크립트 이슈
- `src/app/(main)/api/user/verify-age/route.ts`에 잔존할 수 있는 잠재적 타입 이슈 재확인.
- `npx tsc` 실행 시 나타난 `FullScreenVideo.tsx`의 `url` 속성 없음 에러, `@prisma/client`의 `Media` 타입 부재 에러 등 핵심 재생 로직과 연관된 타입 에러 우선 해결하여 무결성 확보.

---

## ✅ Verification Plan

### Automated Tests
- `npx tsc --noEmit`을 실행하여 모든 수정된 파일(특히 `FullScreenVideo.tsx` 및 성인 인증 로직)에서 타입 에러가 0건인지 확인.
- 브라우저 개발자 도구를 통해 비구독자 계정으로 유료 영상 스와이프 시 네트워크 탭을 확인하여 대기시간(TTFB)이 재생에 블락을 주지 않는지 확인 (비동기 처리 증명).

### Manual Verification
- Vercel 혹은 로컬 프리뷰 환경에서 모바일 기기로 접속하여 PWA 설치 스낵바 동작 확인.
- 성인 인증 모달에서 18세 미만 생년월일 입력 시 거부되는지, 18세 이상 시 정상 처리 및 캐시 반영되는지 테스트.
- 다국어 라우팅 접속 테스트 (`/`, `/ko`, `/zh` URL 변경 시 언어 동적 변경 여부 확인).
