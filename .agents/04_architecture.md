# MegaShorts 플랫폼 종합 아키텍처 및 해설 문서

이 문서는 MegaShorts 플랫폼의 전체적인 기술 구조, 인증 프로세스, 인프라 전략 등을 기록하는 마스터 문서입니다. 시스템이 확장됨에 따라 지속적으로 업데이트됩니다.

## 1. 영상 재생 및 권한 확인 프로세스 (Video Playback Flow)

현재 코드베이스(`PlayPermissionCheck.tsx`, `VideoPlayer.tsx`, `VideoViewClient.tsx`)에 구현된 **실제 동작 과정**입니다. 추측을 배제하고 100% 실제 동작하는 흐름만 기록합니다.

### 1-1. 스와이프 및 권한 검증 단계 (`PlayPermissionCheck.tsx`)
유저가 스와이프하여 새로운 영상을 볼 때마다 즉각적으로 발생하는 검증입니다.

1. **Two-track 캐싱 및 상태 확인 (React Query 로컬 캐시)**
   - 프론트엔드는 로그인 시 가져온 `userAuth` 정보(React Query)를 확인합니다. 이 정보에는 구독 상태뿐만 아니라 **잔여 코인**과 **이미 구매한 영상 ID 목록(`purchasedVideoIds`)**이 포함됩니다.
   - **성인 컨텐츠(`ageLimit >= 18`)**: `userAuth.adultAuth` 필드가 `true`가 아니면 즉시 **[글로벌 성인인증 바텀시트]**를 띄웁니다.
   - **구독자**: `userAuth.subscription.currentPeriodEnd`가 유효하면 0초 즉시 재생합니다.
   - **기구매자**: `userAuth.purchasedVideoIds`에 현재 영상 ID가 포함되어 있으면 서버 통신 없이 0초 즉시 재생합니다.

2. **Optimistic UI 기반 코인 소모 (비구독자/미구매자)**
   - 위 조건에 해당하지 않는 경우에만 `/api/user/coinpay` POST 요청을 보냅니다.
   - **성능 최적화**: 서버 응답을 기다리지 않고 로컬 `userAuth` 캐시의 코인을 즉시 차감하고 재생을 시작하는 **Optimistic UI**를 적용하여, 해외 유저의 네트워크 지연(200~500ms) 문제를 근본적으로 해결했습니다.
   - 만약 서버에서 잔액 부족 등으로 실패할 경우, 캐시를 롤백하고 충전 모달을 띄웁니다.

### 1-2. 시청 시간 추적 및 기록 단계 (`VideoPlayer.tsx` & `api/videos/view`)
영상이 재생되기 시작한 후 시청 기록을 저장하는 과정입니다.

1. **최초 5초 도달 시 (조회수 1 증가)**
   - 영상의 현재 재생 시간(`currentTime`)이 **5초**가 되는 순간 트리거됩니다.
   - **브라우저 로컬**: `videoDB`(IndexedDB)에 시청 기록과 위치를 즉시 저장합니다.
   - **서버 통신**: 해당 영상이 `isPremium`인 경우, 서버로 `fetch('/api/videos/view')` POST 요청을 보냅니다.
   
2. **서버의 시청 기록 처리 (`/api/videos/view/route.ts`)**
   - 서버는 프론트엔드에서 5초 도달 신호를 받으면, 다시 서버 내부적으로 `fetch('/api/users/[userId]/auth')`를 호출하여 유저의 **구독 상태를 재확인**합니다.
   - 구독자면 `accessMethod = SUBSCRIPTION`, 아니면 `accessMethod = COIN`으로 판별합니다.
   - `prisma.$transaction`을 열어 `VideoView` 테이블에 기록이 없으면 최초 생성하고, `UserVideoProgress`를 업데이트하여 **가장 마지막에 본 시퀀스(Sequence)**를 서버 DB에 동기화합니다.
   - 이 과정이 끝나면 R2(로그 워커 대체)에 `SubsView_` 또는 `coinview_` 형태의 통계용 로그가 남습니다.

3. **10초 단위 재생 위치 기록 (Resume 기능)**
   - 10초, 20초, 30초 등 10초 단위로 재생될 때마다 프론트엔드는 백엔드에 부담을 주지 않고 **브라우저 내부(`videoDB` - IndexedDB)**에만 재생 위치를 덮어씌워 저장합니다.
   - 유저가 나중에 다시 이 에피소드로 돌아왔을 때(혹은 앱을 껐다 켰을 때) `VideoViewClient.tsx`가 IndexedDB를 읽어 **"시청 기록이 있습니다! 이어보시겠습니까?"** 모달을 띄워줍니다.

---

## 3. 다국어 (i18n) 및 SEO 전략

### 3-1. 언어 정책
- **기본 언어 (Default)**: **영어 (English)**
- **확장 언어**: 중국어 (Chinese) - *추후 단일 소스 파일에 언어셋만 추가하여 무한 확장 가능*

### 3-2. 구글 SEO 표준 라우팅 정책
- 구글 검색 엔진 최적화(SEO)를 위해 **URL Prefix(경로 기반) 라우팅**을 사용합니다.
- 단, 기본 언어(영어)는 URL에 prefix를 붙이지 않아 URL 깊이를 최소화합니다.
  - **영어(기본)**: `megashorts.com/videos`
  - **중국어**: `megashorts.com/zh/videos`
- 이렇게 하면 `next-intl`의 `localePrefix: 'as-needed'` 설정에 의해 기본 URL의 검색 노출 순위가 완벽히 보존됩니다.

### 3-3. 동적 콘텐츠 다국어화 (Smart Fallback)
- **동적 데이터 구조**: 관리자가 설정하는 공지사항, 슬라이더 제목 등은 DB의 `jsonb` 타입 필드(예: `titleI18n`)에 언어별 데이터를 저장합니다.
- **폴백 메커니즘 (`getDynamicContent`)**: 유저 로케일에 맞는 데이터가 없으면 **[영어(기본) -> 원본 텍스트]** 순으로 자동 폴백하여, 번역이 누락되어도 서비스가 중단되거나 깨지지 않도록 보장합니다.

### 3-4. 프론트엔드 전면 지역화
- 모든 정적 컴포넌트(Subscription, Notice, Company 등)는 `next-intl`의 `messages/*.json` 파일을 사용하여 100% 번역을 지원합니다.
- 서버 컴포넌트는 `getTranslations`, 클라이언트 컴포넌트는 `useTranslations`를 사용하는 표준 패턴을 엄격히 준수합니다.

### 3-5. 포스트 및 카테고리 데이터 구조 원칙 (Global Baseline)
- **포스트 (Post) 다국어화**:
  - `title` 및 `content` 원본 필드는 영상의 실제 오디오/자막 언어(`postLanguage`)와 무관하게 **반드시 영어(English)**로 고정하여 저장합니다. 이는 번역이 없는 다른 국가 유저가 접속했을 때 알 수 없는 언어가 노출되는 것을 방지하기 위한 글로벌 서비스의 최후 방어선(Fallback)이자 SEO의 기준점입니다.
  - 한국어, 중국어 등 다국어 데이터는 `titleI18n`, `contentI18n` JSON 필드에 분리하여 저장하고 렌더링 시 최우선으로 매핑합니다.
- **카테고리 (Category) 다국어 처리**:
  - `CategoryType`은 DB 마이그레이션 리스크와 시스템 복잡도를 피하기 위해 동적 DB 모델이 아닌 **Prisma Enum** 구조를 유지합니다.
  - 카테고리 다국어 처리는 DB 레벨이 아닌 `next-intl`(`ko.json`, `en.json`, `zh.json`의 `Category` 네임스페이스)을 통해 프론트엔드 뷰 레벨에서 100% 완벽하게 처리됩니다.

### 3-6. 콘텐츠 언어 노출 정책 및 영상 자막 선택 기준 (2026-05-19 구축)
이번 단계에서 포스트/영상 관련 동적 콘텐츠의 다국어 표시 기준을 플랫폼 공통 정책으로 정리하고 코드에 반영했습니다.

1. **기본 운영 정책**
   - 기본값은 `전체 노출 + 선택 언어 우선 표시`입니다.
   - 사용자가 한국어, 영어, 중국어 중 어떤 언어를 선택해도 콘텐츠 목록 자체는 기본적으로 사라지지 않습니다.
   - 제목과 소개는 선택 언어 번역을 우선 사용하고, 없으면 영어 번역, 영어 번역도 없으면 원문 필드 순서로 표시합니다.
   - 이 방식은 언어별 콘텐츠 수가 부족한 초기 운영 단계에서 페이지가 비어 보이거나 카테고리 접근이 깨지는 위험을 낮추기 위한 안전한 기본값입니다.

2. **관리자 전환 정책**
   - `/admin/system`에 `콘텐츠 언어 노출 정책` 설정을 추가했습니다.
   - 선택지는 `전체 노출 + 선택 언어 우선 표시`와 `선택 언어 지원 콘텐츠만 노출`입니다.
   - `선택 언어 지원 콘텐츠만 노출`은 현재 선택 언어가 포스트의 `postLanguage`와 같거나, 해당 포스트의 영상 `subtitle` 배열에 포함된 경우만 목록에 노출합니다.
   - 이 필터링 정책은 콘텐츠 수가 충분한 언어권에서만 신중하게 켜야 합니다. 콘텐츠가 적은 언어에서는 랜딩/카테고리/추천 목록이 비어 보일 수 있습니다.

3. **공통 유틸 기준**
   - 클라이언트/서버 공통 표시 규칙은 `src/lib/content-language.ts`에 둡니다.
   - 서버 조회 필터와 시스템 설정 조회는 `src/lib/content-language-server.ts`에 둡니다.
   - 기존 `getDynamicContent`는 선택 언어 -> 영어 -> 원문 fallback 규칙을 따르도록 정리했습니다.
   - 이 구조는 Prisma/DB 접근 코드가 클라이언트 번들에 섞이지 않도록 표시 유틸과 서버 유틸을 분리한 것입니다.

4. **적용된 화면과 API**
   - 랜딩 페이지 메인 슬라이더(`MainContent`, `FeaturedPostSlider`, `PostSlider`, `RankedPostSlider`)
   - 카테고리, 최신, 복합 카테고리 페이지
   - 카테고리 무한 스크롤 API(`/api/posts/by-category`)
   - 추천 영상 페이지와 추천 영상 API(`/recommended-videos`, `/api/posts/recommended`)
   - 포스트 카드, 포스트 그리드, 포스트 모달
   - 포스트 상세 페이지의 제목, 소개, 메타데이터
   - 영상 상세 재생 화면과 추천 영상 재생 화면

5. **자막 선택 기준**
   - `VideoPlayer`는 더 이상 한국어 자막을 고정 선택하지 않습니다.
   - 현재 locale을 영상 재생 언어 값으로 변환한 뒤 해당 언어 자막을 우선 선택합니다.
   - 선택 언어 자막이 없으면 영어 자막을 fallback으로 선택합니다.
   - 자막 트랙이 둘 다 없으면 플레이어는 자막 없이 재생되며, 재생 자체를 막지 않습니다.

6. **검증 상태**
   - `npm run lint` 통과: 기존 warning만 유지됩니다.
   - `npx tsc --noEmit` 통과: 타입 오류 0건입니다.
   - `npm run build` 통과: Next.js 15.5.18 기준 프로덕션 빌드 성공입니다.
   - 빌드 중 로컬 환경에서 Supabase DB 연결 경고가 출력될 수 있습니다. 현재 정적 파라미터 생성 경로에서 catch 처리되어 빌드를 차단하지 않습니다.

7. **운영 확인 필요 항목**
   - Vercel Preview 배포 후 실제 브라우저에서 `/ko`, `/en`, `/zh` 랜딩 페이지를 확인해야 합니다.
   - 카테고리 페이지, 최신 페이지, 추천 영상 페이지, 포스트 모달, 포스트 상세, 영상 재생 화면에서 언어 선택 후 제목/소개/자막 fallback이 기대대로 보이는지 확인해야 합니다.
   - `/admin/system`에서 정책을 `선택 언어 지원 콘텐츠만 노출`로 바꾸는 테스트는 운영 콘텐츠가 충분한지 먼저 확인한 뒤 수행해야 합니다.
   - Production DB와 Preview DB가 같은 경우, 관리자 설정 변경은 실제 서비스 화면에 영향을 줄 수 있으므로 Preview 전용 환경변수/DB 분리가 가장 안전합니다.

### 3-7. 다국어 표시 불일치 보정 기준 (2026-05-20)
2026-05-20 점검에서 언어 선택 후 일부 화면은 번역을 따르고 일부 화면은 원문 또는 한국어 고정 문구가 남는 문제가 확인되었습니다. 원인은 단일 문제가 아니라 데이터 키, 컴포넌트 적용 범위, 서버-클라이언트 직렬화가 섞인 구조적 문제였습니다.

1. **동적 포스트 번역 키 보정**
   - 기존 표시 유틸은 `titleI18n`, `contentI18n` 키가 `ko`, `en`, `zh` 형태라고 가정했습니다.
   - 실제 업로드/운영 경로에는 `KOREAN`, `ENGLISH`, `CHINESE`, `kr`, `cn` 같은 키가 섞일 수 있습니다.
   - `src/lib/content-language.ts`에서 locale alias를 지원하도록 보정했습니다.
   - 현재 표시 우선순위는 선택 locale alias 전체 -> 영어 alias 전체 -> 원문입니다.
   - 이 보정으로 “영어/중국어는 보이는데 한국어만 fallback 되는” 데이터 키 불일치 문제를 줄였습니다.

2. **포스트 상세 페이지 Decimal 직렬화 오류**
   - 오류 메시지: `Only plain objects can be passed to Client Components from Server Components. Decimal objects are not supported.`
   - 원인은 Prisma `User.points`가 `Decimal` 객체인데, 포스트 상세 페이지에서 `PostData` 전체를 클라이언트 컴포넌트(`PublicActions`, `UserActions`, `PostMoreButton`)로 넘기면서 발생했습니다.
   - `src/app/[locale]/(main)/(static)/posts/[postId]/page.tsx`에서 Prisma Decimal을 number로 변환하는 직렬화 보정 함수를 적용했습니다.
   - 이 처리는 클라이언트로 넘기는 데이터의 RSC 직렬화 안정성을 위한 방어 코드입니다.

3. **정적 문구 다국어 적용 범위 확대**
   - `Content`, `UserMenu`, `NotificationMessage` 메시지 네임스페이스를 추가했습니다.
   - 카테고리 페이지 상단 제목, 최신 페이지 제목, 복합 카테고리 제목/메타 설명을 다국어 처리했습니다.
   - 랜딩 슬라이더의 `전체보기`, 포스트 그리드의 무한 스크롤 안내, 모달의 영상 개수 문구를 다국어 처리했습니다.
   - 추천 영상과 전체화면 영상의 `보러가기`, `바로보기` 문구를 다국어 처리했습니다.
   - 영상 상세 재생 화면의 완료/처음/마지막/로그인/프리미엄/코인 오류 모달 문구를 다국어 처리했습니다.
   - 유저메뉴 주요 경로인 북마크, 시청중, 나의 컨텐츠, 프로필 요약, 알림 목록, 프로필 수정 모달의 주요 문구를 다국어 처리했습니다.

4. **검증 상태**
   - 메시지 JSON 파싱 검증 통과: `messages/ko.json`, `messages/en.json`, `messages/zh.json`
   - `npx tsc --noEmit` 통과
   - `npm run lint` 통과: 기존 warning만 유지
   - `.next` 빌드 캐시 정리 후 `npm run build` 통과
   - 로컬 빌드 중 Supabase 연결 경고는 기존과 동일하게 발생했으며, 정적 파라미터 생성 경로에서 catch 처리되어 빌드를 차단하지 않았습니다.

5. **남은 운영 점검**
   - 실제 DB에 저장된 모든 `titleI18n`, `contentI18n` 키 분포를 별도로 점검해야 합니다.
   - 결제/수익관리처럼 문구량이 많은 유저메뉴 하위 기능은 이번에 주요 화면만 보정했으므로, 별도 전수 번역 패스로 관리하는 것이 맞습니다.
   - Vercel Preview에서 `/ko`, `/en`, `/zh` 각각 랜딩, 카테고리, 포스트 모달, 포스트 상세, 추천 영상, 영상 상세, 북마크/시청중/나의 컨텐츠 페이지를 실제 클릭 경로로 확인해야 합니다.

### 3-8. 기본 언어 감지, 사용자 선택 저장, SEO 기준 (2026-05-20 명시)
아래는 현재 코드 기준의 확정 동작입니다.

1. **최초 접속자 기본 언어**
   - 기본값은 `en`입니다 (`src/i18n/config.ts`).
   - 다만 최초 접속 시 `next-intl` 미들웨어의 locale detection이 동작하므로, URL prefix/쿠키가 없으면 브라우저 `accept-language`를 기준으로 매칭 로케일로 리다이렉트될 수 있습니다 (`src/i18n/routing.ts`, `src/middleware.ts`).
   - 즉, 실사용 체감 기준으로는 “브라우저 언어를 따르는 기본 진입”이 맞고, 매칭 실패 시 최종 fallback은 `en`입니다.

2. **언어 선택 저장 위치**
   - 공통: `NEXT_LOCALE` 쿠키 저장.
   - 비로그인 사용자: 쿠키 기반으로 다음 방문 언어 유지.
   - 로그인 사용자: 쿠키 + DB `user.myLanguage` 동시 저장 (`src/app/actions/locale.ts`).
   - 현재 서버 액션에서 `NEXT_LOCALE`을 `maxAge=1년`으로 저장하므로, 사용자가 직접 변경한 언어는 장기 유지됩니다.

3. **현재 SEO 적용 상태**
   - `localePrefix: 'as-needed'`로 기본 언어 URL은 짧게 유지하고, 비기본 언어는 prefix URL을 사용합니다.
   - `[locale]/layout.tsx`에서 `hreflang` alternate link와 `x-default`를 출력합니다.
   - 구글 다국어 SEO의 핵심인 “언어별 alternate(hreflang) 클러스터” 방향과 일치합니다.

4. **Canonical 적용 상태 (2026-05-21 업데이트)**
   - `[locale]/layout.tsx`의 canonical을 루트 고정값에서 상대 canonical(`./`)로 변경했습니다.
   - 이 변경으로 각 페이지 URL 기준 canonical이 생성되며, 기존 hreflang alternate와 충돌 없이 페이지별 canonical이 일관되게 적용됩니다.
   - 운영 점검 기준은 “페이지 canonical URL = 실제 접근 URL(언어 prefix 포함 여부 반영)”입니다.

---

## 4. 프론트엔드 및 플랫폼 UI 구조

- **코어 스택**: Next.js 15 (App Router), React, TypeScript
- **스타일링**: Tailwind CSS, Shadcn UI (Radix 기반)
- **비디오 플레이어**: Cloudflare Stream + Swiper.js를 활용한 세로형 틱톡 스타일 무한 스크롤 인터페이스.
- **PWA (Progressive Web App) 현재 구현 기준 (2026-05-23 업데이트)**:
  - 설정 원본은 `next.config.mjs`, `public/manifest.json`, `src/app/[locale]/layout.tsx`, `src/components/PWAInstallPrompt.tsx`, `src/app/[locale]/~offline/page.tsx`입니다.
  - 설치 조건은 `manifest.json` + `/sw.js` 서비스워커 + `display: standalone` + `scope: "/"` + 192/512 아이콘 조합으로 구성합니다.
  - 개발 모드에서는 기본적으로 PWA가 꺼지며, 필요 시 `NEXT_PUBLIC_PWA_DEV=true pnpm dev`로 켤 수 있습니다. 실제 설치성 검증은 `pnpm build && pnpm start`가 기준입니다.
  - 설치 후 실행 방식은 브라우저 탭이 아니라 standalone 앱 창입니다. 모바일에서는 주소창/브라우저 하단 UI가 사라지므로 `/recommended-videos` 같은 세로 영상 화면에서 사용 가능한 세로 공간이 늘어납니다.
  - PWA 설치 앱으로 실행하면 `PWAEnhancer`가 standalone 상태를 감지하고 `ms_pwa_standalone=1` 쿠키를 설정합니다.
  - PWA 설치 앱에서는 로그인 세션을 90일 기준으로 연장합니다. 일반 웹의 Lucia 기본 세션은 30일 기준입니다.
  - `orientation: "portrait"`와 `viewport-fit=cover`를 사용하고, 설치 앱에서는 가능한 경우 `screen.orientation.lock("portrait")`를 시도합니다.
  - 추천/시청 영상 화면에서는 모든 PWA 설치 앱에서 컨트롤이 숨겨질 때 상단 메뉴도 함께 숨깁니다. 모바일 PWA에서는 safe-area 기반 전체화면형 레이아웃을 추가 적용합니다.
  - 브라우저 저장소도 같은 origin 기준입니다. IndexedDB(`videoDB`)에 저장되는 시청 기록/재생 위치는 웹과 PWA 모두 같은 origin 저장소를 사용합니다.
  - 오프라인 지원은 “전체 콘텐츠 오프라인 재생”이 아닙니다. 네트워크와 캐시가 모두 실패하면 `/ko/~offline` fallback 페이지를 보여주는 수준입니다.
  - 추천 콘텐츠 목록 자체는 `/api/posts/recommended` 또는 서버 렌더링 결과에 의존하므로, 완전 오프라인에서 항상 최신 추천 목록을 보장하지 않습니다.
  - 한 번 로드된 정적 JS/CSS, 일부 페이지 응답, 이미지, API GET 응답은 Workbox 런타임 캐시에 의해 재방문 시 더 빠르게 표시될 수 있습니다.
  - Cloudflare Stream 썸네일은 `StaleWhileRevalidate`로 캐시합니다. 이미 본 썸네일은 다음 진입 시 빠르게 보이고, 백그라운드에서 새 버전을 갱신합니다.
  - Cloudflare Stream HLS manifest(`.m3u8`)는 `NetworkFirst`와 3초 timeout을 사용합니다. 네트워크가 정상일 때는 최신 manifest를 우선 사용하고, 실패 시 캐시가 있으면 보완합니다.
  - Cloudflare Stream 영상 세그먼트/자막 계열(`m4s`, `ts`, `mp4`, `webm`, `vtt`, `webvtt`)은 `CacheFirst`와 Range Requests를 사용합니다. 이미 받아온 일부 구간은 재요청 부담을 줄일 수 있습니다.
  - 추천/시청 영상 페이지는 `preconnect`로 `customer-2cdfxbmja64x0pqo.cloudflarestream.com` 및 `videodelivery.net` 연결 준비를 앞당깁니다. 이는 첫 HLS/썸네일 요청 지연을 줄이기 위한 설정입니다.
  - PWA 설치 앱에서는 다음 영상 썸네일 2개와 다음 HLS 시작 구간을 미리 요청해 전환 지연을 줄입니다.
  - `cacheOnFrontEndNav: true`로 Next 클라이언트 내비게이션 중 필요한 리소스 캐시가 강화됩니다.
  - `skipWaiting: true`, `clientsClaim: true`로 새 서비스워커가 배포 후 더 빨리 활성화됩니다. 다만 이미 브라우저에 오래된 서비스워커가 남아 있으면 수동으로 unregister/cache clear가 필요할 수 있습니다.
  - Vercel 내부 경로(`/_vercel/*`)는 서비스워커가 캐시하지 않고 `NetworkOnly`로 처리합니다. 로컬에서 Vercel Analytics script 404가 서비스워커 실패로 번지는 문제를 피하기 위한 설정입니다.
  - 로컬 개발 환경에서는 Vercel Analytics 컴포넌트를 렌더링하지 않습니다. 운영 빌드에서는 기존처럼 Analytics가 활성화됩니다.
  - manifest shortcut에는 `Recommended Videos`가 등록되어 설치된 앱에서 추천 영상 진입점을 제공할 수 있습니다.
  - PWA 설치 프롬프트 문구와 오프라인 페이지 문구는 `messages/{locale}.json`의 `PWA` 네임스페이스를 사용합니다. 한국어 하드코딩은 사용하지 않습니다.
  - 아이콘 원본은 `public/pwa-192x192.png`, `public/pwa-512x512.png`입니다. 이 파일은 정사각형이어야 하며, 가로 로고를 그대로 넣으면 설치 UI에서 왜곡됩니다.
- **글로벌 UI 표준**:
  - 언어 선택기 등에서 사용하는 국기 아이콘은 시스템 이모지가 아닌 **원형으로 꽉 찬 고화질 SVG 아이콘**을 사용하여 프리미엄 디자인 아이덴티티를 유지합니다.
  - 모든 모달과 바텀시트는 Framer Motion을 활용하여 모바일 앱과 동일한 부드러운 인터랙션을 제공합니다.

---

## 5. 결제 및 정산 아키텍처 (Stripe 도입)

- 기존 하드코딩된 한국 전용 결제 실행부를 걷어내고 글로벌 결제 제공자 연동이 가능한 구조로 전환합니다.
- **다통화(Multi-currency) 정책**: 특정 통화로 정산 기준을 고정하지 않는다. 결제 원장에는 실제 결제 통화와 provider를 보존하고, 정산 워커는 별도 운영 정책으로 산정된 포인트 풀을 기준으로 지급을 계산한다.
- **가격 연동**: 결제 모달에 표시되는 요금은 하드코딩이 아닌, DB(`SystemSettings`)에서 관리자가 설정한 가격을 동적으로 불러와 렌더링합니다.

*(본 문서는 개발 진행 및 아키텍처 확정에 따라 지속해서 내용이 추가됩니다.)*

---

## 6. 영업 자동화 및 Cloudflare 워커 운영 아키텍처

이 섹션은 오늘 확인된 영업팀, 정산, 로그, 배포 구조를 운영/확장 기준으로 정리한 것입니다. 다음 변경부터는 이 문서를 “구현 설명서”가 아니라 “운영 기준서”로 본다는 전제로 읽어야 합니다.

### 6-1. 시스템 역할 분리
- **Next 메인 프로젝트**는 관리자 설정과 화면 제어의 중심입니다. `/admin/agency`에서 팀 타입, 수수료율, 지급 조건을 조정하고, 실제 계산은 Cloudflare 워커에 위임합니다.
- **Cloudflare Worker 체인**은 시청기록 집계와 정산의 실행 엔진입니다. 현재 핵심 흐름은 `viewgroup -> postdata -> viewcountteam -> commission -> cfstats-admin` 순서로 이해하면 됩니다.
- **`referral-structure-worker`**는 추천 구조 동기화, 회원 추가/탈퇴에 따른 상위라인 재배치, D1 `referral_structure` 갱신을 담당합니다.
- **`megashorts-logs`**는 커스텀 로그의 저장/조회 엔진입니다. 애플리케이션 로그는 R2에 저장되고, 일별 압축/정리 작업도 이 워커가 담당합니다.
- **D1 `megashorts-db`**는 집계와 정산의 기준 저장소입니다. `grouped_views`, `post_view_stats`, `referral_structure`, `commission_batch`, `cf_stats`는 이 시스템의 핵심 테이블입니다.
- **Supabase**는 사용자, 결제, 구독, 포인트 반영의 최종 소스입니다. 워커는 여기서 조회하고, 지급 결과를 다시 기록합니다.

### 6-2. 공개 엔드포인트 보호
- 워커의 공개 HTTP 실행 엔드포인트는 지금부터 운영상 “관리자용 내부 API”로 봐야 합니다.
- `viewgroup`, `postdata`, `viewcountteam`, `commission`, `cfstats-admin`, `referral-structure-worker`, `megashorts-logs`는 인증 헤더 없이 실행되면 안 됩니다.
- 인증 기준은 `WORKER_API_KEY` 또는 `CRON_SECRET`입니다.
- 내부 service binding 호출에도 `Authorization: Bearer ...`와 `X-API-Key`를 함께 전달해야 합니다.
- CORS 허용은 제한적이어야 하며, 허용된 origin만 통과시켜야 합니다.
- 이 구조는 비용 절감을 위해 Cloudflare를 쓰는 이유와 직접 연결됩니다. 공개 API를 그대로 열어두면 비용보다 먼저 보안과 정산 무결성이 무너집니다.

### 6-3. 정산 상태값
- `commission_batch.processed = 0`은 미처리 상태입니다.
- `commission_batch.processed = 1`은 실제 Supabase 지급 완료 상태입니다.
- `commission_batch.processed = 2`는 지급 진행 중 또는 청구(claimed) 상태입니다. 중복 지급 방지를 위한 잠금 상태로 취급해야 합니다.
- `commission_batch.processed = 3`은 보류 상태입니다. 계산은 끝났지만 지급 조건이 아직 충족되지 않은 커미션입니다.
- 보류 상태는 실패가 아닙니다. 조건이 맞아지면 다음 실행에서 다시 검사해 누적분을 지급해야 합니다.
- 정산이 끝난 뒤에도 `processed = 2`가 남아 있으면 수동 점검이 필요합니다. Supabase에는 지급됐는데 D1 마감이 남았을 수 있기 때문입니다.

### 6-4. 네트워크와 바이너리의 의미
- **`NETWORK`**는 기본적으로 일반 네트워크 구조입니다. 지급 조건 보류는 기본 비활성화입니다.
- **`BINARY_NETWORK`**는 일반 네트워크와 같은 계산 구조를 공유하되, 직접 하위회원 제한과 지급 조건 기본값이 다릅니다.
- 현재 구현에서 `BINARY_NETWORK`는 전형적인 좌/우 다리 바이너리 보상 모델이 아닙니다.
- 지금의 목표는 “직접 하위 2명 제한 + 조건 달성 전 누적 보류 + 조건 달성 후 지급”입니다.
- 좌/우 다리, 약한 쪽 실적, 양쪽 충족 시 보상 같은 전통적 바이너리 로직이 필요하면 별도 데이터 모델과 계산기가 추가로 필요합니다.
- 관리자 설정에서는 `network.payoutQualification`과 `binaryNetwork.directReferralLimit`을 분리해서 이해해야 합니다. 하나는 지급 조건, 다른 하나는 가입 제한입니다.

### 6-5. 추천 구조와 탈퇴 처리
- 추천 구조는 단순 삭제가 아니라 “상위 추천인 승격”이 핵심입니다.
- 탈퇴 사용자 아래의 직속 하위는 끊지 말고 상위 추천인 또는 팀 마스터 아래로 재배정해야 합니다.
- 이때 D1 `referral_structure`와 Supabase의 `referredBy`가 함께 맞아야 합니다.
- 회원 탈퇴 경로는 이 재배치를 반드시 포함해야 하며, 그렇지 않으면 하위라인과 정산이 서로 어긋납니다.

### 6-6. 로그 시스템
- 커스텀 로그는 지금 구조상 단순 디버그가 아니라 운영 기록 저장소입니다.
- **글로벌 운영 표준**: `saveLogDirectly` 및 `sendLogToWorker`로 저장되는 내부 로그 이벤트 문자열은 모두 간결한 **영어(English)**로 작성되어야 합니다. 이는 다국적 운영팀 환경 및 자동화된 로그 모니터링 시스템(예: Datadog 등) 연동 시 텍스트 파싱 오류를 방지하기 위한 표준입니다 (2026-05-27 적용 완료).
- 로그 저장은 단일 객체와 배열 둘 다 받아야 합니다.
- 로그 조회는 `startDate`와 `endDate`가 필수입니다.
- `type`, `userId`, `country` 필터가 가능해야 운영 시 추적이 수월합니다.
- 브라우저 활동 로거와 관리자 로그 UI는 둘 다 인증 헤더를 포함해야 합니다.
- 로그 워커를 우회해서 브라우저에서 직접 R2를 읽거나 쓰는 구조는 만들지 않는 것이 맞습니다.

### 6-7. 로컬 테스트 함정
- Wrangler 로컬 D1 상태는 워커 config 폴더마다 달라질 수 있습니다.
- 같은 D1 이름을 써도 `-c` 경로와 persistence 경로가 다르면 서로 다른 로컬 DB를 보고 있을 수 있습니다.
- 워커 체인 검증을 할 때는 공유 persistence 경로를 명시해야 거짓 실패와 거짓 성공을 피할 수 있습니다.
- 로컬 검증과 원격 검증은 분리해서 봐야 합니다. 로컬은 코드 검증, 원격은 배포본 검증입니다.

### 6-8. 운영 원칙
- 현재 단계는 운영이 아니라 테스트 단계입니다.
- 하지만 실제 도메인과 같은 Supabase DB를 공유하고 있으므로, 테스트 데이터는 반드시 `codex_agency_test_*` 식별자로 격리해야 합니다.
- 실제 사용자, 실제 포인트, 실제 게시물은 건드리지 않는 것이 원칙입니다.
- Cloudflare config에 평문으로 남아 있는 key는 기능상 동작해도 운영상 바람직하지 않습니다. 최종적으로는 secret으로 옮기고 회전해야 합니다.
- 원격 D1에 이미 핵심 테이블이 존재하는 경우, 무의미한 마이그레이션 재적용은 피해야 합니다.

### 6-9. 2026-05-19 기준 Worker secret 운영 기준
- `wrangler.toml`에는 `API_KEY`, `WORKER_API_KEY`, `CRON_SECRET`, `SUPABASE_SERVICE_ROLE_KEY` 같은 비밀값을 평문으로 두지 않습니다.
- 이 값들은 Cloudflare Worker secret으로 관리합니다.
- `SUPABASE_URL`처럼 주소 성격의 값은 평문 var로 남아 있어도 됩니다.
- secret 전환과 키 회전은 다른 작업입니다.
- secret 전환은 기존 값을 Cloudflare의 숨김 변수로 옮기는 작업입니다.
- 키 회전은 새 키를 발급하고 기존 키를 폐기하는 작업입니다.
- Cloudflare Worker secret으로 옮긴 값도 이미 Git 기록, 로컬 파일, 대시보드 화면 등에 노출된 적이 있다면 장기적으로 새 키로 교체하는 것이 맞습니다.
- 단, Supabase service role key 자체의 재발급과 폐기는 Supabase 대시보드 권한이 필요합니다.

### 6-10. 커스텀 로그 시스템 보안 기준
- 로그 Worker의 관리자 키와 브라우저 쓰기 키는 분리해야 합니다.
- 관리자 키는 `API_KEY`입니다. 이 키는 GET 조회와 POST 저장을 모두 할 수 있으므로 브라우저 번들에 들어가면 안 됩니다.
- 브라우저에서 직접 Cloudflare 로그 Worker로 보내는 키는 `PUBLIC_LOG_WRITE_KEY`입니다.
- `PUBLIC_LOG_WRITE_KEY`는 POST 저장만 허용합니다.
- `PUBLIC_LOG_WRITE_KEY`로 GET 로그 조회를 시도하면 401이어야 합니다.
- 관리자 로그 화면은 브라우저에서 Worker 키를 직접 들고 호출하지 않습니다.
- 관리자 로그 화면은 `/api/admin/service/logs`를 호출하고, Next 서버 API가 Worker 관리자 키를 붙여 로그 Worker에 요청합니다.
- 일반 활동 로그는 `NEXT_PUBLIC_LOG_WRITE_KEY`가 있으면 Cloudflare Worker로 직접 전송합니다.
- `NEXT_PUBLIC_LOG_WRITE_KEY`가 없으면 `/api/logs` 서버 프록시를 통해 전송합니다. 이 fallback은 안전하지만 Vercel 요청량을 늘릴 수 있으므로 운영에서는 `NEXT_PUBLIC_LOG_WRITE_KEY`를 배포 환경에 설정하는 것이 비용 측면에서 낫습니다.

### 6-11. 바이너리 네트워크 지급 조건 해석
- `BINARY_NETWORK`는 새 설정 `network.payoutQualification`이 있으면 그 값을 최우선으로 사용합니다.
- `network.payoutQualification`이 없으면 바이너리 기본값은 `enabled=true`, `memberCount=2`, `countMode=direct`입니다.
- 과거 호환 필드 `network.autoQualification.enabled=false`가 있더라도, 바이너리 기본 조건을 꺼버리는 값으로 해석하지 않습니다.
- 일반 `NETWORK`는 기존 호환성을 위해 `network.payoutQualification`이 없으면 `network.autoQualification`을 참고할 수 있습니다.
- 바이너리 조건은 “팀마스터만 2명 있으면 전체 하위가 지급”이 아니라, 각 커미션 수령자가 자신의 직접 하위 조건을 충족해야 지급되는 방식으로 구현되어 있습니다.
- 조건 미충족 커미션은 `commission_batch.processed=3`으로 보류됩니다.
- 조건 충족 후 같은 날짜 정산을 다시 실행하면 보류 row만 다시 검사해 지급하고, 신규 정산 중복 실행은 차단합니다.

### 6-12. 2026-05-19 원격 검증 요약
- 로그 Worker는 인증 없는 GET 차단, 인증 POST 저장, 인증 GET 조회를 원격에서 확인했습니다.
- 로그 Worker는 쓰기 전용 키 POST 200, 쓰기 전용 키 GET 401, 관리자 키 GET 200을 원격에서 확인했습니다.
- 원격 Worker 체인 `viewgroup -> postdata -> viewcountteam -> commission`은 `2026-06-07` codex 격리 데이터로 success까지 확인했습니다.
- HEADQUARTERS 계열 직접/간접 커미션은 `processed=1` 지급 완료를 확인했습니다.
- 일반 NETWORK 커미션은 `processed=1` 지급 완료를 확인했습니다.
- BINARY_NETWORK는 1차 정산에서 조건 미충족 row가 `processed=3`으로 보류되는 것을 확인했습니다.
- 이후 직접 하위 수를 2명으로 채운 뒤 같은 날짜 정산 재실행으로 보류분이 순차 지급되는 것을 확인했습니다.
- 보류 해제 후 다시 같은 날짜 정산을 실행했을 때 `already_processed`, `payoutAmount=0`으로 중복 지급이 차단되는 것을 확인했습니다.

### 6-13. 폰트 기준
- 영어 locale은 Google `Montserrat`를 사용합니다.
- 중국어 locale은 Google `Noto Sans SC`를 사용합니다.
- 한국어 locale은 기존 로컬 `BMDOHYEON` 폰트를 유지합니다.
- 언어별 body class는 `font-locale-en`, `font-locale-zh`, `font-locale-ko`로 분리합니다.

### 6-14. Vercel/Next 배포 환경변수 기준
- 운영 배포에서 브라우저 활동 로그가 Vercel 서버를 거치지 않고 Cloudflare 로그 Worker로 직접 가려면 Vercel 환경변수에 `NEXT_PUBLIC_LOG_WRITE_KEY`를 반드시 추가해야 합니다.
- 이 값이 없으면 브라우저 활동 로그는 `/api/logs` Next 서버 프록시로 전송됩니다.
- `/api/logs` fallback은 기능적으로는 안전하지만, 로그 요청이 Vercel/Next 서버 함수 요청으로 잡히므로 Vercel 비용 증가 원인이 될 수 있습니다.
- `NEXT_PUBLIC_LOG_WRITE_KEY`가 있으면 브라우저는 `NEXT_PUBLIC_LOGS_WORKER_URL`로 직접 POST를 보내고, Cloudflare Worker가 `PUBLIC_LOG_WRITE_KEY`와 비교해 쓰기만 허용합니다.
- 이 키는 관리자 조회 키가 아닙니다. 이 키로는 로그 POST 저장만 가능해야 하고, GET 조회는 401이어야 합니다.

#### Vercel에 추가해야 하는 값
- Vercel 환경변수 이름: `NEXT_PUBLIC_LOG_WRITE_KEY`
- 가져올 위치: 로컬 프로젝트 루트의 `.env` 파일.
- 가져올 값: `.env` 안의 `NEXT_PUBLIC_LOG_WRITE_KEY=...` 오른쪽 전체 문자열.
- 현재 로컬 `.env`에는 이 값이 이미 생성되어 있습니다.
- 이 값은 Cloudflare 로그 Worker secret인 `PUBLIC_LOG_WRITE_KEY`와 반드시 같아야 합니다.
- Cloudflare 쪽 값은 `wrangler secret put PUBLIC_LOG_WRITE_KEY --config msworker/wrangler.toml`로 등록한 값입니다.

#### Vercel 대시보드 입력 위치
- Vercel Dashboard에 로그인합니다.
- MegaShorts Next 프로젝트로 들어갑니다.
- `Settings` 메뉴를 엽니다.
- `Environment Variables` 메뉴로 들어갑니다.
- 새 변수로 `NEXT_PUBLIC_LOG_WRITE_KEY`를 추가합니다.
- 값은 로컬 `.env`의 `NEXT_PUBLIC_LOG_WRITE_KEY` 값을 그대로 붙여 넣습니다.
- 적용 범위는 최소 `Production`에 포함해야 합니다.
- 실제 도메인 테스트도 같은 배포본으로 확인하려면 `Preview`에도 같은 값을 넣어도 됩니다.
- 저장 후 Next 프로젝트를 재배포해야 브라우저 번들에 반영됩니다.

#### 같이 확인하면 좋은 값
- `NEXT_PUBLIC_LOGS_WORKER_URL`도 Vercel 환경변수에 있어야 합니다.
- 현재 로컬 기준 값은 `https://megashorts-logs.msdevcm.workers.dev`입니다.

### 6-15. 시청/통계/로그 시간대 기준 (2026-05-21 업데이트)
1. **단일 기준값 (Single Source of Truth)**
   - 시간대 기준은 관리자 시스템 설정 `analyticsTimeZone` 1개만 사용합니다.
   - 기본값은 `Asia/Seoul`이며, 현재 지원값은 `UTC`, `Asia/Seoul`, `Asia/Shanghai`, `Asia/Tokyo`, `Asia/Singapore`입니다.
   - 값은 `/admin/system`에서 변경하고 DB(`systemSetting`)에 저장됩니다.

2. **Next/Worker 적용 방식**
   - 관리자 로그 UI(`LogsClient`)는 `/api/admin/settings`에서 `analyticsTimeZone`을 읽어 날짜 경계 계산, 로그 표/모달 표시, API 요청 파라미터에 동일하게 사용합니다.
   - `/api/admin/service/logs`는 `timezone` 파라미터가 없으면 DB 설정값을 자동 주입하고, 잘못된 값은 `UTC`로 정규화합니다.
   - 로그 Worker(`msworker/src/index.ts`)는 `timezone`을 받아 조회 경계(시작일/종료일)를 UTC로 환산해 필터링합니다.

3. **누락 방지 기준**
   - 로그 본문 `timestamp`는 UTC ISO로 저장하고, 조회 시에는 선택 시간대를 UTC 경계로 변환해서 필터합니다.
   - R2 저장 파티션 시간대와 조회 시간대가 달라도 최종 필터가 `timestamp` 기준으로 동작하므로 누락/중복 위험을 낮춥니다.
   - 운영에서 누락을 막는 핵심은 “모든 경계 계산을 `analyticsTimeZone` 하나로 강제”하는 것입니다.

4. **운영 확인 방법**
   - `/admin/system`에서 시간대를 바꾼 뒤 `/admin/service` 로그 조회 시 헤더 타임존 배지와 날짜 경계가 즉시 바뀌는지 확인합니다.
   - 같은 UTC timestamp 로그가 시간대 변경에 따라 다른 로컬 시각으로 표시되는지 확인합니다.
   - Worker GET 요청 URL에 `timezone`이 포함되는지 네트워크 탭으로 확인합니다.
- 서버 관리자 로그 조회용으로는 가능하면 `WORKER_API_KEY`를 Vercel의 비공개 환경변수로 추가하는 것이 좋습니다.
- 현재 코드는 호환을 위해 `WORKER_API_KEY`가 없으면 `NEXT_PUBLIC_WORKER_API_KEY`도 읽지만, 관리자 조회 키는 장기적으로 `NEXT_PUBLIC_` 없이 서버 전용 변수로 두는 것이 맞습니다.

#### 배포 후 확인 방법
- 브라우저 개발자 도구 Network 탭에서 활동 로그 요청이 `/api/logs`가 아니라 `https://megashorts-logs.msdevcm.workers.dev`로 가는지 확인합니다.
- Cloudflare 로그 Worker에 POST가 200으로 성공하는지 확인합니다.
- 같은 `NEXT_PUBLIC_LOG_WRITE_KEY`로 GET 조회를 시도하면 401이어야 합니다.
- 관리자 로그 화면은 `/api/admin/service/logs`를 호출해야 하며, 브라우저가 관리자 Worker 키를 직접 들고 있으면 안 됩니다.

### 6-16. ANALYTICS_TIME_ZONE 하드코드 제거 완료 범위 (2026-05-21)
아래 항목은 “일부”가 아니라 현재 워커 체인 전체에 동일 기준을 적용한 완료 상태입니다.

1. **Next 기준값**
   - 관리자 설정 키: `analyticsTimeZone`
   - 저장 위치: `systemSetting` 테이블
   - 관리 화면: `/admin/system`
   - 적용 파일: `src/lib/analytics-timezone.ts`, `src/lib/analytics-timezone-server.ts`, `src/app/api/admin/service/logs/route.ts`, `src/app/[locale]/(main)/admin/service/components/LogsClient.tsx`, `src/app/[locale]/(main)/admin/service/components/LogModal.tsx`

2. **Next -> Cloudflare 환경변수 반영 키**
   - 매핑 키: `SYSTEM_ANALYTICSTIMEZONE`
   - 적용 파일: `src/app/api/admin/settings/apply/route.ts`
   - 의미: 관리자에서 저장한 시간대를 Cloudflare Worker 환경변수로 일괄 반영하기 위한 표준 키

3. **Worker 기본값 (배포 누락 방지)**
   - 모든 워커 `wrangler.toml`에 `ANALYTICS_TIME_ZONE = "Asia/Seoul"`를 기본값으로 명시 완료
   - 기본값의 역할: 신규 배포/신규 워커 추가 시 환경변수 누락으로 인한 시간대 불일치 방지

4. **기본값 적용 완료 파일 목록 (12개)**
   - `msworker/wrangler.toml`
   - `msworker/src/dailywork/workers/cfstats-admin/wrangler.toml`
   - `msworker/src/dailywork/workers/cfstats-creator/wrangler.toml`
   - `msworker/src/dailywork/workers/commission/wrangler.toml`
   - `msworker/src/dailywork/workers/payments-collector-worker/wrangler.toml`
   - `msworker/src/dailywork/workers/postdata/wrangler.toml`
   - `msworker/src/dailywork/workers/referral-structure-worker/wrangler.toml`
   - `msworker/src/dailywork/workers/system-settings/wrangler.toml`
   - `msworker/src/dailywork/workers/team-master-settings/wrangler.toml`
   - `msworker/src/dailywork/workers/viewcountteam/wrangler.toml`
   - `msworker/src/dailywork/workers/viewgroup/wrangler.toml`
   - `msworker/src/dailywork/workers/workersmanager/wrangler.toml`

5. **체인 전파 강제**
   - `viewgroup -> postdata -> viewcountteam -> commission -> cfstats-admin` 호출 경로에서 `timezone` 파라미터를 전달하도록 통일
   - 공유 유틸 `msworker/src/dailywork/shared/timezone.ts`로 normalize/resolve를 공통 처리

6. **운영자가 실제로 맞추는 위치**
   - Next 관리자 UI: `/admin/system`의 `analyticsTimeZone` 선택
   - Cloudflare 실제 런타임 값: 각 워커 Environment Variables의 `ANALYTICS_TIME_ZONE`
   - 배포 기본 안전값: 각 워커 `wrangler.toml`의 `ANALYTICS_TIME_ZONE = "Asia/Seoul"`
   - 운영 원칙: 관리자값과 Cloudflare 값이 같아야 경계 계산(일/주/월)이 완전히 일치

7. **값이 불일치하면 생기는 현상**
   - 로그 표시 시간과 워커 집계 경계가 달라질 수 있음
   - 같은 UTC timestamp가 화면/정산에서 다른 날짜로 분류될 수 있음
   - 즉, 누락처럼 보이거나 중복처럼 보이는 집계 오해가 생길 수 있음

8. **검증 커맨드 (로컬 기준)**
   - `find msworker -name 'wrangler.toml' -print0 | xargs -0 -I{} sh -c 'rg -q \"ANALYTICS_TIME_ZONE\" \"{}\" && echo \"OK {}\" || echo \"MISS {}\"'`
   - 위 검증 기준에서 `MISS`가 1개라도 나오면 배포 전 수정이 필요

---

## 7. 포인트, 커미션, 통계 아키텍처

이 섹션은 현재 구현된 포인트 지급, 영업 커미션, 크리에이터 수익, 관리자 통계의 실제 데이터 흐름을 기록합니다. 핵심 원칙은 하나입니다. 계산은 Cloudflare Worker와 D1에서 하고, 확정 결과는 R2 스냅샷으로 남기며, Next는 조회와 지급 상태만 담당합니다.

### 7-1. 시스템별 책임
- Next 메인 앱은 사용자 화면, 신청/조회, 관리자 대시보드, 최종 지급 상태 저장을 담당합니다.
- `commission-worker`는 크리에이터와 영업팀 커미션 계산, 주차별 정산 요약 생성을 담당합니다.
- `cfstats-admin`은 Cloudflare 접속 통계 집계와 일/주/월 스냅샷 생성을 담당합니다.
- D1은 계산 원장과 중간 집계 저장소입니다.
- R2는 확정된 정산 스냅샷 저장소입니다.
- Postgres는 잔액, 신청, 승인, 사용자 프로필 같은 서비스 상태 저장소입니다.

### 7-2. 커미션 계산 기준
- 크리에이터 커미션의 원천은 `grouped_views`, `post_view_stats`, `cf_stats`, `commission_batch`, `referral_structure`입니다.
- 영업팀 커미션의 원천은 추천 구조와 팀 단위 시청 집계입니다.
- 계산 단위는 기본적으로 일별 수집, 주차별 정산입니다.
- 주차 키는 `targetDate`를 기준으로 만들며, 현재 구현에서는 해당 주의 종료일을 스냅샷 키로 사용합니다.
- 보류가 필요한 커미션은 바로 지급하지 않고 `commission_batch.processed = 3`으로 남깁니다.
- 지급 완료된 배치는 `commission_batch.processed = 1`입니다.
- 지급 진행 중 또는 잠금 상태는 `commission_batch.processed = 2`로 취급합니다.

### 7-3. 지급 대상과 지급 근거
- 크리에이터 지급 대상은 업로드 가능 사용자 또는 운영팀 이상입니다.
- 영업팀 지급 대상은 영업팀 구성원 또는 운영팀 이상입니다.
- 지급이나 신청 전에 다음 조건을 함께 확인합니다.
- `users.emailVerified = true`
- `creator_info` 또는 은행 정보가 등록되어 있을 것
- `idCheck = true`
- 잔액 또는 지급 대상 포인트가 신청/정산 금액을 충족할 것
- 영업팀은 팀 마스터 구조와 추천 구조를 기준으로 묶어서 계산합니다.

### 7-4. 계산 후 저장 위치
- `commission-worker`는 계산 결과를 D1 `cf_stats.commission_data`에 저장합니다.
- 같은 결과를 R2 `commission-summaries/weekly/{date}.json`에도 저장합니다.
- `cfstats-admin`은 Cloudflare 통계 결과를 D1 `cf_stats`에 저장합니다.
- 같은 결과를 R2 `cf-stats/{period}/{date}.json`에도 저장합니다.
- `pointDistribution_*` 같은 관리자 분배 기록은 Next 쪽 `system_settings`에 남겨 조회합니다.
- 실제 사용자 잔액은 Postgres `users.points`에 반영합니다.
- 출금 신청과 승인 기록은 Postgres `point_withdrawals`에 남깁니다.

### 7-5. 조회 우선순위
- Next 통계 API는 다음 순서로 값을 가져옵니다.
- 1) 워커 read API 호출
- 2) R2 스냅샷 읽기
- 3) D1 원장 조회
- 4) Postgres fallback 집계
- 이 순서를 둔 이유는 비용과 응답 안정성 때문입니다. 이미 계산된 결과를 다시 Postgres에서 재계산하지 않기 위함입니다.

### 7-6. 실제 API 흐름
- 크리에이터 수익은 `/api/stats/uploader`를 사용합니다.
- 이 API는 Postgres fallback 통계와 `commission-worker /summary` 결과를 합칩니다.
- 주차별 상세 조회는 `/api/stats/weekly?type=uploader`를 사용합니다.
- 영업팀 수익은 `/api/stats/agency`를 사용합니다.
- 이 API는 Postgres fallback과 `commission-worker /summary` 결과를 합칩니다.
- 영업팀 페이지에는 글로벌 접속자 지도를 노출하지 않습니다.
- 주차별 상세 조회는 `/api/stats/weekly?type=agency`를 사용합니다.
- 관리자 전체 통계는 `/api/stats/admin`을 사용합니다.
- 이 API는 플랫폼 전체 회원, 콘텐츠, 결제, 포인트, 인기 항목을 반환하고 커미션 요약도 함께 포함합니다.
- 글로벌 접속자 지도는 `/api/stats/cloudflare`를 사용합니다.
- 이 API는 `cfstats-admin /stats`를 먼저 읽고, 없으면 D1 `cf_stats`를 읽습니다.
- 선택한 기간에 맞춰 `viewerDistribution`을 반환합니다.

### 7-7. 역할별 화면 노출
- `/ko/usermenu/earnings`
  - 크리에이터 또는 운영팀 이상에게 노출됩니다.
  - 크리에이터 수익, 주차별 정산, 포인트 신청 탭을 포함합니다.
  - Cloudflare 기반 글로벌 지도도 표시합니다.
- `/ko/usermenu/agency-earnings`
  - 영업팀 또는 운영팀 이상에게 노출됩니다.
  - 크리에이터와 유사한 수익 탭 구조를 사용하지만 글로벌 지도는 숨깁니다.
- `/ko/admin/agency`
  - 영업팀 설정, 조회, 팀마스터 설정 탭으로 구성됩니다.
  - 추천인 구조는 최초 1단계만 불러오고 `+` 확장으로 다음 단계만 추가 조회합니다.
- `/ko/admin/system`
  - 플랫폼 전체 통계와 글로벌 지도를 포함합니다.

### 7-8. 포인트 신청과 지급 흐름
- 포인트 신청은 사용자가 신청 금액을 입력하면 시작됩니다.
- 신청 전 서버는 이메일 인증, 은행/신분 정보, 잔액을 다시 검증합니다.
- 조건이 충족되면 신청은 `point_withdrawals`에 `PENDING`으로 저장됩니다.
- 관리자가 승인하면 실 지급 상태로 바뀌고, 사용자 `users.points`가 차감되거나 정산 기록이 갱신됩니다.
- 알림은 notifications 또는 텔레그램 연동 흐름으로 보냅니다.

### 7-9. Cloudflare 통계 기간 로직
- 현재 구현은 `current`, `daily`, `weekly`, `monthly`를 같은 조회 경로로 처리할 수 있습니다.
- 크리에이터와 관리자 화면은 선택한 주차나 기간을 그대로 워커에 전달합니다.
- 그래서 주차별 정산 화면과 Cloudflare 지도 화면의 기간이 서로 어긋나지 않습니다.

### 7-10. 설계 판단
- Postgres에 모든 통계 요약을 동기화하는 방식은 가장 단순하지만 비용 대비 효율이 낮습니다.
- 이유는 이미 워커가 계산한 데이터를 다시 Postgres에 복사하고, 다시 읽는 중복이 생기기 때문입니다.
- 현재 구조는 다음 기준으로 정리하는 것이 가장 안정적입니다.
- D1: 계산 가능한 원장
- R2: 확정 스냅샷
- Postgres: 서비스 상태
- Next: 화면과 승인 로직

### 7-11. 운영자가 기억해야 할 파일
- 현재 운영/검증 설명서: [docs/STATS_E2E_VERIFICATION_20260525.md](/Users/tigerk/Desktop/megas/docs/STATS_E2E_VERIFICATION_20260525.md)
- 워커 계산: [msworker/src/dailywork/workers/commission/collector.ts](/Users/tigerk/Desktop/megas/msworker/src/dailywork/workers/commission/collector.ts)
- 워커 정산 API: [msworker/src/dailywork/workers/commission/index.ts](/Users/tigerk/Desktop/megas/msworker/src/dailywork/workers/commission/index.ts)
- Cloudflare 통계 워커: [msworker/src/dailywork/workers/cfstats-admin/index.ts](/Users/tigerk/Desktop/megas/msworker/src/dailywork/workers/cfstats-admin/index.ts)
- Next 통계 API: [src/app/api/stats](/Users/tigerk/Desktop/megas/src/app/api/stats)
- 통계 조회 헬퍼: [src/lib/stats-queries.ts](/Users/tigerk/Desktop/megas/src/lib/stats-queries.ts)

## 8. 공유용 검증 및 정리 절차

이 섹션은 운영자가 다른 사람에게 테스트 결과를 보여주거나, 다시 같은 검증을 반복할 때 따라야 하는 절차입니다.

### 8-1. 검증 스크립트의 역할
- [scripts/agency-e2e-fixture.mjs](/Users/tigerk/Desktop/megas/scripts/agency-e2e-fixture.mjs)는 공유용 검증 자동화 스크립트입니다.
- 이 스크립트는 `setup -> trigger -> verify -> report` 순서로 실행됩니다.
- 필요하면 마지막에 `cleanup`을 수행해 테스트 계정과 테스트 데이터만 정리합니다.
- 최신 검증 기준 run은 `20260519060836`이고, 보고서는 [docs/STATS_E2E_VERIFICATION_20260525.md](/Users/tigerk/Desktop/megas/docs/STATS_E2E_VERIFICATION_20260525.md)입니다.

### 8-2. 검증 데이터 생성 흐름
- `setup` 단계에서 관리자 1명, 크리에이터 3명, 영업팀 3개를 생성합니다.
- 모든 테스트 계정은 동일한 비밀번호를 사용합니다.
- 충돌 방지를 위해 `runId`마다 고유한 미래 정산일을 잡습니다.
- 포스트와 원본 시청 기록은 Postgres에 생성합니다.
- 은행 정보, 이메일 인증, 신분 확인 상태도 테스트용으로 함께 채웁니다.

### 8-3. 워커 실행 순서
- `referral-structure-worker`로 추천 구조를 먼저 동기화합니다.
- `viewgroup` 워커가 `video_views`를 읽고 D1 `grouped_views`를 만듭니다.
- `commission` 워커가 `grouped_views`를 읽고 D1 `commission_batch`를 만듭니다.
- 지급 가능한 행은 Postgres `users.points`에 반영됩니다.
- `cfstats-admin` 워커가 Cloudflare 지도 통계와 요약값을 읽습니다.
- 최종적으로 보고서가 Markdown으로 저장됩니다.

### 8-4. 보고서가 설명하는 내용
- 어떤 계정이 어떤 역할로 생성되었는지
- 어떤 시청 기록이 어떤 크리에이터와 어떤 팀으로 연결되었는지
- 어떤 커미션이 어떤 기준으로 계산되었는지
- 어떤 계정이 실제 포인트를 받았는지
- 어떤 계정이 지급 신청을 했고 승인되었는지
- 어떤 기간의 Cloudflare 국가별 데이터가 화면에 쓰이는지
- 어떤 URL에서 직접 같은 데이터를 조회할 수 있는지

### 8-5. 안전한 정리 기준
- 예전에는 날짜 전체를 지우는 방식이 위험할 수 있었습니다.
- 지금은 `runId`를 기준으로 테스트 사용자, 테스트 포스트, 테스트 시청 기록, 테스트 지급 신청만 지웁니다.
- D1도 `runId`가 들어간 행만 삭제합니다.
- Cloudflare 통계는 이 스크립트가 만든 미래 검증 날짜일 때만 지웁니다.
- 실사용 데이터와 충돌하지 않도록 테스트 식별자는 항상 `codex_agency_test_*` 접두어를 씁니다.

### 8-6. 화면 확인 기준
- 크리에이터 확인은 `/ko/usermenu/earnings?tab=statistics&period=2042-W24&unit=weekly`
- 영업팀 확인은 `/ko/usermenu/agency-earnings?tab=statistics&period=2042-W24&unit=weekly`
- 관리자 확인은 `/ko/admin/system?tab=stats&period=2042-W24&unit=weekly`
- 조직도와 설정은 `/ko/admin/agency`
- 같은 기간 키를 화면과 API에 같이 넣어야 조회 결과가 어긋나지 않습니다.

---

## 9. 2026-05-20 UI 및 MCP 운영 업데이트

### 9-1. Post Modal 반응형 구조 기준 (중요)
- 대상 컴포넌트: `src/components/posts/PostModal.tsx`
- 기존에는 `window.innerWidth/innerHeight` 기반으로 모바일/데스크톱 렌더 경로가 갈렸고, 좁은 화면에서 정보영역 잘림이 발생했습니다.
- 현재는 **단일 반응형 모달 레이아웃**으로 통합했습니다.
- 모달 컨테이너는 `max-h-[92dvh]` + `flex-col` 구조이며, 상단은 2:3 비율 프리뷰 영역, 하단은 `overflow-y-auto` 정보영역입니다.
- 화면이 줄어들면 영상은 비율(2:3) 유지 상태로 축소되고, 정보영역은 스크롤로 모든 정보를 유지합니다.
- 영상 미리보기 오프셋(`translate-x`, 상단 패딩) 제거로 프레임 잘림/치우침을 줄였습니다.

### 9-2. 모달 메타라인 표기 규칙
- 포스트 모달의 연령 배지 우측 메타라인은 다음 순서로 표기합니다.
  - `N개의 동영상 - [영상언어국기] / [자막지원국기 ...]`
- 영상 언어는 `post.postLanguage`, 자막 언어는 `post.videos[0].subtitle` 기준입니다.
- 국기 이모지 baseline 차이로 인한 시각적 들뜸은 `top-[1px]` 보정 클래스로 정렬합니다.

### 9-3. MCP 실사용 설정 위치 기준
- 프로젝트 루트 `.mcp.json`은 참고용으로 유지할 수 있으나, 현재 Codex 런타임에서 실제 인식 핵심은 `~/.codex/config.toml`의 `[mcp_servers.*]`입니다.
- 2026-05-20 기준 등록:
  - `cloudflare-api = https://mcp.cloudflare.com/mcp`
  - `vercel = https://mcp.vercel.com`
  - `supabase = https://mcp.supabase.com/mcp`
- 신규 MCP 서버 추가 후에는 세션 재시작이 필요할 수 있습니다(런타임 hot-reload 미보장).
- Cloudflare MCP는 initialize 단계에서 `Auth required`가 나올 수 있으므로, 재시작 후 각 MCP 인증 절차를 수행해야 실제 조회/조치가 가능합니다.

---

## 10. 2026-05-21 운영 동기화 업데이트

### 10-1. 시간대 운영 설정의 실제 변경 위치 (운영자용 확정본)
- 실제 운영에서 맞춰야 하는 곳은 아래 2개입니다.
  - Next 관리자: `/admin/system`의 `analyticsTimeZone`
  - Cloudflare Worker env: `ANALYTICS_TIME_ZONE`
- 코드 파일 수정이 많이 있었던 이유는, 위 2개 설정이 체인 전체에 누락 없이 전파되도록 기존 하드코드를 제거하는 1회성 마이그레이션이 포함됐기 때문입니다.
- 신규 배포 누락 방지 기준은 `wrangler.toml` 기본값 고정입니다.
  - 예: `msworker/wrangler.toml`
  - 예: `msworker/src/dailywork/workers/commission/wrangler.toml`
  - 예: `msworker/src/dailywork/workers/cfstats-admin/wrangler.toml`

### 10-2. 시간대 기본값 검증 결과 (ops-doc-sync 실행)
- 실행 일시: 2026-05-21
- 실행 커맨드:
  - `bash /Users/tigerk/.codex/skills/ops-doc-sync/scripts/check_timezone_defaults.sh`
- 결과:
  - PASS
  - 워커 `wrangler.toml` 12개 모두 `ANALYTICS_TIME_ZONE` 선언 확인

### 10-3. 시청→정산→통계 공유용 요약본 추가
- 공유용 핵심 문서:
  - [STATS_E2E_VERIFICATION_20260525.md](/Users/tigerk/Desktop/megas/docs/STATS_E2E_VERIFICATION_20260525.md)
  - `.tmp/agency-e2e-20260519060836.json`
- 이번 기준 run:
  - 실행 ID: `20260519060836`
  - 정산 기준일: `2042-06-08`
  - 주차키: `2042-W23`
  - 테스트 시청기록: 총 `15`건 (`COIN 9`, `SUBSCRIPTION 6`)
  - D1 `commission_batch`: 총 `26`건 (`processed=1` 22건, `processed=3` 4건)

### 10-4. 프로필/언어 UI 공통화 기준
- 공통 국기 표시 컴포넌트: `src/components/LanguageFlag.tsx`
- 공통 SVG 자산:
  - `public/flags/ko.svg`
  - `public/flags/en.svg`
  - `public/flags/zh.svg`
- 적용 범위:
  - 상단 언어 스위처(`LocaleSwitcher`)
  - 프로필 페이지/프로필 수정 모달
  - 포스트 작성/편집 언어 선택
  - 공지/포스트 언어 표시 등 다국어 UI 전반
- 프로필 페이지 정보 블록은 좌/우 3줄 정렬 기준으로 재정리했습니다.
  - 좌측 `Account Info`: 가입일, 이메일(가입방식 포함), 언어
  - 우측 `Status`: 코인, 성인인증(버튼 동일 줄), 구독 상태

---

## 11. 랜딩/카테고리 캐시 및 재생성 전략 (초보자용, 2026-05-28 확인본)

이 섹션은 “포스트를 만들거나 수정/삭제했을 때 랜딩, 카테고리, 최근, 추천 페이지가 어떻게 빠르게 반영되는가”를 운영 관점에서 쉽게 설명한 기준입니다.

### 11-1. 먼저 결론: 랜딩 홈과 나머지 목록 페이지의 전략을 분리
- 랜딩 홈(`/`, `/ko`, `/zh`)은 2026-05-28부터 request-time 렌더링으로 운영합니다.
  - 구현 위치: `src/app/[locale]/(main)/page.tsx`
  - 현재 설정: `dynamic = 'force-dynamic'`, `revalidate = 0`
  - 데이터 위치: `src/components/MainContent.tsx`
  - 현재 설정: `unstable_noStore()` 호출 후 `main_sliders`, 최신/인기/추천/카테고리 슬라이더 포스트를 Prisma로 직접 조회
- 카테고리/최근/추천 페이지는 기존처럼 `unstable_cache` + on-demand 무효화 구조를 유지합니다.
  - 카테고리: `src/app/[locale]/(main)/(static)/categories/[category]/page.tsx`
  - 복합 카테고리: `src/app/[locale]/(main)/(static)/categories/combined/[encodedCategories]/page.tsx`
  - 최근: `src/app/[locale]/(main)/(static)/categories/recent/page.tsx`
  - 추천: `src/app/[locale]/(main)/recommended-videos/page.tsx`
- 의미:
  - 랜딩 홈은 프리뷰/운영에서 샘플 포스트나 슬라이더 변경이 오래된 서버 캐시에 묶이지 않도록 매 요청 최신 DB 상태를 읽습니다.
  - 나머지 목록 페이지는 평소 캐시 성능을 유지하고, 포스트 변경 시 필요한 캐시만 무효화합니다.

### 11-2. 왜 이렇게 바꿨는가
- 2026-05-28 프리뷰에서 영어 랜딩(`/en` -> `/`)이 한국어/중국어 랜딩과 다르게 오래된 슬라이더 데이터를 보여주는 문제가 확인되었습니다.
- 실제 원인은 콘텐츠 언어 필터가 아니라 랜딩 홈의 무기한 서버 캐시와 기존 브라우저 서비스워커 캐시가 최신 DB 상태 확인을 방해할 수 있는 구조였습니다.
- 따라서 가장 변경 빈도가 높고 운영자가 즉시 확인해야 하는 랜딩 홈만 동적 조회로 전환했습니다.
- 카테고리/최근/추천/상세 등은 기존 on-demand 무효화 구조가 유지되므로, 전체 사이트의 정적 자원 로딩 최적화와 목록 페이지 캐시 전략은 그대로 유지됩니다.

### 11-3. 실제 캐시 구조 (핵심만)
- 랜딩 홈 메인 콘텐츠:
  - `src/components/MainContent.tsx`에서 `unstable_cache`를 사용하지 않습니다.
  - `noStore()`로 요청 단위 DB 조회를 강제합니다.
  - 대상 데이터는 `systemSetting.key = 'main_sliders'`와 포스트 슬라이더 조회입니다.
  - 관리자 수동 고정 포스트는 `FILTER_BY_SELECTED_LANGUAGE` 정책에서 선택 언어 필터로 모두 제외되더라도 fallback 조회로 유지됩니다.
- 카테고리/최근/추천 페이지:
  - 기존처럼 `unstable_cache`와 태그 기반 무효화를 사용합니다.
  - 주요 태그: `content:home`, `content:recent`, `content:recommended`, `content:categories`, `content:sliders`, `content:settings`, `content:locale:*`, `content:category:*`
- 정적 자원:
  - Next 정적 JS/CSS chunk, 이미지, Cloudflare Stream 썸네일/HLS 캐시 정책은 이 변경의 대상이 아닙니다.
  - 홈 HTML/홈 데이터 조회만 동적화한 것이며, 전체 정적 자원 최적화를 끈 것이 아닙니다.

### 11-4. 포스트 생성/수정/삭제 시 반영 흐름

1. **포스트 생성/수정**
- 서버 액션 `submitPost` 완료 후, 결과 상태가 `PUBLISHED`면 `invalidatePostContent()`를 호출합니다.
- 위치: `src/components/posts/editor/actions.ts`
- 효과:
  - 태그 무효화: 홈/최근/추천/카테고리/포스트/로케일/카테고리별 태그
  - 경로 무효화: `/`, `/categories/recent`, `/recommended-videos`, `/posts/{id}`, 각 카테고리 페이지, 복합 카테고리 페이지(그리고 각 로케일 경로)

2. **포스트 삭제**
- 서버 액션 `deletePost` 완료 후, 삭제된 포스트가 `PUBLISHED`였으면 동일하게 `invalidatePostContent()`를 호출합니다.
- 위치: `src/components/posts/actions.ts`
- 효과:
  - 랜딩 슬라이더, 카테고리 페이지, 최근/추천 페이지, 상세 페이지에서 삭제 결과가 반영되도록 캐시를 무효화합니다.

3. **공통 무효화 함수**
- 구현 위치: `src/lib/content-revalidation.ts`
- `invalidatePostContent()`가 태그(`revalidateTag`)와 경로(`revalidatePath`)를 함께 처리합니다.
- 설계 포인트:
  - 태그 무효화: 같은 데이터 소스를 쓰는 여러 화면을 한번에 정리
  - 경로 무효화: 실제 사용자 URL을 즉시 새로 생성하도록 강제

### 11-5. 관리자 수동 갱신 경로
- 운영 중 필요하면 관리자 권한으로 수동 무효화도 가능합니다.
  - API: `POST /api/revalidate` (`src/app/api/revalidate/route.ts`)
  - 슬라이더 설정 변경: `POST /api/admin/slider-settings` (`src/app/api/admin/slider-settings/route.ts`)
- 슬라이더 설정 저장 시에는 홈/최근/추천 태그 무효화 + 영향 카테고리 경로 재생성까지 함께 수행합니다.

### 11-6. 정리 (운영자가 기억할 한 줄)
- **랜딩 홈은 즉시성 우선으로 매 요청 DB 조회, 카테고리/최근/추천은 성능 우선으로 캐시 + on-demand 무효화입니다.**
- 따라서 영어 랜딩의 최신 샘플 포스트 반영 문제는 홈 캐시 stale 문제로 해결했고, 포스트 생성/수정/삭제 반영을 위한 기존 무효화 경로는 그대로 유지됩니다.

### 11-7. 상태 전환 보강 완료 (2026-05-22)
- `submitPost`는 이제 **신규 상태가 `PUBLISHED`인 경우뿐 아니라, 이전 상태가 `PUBLISHED`였던 경우(`PUBLISHED -> DRAFT`)도 무효화**합니다.
- 구현 파일: `src/components/posts/editor/actions.ts`
- 추가 보강:
  - 무효화 카테고리는 `이전 categories + 현재 categories`의 합집합으로 처리합니다.
  - 따라서 카테고리 변경(예: A -> B) 시에도 A/B 양쪽 관련 페이지 캐시가 함께 갱신됩니다.

### 11-7-1. 프리뷰 PWA 캐시 격리 기준 (2026-05-28)
- Vercel Preview 환경에서는 PWA를 생성하지 않습니다.
  - 구현 위치: `next.config.mjs`
  - 기준: `process.env.VERCEL_ENV === "preview"`이면 `withPWA({ disable: true })`
- 이미 과거에 `preview.megashorts.com`에서 설치/등록된 서비스워커는 프리뷰 호스트에서만 정리합니다.
  - 구현 위치: `src/components/PWAEnhancer.tsx`
  - 기준: `window.location.hostname === "preview.megashorts.com"`일 때만 `navigator.serviceWorker.getRegistrations().unregister()`
- 이 조치는 프리뷰 검증 정확도를 위한 격리입니다. 운영 도메인의 PWA 설치, 세션 연장, Workbox runtime cache 정책은 변경하지 않습니다.
- `/en` 접속이 `/`로 보이는 것은 `next-intl`의 `localePrefix: 'as-needed'` 정책 때문입니다. 기본 언어 영어는 prefix 없는 URL이 canonical이며, `NEXT_LOCALE=en` 쿠키와 `<html lang="en">`로 영어 상태가 유지됩니다.

### 11-8. E2E 영업팀 통계 화면 검증 기준 (2026-05-22)
- 영업팀 검증은 목적에 따라 화면을 구분해서 봐야 합니다.
1. **영업자(팀마스터) 본인 지급/통계 확인**
   - 경로: `/ko/usermenu/agency-earnings?tab=statistics&period=2042-W23`
   - 확인: 상단 `Points`, 하단 `Settlement Lookup`의 `Settlement Points`
2. **운영자 Lookup 검증**
   - 경로: `/ko/admin/agency?tab=search`
   - `Point Distribution` 탭: `Year=2042`, `Week=23` 입력 후 `Lookup`으로 분배기록/상세(`masterId`, `commissionRate`, `amount`) 확인
   - `Statistics` 탭: `Weekly Report` 선택 조회로 팀 구성/포인트 시계열 확인
- 주의:
  - `admin/agency > Statistics`는 `userId` 기반 통계 화면이며, 고정 주차키(`2042-W23`)를 직접 조회하는 단일 기준 화면이 아닙니다.
  - 고정 주차 검증의 기준 화면은 `Point Distribution(2042, 23)`이며, 최종 수치는 `/api/stats/agency`, `/api/stats/weekly?type=agency`로 교차검증합니다.

---

## 12. PWA 설치 앱 최적화 기준 (2026-05-23)

### 12-1. 적용 범위
- PWA 설치 앱에서만 강해지는 동작은 클라이언트 감지 후 적용합니다.
- 감지 기준:
  - `window.matchMedia("(display-mode: standalone)")`
  - `window.matchMedia("(display-mode: fullscreen)")`
  - iOS `navigator.standalone`
- 소스 위치:
  - PWA 감지/쿠키: `src/lib/pwa-client.ts`
  - PWA 전역 부트스트랩: `src/components/PWAEnhancer.tsx`
  - PWA 세션 상수: `src/lib/pwa-session.ts`
  - PWA 영상 UI 크롬 제어: `src/hooks/usePwaVideoChrome.ts`

### 12-2. PWA 세션 유지 정책
- 일반 웹의 Lucia 기본 세션 만료는 30일 기준입니다.
- PWA 설치 앱에서는 `ms_pwa_standalone=1` 쿠키가 설정되고, 로그인 세션을 90일 기준으로 연장합니다.
- 구현 위치:
  - 로그인 직후 PWA 쿠키가 있으면 DB `sessions.expiresAt`을 90일로 갱신: `src/app/[locale]/(auth)/login/actions.ts`
  - 설치 앱 실행 중 12시간마다 세션 연장 API 호출: `src/components/PWAEnhancer.tsx`
  - API: `POST /api/auth/pwa-session` (`src/app/api/auth/pwa-session/route.ts`)
  - Lucia fresh 세션 쿠키 갱신 시 PWA 쿠키가 있으면 persistent cookie 속성 유지: `src/auth.ts`
- 보안 기준:
  - 로그인하지 않은 요청은 `401 Unauthorized`
  - PWA 표시 헤더/쿠키가 없는 요청은 `400`
  - 설치 사용자 분석/트래킹은 추가하지 않음

### 12-3. PWA 영상 UI
- 추천 영상 페이지와 실제 영상 시청 페이지에서만 PWA 영상 UI를 다르게 적용합니다.
- 대상:
  - `src/app/[locale]/(main)/recommended-videos/RecommendedVideosClient.tsx`
  - `src/app/[locale]/(main)/video-view/[postId]/VideoViewClient.tsx`
- 동작:
  - 모든 PWA 설치 앱(모바일/데스크탑/태블릿)에서 사용자가 터치/마우스 제스처를 하면 영상 컨트롤과 상단 메뉴가 보입니다.
  - 3초 뒤 컨트롤이 사라지면 모든 PWA 설치 앱에서 상단 로고/메뉴줄도 함께 숨깁니다.
  - 모바일 PWA에서는 브라우저 상하단 UI가 없다는 점을 활용해 safe-area 기반 전체화면형 영상 레이아웃을 추가 적용합니다.
  - 일반 브라우저 접속에서는 기존 UI를 유지합니다.
- CSS 기준:
  - `html.pwa-video-screen`
  - `html.pwa-video-chrome-hidden`
  - `.pwa-recommended-page`
  - `.pwa-recommended-slide`
  - 위치: `src/app/globals.css`

### 12-4. 세로형 콘텐츠 유지
- PWA 설치 앱에서 `screen.orientation.lock("portrait")`를 시도합니다.
- 지원 브라우저에서는 기기를 옆으로 눕혀도 portrait 잠금을 시도합니다.
- iOS Safari처럼 프로그램 방식 잠금을 막는 환경에서는 기존 세로 사용 안내 모달이 fallback입니다.
- 세로 안내 문구는 `next-intl` 메시지로 분리했습니다.
  - 컴포넌트: `src/components/OrientationModal.tsx`
  - 메시지: `messages/en.json`, `messages/ko.json`, `messages/zh.json`

### 12-5. 추천/시청 영상 로딩 최적화
- PWA 설치 앱 + 네트워크가 느리거나 데이터 절약 모드가 아닐 때만 다음 영상을 미리 데웁니다.
- 프리로드 대상:
  - 다음 2개 영상 썸네일
  - 다음 1개 영상의 HLS manifest 및 첫 media segment
- 구현 위치:
  - `src/lib/pwa-video-preload.ts`
  - 추천 페이지와 실제 시청 페이지에서 `activeIndex` 변경 시 호출
- Service Worker 캐시와 결합되는 장점:
  - Cloudflare Stream 썸네일: `StaleWhileRevalidate`
  - HLS manifest: `NetworkFirst`
  - HLS segment/subtitle/media: `CacheFirst` + `RangeRequestsPlugin`
  - 설정 위치: `next.config.mjs`, 생성 결과: `public/sw.js`

### 12-6. 오프라인/불안정 네트워크 보강
- PWA에서 유료 영상 시청 기록 저장 요청(`/api/videos/view`)이 실패하면 IndexedDB `offlineActions`에 큐잉합니다.
- 온라인 복귀 또는 PWA 재진입 시 큐를 순서대로 재전송합니다.
- 구현 위치:
  - IndexedDB v2 및 큐 처리: `src/lib/indexedDB.ts`
  - 실패한 시청 기록 큐잉: `src/components/videos/VideoPlayer.tsx`
  - 온라인 복귀 flush: `src/components/PWAEnhancer.tsx`
- 현재 범위:
  - 영상 시청 기록 보존에 집중합니다.
  - 좋아요/북마크 오프라인 큐는 이번 범위에 포함하지 않았습니다.

### 12-7. 검증 결과
- `pnpm build`: 성공
- `pnpm exec tsc --noEmit`: 새 PWA 코드 관련 오류 없음
  - 남은 오류는 기존 `@react-email/render` 의존성 누락 2건
- 로컬 production 서버 검증:
  - `GET /manifest.json`: 200, `display=standalone`, `scope=/`, 192/512 아이콘 확인
  - `GET /sw.js`: 200, Cloudflare Stream/Vercel internal 캐싱 규칙 확인
  - `POST /api/auth/pwa-session` 로그인 전 요청: 401 확인

### 12-8. OS별 PWA 설치 위치와 사용자 안내 기준
- PWA 설치 위치와 홈 화면 아이콘 생성 여부는 웹앱 코드가 아니라 브라우저와 OS가 결정합니다.
- MEGASHORTS 코드가 제어할 수 있는 것은 `manifest.json`의 앱 이름, 아이콘, 시작 URL, scope, display mode, shortcuts 정도입니다.

1. **macOS + Chrome**
- 결과: 설치 가능.
- 설치 위치: `/Users/<user>/Applications/Chrome Apps.localized`
- `/System/Applications` 설치: 불가능.
- `/Applications` 자동 설치: Chrome PWA 기준으로 보장 불가.
- 바탕화면 아이콘 자동 생성: PWA 코드로 강제 불가.
- 사용 방식: Launchpad, Spotlight, Dock 고정이 정상 사용 흐름입니다.
- 운영 안내 문구는 “설치 후 Launchpad 또는 Spotlight에서 MEGASHORTS를 실행하고, 필요 시 Dock에 고정하세요”가 정확합니다.

2. **Windows + Chrome/Edge**
- 결과: 설치 가능.
- 설치 후 시작 메뉴에 앱처럼 등록됩니다.
- 작업 표시줄 고정이 가능합니다.
- 바탕화면 아이콘 생성은 브라우저/설치 옵션/Windows 정책에 따라 달라지며, PWA 코드로 강제할 수 없습니다.
- 운영 안내 문구는 “설치 후 시작 메뉴에서 실행하거나 작업 표시줄에 고정하세요”가 정확합니다.

3. **Android + Chrome**
- 결과: 홈 화면 아이콘 생성 가능.
- 설치 버튼 또는 브라우저 메뉴의 앱 설치/홈 화면 추가를 통해 홈 화면에 MEGASHORTS 아이콘이 생깁니다.
- 일부 런처에서는 앱 서랍에도 표시될 수 있습니다.
- standalone으로 실행되면 주소창 없이 앱처럼 열립니다.

4. **iPhone/iPad + Safari**
- 결과: 홈 화면 아이콘 생성 가능.
- 설치 방법: Safari에서 MEGASHORTS 열기 -> 공유 버튼 -> `홈 화면에 추가`.
- 이 흐름이 iOS/iPadOS에서의 PWA 설치 방식입니다.
- 일반 사이트를 홈 화면에 추가하면 단순 바로가기처럼 동작할 수 있지만, MEGASHORTS는 manifest/service worker/standalone 설정이 있으므로 홈 화면 아이콘으로 실행하면 PWA standalone 앱 방식으로 동작합니다.
- iOS Chrome은 WebKit/OS 정책 제약이 있으므로 사용자 안내는 Safari 기준으로 해야 합니다.

### 12-9. 사용자에게 혼동 없이 설명할 문장
- “iPhone/iPad에서는 Safari에서 공유 버튼을 누르고 `홈 화면에 추가`를 선택하면 홈 화면에 MEGASHORTS 아이콘이 생깁니다. 그 아이콘으로 실행하면 PWA 앱 모드입니다.”
- “Android에서는 Chrome의 앱 설치 또는 홈 화면 추가를 사용하면 홈 화면에 MEGASHORTS 아이콘이 생깁니다.”
- “macOS Chrome에서는 PWA가 시스템 앱 폴더가 아니라 사용자 앱 폴더(`~/Applications/Chrome Apps.localized`)에 설치되는 것이 정상입니다. Launchpad/Spotlight/Dock으로 실행합니다.”
- “바탕화면 아이콘이나 시스템 애플리케이션 폴더 설치 위치는 MEGASHORTS 코드에서 강제할 수 없습니다.”

## 13. 저장 통계 조회 정책

### 13-1. 핵심 원칙
- 통계 화면은 Next.js 요청 시점에 플랫폼 데이터를 새로 계산하지 않습니다.
- 시청 로그 수집, 포인트 계산, 분배, 통계 작성은 Cloudflare Worker의 일일 실행 결과로 저장합니다.
- Next.js API와 화면은 저장된 결과를 조회하고 표시하는 역할만 담당합니다.
- 조회 단위는 `daily`, `weekly`, `monthly` 세 가지입니다.

### 13-2. 기간 키 해석
- `2026-05-23`: 일간 통계(`daily`)
- `2026-W20`, `2042-W23`: 주간 통계(`weekly`)
- `2026-05`: 월간 통계(`monthly`)
- 화면의 Day / Week / Month 선택은 위 기간 키 형식과 API 조회 단위를 함께 결정합니다.

### 13-3. 저장소와 Worker
- `commission` Worker:
  - `/summary?period=daily|weekly|monthly&date=...`
  - 소스 기준으로는 R2 `commission-summaries/{period}/{date}.json` 및 D1 fallback 조회 API가 있습니다.
  - 단, 2026-05-23 실제 배포 Worker 검증에서 `/summary`가 조회가 아니라 기존 실행처럼 동작하는 것을 확인했으므로 Next는 기본적으로 이 HTTP 경로를 사용하지 않습니다.
- `cfstats-admin` Worker:
  - 플랫폼 국가 통계: R2 `cf-stats/{period}/{date}.json`
  - 크리에이터 국가 통계: R2 `cf-stats/{period}/{date}/creators/{creator}.json`
  - 소스 기준 `/stats` API는 `creator` 파라미터가 있으면 개인 지도용 저장 통계를 반환합니다.
  - 단, 2026-05-23 실제 배포 Worker 검증에서 `/stats`가 fixture 국가 데이터를 빈 값으로 덮는 것을 확인했으므로 Next 플랫폼 지도는 기본적으로 D1 `cf_stats.top_countries`를 직접 조회합니다.

### 13-4. Next API 계층
- `/api/stats/uploader`: 크리에이터 수익/상세 통계 조회
- `/api/stats/agency`: 영업팀 수익/상세 통계 조회
- `/api/stats/admin`: 플랫폼 전체 저장 통계 조회
- `/api/stats/weekly`: 선택 기간의 상세 내역 조회
- `/api/stats/reports`: 저장 통계 리포트 조회
- `/api/stats/cloudflare`: 플랫폼 또는 크리에이터 국가별 조회수 지도 데이터 조회
- `/api/agency/statistics`, `/api/agency/distributions`: 관리자 영업팀 Lookup 화면의 저장 통계 조회
- 구현 기준:
  - `src/lib/worker-stats.ts`가 통계 조회의 서버측 단일 진입점입니다.
  - Cloudflare D1 환경변수(`CLOUDFLARE_ACCOUNT_ID`, `CLOUDFLARE_API_TOKEN`, `CLOUDFLARE_D1_DATABASE_ID`)가 있으면 D1 저장값을 직접 조회합니다.
  - `ENABLE_WORKER_STATS_HTTP=1`이 없으면 Worker HTTP 조회를 하지 않습니다.

### 13-5. 화면 권한과 메뉴 노출
- `src/lib/user-roles.ts`가 수익 메뉴 권한의 단일 기준입니다.
- 크리에이터 수익 화면(`/usermenu/earnings`)은 크리에이터 또는 운영 권한만 접근합니다.
- 영업팀 수익 화면(`/usermenu/agency-earnings`)은 영업팀 또는 운영 권한만 접근합니다.
- 사용자 메뉴도 같은 권한 기준으로 표시되어, 권한 없는 메뉴는 보이지 않습니다.

### 13-6. 지도 구현
- 지도는 `MapLibre GL JS + CARTO raster basemap`으로 표시합니다.
- Cloudflare Stream 국가별 저장 통계를 국가 중심좌표 JSON에 매핑합니다.
- 국가별 조회수는 지도 위 원형 버블로 표시하고, 조회수가 클수록 원 크기를 키웁니다.
- glyph가 필요한 지도 symbol layer는 사용하지 않습니다. OpenFreeMap glyph 404를 피하고 hover tooltip으로 국가/수치를 표시합니다.
- 도시 단위 지도는 Cloudflare Stream 기본 국가 통계 범위를 벗어나므로 구현 대상이 아닙니다.

### 13-7. 운영 확인 문서
- 현재 단일 기준 문서: `docs/STATS_E2E_VERIFICATION_20260525.md`
- 과거 통계/영업팀 보고서는 삭제하고, 현재 단일 기준 문서 `docs/STATS_E2E_VERIFICATION_20260525.md`만 유지한다.
- 검증 결과:
  - `pnpm exec tsc --noEmit`: 통과
  - `pnpm exec tsc --noEmit -p msworker/tsconfig.json`: 통과
  - `pnpm exec next build`: 통과

## 14. 정산/로그/가격 재검증 운영 기준

### 14-1. 로그 다국어 저장 정책
- Worker/Next가 저장하는 운영 로그의 기본 `event`는 영문으로 유지합니다.
- 한국어 등 원문 이벤트가 들어오는 경우 `eventI18n`에 원문을 보존합니다.
- 관리자 로그 UI는 영문 event를 우선 표시하고, 상세 모달에서 원문을 함께 보여줍니다.
- 구현 위치:
  - 타입: `src/lib/activity-logger/types.ts`
  - Worker 로그 클라이언트: `msworker/src/dailywork/shared/log-client.ts`
  - 관리자 UI: `src/app/[locale]/(main)/admin/service/components/LogTable.tsx`, `LogModal.tsx`

### 14-2. 시청기록과 정산 기준
- 구독 시청 기록은 `/api/videos/view`에서 `video_views`에 저장합니다.
- 같은 사용자가 같은 영상을 다시 시청하면 기존 행의 `createdAt`을 갱신하고 `viewCount`를 증가시킵니다.
- Worker 집계는 일자별 활동 행을 기준으로 처리합니다. 누적 `viewCount` 전체를 정산 수량으로 합산하면 과거 시청분 중복 지급 위험이 있으므로 현재 지급 기준에는 직접 사용하지 않습니다.
- 코인 시청은 `/api/user/coinpay` 경로에서 차감 및 `video_views` 기록을 생성합니다.

### 14-3. 관리자 영업팀 조회
- `/ko/admin/agency?tab=search`는 운영자가 팀마스터를 선택해 하위 조회 탭을 확인하는 구조입니다.
- `Referral Structure`, `Point Distribution`, `Statistics`는 선택된 팀마스터 기준으로 조회합니다.
- 본인이 아닌 팀 구조 조회는 운영 권한 이상만 허용합니다.
- 구현 위치:
  - UI: `src/app/[locale]/(main)/admin/agency/components/Agencysearch.tsx`
  - 권한: `src/app/api/agency/structure/route.ts`

### 14-4. 가격 설정과 결제 반영 범위
- 구독/코인 구매 화면은 관리자 시스템 설정의 `subscriptionPackages`, `coinPackages`를 읽어 표시합니다.
- 구현 위치:
  - 설정 정의: `src/lib/admin/system-settingspage.ts`
  - 설정 API: `src/app/api/admin/settings/route.ts`
  - 구매 화면: `src/app/[locale]/(main)/(static)/subscription/Subscription.tsx`
- 현재 실제 결제 승인 흐름은 제거되어 있습니다.
- 관리자 `globalPrice`는 저장/표시되지만, 글로벌 결제 승인/웹훅/정산 포인트 반영 경로는 아직 구현 전입니다.

### 14-5. 아직 닫히지 않은 설계 항목
- 글로벌 결제 승인/웹훅/정산 포인트 반영 경로는 아직 구현 전입니다.
- 첫 번째 영상이 유료 정산 대상이면 `VideoPlayer`의 `sequence > 1` 시청 기록 조건을 조정해야 합니다. 첫 번째 영상이 무료 프리뷰라면 현재 조건이 맞습니다.

### 14-6. 실제 검증 후 통계 조회 운영 기준
- 2026-05-23 실제 fixture/API 검증에서 배포된 `commission-worker` `/summary`와 `cfstats-admin` `/stats`가 현재 소스의 조회 API와 다르게 동작하는 것을 확인했습니다.
- Next 통계 API는 기본적으로 Worker HTTP를 호출하지 않고 Cloudflare D1 저장값을 직접 조회합니다.
- Worker HTTP 조회는 새 Worker 배포와 검증이 끝난 뒤 `ENABLE_WORKER_STATS_HTTP=1`을 설정한 경우에만 사용합니다.
- 구현 위치: `src/lib/worker-stats.ts`
- D1 커미션 통계는 `commission_batch.processed = 1` 지급 완료 행만 합산합니다.
- commission Worker는 지급 완료 원장을 기준으로 `daily`, `weekly`, 월말 `monthly` 정산 요약을 `cf_stats.commission_data`와 R2 `commission-summaries/{period}/{date}.json`에 저장합니다.
- 개인 영업팀 수익은 팀 전체값이 아니라 해당 사용자 `user_id`의 지급 완료 커미션만 합산합니다.
- 플랫폼 지도는 D1 `cf_stats.top_countries` 또는 R2 `cf-stats/{period}/{date}.json`에서 국가별 저장값을 읽고, 국가 중심좌표 JSON으로 MapLibre 버블을 그립니다.
- fixture 국가 지도 seed는 실제 시청 원장에서 파생한 값을 운영 `cfstats-admin`과 같은 `[{country, minutes}]` 형식으로 D1 `cf_stats`에 upsert합니다.
- 크리에이터 지도는 R2 `cf-stats/{period}/{date}/creators/{creator}.json`을 기준으로 하며, 크리에이터 원장이 없을 때 플랫폼 전체 국가 통계를 대신 보여주지 않습니다.

### 14-7. 2042-W23 실제 검증값
- fixture run: `20260519060836`
- 검증 명령: `node scripts/agency-e2e-fixture.mjs verify 20260519060836`
- 결과: 통과
- 관리자 API: `/api/stats/admin?period=2042-W23` -> `1478.35P`, `38` views
- 크리에이터 LV1 API: `/api/stats/uploader?userId=codex_agency_test_20260519060836_creator_lv1&period=2042-W23` -> `372P`, `6` views
- HEADQUARTERS 마스터 API: `/api/stats/agency?userId=codex_agency_test_20260519060836_hq_master&period=2042-W23` -> `244.8P`, `5` views
- 지도 API: `/api/stats/cloudflare?period=2042-W23` -> `KR 118`, `US 82`, `JP 46`, `CN 39`, `VN 28`
- 인증 없는 플랫폼 통계 API는 `401 Unauthorized`입니다.

### 14-8. 2026-05-24 통계 화면 재정리 기준
- 기존 URL은 새로 만들지 않고 다음 책임으로 고정합니다.
  - 개인 크리에이터 수익: `/ko/usermenu/earnings`
  - 개인 영업자 수익: `/ko/usermenu/agency-earnings`
  - 영업팀별 전체 정보: `/ko/admin/agency?tab=search`
  - 플랫폼 전체 정보: `/ko/admin/system?tab=stats`
- 개인 수익 API는 D1 `commission_batch.user_id` 기준입니다.
- 영업팀 전체 조회 API는 D1 `commission_batch.master_id` 기준입니다.
- 운영자 이상은 `/ko/admin/service?tab=user` 사용자 액션 메뉴의 `Earnings`로 기존 개인 수익 페이지를 `targetUserId`와 함께 열 수 있습니다.
- UI는 `cloudflare-d1-commission_batch` 같은 내부 원본명을 표시하지 않습니다.
- 긴 원장 ID는 표에서 truncate/title 처리하며, 가능한 경우 Post title 또는 User displayName으로 매핑합니다.
- 통계 기준 시간대는 `Asia/Seoul`입니다. Next API는 `src/lib/analytics-timezone-server.ts`의 `getAnalyticsTimeZone()`을 사용하고, Worker는 각 `wrangler.toml`의 `ANALYTICS_TIME_ZONE = "Asia/Seoul"`을 사용합니다.
- 팀마스터 제거 정책은 "팀 해체"입니다. `src/app/api/admin/team-master-remove/route.ts`가 팀원 `teamMaster` 해제, 영업팀 역할 일반 회원화, 팀 내부 추천 연결 제거, D1 추천 구조 제거 호출을 수행합니다.
- 시스템 통계 화면은 상단 누적 카드, 국가 지도, 기간 조회 필터, 기간 리포트 순서입니다. 기간 리포트 API는 `/api/stats/reports`이며 D1 정산 원장 + Postgres 보조 집계를 사용합니다.
- 팀마스터도 사용자 메뉴에서 `/admin/agency`를 볼 수 있습니다. `Team Master` 탭은 운영자만, `Settings`/`Lookup`은 팀마스터도 접근합니다. 운영자는 Lookup에서 팀마스터 선택, 팀마스터는 자신의 팀 자동 선택입니다.
- 운영자 Lookup의 팀마스터 선택 목록은 `src/app/api/admin/team-master-list/route.ts`에서 OPERATION1 이상에게만 제공합니다.
- 현재 검증 문서는 [docs/STATS_E2E_VERIFICATION_20260525.md](/Users/tigerk/Desktop/megas/docs/STATS_E2E_VERIFICATION_20260525.md)입니다.

### 14-9. 2026-05-25 통계 원장 필드/화면 최종 기준
- 기존 네 화면의 책임은 다음으로 고정합니다.
  - 개인 크리에이터 수익: `/ko/usermenu/earnings`
  - 개인 영업자 수익: `/ko/usermenu/agency-earnings`
  - 영업팀별 전체 정보: `/ko/admin/agency?tab=search`
  - 플랫폼 전체 정보: `/ko/admin/system?tab=stats`
- 개인/영업팀 수익 기간 조회는 `weekly`, `monthly`만 제공합니다. 지급 원장은 주간 정산이 중심이므로 개인/팀 `daily` 지급 통계는 화면에서 제거했습니다.
- 플랫폼 전체 통계는 `daily`, `weekly`, `monthly`를 유지합니다. 플랫폼 일별 운영 지표는 의미가 있으나, 저장 원장에 없는 일별 항목은 0 또는 빈 값으로 표시합니다.
- D1 지급 원장 `commission_batch`의 현재 조회 가능 필드는 `user_id`, `master_id`, `commission_type`, `post_id`, `point_by_coin`, `point_by_subscription`, `view_count_coin`, `view_count_subscription`, `metadata`입니다.
- 현재 원장에는 viewer ID와 개별 video ID가 없으므로, UI는 포스트/유형/시청방식/포인트까지만 표시합니다. 이보다 더 상세한 지급 근거가 필요하면 Worker 원장 저장 필드를 확장해야 합니다.
- 2042-W23 fixture 원장의 `cf_stats.commission_data.pointSettings` 누락은 보강했습니다. 기준값은 `subscriptionPerPoint=100`, `viewCoinAmount=2`, `coinPerPoint=120`입니다.
- `cfstats-admin` Worker는 `date=all` 조회 시 R2의 `cf-stats/{period}/{date}.json` 및 `cf-stats/{period}/{date}/creators/{creator}.json`을 누적 합산할 수 있습니다.
- 과거 2042-W23 fixture에는 크리에이터별 국가 R2 파일이 없으므로 개인 크리에이터 지도는 빈 값이 정상입니다. 새 Worker 배포 후 실행분부터 생성됩니다.
- 영업자 개인 수익 페이지에는 지도 섹션을 두지 않습니다.
- `/admin/agency?tab=search`의 Lookup 하위 탭은 `Referral Structure`, `Statistics` 두 개입니다. 기존 별도 `Point Distribution` 탭은 제거했고, 팀 전체 지급 상세는 `Statistics` 하단에 포함합니다.
- 영업자 개인 페이지(`/usermenu/agency-earnings`)에는 `Referral Structure` 탭이 있으며, 모든 영업자는 자기 하위 구조를 볼 수 있습니다. 팀마스터와 운영자는 허용된 하위 멤버 자격을 변경할 수 있고 `/api/agency/structure/role`이 처리합니다.
- `_next/static/chunks`는 PWA precache 대상에서 제외하고 runtime `NetworkOnly`로 처리합니다. stale chunk로 인한 Workbox `bad-precaching-response`를 줄이기 위한 운영 기준입니다.

### 14-10. 최신 E2E fixture 기준 (2026-05-25)
- `2042-W23` fixture는 최신 UI/원장 구조 검증 기준으로 사용하지 않습니다.
- 최신 기준:
  - runId: `20260525090317`
  - targetDate: `2042-06-15`
  - period: `2042-W24`
  - 상세 문서: `docs/AGENCY_E2E_REPORT_20260525090317.md`
- 확인 계정:
  - creator: `lv1-0317`
  - agency personal/team master: `hq-0317`
  - admin: `t-admin-0317`
- Worker/D1 검증값:
  - D1 `grouped_views`: 15행
  - D1 `commission_batch`: 26행
  - 지급 완료: 22행
  - 조건 미충족 보류: 4행
  - 국가 지도 weekly: US 9분, TH 9분, KR 6분, JP 6분, VN 6분
- 주간 단가 원장:
  - `subscriptionPerPoint=1000`
  - `coinPerPoint=120`
  - `viewCoinAmount=2`
- fixture 스크립트 운영 기준:
  - login username/email은 `lv1-0317`처럼 짧은 base + runId suffix로 생성합니다.
  - 내부 PK는 `codex_agency_test_{runId}_...` 형식을 유지합니다.
  - country seed는 `cf_stats` daily/weekly/monthly 행을 삭제하지 않고 upsert하여 `commission_data.pointSettings`를 보존합니다.
  - R2 지도 스냅샷은 `scripts/agency-e2e-r2-stats-snapshot.mjs`로 `points-system-bucket/cf-stats/`에 platform/creator daily/weekly/monthly 객체를 생성합니다.

### 14-11. 2026-05-26 운영 스키마 기반 재검증
- 실제 실행:
  - `node scripts/agency-e2e-fixture.mjs full 20260525090317`
  - `node scripts/agency-e2e-r2-stats-snapshot.mjs 20260525090317 2042-06-15`
- 결과:
  - `checks.passed=true`
  - D1 `grouped_views`: 15행
  - D1 `commission_batch`: 26행, 지급 완료 22행, 보류 4행
  - D1 `cf_stats`: daily/weekly/monthly, 각 `totalMinutes=36`
  - R2 `points-system-bucket/cf-stats/`: 12개 객체 업로드
  - Cloudflare MCP R2 list 확인: weekly platform/creator 4개 객체 존재, `application/json`
- 제한:
  - 현재 Codex 실행환경은 최신 Next 서버 bind가 `listen EPERM`으로 막혀 실제 브라우저 UI 확인은 로컬에서 직접 실행해야 합니다.
  - Worker HTTP read-back도 sandbox DNS 제한 및 escalated read 거부로 이 환경에서는 직접 완료하지 못했습니다.

### 14-12. 2026-05-26 통계 UI 간격/다국어/PWA 설치 프롬프트 보정
- 목적:
  - 통계 페이지 전반의 과도한 섹션 간격을 줄여 헤더-탭 간격과 유사한 밀도로 통일.
  - 한국어 PWA 설치 프롬프트에서 텍스트 길이로 버튼/컨테이너가 깨지는 현상 수정.
  - 로그인 비밀번호 입력의 눈 아이콘 상태(숨김/표시)가 반대로 보이는 문제 수정.
  - `usermenu` 경로는 locale 번역 적용, `admin` 경로는 영어 고정 원칙을 코드 기준으로 재정렬.

- UI 간격 기준:
  - 통계/수익 주요 화면의 루트 간격을 `space-y-2`, 카드/섹션 내부 간격을 `gap-2`, 탭-콘텐츠 간격을 `mt-2`로 통일.
  - 적용 경로:
    - `src/app/[locale]/(main)/usermenu/earnings/*`
    - `src/app/[locale]/(main)/usermenu/agency-earnings/*`
    - `src/app/[locale]/(main)/admin/system/components/SystemStats.tsx`
    - `src/app/[locale]/(main)/admin/agency/components/Agencysearch.tsx`
    - `src/app/[locale]/(main)/admin/agency/components/search/*`

- PWA 설치 프롬프트 보정:
  - 한국어 설명을 짧게 조정: `"메가쇼츠를 앱처럼 사용하세요"`.
  - 레이아웃을 좁은 폭 기준으로 재배치:
    - 텍스트 영역 `min-w-0`, 버튼 영역 `shrink-0`.
    - 제목 `truncate`, 설명 `break-keep`, 버튼 `whitespace-nowrap`.
    - 컨테이너 폭 `w-[calc(100%-24px)] max-w-[440px]`.
  - 적용 파일:
    - `src/components/PWAInstallPrompt.tsx`
    - `messages/ko.json` (`PWA.installDescription`)

- 비밀번호 눈 아이콘 상태 보정:
  - 기본(숨김) 상태 아이콘: `EyeOff`
  - 표시 상태 아이콘: `Eye`
  - 적용 파일:
    - `src/components/PasswordInput.tsx`

- usermenu 다국어 / admin 영어 고정 정리:
  - `PointsStatistics`의 하드코딩 라벨을 `messages/*` 키로 이전.
  - `Earnings` 번역 키 보강:
    - 단위(`unitWeek`, `unitMonth`)
    - 누적/기간/지도/정산 관련 라벨
    - 페이지 메타 타이틀/설명 키(`creatorMetaTitle`, `agencyMetaTitle` 등)
  - `usermenu` 수익 페이지 metadata를 `generateMetadata + getTranslations`로 전환.
  - `admin` 통계/조회 화면의 렌더 문자열은 영어 유지 기준으로 확인.
  - 적용 파일:
    - `src/app/[locale]/(main)/usermenu/earnings/page.tsx`
    - `src/app/[locale]/(main)/usermenu/agency-earnings/page.tsx`
    - `src/app/[locale]/(main)/usermenu/earnings/PointsStatistics.tsx`
    - `messages/ko.json`, `messages/en.json`, `messages/zh.json`

- 구조 정리:
  - 더 이상 참조되지 않는 구버전 백업 파일 삭제:
    - `src/app/[locale]/(main)/usermenu/earnings/2PointsApplication.tsx`
  - 영업자 페이지 문구 분기 오류 수정:
    - `isUploader` 기준을 실제 역할값으로 정정 (`userRole >= 40`).
    - 적용: `src/app/[locale]/(main)/usermenu/earnings/PointsApplication.tsx`

- 검증:
  - 메시지 JSON 파싱: `messages/ko.json`, `messages/en.json`, `messages/zh.json` 통과.
  - 타입체크: `pnpm exec tsc --noEmit --pretty false` 통과.
  - 빌드: `pnpm run build` 성공.
  - 참고: 빌드 중 기존 경고(Sentry/OpenTelemetry, hooks lint warning)와 Supabase 연결 경고는 기존과 동일하게 출력되지만 빌드는 완료됨.

### 14-13. 2026-05-26 통계 지도/상세 지급 리포트 추가 보정
- 사용자 지적 사항을 기준으로 이전 완료 보고를 재검토한 결과, 다음 항목은 미완성 상태였으므로 추가 보정했다.
  - 크리에이터 개인 수익 지도에서 R2 크리에이터별 국가 스냅샷을 직접 읽지 못해 `Unable to load Cloudflare statistics data.`가 표시될 수 있음.
  - 플랫폼 전체 기간 리포트가 포스트/뷰/포인트 수준에 머물러 크리에이터 지급, 영업팀 지급, 직접/간접 지급 근거를 충분히 보여주지 못함.
  - 관리자 영업팀 Lookup API 응답에 한국어 그룹/역할 라벨이 남아 admin 화면 영어 고정 원칙과 충돌함.
  - MapLibre hover popup에 기본 컨테이너와 내부 카드가 중복되어 말풍선 UI가 이중으로 보임.

- 구현 위치:
  - R2 직접 조회 fallback: `src/lib/worker-stats.ts`
  - 플랫폼 기간 리포트 상세 확장: `src/app/api/stats/reports/route.ts`
  - 관리자 전체 통계 상세 UI: `src/app/[locale]/(main)/admin/system/components/SystemStats.tsx`
  - 영업팀 Lookup 영어 라벨 API: `src/app/api/agency/statistics/route.ts`, `src/app/api/agency/distributions/route.ts`
  - 지도 popup UI: `src/components/stats/CountryBubbleMap.tsx`, `src/app/globals.css`

- R2 조회 기준:
  - Next 서버는 Worker HTTP read-back이 실패하거나 구버전 Worker가 응답 형식을 맞추지 못할 때 `points-system-bucket`의 운영 경로를 직접 읽는다.
  - 플랫폼 국가 통계: `cf-stats/{period}/{date}.json`
  - 크리에이터 국가 통계: `cf-stats/{period}/{date}/creators/{creator}.json`
  - `date=all`은 해당 `period` prefix 아래 객체를 list한 뒤 합산한다.
  - 필요한 환경변수는 `CLOUDFLARE_ACCOUNT_ID`, `CLOUDFLARE_R2_ACCESS_KEY_ID`, `CLOUDFLARE_R2_SECRET_ACCESS_KEY`, `CLOUDFLARE_POINTS_SYSTEM_BUCKET_NAME` 또는 `CLOUDFLARE_POINTS_R2_BUCKET_NAME`이다.

- 플랫폼 기간 리포트 표시 기준:
  - D1 `commission_batch` 지급 완료 행을 직접 조회해 크리에이터 지급과 영업팀 지급을 분리한다.
  - 리포트는 현재 원장이 가진 범위 안에서 `recipient`, `teamMaster`, `commission_type`, `post_id`, 구독/코인 시청수, 구독/코인 지급 포인트, 총 포인트를 표시한다.
  - `Top Marketer Payouts (Excluding Masters)`는 D1 지급 행 중 영업팀 마스터 이상 권한 사용자를 제외한 실제 수령자 기준으로 계산한다.
  - `Agency Payout by Type`은 `direct_referral`, `indirect_referral`, `network_level` 등 `commission_type` 기준 합계다.
  - 축약 표기(`1.5K`) 대신 원 숫자 기준 포맷을 사용한다.

- 현재 원장 한계:
  - 기존 D1 `commission_batch`에는 viewer ID와 개별 video ID가 없다.
  - 2026-05-26 보정으로 `viewgroup` Worker가 `grouped_view_details` 상세 원장을 생성하도록 확장했다.
  - `grouped_view_details`는 `source_view_id`, `viewer_id`, `video_id`, `access_method`, `view_count`, `uploader_id`, `post_id`, `master_id`, `referrer_id`를 저장한다.
  - `/api/stats/reports`는 이 상세 원장이 있으면 `Paid View Basis Detail`로 포스트/비디오/시청방식/시청자수/시청수를 표시한다.
  - `20260525090317 / 2042-W24` fixture는 2026-05-26에 `viewgroup` Worker 배포 후 재생성되어 `grouped_view_details=15`행이 확인됐다.
  - 검증 보고서 `docs/AGENCY_E2E_REPORT_20260525090317.md`는 해당 상세 시청 근거를 포함한다.
  - 이번 보정은 없는 필드를 임의 fixture 값으로 만들지 않고, 운영 D1/R2 원장에 실제 존재하거나 Worker가 새로 저장하는 필드만 UI에 노출한다.

- 검증:
  - `pnpm exec tsc --noEmit --pretty false`: 통과.
  - `pnpm run build`: 통과.
  - 관리자 영업팀/API 소스에서 `직접 추천`, `간접 추천`, `네트워크 레벨`, `영업자 지급`, `저장된 지급`, `에이젼시 멤버`, `본부 마스터` 잔존 문자열 검색: 없음.
  - 참고: 실제 브라우저 로그인 UI 검증은 이 Codex 실행환경의 서버 bind 제한이 있을 수 있으므로, 로컬 `pnpm run dev` 또는 production 서버에서 `lv1-0317`, `hq-0317`, `t-admin-0317`로 최종 확인해야 한다.

### 14-14. 2026-05-26 영업수수료 post_id 보존 원장 기준
- 원칙:
  - 영업수수료 원장은 크리에이터 지급 원장과 동일하게 `post_id`를 보존해야 한다.
  - 관리자 리포트에서 `post_id`가 비어 있으면 UI 문제가 아니라 지급 감사 원장의 정보 손실이다.
  - 지급완료 영업수수료 행의 `post_id` 누락은 E2E 실패 조건이다.
- 원인과 수정:
  - `commission` worker의 `team-processors` 계층은 이미 `postId`를 전달하고 있었다.
  - 실제 누락 원인은 `saveCommissionBatch()`가 영업수수료를 `userId-date-commissionType-batchId`로만 합산하면서 포스트 정보를 버린 것이었다.
  - 현재 구현은 집계 키에 `postId`를 포함하고, D1 `commission_batch.post_id` 및 metadata에 해당 값을 보존한다.
- 최신 검증 원장:
  - runId: `20260526074947`
  - targetDate: `2041-06-30`
  - period: `2041-W26`
  - report: `docs/AGENCY_E2E_REPORT_20260526074947.md`
  - deployment: `commission-worker` version `da3fe573-fd2d-4a8f-aa91-31f4ae61f188`
- 검증값:
  - D1 `commission_batch`: 34행
  - D1 영업수수료 행: 27행
  - D1 영업수수료 `post_id` 누락: 0행
  - D1 지급완료 영업수수료 `post_id` 누락: 0행
  - D1 `grouped_view_details`: 15행
  - `checks.passed=true`
- UI/API 기준:
  - `/api/stats/reports`는 `commission_batch`의 지급 완료 행을 기반으로 크리에이터 지급, 영업팀 지급, 직접/간접/네트워크 지급 유형 합계를 만든다.
  - `Agency Payout Detail`은 Post 컬럼을 표시한다. 여러 포스트가 섞인 경우에도 원장 자체가 포스트별 행으로 분리되므로 하나의 행에 복수 포스트를 억지로 압축하지 않는다.
  - 비디오/시청자/시청방식 근거는 `grouped_view_details`에서 별도 `Paid View Basis Detail`로 제공한다.
- R2 지도 기준:
  - 플랫폼 지도 객체: `points-system-bucket/cf-stats/weekly/2041-06-30.json`
  - 크리에이터 지도 객체:
    - `points-system-bucket/cf-stats/weekly/2041-06-30/creators/codex_agency_test_20260526074947_creator_lv1.json`
    - `points-system-bucket/cf-stats/weekly/2041-06-30/creators/codex_agency_test_20260526074947_creator_lv2.json`
    - `points-system-bucket/cf-stats/weekly/2041-06-30/creators/codex_agency_test_20260526074947_creator_lv3.json`
  - 위 4개 객체는 Cloudflare API R2 list에서 `application/json`으로 확인했다.
- 로컬 확인 계정:
  - creator: `lv1-4947`
  - agency master: `hq-4947`
  - admin: `t-admin-4947`
  - common password: `MegaTest!2026`
  - local creator URL: `/ko/usermenu/earnings?tab=statistics&period=2041-W26&unit=weekly`
  - local agency URL: `/ko/usermenu/agency-earnings?tab=statistics&period=2041-W26&unit=weekly`
  - local admin URL: `/ko/admin/system?tab=stats&period=2041-W26&unit=weekly`

### 14-15. 2026-05-26 크리에이터 지도 조회 fallback 아키텍처
- 지도 위치:
  - 크리에이터 수익 페이지: `src/app/[locale]/(main)/usermenu/earnings/PointsStatistics.tsx`
  - API: `src/app/api/stats/cloudflare/route.ts`
  - R2/D1/Worker 조회 유틸: `src/lib/worker-stats.ts`
- 조회 순서:
  - 크리에이터 누적 지도는 먼저 `period=all`로 크리에이터별 R2 객체 prefix를 합산한다.
  - `period=all` 결과가 비어 있고 화면의 선택 기간이 있으면 `fallbackPeriod`를 사용해 해당 기간의 크리에이터 R2 객체를 직접 조회한다.
  - R2 S3 signed GET/List가 실패하면 Cloudflare API token 기반 R2 object GET/List를 fallback으로 사용한다.
  - 크리에이터 지도는 플랫폼 전체 국가 통계로 fallback하지 않는다. 크리에이터별 R2 결과가 없으면 빈 지도가 맞다.
- 운영 환경변수:
  - S3 호환 R2 조회: `CLOUDFLARE_ACCOUNT_ID`, `CLOUDFLARE_R2_ACCESS_KEY_ID`, `CLOUDFLARE_R2_SECRET_ACCESS_KEY`, `CLOUDFLARE_POINTS_SYSTEM_BUCKET_NAME`
  - Cloudflare API fallback: `CLOUDFLARE_ACCOUNT_ID`, `CLOUDFLARE_API_TOKEN`, `CLOUDFLARE_POINTS_SYSTEM_BUCKET_NAME`
- 최신 확인 기준:
  - URL: `/ko/usermenu/earnings?tab=statistics&period=2041-W26&unit=weekly`
  - login: `lv1-4947`
  - fallback R2 key: `cf-stats/weekly/2041-06-30/creators/codex_agency_test_20260526074947_creator_lv1.json`
- 주의:
  - 화면에서 `2041-W26`을 선택해도 지도 자체는 누적 섹션이다. 따라서 `period=all`이 먼저 호출되는 것이 의도된 구조다.
  - 누적 prefix list가 실패했을 때 선택 주차 fallback을 적용해야 fixture/운영 초기 데이터에서 지도가 보인다.

## Payment Provider Transition State (2026-05-26)

- Current payment execution state:
  - Legacy Korean payment execution code has been removed from the app.
  - `/subscription` remains the user-facing purchase page, but it no longer opens an external payment widget.
  - Subscription and coin purchase clicks show a placeholder toast until a global payment provider is implemented.
- Source of truth:
  - UI: `src/app/[locale]/(main)/(static)/subscription/Subscription.tsx`
  - Admin pricing schema/defaults: `src/lib/admin/system-settingspage.ts`
  - Admin pricing UI: `src/app/[locale]/(main)/admin/system/components/SystemSettings.tsx`
  - Subscription expiry maintenance: `src/app/api/cron/billingkr/route.ts`
  - Payment cancellation placeholder: `src/app/api/payments/cancel/route.ts`
  - DB models retained for future provider: `prisma/schema.prisma` models `Payment`, `Subscription`, `BillingKey`, `webhookLog`
- Pricing policy:
  - Admin settings retain both legacy `price` and global `globalPrice`.
  - `/subscription` displays `globalPrice` as USD.
  - Existing weekly/yearly tab behavior and coin selection activation behavior are preserved.
- Removed runtime surface:
  - Payment widget modals and billing modals.
  - Payment result pages under `/usermenu/payments/result/*`.
  - Legacy payment callback/status/webhook APIs under `/api/payments/coin/*`, `/api/payments/billing/*`, `/api/payments/statusdb`, `/api/payments/webhook`.
  - Legacy payment SDK dependencies and local environment keys.
- Statistics and commission isolation:
  - This removal does not change worker statistics or agency payout simulation ledgers.
  - The commission/stat source ledgers remain `video_views`, D1 `grouped_views`, `grouped_view_details`, `commission_batch`, and `cf_stats`.
  - Future payment provider work must preserve currency/provider fields and feed a provider-neutral settlement point pool into statistics.
- Follow-up implementation guide:
  - `docs/GLOBAL_PAYMENT_INTEGRATION_GUIDE.md` documents the DB, webhook, admin settings, subscription page, worker settlement, and statistics integration points for the next global payment provider.

## Pricing And Settings Stability Updates (2026-05-27)

- Pricing page i18n:
  - The pricing headline is no longer hard-coded Korean text.
  - Source: `src/app/[locale]/(main)/(static)/subscription/page.tsx`
  - Translation key: `Subscription.eventHeadline`
  - Messages updated in `messages/ko.json`, `messages/en.json`, and `messages/zh.json`.
- Pricing display:
  - Menu label changed from `Subscription / Coins` to `Pricing` in English navigation.
  - `/subscription` continues to display USD prices from admin `globalPrice`.
  - If an old DB setting row lacks `globalPrice`, the page falls back to `price / 1000` before falling back to default settings, preventing `$NaN`.
  - Original/struck-through subscription prices are calculated as 20% above the active USD display price.
- Admin system settings stability:
  - `/api/admin/settings` now merges DB settings with `DEFAULT_SETTINGS` and tolerates older raw JSON setting shapes.
  - `SystemSettings` number formatting is defensive against `undefined`, `null`, and string values so `/admin/system?tab=settings` does not crash on partial settings rows.
  - Source files:
    - `src/app/api/admin/settings/route.ts`
    - `src/app/[locale]/(main)/admin/system/components/SystemSettings.tsx`
- Local analytics behavior:
  - Vercel Analytics is now rendered only when `NODE_ENV=production` and `VERCEL=1`.
  - This prevents local production deployments from requesting `/_vercel/insights/script.js` and producing irrelevant 404 noise.
  - Source: `src/app/[locale]/layout.tsx`
- Mobile user menu:
  - User dropdown now has a viewport-based max height and internal vertical scroll.
  - This prevents lower menu items from being clipped on mobile/tablet browsers.
  - Source: `src/components/UserButton.tsx`
- Verification:
  - `./node_modules/.bin/tsc --noEmit --pretty false` passed after these changes.
  - Message JSON parsing passed for Korean, English, and Chinese.

### 14-16. 2026-05-27 로그 시스템 모바일 반응형 UI 최적화 및 시간대/영문화 검증

- **로그 시스템 모바일/태블릿 반응형 UI 최적화**:
  - `admin/service?tab=logs` 화면의 `LogTable` 컴포넌트에 모바일 환경(`sm` 미만) 전용 카드 뷰 레이아웃을 도입했습니다.
  - 각 카드는 로그의 타임스탬프, 사용자(username), 타입 아이콘, 국가 및 IP 주소, 로그 이벤트 설명이 적절히 배치되도록 구성하여 좁은 화면에서도 찌그러지거나 잘리지 않도록 개선했습니다.
  - 기존의 데스크톱 전용 테이블 UI는 `hidden sm:block`으로 감싸서 모바일 환경에서 렌더링되지 않도록 조치했습니다.
  - `LogFilters`의 모바일 입력 필드 `placeholder`에 `"User ID"`를 지정하여 모바일 뷰에서의 사용성을 보완했습니다.
  - 불필요한 `ko` 로케일 임포트를 정리했습니다.
- **시간대 설정 연동 및 표기 검증**:
  - 어드민 설정 페이지(`admin/system?tab=settings`)에서 지정한 `analyticsTimeZone`과 워커의 `ANALYTICS_TIME_ZONE` 환경변수가 연동되어 동작하고 있음을 확인했습니다.
  - Next.js 서버사이드(`/api/admin/service/logs`)에서 타임존 정보를 안전하게 파싱하여 로그 워커로 전송하고, 워커 측에서 기간 필터링 바운더리를 계산할 때 타임존을 기반으로 UTC 변환을 정확히 수행하고 있습니다.
  - 어드민 UI단(`LogTable`, `LogModal`)에서도 설정된 타임존 프롭을 바탕으로 `formatInTimeZone` 유틸을 거쳐 정확한 현지 시간대로 출력되고 있음을 검증했습니다.
- **검증**:
  - `pnpm exec tsc --noEmit` 검사 통과.
  - `pnpm run build` 검사 진행 완료.
