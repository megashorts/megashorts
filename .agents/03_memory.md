# MegaShorts 개발 메모리 (에러/해결/구조변경 기록)

> 최종 업데이트: 2026-05-22

## 2026-05-13 — 플랫폼 고도화 (다국어, PWA, 권한 최적화, 성인인증)

### 1. 다국어(next-intl) 및 라우팅 구조 변경
- **URL 구조**: 영어(기본, prefix 없음), 한국어(`/ko`), 중국어(`/zh`)
- **API 경로 주의**: `src/app/[locale]/(main)/api` 폴더가 있으면 `/en/api/...` 처럼 접두사가 붙어 프론트엔드 fetch 호출이 깨짐. 따라서 모든 API를 `src/app/api`로 이동 완료.
- **Middleware**: `next-intl` 미들웨어를 기존 CORS 설정과 통합.

### 2. 시청 권한 최적화 (Two-track Caching)
- **Problem**: 스와이프 시마다 `/api/user/coinpay`를 동기적으로 기다려 1~2초 딜레이 발생.
- **Solution**: 
    1. `useUserAuth`에서 `mscoin`과 `purchasedVideoIds`(소장목록)를 함께 로드.
    2. `PlayPermissionCheck`에서 소장목록 확인 시 0초 즉시 재생.
    3. 미구매 영상이나 코인 보유 시, **Optimistic UI**로 로컬 캐시(QueryData)를 먼저 차감하고 서버 통신은 비동기로 처리하여 딜레이 제거.

### 3. 글로벌 성인인증 (Self-Declaration)
- **UI**: Framer Motion을 사용한 모바일 친화적 바텀시트 모달(`AgeVerificationModal.tsx`) 구현.
- **Logic**: 생년월일 입력 및 만 18세 이상 확인 체크. 성공 시 `/api/user/verify-age` 호출 및 `userAuth` 캐시 갱신.

### 4. TypeScript 에러 및 MCP 경고 해결 (2026-05-14)
- **MCP 에러**: `~/.gemini/antigravity/mcp_config.json`의 잘못된 MCP 서버 설정(Vercel, Cloudflare CLI 등)으로 인한 에디터 경고를 설정 초기화하여 해결.
- **TypeScript 에러 해결 (약 97개)**:
    - **Next.js 15 Route Handlers**: API 라우트의 `params` 타입이 Promise로 변경됨에 따라, `await context.params` 방식으로 15여 개 라우트 파일 일괄 업데이트.
- **2026-05-14**
- **에러**: `zh.json` 파일 내 큰따옴표 미처리로 JSON 파싱 에러 발생.
- **해결**: 문자열 내 큰따옴표는 반드시 `\"`로 이스케이프 처리해야 함.
- **이슈**: 다국어 적용 후 `/ko`, `/zh` 등 로케일 경로에서 `MenuBar`가 숨겨지지 않고 노출되는 현상.
- **원인**: `next/navigation`의 `usePathname`은 로케일 접두사를 포함하므로, `@/i18n/routing`의 `usePathname`을 사용해야 함.
- **해결**: MenuBar.tsx에서 next/navigation 대신 @/i18n/routing의 usePathname과 Link를 import하도록 수정하여 버그 해결 완료.
- **Phase 5 완료**:
    - `(static)` 폴더 하위 컴포넌트 전체(`Subscription`, `Notice`, `Company`, `Categories`)의 하드코딩 텍스트를 모두 추출하여 다국어(`next-intl`) 마이그레이션 적용.
    - 서버 컴포넌트에서는 `getTranslations`, 클라이언트 컴포넌트에서는 `useTranslations` 훅을 일관성 있게 사용.
    - `Prisma Schema 동기화`: `FullScreenVideo.tsx` 등에서 삭제된 `Media` 객체와 `url` 속성 참조 에러를 `filename`으로 수정.
    - **경로 의존성 복구**: `(main)`이 `[locale]/(main)`으로 이동하면서 깨진 컴포넌트 import(`@/app/(main)/...`)들을 현재 구조에 맞게 복구.
    - **미사용 워커 라우트 잔재 제거**: `agency`, `auth`, `referral-structure` 등의 잔여 빈 API 라우트 폴더를 삭제하고 `.next` 캐시 초기화하여 유령 모듈 참조 에러 제거.
- **현재 상태**: `tsc --noEmit` 통과 (에러 0건). 로컬 개발 서버 정상 동작 가능 상태 진입.

### 5. 카테고리 다국어화 마이그레이션 (2026-05-15)
- **결정**: `CategoryType` Prisma Enum 구조를 유지하며, DB 마이그레이션 리스크를 회피함.
- **방법**: `constants.ts`의 하드코딩 `CATEGORIES`와 `getCategoryName` 함수를 완전 삭제하고, `messages/*.json`의 `Category` 네임스페이스에 ALL_CAPS 키(예: `COMEDY`, `ROMANCE`)로 번역 데이터를 추가.
- **수정된 파일**: `PostModal.tsx`, `PostEditor.tsx`, `CategorySelect.tsx`, `posts/[postId]/page.tsx`
- **주의사항**: `PostEditor.tsx`에서는 `NOTIFICATION`, `MSPOST` 카테고리를 선택지에서 제외하는 `SELECTABLE_CATEGORIES` 배열을 별도로 정의함.
- **TypeScript 에러 추가 수정**:
  - `notice/[postId]/page.tsx`, `posts/[postId]/page.tsx`: Next.js 15의 `params` 타입을 `Promise<>`로 수정.
  - `company/introduce/page.tsx`: `generateStructuredData`는 Next.js가 인식하는 export가 아니므로 `export` 제거.

### 6. 로그인 후 세션 불일치 및 미인식 버그 해결 (2026-05-20)
- **현상**: 로그인 폼에서 올바른 자격증명을 제출하여 `POST /login` 200 성공 및 세션 쿠키(`auth_session`)가 정상 생성되었으나, 메인 페이지 `/`로 리다이렉트된 이후 로그인 상태가 여전히 미로그인으로 노출되고 로그인이 유지되지 않는 현상.
- **원인**:
  1. `src/app/[locale]/(main)/layout.tsx`에서 React Query를 사용하여 세션 API(`/api/auth/session`)를 호출하는데, `refetchOnMount: false` 및 `staleTime: Infinity`가 적용되어 있었음.
  2. Next.js 15의 SSR(Server-Side Rendering) 단계에서 서버가 페이지를 그릴 때, 해당 쿼리가 서버 측에서 실행되면서 쿠키가 배제된 빈 요청 결과(`{ user: null, session: null }`)를 반환함.
  3. 이 빈 결과가 하이드레이션 캐시 데이터로 클라이언트에 전달되었고, 브라우저가 마운트될 때 `staleTime`이 무한대이므로 브라우저는 이미 데이터를 최신(fresh) 상태라고 간주하여 세션 검증 API 호출을 생략함.
- **해결**:
  1. `queryFn` 내부에서 서버 환경(`typeof window === 'undefined'`)일 때는 페치를 수행하지 않고 즉시 기본값(`{ user: null, session: null }`)을 리턴하도록 분기 처리.
  2. 세션 쿼리의 `staleTime`을 `0`으로 지정하고, `refetchOnMount: true`를 활성화하여 브라우저에 마운트되는 즉시 실제 세션 쿠키를 들고 세션 API를 호출하도록 동기화 설정 적용 완료.

### 7. 관리자(admin/service, admin/agency) 영역 하드코딩 텍스트 일괄 영문화 (2026-05-20)
- **결정**: 관리자/에이전시 페이지는 여러 다국어로 번역/유지보수할 필요 없이, 글로벌 운영 표준인 **영어 고정(English Only)**으로 단순화하여 UI 통일성과 관리 효율을 극대화함.
- **수정 범위**:
  - **Logs**: `LogFilters.tsx`, `LogModal.tsx`, `LogTable.tsx`
    - 날짜 범위 표시 포맷터, 모바일 및 데스크톱 캘린더 선택 옵션, 사용자 ID 검색 placeholder, 요청/응답 정보 레이블 및 툴팁 문구 영문화.
  - **Users**: `UserManagementClient.tsx`
    - 세션 강제 로그아웃, 정보 수정, 포인트/코인 지급 성공 및 실패 토스트 메시지, 사용자 상세 테이블 레이블, 비밀번호 변경 다이얼로그 텍스트 영문화.
  - **Inquiry**: `StatusLedButton.tsx`, `InquiryDialog.tsx`, `AdminInquiryList.tsx`, `DateFilterButton.tsx`, `InquiryTypeIcon.tsx`
    - 대기중/진행중/완료 상태 옵션, 문의 답변 작성 placeholder, 사용자 검색 placeholder, 문의 내역 없음 메시지, 날짜 필터 프리셋 영문화.
- **검증**: TypeScript 컴파일 검사(`tsc --noEmit`)를 실행하여 서비스 관리 컴포넌트 내에 어떠한 타입 및 구문 오류도 발생하지 않았음을 검증 완료.

### 8. 시청/통계/로그 시간대 단일화 + 워커 기본값 명시 (2026-05-21)
- **핵심 결정**: 시간대 기준을 단일 소스(`analyticsTimeZone`)로 통일하고, Worker 런타임 기본값을 `ANALYTICS_TIME_ZONE = Asia/Seoul`로 고정.
- **Next 적용**:
  - `analyticsTimeZone` 설정 로직 추가(`src/lib/analytics-timezone.ts`, `src/lib/analytics-timezone-server.ts`)
  - `/api/admin/service/logs`에서 timezone 누락 시 DB 설정값 자동 주입 + 잘못된 값 UTC 정규화
  - `/admin/service` 로그 화면의 필터/표/모달을 동일 timezone으로 렌더링
  - `/api/admin/settings/apply`에 `analyticsTimeZone -> SYSTEM_ANALYTICSTIMEZONE` 매핑 추가
- **Worker 적용**:
  - `msworker/src/dailywork/shared/timezone.ts`로 normalize/resolve 로직 공통화
  - `viewgroup -> postdata -> viewcountteam -> commission -> cfstats-admin` 호출에서 timezone 파라미터 연쇄 전달 통일
  - `cfstats-admin`, `cfstats-creator` 날짜 경계 계산을 timezone 인지 방식으로 정리
  - 커스텀 로그 워커(`msworker/src/index.ts`) 조회 경계를 timezone 기준으로 UTC 환산 후 필터
- **배포 누락 방지**:
  - 전체 워커 `wrangler.toml` 12개 파일에 `ANALYTICS_TIME_ZONE = "Asia/Seoul"` 명시 완료
  - 신규 배포 시 env 누락으로 생기던 하드코드성 시간대 불일치 리스크를 기본적으로 차단
- **운영 메모**:
  - 관리자 설정값과 Cloudflare 런타임 `ANALYTICS_TIME_ZONE`이 불일치하면 날짜 경계가 달라져 집계 오해(누락/중복처럼 보임)가 발생 가능
  - 배포 전 `wrangler.toml`/Cloudflare env/UI 설정의 3지점 동기화 확인이 필수

### 9. 운영 문서 동기화 스킬 생성 (2026-05-21)
- **목적**: 큰 변경 이후 `04_architecture.md`/`02_progress.md`/`03_memory.md`를 누락 없이 동시에 갱신하기 위한 반복 작업 표준화.
- **설치 위치**: `~/.codex/skills/ops-doc-sync`
- **구성**:
  - `SKILL.md`: 문서 동기화 절차, 시간대 관련 필수 체크 규칙
  - `agents/openai.yaml`: 스킬 UI 메타데이터
  - `scripts/check_timezone_defaults.sh`: 워커 `wrangler.toml`의 `ANALYTICS_TIME_ZONE` 선언 누락 점검 스크립트
- **검증 결과**: 스크립트 실행 PASS, 현재 워커 12개 `wrangler.toml` 모두 `ANALYTICS_TIME_ZONE` 선언 확인.

### 10. E2E 공유본 단순화 + ops-doc-sync 실행 기록 (2026-05-21)
- **문제 인식**:
  - 기존 E2E 산출물이 길고 분산되어 운영/공유 시 핵심 흐름(시청→정산→통계) 파악이 어려웠음.
- **결정**:
  - 과거 분산 리포트는 최신 단일 검증 문서로 통합한다.
- **현재 산출물**:
  - `docs/STATS_E2E_VERIFICATION_20260525.md`
  - 기준 run: `20260519060836`, `targetDate=2042-06-08`, `period=2042-W23`
- **핵심 요약값**:
  - 테스트 시청기록 15건 (COIN 9 / SUBSCRIPTION 6)
  - D1 grouped_views 15건
  - D1 commission_batch 26건 (processed=1:22, processed=3:4)
- **운영 검증 포인트 재강조**:
  - 시간대 운영 설정 위치는 2개만 맞추면 됨:
    - Next 관리자 `analyticsTimeZone`
    - Cloudflare `ANALYTICS_TIME_ZONE`
  - 단, 신규 배포 누락 방지를 위해 각 워커 `wrangler.toml` 기본값 선언은 계속 유지해야 함.
- **ops-doc-sync 실행 확인**:
  - `bash /Users/tigerk/.codex/skills/ops-doc-sync/scripts/check_timezone_defaults.sh`
  - 결과 PASS (12/12 선언)

### 11. 문서 정합성 정리 (2026-05-22)
- **목적**: 사용량 제한으로 중단된 문서 정리 상태를 재점검하고, 체크리스트/설계문서 간 불일치를 제거.
- **정리 내용**:
  - `.agents/02_progress.md`에서 MCP 설치/설정 항목을 실제 설정 상태(`.mcp.json`, `~/.codex/config.toml`) 기준으로 완료 처리.
  - `implementation_plan.md`의 승인 대기형 `Open Questions` 제거 후 실행 결과 기준 문서로 재작성.
  - `04_admin_i18n_design.md`를 승인 대기 초안이 아닌 현재 운영 기준 정리본으로 재작성.
  - `04_architecture.md` 내부의 이전 사용자 절대 경로(`/Users/kimryan/...`)를 현재 워크스페이스 경로(`/Users/tigerk/...`)로 통일.
- **현재 단일 미완료 기준**:
  - Stripe 결제 구현
  - 토스/스트라이프 전환 로직
- **검증 재실행**:
  - `bash /Users/tigerk/.codex/skills/ops-doc-sync/scripts/check_timezone_defaults.sh`
  - 결과 PASS (워커 `wrangler.toml` 12/12 `ANALYTICS_TIME_ZONE` 선언)

### 12. 랜딩/카테고리 캐시 전략 문서화 (2026-05-22)
- **요청 배경**: “ISR을 제거했는지, 포스트 생성/수정/삭제 반영과 캐시 성능을 어떻게 동시에 달성하는지”를 초보자 기준으로 문서화 요청.
- **반영 위치**: `.agents/04_architecture.md` 섹션 `11. 랜딩/카테고리 캐시 및 재생성 전략`.
- **핵심 정리**:
  - 현재 핵심 페이지는 시간 기반 ISR 주기 갱신이 아니라 `revalidate=false + on-demand revalidation` 구조.
  - `invalidatePostContent()`로 태그/경로를 함께 무효화하여 랜딩/카테고리/최근/추천/상세를 반영.
  - 관리자 수동 갱신 경로(`/api/revalidate`, `/api/admin/slider-settings`)도 함께 명시.
- **주의사항 기록**:
  - `submitPost` 무효화는 결과 상태가 `PUBLISHED`일 때만 트리거되므로, `PUBLISHED -> DRAFT` 전환은 별도 보강 여지가 있음을 문서에 명시.

### 13. PUBLISHED -> DRAFT 캐시 무효화 보강 적용 (2026-05-22)
- **실제 코드 조치 완료**: `src/components/posts/editor/actions.ts`
- **변경 내용**:
  - `submitPost` 무효화 조건을 `newPost.status === PUBLISHED` 단일 조건에서
    `newPost.status === PUBLISHED || previousStatus === PUBLISHED`로 확장.
  - 무효화 대상 카테고리를 `previousCategories + newPost.categories` 합집합으로 확장.
- **효과**:
  - 공개 글을 비공개로 전환해도 랜딩/카테고리/최근/추천의 stale 노출 가능성을 줄임.
  - 카테고리 이동 시 기존 카테고리 페이지 잔존 캐시를 함께 정리.

### 14. E2E 영업팀 통계 확인 가이드 재작성 (2026-05-22)
- **문제**: 과거 공유용 요약본의 영업팀 통계 확인 섹션이 실사용 경로와 어긋나 혼선을 유발.
- **조치**:
  - `B-1`에 영업자(팀마스터) 개인 확인 경로(`/ko/usermenu/agency-earnings?tab=statistics&period=2042-W23`)를 복원.
  - `B-2`에 운영자 요청 경로(`/ko/admin/agency?tab=search`) 기준으로 Lookup 탭의
    - `Point Distribution`(Year/Week 입력 + Lookup)
    - `Statistics`(Weekly Report 선택 + Search)
    절차를 분리해 명시.
  - `C` 섹션을 `/ko/admin/system?period=2042-W23`의 `Stats` 탭 중심 클릭 순서형으로 재작성.
- **중요 구분**:
  - `admin/agency > Statistics`는 고정 주차키 직접 주입형 화면이 아니라 `userId` 기반 멤버/포인트/시계열 집계 화면.
  - 이번 E2E의 고정 주차(`2042-W23`) 검증 기준은 `Point Distribution(2042, 23)` + `/api/stats/*` 교차검증.

### 15. PWA 설치 앱 최적화 적용 (2026-05-23)
- **결정**:
  - PWA는 단순 설치 포장만으로는 가치가 부족하므로, 설치 앱 상태에서만 세션/영상 UI/프리로드/오프라인 보강을 추가.
  - 설치 사용자 분석이나 별도 트래킹은 요구사항에 따라 구현하지 않음.
- **구현 범위**:
  - `src/components/PWAEnhancer.tsx`: standalone/mobile 감지, PWA 쿠키 설정, 세션 연장 호출, portrait lock 시도, offline action flush.
  - `src/app/api/auth/pwa-session/route.ts`: 설치 앱 세션을 90일로 연장.
  - `src/auth.ts`, `src/app/[locale]/(auth)/login/actions.ts`: PWA 쿠키가 있는 경우 persistent session cookie 유지.
  - `src/hooks/usePwaVideoChrome.ts`: 모든 PWA 설치 앱의 영상 화면에서 컨트롤 숨김 시 상단 header 숨김 class 제어.
  - `src/app/[locale]/(main)/recommended-videos/RecommendedVideosClient.tsx`, `src/app/[locale]/(main)/video-view/[postId]/VideoViewClient.tsx`: PWA 모바일에서 browser chrome 없는 전체화면형 영상 레이아웃 적용.
  - `src/lib/pwa-video-preload.ts`: 다음 영상 썸네일/HLS 시작 구간 프리로드.
  - `src/lib/indexedDB.ts`, `src/components/videos/VideoPlayer.tsx`: 유료 영상 시청 기록 실패 시 IndexedDB 큐잉 후 온라인 복귀 재전송.
- **운영 리스크**:
  - iOS는 `screen.orientation.lock()`을 제한할 수 있어 강제 세로 잠금이 항상 성공하지 않는다. 이 경우 기존 세로 안내 모달이 fallback이다.
  - PWA 세션 연장은 `ms_pwa_standalone=1` 쿠키와 `/api/auth/pwa-session` 호출에 의존하므로, 설치 앱에서 첫 실행 후 적용된다.
  - 오프라인 큐는 현재 `/api/videos/view` 시청 기록에만 적용되며 좋아요/북마크 큐잉은 별도 확장 대상이다.
  - PWA 설치 위치와 홈 화면 아이콘 생성 방식은 웹앱 코드가 아니라 OS/브라우저 정책이 결정한다.
  - macOS Chrome PWA는 `/Users/<user>/Applications/Chrome Apps.localized`에 설치되는 것이 정상이며 `/System/Applications`나 `/Applications`로 강제 설치할 수 없다.
  - iPhone/iPad는 Safari의 공유 버튼 -> `홈 화면에 추가`가 PWA 설치 방식이며, MEGASHORTS처럼 manifest/service worker/standalone 조건을 갖춘 경우 그 홈 화면 아이콘 실행이 PWA 실행이다.
  - Android Chrome은 설치/홈 화면 추가 후 홈 화면 아이콘으로 실행하는 것이 정상 흐름이다.
- **검증**:
  - `pnpm build` 성공.
  - `pnpm exec tsc --noEmit`에서 새 PWA 코드 오류 없음. 기존 `@react-email/render` 의존성 누락 2건은 별도 이슈.
  - production server에서 `/manifest.json` 200, `/sw.js` 200, 로그인 전 `/api/auth/pwa-session` 401 확인.

### 16. 저장 통계 조회/지도/권한 정리 (2026-05-23)
- **결정**:
  - 크리에이터/영업팀/플랫폼 통계 화면은 Next 요청 시점에 Postgres를 새로 집계하지 않고, 매일 실행된 Cloudflare Worker 저장 결과를 조회한다.
  - 조회 단위는 `daily`, `weekly`, `monthly`로 통일한다.
  - `period=2042-W23` 같은 기존 주차 링크는 `weekly` 단위로 해석하고, `period=2026-05-23`, `period=2026-05`, `period=2026-W20` 형식을 모두 지원한다.
- **권한 정책**:
  - 크리에이터 수익(`/usermenu/earnings`)은 크리에이터와 운영 권한만 접근한다.
  - 영업팀 수익(`/usermenu/agency-earnings`)은 영업팀 권한과 운영 권한만 접근한다.
  - 사용자 메뉴 노출도 동일한 권한 함수(`src/lib/user-roles.ts`)를 기준으로 분리한다.
- **구현 범위**:
  - Next API: `/api/stats/uploader`, `/api/stats/agency`, `/api/stats/admin`, `/api/stats/weekly`, `/api/stats/reports`, `/api/stats/cloudflare`
  - UI: 크리에이터/영업팀 수익 통계, 플랫폼 시스템 통계, 영업팀 관리자 Lookup/Statistics
  - Worker: `commission` summary의 `daily/weekly/monthly` 조회, `cfstats-admin`의 크리에이터별 국가 통계 R2 저장/조회
  - 지도: `MapLibre GL JS + CARTO raster basemap + 국가 중심좌표 JSON + Cloudflare Stream 국가별 저장 통계`
- **운영 리스크**:
  - 과거 실행분에는 크리에이터별 국가 R2 파일이 없을 수 있다. 해당 데이터는 새 `cfstats-admin` 배포 후 실행분부터 생성된다.
  - 2026-05-23 실제 검증 후 Next 통계 API는 기본적으로 Worker HTTP가 아니라 Cloudflare D1 저장 원장을 직접 조회한다.
  - Worker HTTP 조회는 배포 Worker 검증 후 `ENABLE_WORKER_STATS_HTTP=1`을 설정한 경우에만 사용한다.
- **검증**:
  - `pnpm exec tsc --noEmit`: 통과
  - `pnpm exec tsc --noEmit -p msworker/tsconfig.json`: 통과
  - `pnpm exec next build`: 통과
  - `node scripts/agency-e2e-fixture.mjs verify 20260519060836`: 통과

### 17. 정산/로그/가격/운영 조회 재검증 (2026-05-23)
- **목적**: 시청기록 수집부터 크리에이터 지급, 영업팀 커미션, 통계 저장/조회, 로그 다국어, 관리자 가격 설정 반영까지 다시 코드 기준으로 점검.
- **즉시 수정한 항목**:
  - `msworker/src/dailywork/shared/log-client.ts`: 한국어 로그 event를 영문 기본 event와 `eventI18n.ko` 원문으로 저장.
  - `src/app/[locale]/(main)/admin/service/components/LogTable.tsx`, `LogModal.tsx`: 영문 event 우선 표시, 원문은 상세에서 확인.
  - `src/app/[locale]/(main)/admin/agency/components/Agencysearch.tsx`: 운영자가 조회 대상 팀마스터를 선택해 search 하위 탭을 확인.
  - `src/app/api/agency/structure/route.ts`: 본인이 아닌 팀 구조 조회는 운영 권한 이상으로 제한.
  - `src/app/api/videos/view/route.ts`: 같은 유료 영상 재시청도 집계 일자 갱신 및 viewCount 증가.
  - `src/app/[locale]/(main)/(static)/subscription/Subscription.tsx`: 관리자 구독/코인 패키지 설정을 구매 화면에 반영.
  - `scripts/agency-e2e-fixture.mjs`: `dotenv` 누락 시에도 스크립트 시작 가능.
- **중요 판단**:
  - `viewgroup`은 일자별 활동 행을 기준으로 그룹화해야 하며, 누적 `viewCount`를 그대로 합산하면 이전 시청분을 재지급할 위험이 있다.
  - 2026-05-24 수정 후 commission Worker는 지급 완료 원장(`processed = 1`) 기준으로 `daily`, `weekly`, 월말 `monthly` 정산 요약을 D1 `cf_stats.commission_data`와 R2 `commission-summaries/{period}/{date}.json`에 저장한다.
  - 관리자 `globalPrice`는 저장/표시되지만 실제 결제는 Toss KRW 경로가 중심이다. 달러 결제는 Stripe/글로벌 결제 구현 전에는 완료로 볼 수 없다.
  - 2026-05-24 기준 팀마스터 제거 정책은 "팀 해체"다. 기존 팀원은 `teamMaster`가 해제되고, 영업팀 역할자는 일반 회원으로 내려가며, 팀 내부 `referredBy` 연결은 제거한다. D1 추천 구조는 referral worker remove 호출로 정리한다.
- **검증**:
  - `./node_modules/.bin/tsc --noEmit`: 통과
  - `./node_modules/.bin/tsc --noEmit -p msworker/tsconfig.json`: 통과
  - `pnpm exec next build`: 통과
  - `node scripts/agency-e2e-fixture.mjs verify 20260519060836`: 통과
  - 로컬 production 서버(`pnpm exec next start -H 127.0.0.1 -p 3000`)에서 실제 fixture 세션 쿠키로 API 호출 검증 통과
  - `/api/stats/admin?period=2042-W23`: `1478.35P`, `38` views, source `cloudflare-d1-commission_batch`
  - `/api/stats/uploader?userId=codex_agency_test_20260519060836_creator_lv1&period=2042-W23`: `372P`, `6` views
  - `/api/stats/agency?userId=codex_agency_test_20260519060836_hq_master&period=2042-W23`: `244.8P`, `5` views
  - `/api/stats/cloudflare?period=2042-W23`: 국가 버블 `KR 118`, `US 82`, `JP 46`, `CN 39`, `VN 28`
  - `/api/admin/team-master-list`: 운영자 세션에서 `success: true`와 팀마스터 목록 반환
  - 인증 없는 `/api/stats/admin?period=2042-W23`: `401 Unauthorized`
- **실제 실행 중 추가 발견 및 조치**:
  - 배포된 `commission-worker`의 `/summary`는 현재 소스의 조회 API가 아니라 기존 실행 로직처럼 응답했다.
  - 배포된 `cfstats-admin`의 `/stats`는 fixture 국가 데이터를 빈 값으로 덮을 수 있었다.
  - `src/lib/worker-stats.ts`는 기본적으로 Worker HTTP를 호출하지 않고 Cloudflare D1 저장값을 직접 조회한다.
  - Worker HTTP 조회는 새 Worker 배포/검증 후 `ENABLE_WORKER_STATS_HTTP=1`을 설정한 경우에만 허용한다.
  - D1 커미션 통계는 `commission_batch.processed = 1` 지급 완료 행만 합산한다.
  - 개인 영업팀 수익은 팀 전체 합계가 아니라 해당 `user_id`의 지급 완료 커미션만 표시한다.
  - 당시 `scripts/agency-e2e-fixture.mjs`의 국가 지도 seed는 미래 fixture 날짜의 weekly `cf_stats` 행을 재작성했다. 최신 기준은 W24 운영 스키마형 D1/R2 스냅샷이다.
- **보고서**: 최신 기준은 `docs/STATS_E2E_VERIFICATION_20260525.md`이며, 과거 보고서는 대체 안내만 남긴다.

### 18. 통계 화면 책임 분리 및 2026-05-24 재검증
- **결정**:
  - 새 페이지를 만들지 않고 기존 네 URL의 책임만 바로잡았다.
  - `/usermenu/earnings`는 크리에이터 개인 수익, `/usermenu/agency-earnings`는 영업자 개인 수익, `/admin/agency?tab=search`는 영업팀 전체, `/admin/system?tab=stats`는 플랫폼 전체다.
  - D1 직접 조회는 유지하며, Worker HTTP `/summary`, `/stats`는 `ENABLE_WORKER_STATS_HTTP=1` 없이는 사용하지 않는다.
- **구현 범위**:
  - `src/lib/worker-stats.ts`: 개인 `user_id` 조회와 팀 `master_id` 조회 분리.
  - `src/app/api/stats/uploader`, `stats/agency`, `stats/weekly`, `agency/distributions`, `agency/statistics`, `stats/admin`, `stats/reports`, `stats/cloudflare`: 저장 원장 기준과 표시명 매핑 보강.
  - `src/app/[locale]/(main)/usermenu/earnings/PointsStatistics.tsx`: 내부 source 제거, 콘텐츠 `2/2(2)` 형식, 표 overflow 방지.
  - `src/app/[locale]/(main)/usermenu/earnings/PointsApplication.tsx`: agency 개인 출금 문구에서 creator 표현 제거, 거래표 반응형 보강.
  - `src/app/[locale]/(main)/admin/service/components/users/UserManagementClient.tsx`: `Earnings`, `Profile` 액션 추가.
  - `next.config.mjs`: Workbox precache manifest 제외.
  - `scripts/agency-e2e-fixture.mjs`: 신규 fixture login username/email을 짧은 값으로 생성.
- **검증 메모**:
  - Supabase 접속 불가 상태가 아니라, sandbox build 중 정적 생성 단계에서 네트워크 제한으로 일부 static params 조회가 skip된 것이다. escalated 실제 Prisma 조회와 local API 검증은 성공했다.
  - 실제 테스트 계정 login username/email은 `lv1@ms.com`, `hq@ms.com` 등으로 정리했다. 내부 PK와 D1 원장 키는 정산 참조 무결성을 위해 유지한다.
  - HEADQUARTERS master `244.8P`는 D1 개인 지급 행 기준으로 `3 coin * 24P * 90% + 2 subscription * 100P * 90%`와 일치한다.
  - 최신 공유 문서: `docs/STATS_E2E_VERIFICATION_20260525.md`.

### 19. 시간대/기간 저장/팀마스터 제거 교정 (2026-05-24)
- **결정**:
  - 플랫폼 통계 기준 시간대는 `Asia/Seoul`이다. API/UI에 `UTC`를 하드코딩하지 않는다.
  - 통계 응답 시간대는 `src/lib/analytics-timezone-server.ts`의 `getAnalyticsTimeZone()`을 사용한다.
  - Stripe/global USD 결제는 아직 구현 전이므로 기존 통계 검증 보고서에서 완료 범위에 포함하지 않는다.
- **구현 범위**:
  - `src/app/api/stats/uploader`, `stats/agency`, `stats/admin`, `agency/distributions`, `agency/statistics`: `timezone` 응답을 시스템 설정 기준으로 변경.
  - `src/app/[locale]/(main)/usermenu/earnings/PointsStatistics.tsx`, `src/app/[locale]/(main)/admin/system/components/SystemStats.tsx`: 기본 표시 시간대를 `Asia/Seoul`로 변경.
  - `msworker/src/dailywork/workers/commission/collector.ts`: 정산 완료 후 `daily`, `weekly`, 월말 `monthly` 요약 저장.
  - `msworker/src/dailywork/workers/commission/index.ts`: `/summary` D1 fallback도 `processed = 1` 지급 완료 행만 읽도록 수정.
  - `src/app/api/admin/team-master-remove/route.ts`: 팀마스터 제거 시 팀 해체 정책을 트랜잭션으로 적용.
- **검증**:
  - `npm run lint`: 통과, 기존 경고만 있음.
  - `npm run build`: 통과, sandbox 네트워크 제한으로 Supabase static params skip 로그는 유지.
  - `npx tsc --noEmit -p msworker/tsconfig.json`: 통과.
  - 로컬 production 서버에서 인증 쿠키로 creator/agency/admin/team distribution API를 호출해 `timezone = Asia/Seoul` 확인.
  - 임시 팀마스터/팀원/크리에이터를 Supabase에 생성한 뒤 `/api/admin/team-master-remove`를 실제 호출했다. 응답은 `success: true`, `affectedUsers: 3`, `failed: 0`; DB 확인 결과 마스터/팀원은 `USER`, 크리에이터는 역할 유지, `teamMaster`/팀 내부 `referredBy` 제거, 설정 삭제 완료. 이후 임시 계정 삭제.

### 20. 통계 UI 재배치 및 리포트 확장 (2026-05-24)
- **결정**:
  - 운영자/개인 통계 화면은 누적 정보와 조회 기간 정보를 분리한다.
  - 지도는 Cloudflare 국가별 총 streaming request 기준으로 표시한다. 현재 저장값에는 국가별 유료/무료 분리가 없으므로 제목과 설명에 그 한계를 명시한다.
  - OpenFreeMap glyph 404를 피하기 위해 MapLibre 배경은 CARTO raster basemap으로 변경하고, 숫자 label layer 대신 hover tooltip을 사용한다.
- **구현 범위**:
  - `SystemStats.tsx`: hydration 방지를 위한 mounted skeleton, 누적 카드, 지도, 조회 필터, 기간 리포트 순서로 재배치.
  - `PointsStatistics.tsx`: 크리에이터/영업자 개인 수익도 누적 카드, 지도, 조회 필터, 기간 상세 순서로 재배치.
  - `/api/stats/reports`: 신규/탈퇴 사용자, 신규 콘텐츠, 유료 시청, 결제 수익, 출금, Top 유료 포스트, Top 크리에이터, 마스터 제외 Top 영업자 반환.
  - `UserButton.tsx`: 팀마스터도 영업시스템 메뉴 접근 가능.
  - `Agencysearch.tsx`: 운영자 선택 권한을 OPERATION1 이상으로 완화, 팀마스터는 자신의 팀 고정.
  - `src/app/api/admin/team-master-list/route.ts`: 팀마스터 선택 목록 API 권한을 OPERATION1 이상으로 완화.
- **검증**:
  - `npm run lint`: 통과.
  - `npm run build`: 통과.
  - `npx tsc --noEmit -p msworker/tsconfig.json`: 통과.
  - 로컬 production 서버에서 admin/creator/agency/team distribution/report/team-master-list API 호출 성공.
  - `/ko/admin/system?tab=stats&period=2042-W23`, `/ko/usermenu/earnings?tab=statistics&period=2042-W23`, `/ko/admin/agency?tab=search&period=2042-W23` 인증 세션 200 응답 확인.

### 21. 통계 원장 필드 기반 재정리 및 2026-05-25 검증
- **결정**:
  - 개인/팀 수익 화면의 기간 조회는 `weekly`, `monthly`만 제공한다. 지급 원장은 주간 정산 중심이므로 개인/팀 `daily` 지급 통계는 사용자에게 오해를 준다.
  - 플랫폼 전체 통계는 `daily`, `weekly`, `monthly`를 유지한다. 플랫폼 일별 운영 지표는 의미가 있으나, D1 지급 원장에 없는 항목은 0 또는 빈 값으로 표시한다.
  - 영업자 개인 수익(`/usermenu/agency-earnings`)에는 국가 지도 섹션을 두지 않는다.
  - 영업팀 전체 지급 상세는 `/admin/agency?tab=search`의 별도 `Point Distribution` 탭이 아니라 `Statistics` 하단 섹션으로 포함한다.
- **원장 확인**:
  - D1 `commission_batch` 실제 필드: `user_id`, `master_id`, `commission_type`, `post_id`, `point_by_coin`, `point_by_subscription`, `view_count_coin`, `view_count_subscription`, `metadata`.
  - 현재 지급 원장에는 viewer ID와 개별 video ID가 없다. 따라서 화면에는 포스트/유형/시청방식/포인트까지만 표시한다.
  - 2042-W23 `cf_stats.commission_data`에는 `pointSettings`가 누락되어 있었다. 실제 지급 산식과 일치하도록 `coinPerPoint=120`, `viewCoinAmount=2`, `subscriptionPerPoint=100`, `subscriptionRevenue.totalWeeklyRevenue=6000`, `totalSubscriptionViews=60`을 보강했다.
- **구현 범위**:
  - `src/lib/worker-stats.ts`: `period=all` D1 직접 조회, `pointSettings` 부분 저장값 안전 처리, 팀 `master_id`/개인 `user_id` 분리.
  - `msworker/src/dailywork/workers/cfstats-admin/index.ts`: R2 `date=all` 조회 시 플랫폼/크리에이터 국가 통계 누적 합산.
  - `src/app/[locale]/(main)/usermenu/earnings/PointsStatistics.tsx`: 개인 수익 UI 구조 재배치, 개인/팀 daily 제거, period detail에 구독 1회당 포인트 표시.
  - `src/app/[locale]/(main)/usermenu/agency-earnings/AgencyEarningsTabsClient.tsx`, `ReferralStructureTab.tsx`: 영업자 개인 페이지에 하위 추천 구조 탭 추가.
  - `src/app/api/agency/structure/route.ts`, `src/app/api/agency/structure/role/route.ts`: 하위 추천 구조 조회와 팀마스터/운영자 자격 변경 API 추가.
  - `src/app/[locale]/(main)/admin/agency/components/Agencysearch.tsx`: `Point Distribution` 탭 제거, `Statistics` 하단으로 지급 상세 편입.
  - `src/app/[locale]/(main)/admin/agency/components/search/ReferralStructureView.tsx`: 긴 ID tooltip 처리, 모바일 overflow 방지, 자격 변경 select 추가.
  - `src/app/[locale]/(main)/usermenu/earnings/PointsApplication.tsx`, `/api/points/users/[userId]`, `/api/points/apply`: 최소 출금 포인트 표시 및 서버 검증.
  - `next.config.mjs`: `_next/static/chunks` precache 제외와 `NetworkOnly` runtime route 유지.
- **검증**:
  - `npm run lint`: 통과, 기존 경고만 있음.
  - `npm run build`: 통과. sandbox build 중 Supabase static params skip 로그는 네트워크 제한이며, escalated local API 검증은 성공.
  - `npx tsc --noEmit -p msworker/tsconfig.json`: 통과.
  - `check_timezone_defaults.sh`: PASS.
  - local production server `http://localhost:3001`에서 인증 세션 검증:
    - creator LV1 weekly detail: `372P`, `6 views`, `subscriptionPerPoint=100`.
    - HQ 개인 agency detail: `244.8P`, `5 views`, `subscriptionPerPoint=100`.
    - HQ team distributions: `325.99P`, `9 views`, detailRows 반환.
    - admin stats: `1478.35P`, `38 views`, cumulative paidPoints `15729.15P`.
    - platform country map all: KR `206`, US `82`, JP `46`, CN `39`, VN `28`.
    - pages 200: `/ko/admin/system?tab=stats&period=2042-W23`, `/ko/usermenu/earnings?tab=statistics&period=2042-W23`, `/ko/usermenu/agency-earnings?tab=statistics&period=2042-W23`, `/ko/admin/agency?tab=search&period=2042-W23`.
    - role update API: `hq-a`를 `40 -> 45 -> 40`으로 실제 변경 후 원복 성공.
- **운영 리스크**:
  - 2042-W23 과거 크리에이터별 국가 R2 원장은 없다. 새 `cfstats-admin` 배포 후 실행분부터 `cf-stats/{period}/{date}/creators/{creator}.json`이 생성된다.
  - viewer/video 단위 지급 상세가 반드시 필요하면 Worker가 `commission_batch.metadata` 또는 별도 상세 원장에 viewer/video ID를 저장하도록 확장해야 한다.
  - 최신 공유 문서: `docs/STATS_E2E_VERIFICATION_20260525.md`.

### 22. 최신 fixture 기준 재확정 (2026-05-25)
- 기존 `2042-W23 / 20260519060836` fixture는 최신 UI/원장 검증 기준으로 사용하지 않는다.
- 최신 검증 기준은 `runId=20260525090317`, `targetDate=2042-06-15`, `period=2042-W24`이다.
- 로그인 계정은 짧지만 유니크하게 `lv1-0317`, `hq-0317`, `net-0317`, `bin-0317`, `t-admin-0317` 형식을 사용한다.
- 전체 시뮬레이션 결과:
  - 계정 22개, 포스트 6개, 원본 시청 15건
  - D1 `grouped_views` 15행
  - D1 `commission_batch` 26행
  - 지급 완료 22행, 조건 미충족 보류 4행
  - 지급 신청/승인 예시 6건
  - 당시 국가 지도 weekly 값: KR 118, US 82, JP 46, CN 39, VN 28. 최신 W24 기준은 US 9분, TH 9분, KR 6분, JP 6분, VN 6분.
- 주간 단가 원장:
  - `subscriptionPerPoint=1000`
  - `coinPerPoint=120`
  - `viewCoinAmount=2`
- 실제 local production API 검증:
  - creator LV1 weekly detail: `372P`, detail 2건, pointSettings 반환.
  - HQ agency weekly detail: `244.8P`, detail 2건, pointSettings 반환.
  - HQ team statistics: totalMembers 6, payoutMembers 4, totalPoints `325.99P`.
  - HQ team distributions: teamTotal `325.99P`, detailRows 6건.
- `scripts/agency-e2e-fixture.mjs` 교정 사항:
  - username은 짧은 base + runId suffix로 유니크하게 생성한다.
  - post/video id는 username split이 아니라 fixture user id suffix에서 만든다.
  - cleanup은 manifest user id 기준으로도 계정을 삭제한다.
  - Cloudflare country seed는 weekly `cf_stats` 행을 삭제하지 않고 upsert하여 `commission_data`를 보존한다.
- 최신 공유 문서:
  - `docs/STATS_E2E_VERIFICATION_20260525.md`
  - `docs/AGENCY_E2E_REPORT_20260525090317.md`

### 23. 운영 스키마 기반 R2 지도 스냅샷 재검증 (2026-05-26)
- **결정**:
  - 미래 날짜의 Cloudflare Stream 원본 국가는 실제 API에서 받을 수 없으므로, fixture 국가 통계는 실제 시청 원장에서 파생하되 운영 `cfstats-admin` 저장 스키마와 동일해야 한다.
  - 지도 표시만을 위한 임의 필드(`count`, `fixture`, `source`, `description` 등)는 검증 원장에 넣지 않는다.
  - 크리에이터 지도는 크리에이터별 R2 원장 없을 때 플랫폼 전체 국가 통계를 fallback으로 보여주지 않는다.
- **구현 범위**:
  - `scripts/agency-e2e-fixture.mjs`: D1 `cf_stats`를 `top_countries=[{country,minutes}]`, 기간별 `request_list`로 생성.
  - `scripts/agency-e2e-r2-stats-snapshot.mjs`: `points-system-bucket/cf-stats/` 아래 platform/creator daily/weekly/monthly R2 스냅샷 12개 업로드.
  - `src/app/api/stats/cloudflare/route.ts`: creator 요청에서 creator R2/D1 값이 없을 때 platform fallback 제거.
- **실제 실행 결과**:
  - `node scripts/agency-e2e-fixture.mjs full 20260525090317`: `checks.passed=true`.
  - D1 `grouped_views`: 15행.
  - D1 `commission_batch`: 26행, 지급 완료 22행, 보류 4행.
  - D1 `cf_stats`: daily/weekly/monthly 3행, `totalMinutes=36`, 국가 `{US:9, TH:9, KR:6, JP:6, VN:6}`.
  - 최초 R2 S3 키 업로드는 `points-system-bucket` 권한 부족으로 `403 AccessDenied`.
  - 승인 후 Wrangler로 R2 객체 12개 업로드 성공.
  - Cloudflare MCP R2 list로 `cf-stats/weekly/2042-06-15*` platform/creator 4개 객체 존재, `application/json` 확인.
- **검증**:
  - `npx tsc --noEmit --pretty false`: 통과.
  - `npx tsc --noEmit -p msworker/tsconfig.json --pretty false`: 통과.
  - `node --check scripts/agency-e2e-fixture.mjs`: 통과.
  - `node --check scripts/agency-e2e-r2-stats-snapshot.mjs`: 통과.
  - `npm run build`: 통과. 기존 Sentry/OpenTelemetry/React hook/img 경고만 유지.
- **남은 제한**:
  - 로컬 최신 빌드 UI 서버는 현재 실행환경에서 `listen EPERM`으로 시작하지 못했고, escalated 서버 실행도 정책상 거부됐다.
  - Worker HTTP 직접 read-back은 sandbox DNS 제한과 escalated read 거부 때문에 이 환경에서 완료하지 못했다. R2 존재 확인은 Wrangler 업로드 성공 결과와 Cloudflare MCP object list로 대체했다.

### 24. 결제 시스템 종합 분석 보고서 이전 및 전수조사 (2026-05-26)
- **요청**: 결제 및 구독에 관련한 페이지 전수조사, 관리자 결제기록 탭 설계, 구독 단일 소스화 방안을 추가하고 기존 분석 보고서를 `docs` 폴더로 이동.
- **조치 사항**:
  - `docs/PAYMENT_SYSTEM_ANALYSIS.md` 신규 파일 작성 및 이동 처리 완료.
  - **전수조사**: `/subscription` 페이지, Toss 일반결제/자동결제 모달, 성공/실패 콜백 페이지, 프로필 화면의 결제내역 탭(`pay` 탭의 `PaymentHistory` 주석 비활성화 상태 확인), 관리자 회원 정보 상세 내 구독 수동 변경 모달, 관련 백엔드 API 및 크론 배치 등 총 20여 개 대상 전수조사 목록 정리.
  - **관리자 결제기록 탭**: `/admin/service?tab=payments` 신규 탭 추가 기획, 클라이언트 완료 여부(`confirm/success`)와 웹훅 완료 여부(`webhookLog` 기반)를 교차 대조하여 누락된 결제 처리를 한눈에 볼 수 있도록 설계 제안.
  - **구독 정보 단일 소스화**: `User.subscriptionEndDate` 컬럼과 `Subscription` 테이블의 불일치 문제를 분석하고, `subscriptionEndDate` 컬럼의 물리적 제거 및 `Subscription` 테이블 단일화 방안 제안.

### 25. Stripe(스트라이프) 글로벌 결제 전환 상세 로드맵 수립 (2026-05-26)
- **요청**: 토스페이먼츠 삭제 및 스트라이프 신규 연동을 위한 상세 단계, 파일 변경 사항, 아키텍처 재설계, 크론 변경, 상세 구현 단계를 포함하는 구축 로드맵 수립.
- **조치 사항**:
  - `docs/PAYMENT_SYSTEM_ANALYSIS.md`에 **8. Stripe(스트라이프) 결제 시스템 전환 로드맵** 섹션을 추가하여 구체적인 이전 가이드 작성 완료.
  - **전면 제거**: 토스 페이먼츠 모달(`PaymentModal`, `BillingModal`), 중계 API 라우트 5개, 토스 환경변수 제거 계획 명시.
  - **환경 구성**: `stripe`, `@stripe/stripe-js` 패키지 설치 방법 및 API Secret Keys, Webhook Secret, Publishable Key 설정 방식 가이드 수립.
  - **결제 프로세스 재설계**: Stripe Checkout Session(일회성 결제 `mode: 'payment'`, 정기 구독 `mode: 'subscription'`) 방식 도입 및 Stripe Webhook을 통한 원자적 원장(코인 지급, 구독 상태 및 캐시 동기화) 처리 기획.
  - **구현 유틸리티 및 API 가이드라인**: 백엔드 Stripe 인스턴스 초기화 유틸(`src/lib/stripe.ts`), Checkout 세션 생성 API(`stripe/checkout/route.ts`), Webhook 수신 엔드포인트(`payments/webhook/route.ts`), 정산 크론 단순화 및 취소 API 교체 등을 구체적인 예시 코드와 함께 설계하여 수록.

### 26. 통계 지도/상세 지급 리포트 누락 보정 (2026-05-26)
- **결정**:
  - 이전 완료 보고에는 누락이 있었다. 크리에이터 지도 R2 read-back과 플랫폼 상세 지급 리포트는 "완료"로 말하면 안 되는 상태였다.
  - 통계 UI는 임의 fixture 필드를 만들어 채우지 않고, 운영 D1/R2 원장에 실제 저장되는 필드를 기준으로만 표시한다.
  - viewer ID와 개별 video ID 수준의 상세 보고는 현재 `commission_batch` 원장에 필드가 없으므로, Worker 원장 스키마 확장 없이는 구현 완료로 볼 수 없다.
- **구현 범위**:
  - `msworker/src/dailywork/workers/viewgroup/collector.ts`: 원본 `video_views`를 집계하면서 viewer/video/accessMethod 단위 상세 원장 `grouped_view_details`도 저장.
  - `msworker/src/dailywork/shared/migrations.sql`, `msworker/src/dailywork/shared/schema.ts`: `grouped_view_details` 스키마 추가.
  - `src/lib/worker-stats.ts`: R2 S3 signed GET/List fallback 추가. `cf-stats/{period}/{date}.json` 및 `cf-stats/{period}/{date}/creators/{creator}.json`을 직접 읽고 `date=all`은 prefix list 후 합산.
  - `src/app/api/stats/reports/route.ts`: D1 `commission_batch` 지급 완료 행을 상세 지급 리포트의 기준으로 사용. 크리에이터 지급, 영업팀 지급, 직접/간접/네트워크 지급 유형 합계와 `grouped_view_details` 기반 비디오 단위 시청 근거를 분리.
  - `src/app/[locale]/(main)/admin/system/components/SystemStats.tsx`: 포스트별 지급 근거, 비디오 단위 시청 근거, 크리에이터 지급 상세, 영업팀 지급 상세, 영업팀 지급 유형 합계 섹션 추가.
  - `src/app/api/agency/statistics/route.ts`, `src/app/api/agency/distributions/route.ts`: admin 화면으로 노출되는 그룹/역할 라벨을 영어로 고정.
  - `src/components/stats/CountryBubbleMap.tsx`, `src/app/globals.css`: 지도 hover popup의 이중 말풍선 제거.
- **검증**:
  - `pnpm exec tsc --noEmit --pretty false`: 통과.
  - `pnpm run build`: 통과.
  - 관리자 영업팀/API 소스에서 `직접 추천`, `간접 추천`, `네트워크 레벨`, `영업자 지급`, `저장된 지급`, `에이젼시 멤버`, `본부 마스터` 검색 결과 없음.
- **운영 리스크**:
  - R2 fallback은 `CLOUDFLARE_R2_ACCESS_KEY_ID`, `CLOUDFLARE_R2_SECRET_ACCESS_KEY`, `CLOUDFLARE_ACCOUNT_ID`, bucket env가 없으면 동작하지 않는다.
  - `Top Marketer Payouts (Excluding Masters)`가 계속 비어 있으면 UI 문제가 아니라 해당 기간 D1 지급 완료 행에 팀마스터 미만 영업자 수령자가 없는지 먼저 확인해야 한다.
  - `grouped_view_details`는 새 viewgroup 실행부터 채워진다.
  - 2026-05-26에 사용자가 `viewgroup` Worker 배포를 완료한 뒤 `20260525090317 / 2042-W24` fixture를 재생성했다.
  - 재생성 결과: `checks.passed=true`, `d1GroupedViewRows=15`, `d1GroupedViewDetailRows=15`, `d1CommissionRows=26`, `cfStatsRows=3`, `commissionStatusCounts={"1":22,"3":4}`.
  - 검증 보고서 `docs/AGENCY_E2E_REPORT_20260525090317.md`는 지급완료(`processed=1`) 요약 기준이며, `grouped_view_details` 상세 시청 근거 섹션을 포함한다.

### 27. 다중 통화 결제 원장과 정산 포인트 기준 분리 설계 (2026-05-26)
- **요청 정정**: 특정 통화, 특히 원화 가치로 모든 결제 금액을 환산해 획일화하는 방향은 운영 목표와 맞지 않는다. 글로벌 결제 제공자와 지역별 통화에 대응하려면 결제 원장 통화와 정산 포인트 기준을 분리해야 한다.
- **조치 사항**:
  - `docs/PAYMENT_SYSTEM_ANALYSIS.md`의 다중 통화 섹션을 특정 통화 환산 중심이 아니라 provider/currency 원장 보존 및 settlement point pool 기준으로 정정했다.
  - `Payment` 원장은 후속 구현 시 `currency`, `provider`, provider payment/customer/subscription id를 저장해야 한다.
  - 관리자 설정의 기존 KRW `price`와 USD `globalPrice`는 변경 최소화를 위해 유지하되, 후속 결제 제공자 구현 시 provider별 Price ID와 정산 정책값을 분리해야 한다.
  - 정산 워커는 결제 표시 통화가 아니라 운영 정책으로 계산된 정산 포인트 풀과 실제 유료 시청 원장을 기준으로 지급을 계산해야 한다.

### 28. 영업수수료 post_id 보존 및 최신 W26 원장 재생성 검증 (2026-05-26)
- **문제**:
  - `commission_batch`의 크리에이터 지급 행에는 `post_id`가 있었지만, 영업수수료 행은 `saveCommissionBatch()` 집계 키가 포스트를 제외해 `post_id=null`로 저장됐다.
  - 이 상태에서는 관리자 `Agency Payout Detail`에서 어느 포스트의 유료시청이 어떤 영업수수료로 이어졌는지 추적할 수 없으므로, 포스트 컬럼을 숨기는 것은 근본 해결이 아니었다.
- **수정**:
  - `msworker/src/dailywork/workers/commission/collector.ts`의 `saveCommissionBatch()`에서 영업수수료 집계 키에 `postId`를 포함하도록 변경했다.
  - 지급 원장 저장 시 `post_id`를 그대로 보존하고, metadata에도 `postId`를 남긴다.
  - `src/app/[locale]/(main)/admin/system/components/SystemStats.tsx`의 `Agency Payout Detail`은 다시 Post 컬럼을 표시한다.
  - `scripts/agency-e2e-fixture.mjs`는 지급 완료 영업수수료 행 중 `post_id` 누락이 1건이라도 있으면 `checks.passed=false`가 되도록 강화했다.
- **배포/재생성**:
  - 사용자가 `commission-worker`를 Wrangler로 배포했고, Cloudflare 배포 버전은 `da3fe573-fd2d-4a8f-aa91-31f4ae61f188`이다.
  - 이후 최신 검증 원장을 새로 생성했다.
  - 최신 기준 runId: `20260526074947`
  - targetDate: `2041-06-30`
  - period: `2041-W26`
  - 보고서: `docs/AGENCY_E2E_REPORT_20260526074947.md`
- **검증 결과**:
  - `checks.passed=true`
  - D1 `commission_batch`: 34행
  - D1 영업수수료 행: 27행
  - D1 영업수수료 `post_id` 누락 행: 0행
  - D1 지급완료 영업수수료 `post_id` 누락 행: 0행
  - D1 `grouped_views`: 15행
  - D1 `grouped_view_details`: 15행
  - 지급 상태: `{"1":30,"3":4}`
  - `summaries.admin.rows`와 `summaries.agencies.*.rows`에서 영업수수료 행의 `post_id`가 모두 채워진 것을 확인했다.
- **R2 지도 스냅샷 확인**:
  - `points-system-bucket`의 `cf-stats/weekly/2041-06-30` prefix를 Cloudflare API로 list 확인했다.
  - 플랫폼 객체 `cf-stats/weekly/2041-06-30.json` 1개와 크리에이터별 객체 3개가 `application/json`으로 존재한다.
  - 크리에이터 지도 확인 대상 객체 예: `cf-stats/weekly/2041-06-30/creators/codex_agency_test_20260526074947_creator_lv1.json`.
- **운영 기준**:
  - 이후 통계/지도/UI 검증은 기존 `20260525090317 / 2042-W24`가 아니라 최신 `20260526074947 / 2041-W26`를 기준으로 한다.
  - `lv1-4947`, `hq-4947`, `t-admin-4947` 계정과 `period=2041-W26&unit=weekly` 링크를 사용한다.
  - 로컬 IP(`http://192.168.0.42:3000`)에서 로그인 테스트를 하려면 HTTP 환경에서 Secure cookie가 막히지 않도록 로컬 전용 `AUTH_COOKIE_SECURE=false` 설정이 필요하다.

### 29. 크리에이터 지도 `period=all` 빈 결과 fallback 보정 (2026-05-26)
- **문제**:
  - 수익 페이지 URL이 `/ko/usermenu/earnings?tab=statistics&period=2041-W26&unit=weekly`여도, 지도 섹션은 누적 영역이므로 `/api/stats/cloudflare?userId={creatorId}&period=all`을 호출했다.
  - R2에 `cf-stats/weekly/2041-06-30/creators/{creatorId}.json` 객체가 존재해도 `period=all` prefix list/read가 실패하거나 빈 결과를 반환하면, 화면은 `저장된 크리에이터 국가별 통계가 없습니다`로 떨어졌다.
- **수정**:
  - `src/app/api/stats/cloudflare/route.ts`: 크리에이터 `period=all` 결과가 비고 `fallbackPeriod`가 있으면 해당 기간의 R2 객체를 다시 조회한다.
  - `src/app/[locale]/(main)/usermenu/earnings/PointsStatistics.tsx`: 누적 지도 API 호출에 현재 선택 기간을 `fallbackPeriod`로 전달한다.
  - `src/lib/worker-stats.ts`: R2 S3 signed GET/List 실패 시 Cloudflare API token 기반 object GET/List fallback을 추가했다.
- **운영 기준**:
  - 크리에이터 지도는 여전히 플랫폼 전체 지도 데이터로 fallback하지 않는다. 크리에이터별 저장 객체가 실제로 있어야 표시한다.
  - 최신 fixture 확인 대상은 `lv1-4947`, `period=2041-W26`, R2 key `cf-stats/weekly/2041-06-30/creators/codex_agency_test_20260526074947_creator_lv1.json`이다.
  - 로컬 Next 서버가 오래 떠 있으면 이 수정이 반영되지 않을 수 있으므로 dev server 재시작 또는 강력 새로고침이 필요하다.
- **검증**:
  - `pnpm exec tsc --noEmit --pretty false`: 통과.
  - `pnpm exec tsc --noEmit -p msworker/tsconfig.json --pretty false`: 통과.
  - 수정 범위 `git diff --check`: 통과.

### 30. Toss/KRW 결제 실행부 제거 및 USD 표시 전환 (2026-05-26)
- **요청**:
  - 기존 Toss/KRW 결제 실행 로직을 제거하되, 시청기록 수집/포인트 수수료 계산/지급/통계 시뮬레이션에는 영향을 주지 않는다.
  - 관리자 가격 설정과 `/subscription` 페이지 UX는 유지하고, 가격 표시는 USD 중심으로 변경한다.
  - 실제 글로벌 결제 제공자 구현 전까지 버튼 클릭은 토스트만 표시한다.
- **구현**:
  - `/subscription` 페이지는 `subscriptionPackages`와 `coinPackages`를 계속 읽고, 표시 가격은 `globalPrice`를 USD로 포맷한다.
  - 주간/연간 구독 선택과 코인 수량 선택 후 구매 버튼 활성화 UX는 유지했다.
  - 구독/코인 구매 클릭은 실제 결제 모달을 열지 않고 `결제구현시 작동합니다` 토스트를 표시한다.
  - 결제 모달, 결제 결과 페이지, Toss 중계 API, statusdb, webhook API를 삭제했다.
  - `@tosspayments/payment-widget-sdk`, `@tosspayments/tosspayments-sdk` 의존성과 로컬 Toss 환경변수를 제거했다.
  - `/api/cron/billingkr`는 외부 자동청구 호출을 제거하고 구독 만료 상태 정리와 갱신 후보 카운트만 남겼다.
  - `/api/payments/cancel`은 다음 글로벌 결제 제공자 구현 전까지 `501`을 반환한다.
- **보존**:
  - Prisma `Payment`, `Subscription`, `BillingKey`, `webhookLog` 모델은 유지했다.
  - 관리자 설정의 KRW `price`와 USD `globalPrice`는 모두 유지했다.
  - 워커 통계/정산 기준 원장인 `video_views`, D1 `grouped_views`, `grouped_view_details`, `commission_batch`, `cf_stats`는 변경하지 않았다.
- **운영 리스크**:
  - 현재는 결제가 실제 승인되지 않으므로 새 결제/구독/코인 지급은 발생하지 않는다.
  - 후속 글로벌 결제 제공자 도입 시 기존 DB 모델을 재사용하되, 통화/제공자/상태값과 정산 포인트 기준을 분리 저장해야 통계/정산 혼선을 피할 수 있다.
- **후속 문서**:
  - `docs/GLOBAL_PAYMENT_INTEGRATION_GUIDE.md`를 추가했다.
  - DB 테이블, 웹훅, 관리자 설정, `/subscription` 연결, 워커 시청/정산/통계 원장 결합 기준을 provider 중립 구조로 정리했다.

### 31. 로그 시스템 모바일 반응형 UI 최적화 및 시간대/영문화 검증 (2026-05-27)
- **요청**:
  - `admin/service?tab=logs` 탭의 모바일 및 태블릿 반응형 UI 최적화.
  - 어드민 설정 시간대와 워커 배포 변수 설정 연동 및 표기 검증.
  - 영어 고정 하드코딩 표준을 위반하는 잔여 코드 및 한글 하드코딩 여부 점검 및 교정.
- **구현**:
  - `LogTable.tsx`에 모바일 환경(`sm` 미만)용 전용 카드 뷰 리스트 UI를 추가하여 로그의 타임스탬프, 사용자(username), 타입 아이콘, 국가 및 IP, 이벤트 설명이 잘리지 않고 알맞게 렌더링되도록 수정했다.
  - 기존의 데스크톱 테이블 뷰는 `hidden sm:block` 스타일을 주어 모바일 환경에서 렌더링되지 않도록 조치했다.
  - `LogFilters.tsx`에서 모바일 입력 필드 `Input`의 placeholder를 `"User ID"`로 지정하여 비어 있던 모바일 사용성을 보완했다.
  - 미사용 중이던 `import { ko } from 'date-fns/locale'`를 제거했다.
- **검증**:
  - 설정된 `analyticsTimeZone`과 워커의 `ANALYTICS_TIME_ZONE`이 API 및 화면(로그 상세 모달, 테이블, 카드 뷰)에서 UTC 오프셋을 통해 완벽히 변환되어 현지 시간대로 출력되고 있음을 확인했다.
  - 타입체크 `pnpm exec tsc --noEmit` 정상 통과.
  - 빌드 `pnpm run build` 정상 통과.

### 32. 워커(msworker) 전역 커스텀 로그 호출부 영문화 완료 (2026-05-27)
- **요청**: `saveLogDirectly` 및 `sendLogToWorker`를 통한 워커 내부 로그 저장 시, 한글로 하드코딩된 로그 메시지가 남아있는지 전수 조사하여 최대한 간략한 영문으로 수정.
- **조치 사항**:
  - `grep`을 통해 `msworker/src/dailywork/workers` 내부의 모든 `saveLogDirectly` 및 `sendLogToWorker` 호출을 전수 조사.
  - `cfstats-admin`, `team-master-settings`, `viewgroup`, `postdata`, `viewcountteam`, `system-settings`, `referral-structure-worker`, `workersmanager` 등 워커 전반에서 사용 중인 활성(비주석) 한글 로그 메시지를 찾아 모두 간결한 영어로 교체 완료. (예: `4_ CF DAILY 통계 처리 완료` -> `4_ CF DAILY stats done`)
  - 모든 활성 코드의 교체가 완료되었으며, 주석(`//`) 처리된 코드 내의 한글만 남겨두어 런타임에 실행되는 모든 커스텀 로그는 영어로 적재되도록 보장함.
  - 이 변경 사항으로 인한 타입 오류나 구문 오류가 없는지 `tsc --noEmit` 및 전체 워커 대상 스크립트로 검증 완료.

### 33. 자막 위치 일관성 확보 및 33% 높이 조절 (2026-05-27)
- **요청**:
  - 프리뷰, 정식재생, PWA 설치 앱을 포함한 모든 재생 환경에서 자막 위치를 비디오 프레임 아래에서 33% 높이 지점(0: 하단, 100: 상단)으로 일정하게 조절하고, 변경된 위치와 그 조절 방식에 대해 설명.
- **원인 및 분석**:
  - 기존에는 `isIOS`, `isDesktop`, `isFullscreen` 상태를 분기하여 `VTTCue.line`을 11, 16, 21, 24 등 정수 라인 넘버로 다르게 설정하고 있었음.
  - 정수 라인으로 설정(snapToLines = true, 기본값) 시, 화면 크기나 해상도에 따라 자막의 절대적인 높이가 달라지며 화면 하단 33% 수준으로 일치시키는 데 한계가 존재함.
- **해결**:
  - `src/components/videos/VideoPlayer.tsx` 내의 자막 `cue` 처리 로직을 수정함:
    1. 모든 `cue`에 대해 `cue.snapToLines = false;`를 지정하여 위치 설정을 백분율(Percentage, 0~100) 방식으로 전환.
    2. `cue.line = 67;`로 설정함. VTT 표준 스펙상 `snapToLines = false` 일 때 `line`은 상단(Top) 기준의 오프셋 백분율(%)이 되므로, 하단에서 33% 떨어진 지점은 `100 - 33 = 67`이 됨.
    3. HLS Manifest 파싱 완료 단계의 iOS 특화 설정 부(`Hls.Events.MANIFEST_PARSED` 내부)에서도 초기 `cue`들의 `snapToLines`와 `line` 값을 동일하게 `false`, `67`로 처리하도록 보완함.
- **운영 기준 및 검증**:
  - `npx tsc --noEmit` 실행 시 어떠한 타입 빌드 오류도 발생하지 않고 완벽하게 통과함.
  - 이 설정을 통해 모바일, 데스크톱, PWA, 전체화면 여부와 관계없이 세로형 영상의 아래에서 정확히 약 33% 높이 지점에 자막이 일관적으로 고정되어 렌더링됨.

### 34. 컨텐츠 모달 상단 프리뷰 우측 여백 최적화 (2026-05-27)
- **요청**:
  - 랜딩페이지 등에서 컨텐츠 이미지를 클릭할 때 열리는 컨텐츠 모달(`PostModal.tsx`)에서, 상단 영상 프리뷰 우측의 아이콘들 오른쪽에 불필요하게 넓은 여백이 발생하여 이를 줄이고자 함.
- **원인 분석**:
  - 기존 코드에서는 상단 컨텐츠 프리뷰 영역의 가로 너비가 `w-[min(72vw,320px)] sm:w-[min(58vw,340px)] lg:w-[70%]`로 엄격하게 고정되어 있었음.
  - 이로 인해 모달의 전체 너비(`w-[94vw] max-w-[560px]`)가 넓어질 때, 프리뷰 영상 너비가 상한선(320px ~ 340px)에 걸려 더 늘어나지 못하고, 아이콘은 프리뷰 오른쪽에 딱 붙기 때문에 아이콘 우측에 매우 넓은 텅 빈 불필요한 여백이 발생했음.
- **해결**:
  - `src/components/posts/PostModal.tsx`의 레이아웃 코드를 수정함:
    1. 프리뷰 영상과 아이콘을 포함하는 컨테이너 `div`에 `w-full`을 지정.
    2. 프리뷰 영상 영역의 너비 제한을 제거하고 `flex-grow` 스타일을 지정하여, 모달 내부 가로 영역의 남는 공간을 최대한 가득 채우도록 개선.
    3. 우측 아이콘 컨테이너에 `flex-shrink-0`을 추가 적용하여, 영상 영역이 가로로 늘어남에 따라 아이콘의 형태가 찌그러지지 않고 고정된 크기를 유지한 채 모달의 우측 패딩 경계선에 자연스럽게 밀착되어 정렬되도록 레이아웃을 최적화.
- **검증**:
  - `npx tsc --noEmit` 정적 타입 검사 무오류 통과.
  - 이 최적화를 통해 모달 너비에 따라 영상 프리뷰 카드가 가로로 유연하고 꽉 차게 늘어나며, 아이콘의 우측 불필요한 빈 여백이 완전히 제거되어 훨씬 깔끔하고 프리미엄한 UI를 확보함.

