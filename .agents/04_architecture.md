# MegaShorts 플랫폼 종합 아키텍처 및 해설 문서

이 문서는 MegaShorts 플랫폼의 전체적인 기술 구조, 인증 프로세스, 인프라 전략 등을 기록하는 마스터 문서입니다. 시스템이 확장됨에 따라 지속적으로 업데이트됩니다.

## 1. 영상 재생 및 권한 확인 프로세스 (Video Playback Flow)

현재 코드베이스(`PlayPermissionCheck.tsx`, `VideoPlayer.tsx`, `VideoViewClient.tsx`)에 구현된 **실제 동작 과정**입니다. 추측을 배제하고 100% 실제 동작하는 흐름만 기록합니다.

### 1-1. 스와이프 및 권한 검증 단계 (`PlayPermissionCheck.tsx`)
유저가 스와이프하여 새로운 영상을 볼 때마다 즉각적으로 발생하는 검증입니다.

1. **상태 및 구독 확인 (React Query 로컬 캐시)**
   - 프론트엔드는 로그인 시 가져온 `userAuth` 정보(React Query)를 확인합니다.
   - 성인 컨텐츠(`ageLimit >= 18`)인 경우: `userAuth.adultauth`가 없으면 즉시 **[성인인증 모달]**을 띄우고 재생을 막습니다.
   - 유료 컨텐츠(`isPremium === true`)인 경우: `userAuth.subscription.currentPeriodEnd`가 유효(현재 시간 이후)하면 즉시 영상을 재생합니다. (서버 통신 0초)

2. **코인 소모 및 소장 여부 확인 (DB 통신)**
   - 구독자가 **아닌** 유저가 유료 컨텐츠를 볼 때 발생합니다.
   - 프론트엔드는 즉시 서울 서버로 `fetch('/api/user/coinpay')` POST 요청을 보냅니다.
   - 서버는 DB를 확인하여:
     - **이미 구매한 영상인 경우**: `{ alreadyPurchased: true }`를 반환하고 즉시 재생을 허용합니다.
     - **처음 보는 영상인 경우**: 유저의 잔여 코인을 확인하고 1코인을 차감한 후, 구매 이력(DB 트랜잭션)을 생성하고 재생을 허용합니다.
     - **코인이 부족한 경우**: `{ success: false }`를 반환하여 프론트엔드가 **[코인 충전 유도 모달]**을 띄웁니다.
   - **현재 아키텍처의 특징(단점)**: 비구독자의 경우 이미 소장한 영상이라도 스와이프할 때마다 서울 DB 서버를 다녀와야 하므로, 미국 등 해외 유저는 재생 시작 전 200~500ms의 네트워크 지연(검은 화면 대기)이 발생합니다.

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

---

## 4. 프론트엔드 및 플랫폼 UI 구조

- **코어 스택**: Next.js 15 (App Router), React, TypeScript
- **스타일링**: Tailwind CSS, Shadcn UI (Radix 기반)
- **비디오 플레이어**: Cloudflare Stream + Swiper.js를 활용한 세로형 틱톡 스타일 무한 스크롤 인터페이스.
- **PWA (Progressive Web App)**: 
  - 유저 첫 방문 시 거슬리지 않는 하단 스낵바 형태로 "앱 설치"를 권유.
  - 설치 시 브라우저 UI(주소창)가 사라지고 세로 화면(Portrait)으로 고정되어 완벽한 네이티브 앱 경험 제공.
  - 서비스 워커를 통한 HLS 영상 세그먼트 백그라운드 사전 다운로드(Pre-fetching)로 로딩 없는 스와이프 구현.

---

## 5. 결제 및 정산 아키텍처 (Stripe 도입)

- 기존 하드코딩된 한국 전용 결제(토스)를 걷어내고 글로벌 표준인 **Stripe**로 일원화합니다.
- **다통화(Multi-currency) 정책**: Stripe의 자동 환전 기능을 활용하여 한국인에게는 원화(₩), 타국가에는 현지 통화로 가격을 보여주고 결제받아 환전 수수료에 대한 유저 거부감을 없애고 구매 전환율을 극대화합니다.
- **가격 연동**: 결제 모달에 표시되는 요금은 하드코딩이 아닌, DB(`SystemSettings`)에서 관리자가 설정한 가격을 동적으로 불러와 렌더링합니다.

*(본 문서는 개발 진행 및 아키텍처 확정에 따라 지속해서 내용이 추가됩니다.)*
