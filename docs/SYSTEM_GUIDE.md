# MegaShorts 플랫폼 종합 시스템 가이드

> **버전**: v1.0  
> **범위**: 프론트엔드, 백엔드, Cloudflare Workers, 데이터베이스, 캐시, 인증, 결제, 에이전시 정산 시스템 전반

---

## 목차

1. [시스템 기술 구성도](#1-시스템-기술-구성도)
2. [데이터베이스 해설](#2-데이터베이스-해설)
3. [시청 흐름 (구독/코인 결제 포함)](#3-시청-흐름-구독코인-결제-포함)
4. [포스트 CRUD 및 캐시 갱신 흐름](#4-포스트-crud-및-캐시-갱신-흐름)
5. [랜딩페이지 정적 구성 및 재생성 로직](#5-랜딩페이지-정적-구성-및-재생성-로직)
6. [워커 기반 시청기록 수집·포인트 지급·통계 수립](#6-워커-기반-시청기록-수집포인트-지급통계-수립)
7. [추천콘텐츠 페이지 구성 로직과 최적화 전략](#7-추천콘텐츠-페이지-구성-로직과-최적화-전략)
8. [세션·코인·구독정보 캐싱 전략과 메뉴 노출 로직](#8-세션코인구독정보-캐싱-전략과-메뉴-노출-로직)
9. [다국어(i18n) 및 SEO 전략](#9-다국어i18n-및-seo-전략)
10. [프론트엔드 및 플랫폼 UI 구조](#10-프론트엔드-및-플랫폼-ui-구조)
11. [보안 및 인증 아키텍처](#11-보안-및-인증-아키텍처)
12. [인프라 및 배포 전략](#12-인프라-및-배포-전략)
13. [에이전시 정산 시스템](#13-에이전시-정산-시스템)
14. [운영 상태 및 진행 현황](#14-운영-상태-및-진행-현황)
15. [Payment Provider 전환 상태](#15-payment-provider-전환-상태)
16. [Pricing 및 관리 설정 안정성](#16-pricing-및-관리-설정-안정성)
17. [로그 시스템 모바일 UI 및 검](#17-로그-시스템-모바일-ui-및-검증)
18. [E2E 시뮬레이션 검증 가이드](#18-e2e-시뮬레이션-검증-가이드)

---

## 1. 시스템 기술 구성도

### 1-1. 코어 기술 스택 및 중요검토사항

| 영역 | 기술 | 버전 |
|------|------|------|
| Frontend 프레임워크 | Next.js (App Router) | 15.5.18 |
| UI 라이브러리 | React | 최신 |
| 타입 시스템 | TypeScript | 최신 |
| 스타일링 | Tailwind CSS + Shadcn UI (Radix 기반) | - |
| ORM | Prisma | 최신 |
| 인증 | Lucia Auth | - |
| OAuth | Arctic (Google, Kakao, Naver) | - |
| 데이터베이스 (운영) | Supabase (PostgreSQL) | - |
| 데이터베이스 (워커) | Cloudflare D1 (SQLite) | - |
| 스토리지 | Cloudflare R2 | - |
| 비디오 호스팅 | Cloudflare Stream | - |
| 서비스워커 | Workbox (PWA) | - |
| 무한스크롤 | Swiper.js (Virtual + Mousewheel) | - |
| 상태관리 | React Query (TanStack Query) | - |
| 워커 런타임 | Cloudflare Workers | - |
| 배포 | Vercel | - |
| 모니터링 | Sentry | - |

### 중요 검토사항
- 넥스트 중요 보안이슈 중 현재 15.1.6버젼은 “CVE-2025-29927 Middleware 인증 우회”, “CVE-2025-66478 / React Server Components RCE”이 해당되어 15.5.18로 넥스트 버젼 변경 재설치
- 성인용 컨텐츠는 재생시 블락제어
- 사용자 페이지 다국어 구현 / 관리자 페이지 영문 고정
- 글로벌 반응시간을 위해 선재생 후 권한검증으로 블락
- 토스와 패들 결제솔루션은 모두 삭제하였고 구매페이지만 유지


### 사용자 역할 권한 정리

| 권한 숫자 | 권한 코드 | 한국어 명칭 | 영어 명칭 |
|---:|---|---|---|
| 10 | `USER` | MS멤버 | MS Member |
| 20 | `CREATOR_Lv1` | 크리에이터 Lv1 | Creator Lv1 |
| 22 | `CREATOR_Lv2` | 크리에이터 Lv2 | Creator Lv2 |
| 24 | `CREATOR_Lv3` | 크리에이터 Lv3 | Creator Lv3 |
| 26 | `CREATOR_Lv4` | 크리에이터 Lv4 | Creator Lv4 |
| 28 | `CREATOR_Lv5` | 크리에이터 Lv5 | Creator Lv5 |
| 30 | `CREATOR_Lv6` | 크리에이터 Lv6 | Creator Lv6 |
| 32 | `CREATOR_Lv7` | 크리에이터 Lv7 | Creator Lv7 |
| 34 | `CREATOR_Lv8` | 크리에이터 Lv8 | Creator Lv8 |
| 38 | `SUPPORTER` | 서포터 | Supporter |
| 40 | `TEAM_MEMBER` | 에이젼시 멤버 | Agency Member |
| 45 | `TEAM_AGENCY` | 에이젼시 마스터 | Agency Master |
| 48 | `TEAM_OPERATOR` | 본부 운영자 | HQ Operator |
| 50 | `TEAM_MASTER` | 본부 마스터 | HQ Master |
| 51 | `NATIONAL_MASTER` | 국가 마스터 | National Master |
| 52 | `MARKETING1` | 마케팅팀 | Marketing Team |
| 55 | `MARKETING2` | 마케팅 매니저 | Marketing Manager |
| 60 | `OPERATION1` | 운영팀 | Operations Team |
| 70 | `OPERATION2` | 운영팀 매니저 | Operations Manager |
| 80 | `OPERATION3` | 운영팀 마스터 | Operations Master |
| 90 | `EXECUTIVE` | 임원진 | Executive |
| 99 | `MASTER_ADMIN` | 최고 관리자 | Super Admin |

### 1-2. 아키텍처 레이어

```
┌─────────────────────────────────────────────────────────┐
│                    사용자 (브라우저/PWA)                    │
│  - 데스크톱 웹, 모바일 웹, PWA 설치앱                       │
│  - IndexedDB (videoDB): 시청기록·재생위치 로컬 저장          │
│  - localStorage: 뮤트상태·마지막 시청위치·언어설정           │
│  - Workbox 런타임 캐시: 정적자산·API응답·HLS세그먼트         │
└─────────────────────┬───────────────────────────────────┘
                      │
┌─────────────────────▼───────────────────────────────────┐
│                    Vercel (Next.js)                        │
│  ┌────────────────────────────────────────────────────┐  │
│  │  Server Components (RSC)                            │  │
│  │  - 랜딩페이지 (force-static + unstable_cache)        │  │
│  │  - 카테고리/최신/추천 페이지                         │  │
│  │  - 포스트 상세 페이지                                │  │
│  │  - API Routes (auth, coinpay, videos/view, stats)   │  │
│  │  - 미들웨어 (locale routing, session 보호)            │  │
│  └────────────────────────────────────────────────────┘  │
│  ┌────────────────────────────────────────────────────┐  │
│  │  Client Components                                  │  │
│  │  - SessionProvider (React Query)                     │  │
│  │  - PlayPermissionCheck (시청권한 검증)                 │  │
│  │  - VideoPlayer (Cloudflare Stream 재생)              │  │
│  │  - RecommendedVideosClient (스와이프 피드)            │  │
│  │  - PWAInstallPrompt / PWAEnhancer                   │  │
│  └────────────────────────────────────────────────────┘  │
└──────────┬──────────────────────────┬────────────────────┘
           │                          │
┌──────────▼──────────┐    ┌──────────▼──────────────────┐
│   Supabase (PostgreSQL)│    │  Cloudflare Infrastructure   │
│  - User, Post, Video  │    │  - Stream (비디오 호스팅)      │
│  - VideoView, Session │    │  - R2 (통계 스냅샷, 로그)      │
│  - SystemSetting      │    │  - D1 (grouped_views,         │
│  - PointWithdrawal    │    │         commission_batch,     │
│  - Payment, BillingKey│    │         cf_stats,             │
│  - PointWith...       │    │         grouped_view_details) │
└─────────────────────┘    │  - Workers (viewgroup,         │
                           │    commission, cfstats-admin,   │
                           │    cfstats-creator, postdata,   │
                           │    referral-structure,          │
                           │    system-settings,             │
                           │    team-master-settings,        │
                           │    viewcountteam)               │
                           └───────────────────────────────┘
```

### 1-3. 라우팅 구조

```
/                              → 랜딩페이지 (MainContent)
/ko, /zh                       → 다국어 prefix (en은 prefix 없음)
/videos                        → 영상 목록
/recommended-videos            → 추천콘텐츠 (세로 스와이프 피드)
/video-view/[postId]           → 개별 영상 상세 재생
/subscription                  → 구독/코인 결제 페이지 (Pricing)
/categories/[category]         → 카테고리별 페이지
/categories/recent             → 최신 콘텐츠
/categories/combined/[combo]   → 복합 카테고리
/usermenu/                     → 내 정보 (프로필, 북마크, 시청중, 수익, 설정)
/usermenu/earnings             → 크리에이터 수익 페이지
/usermenu/agency-earnings      → 영업팀 수익 페이지
/admin/system                  → 관리자 시스템 설정/통계
/admin/agency                  → 관리자 영업팀 관리
/admin/service                 → 관리자 문의/로그/공지
/admin/revalidate              → 관리자 캐시 재검증 트리거
/~offline                      → PWA 오프라인 fallback
```

---

## 2. 데이터베이스 해설

### 2-1. Supabase (PostgreSQL) - 운영 데이터베이스

#### 핵심 테이블

| 테이블명 | 용도 | 주요 필드 |
|----------|------|-----------|
| `user` | 사용자 정보 | id, username, displayName, userRole, mscoin, referredBy, teamMaster, adultauth, myLanguage, emailVerified, bankVerified, idVerified |
| `session` | Lucia 세션 | id, userId, expiresAt |
| `post` | 콘텐츠 포스트 | id, userId, title, titleI18n, content, contentI18n, postLanguage, thumbnailId, categories[], status, featured, priority, viewCount, publishedAt, ageLimit, videoCount |
| `video` | 영상 메타데이터 | id, postId, streamId, sequence, isPremium, subtitle[], createdAt |
| `video_view` | 유료 시청 기록 | id, userId, videoId, postId, uploaderId, accessMethod(FREE/COIN/SUBSCRIPTION), viewCount, referredBy, teamMaster, createdAt |
| `user_video_progress` | 재생 위치 기록 | userId, postId, lastVideoSequence |
| `subscription` | 구독 정보 | id, userId, currentPeriodEnd, subscriptionPlanId |
| `payment` | 결제 내역 | id, userId, amount, status, provider, createdAt |
| `billing_key` | 자동결제 키 | id, userId, provider, billingKey |
| `webhook_log` | 웹훅 로그 | id, provider, payload, processedAt |
| `system_setting` | 시스템 설정 | id, key, value(jsonb) |
| `point_withdrawal` | 포인트 지급 신청 | id, userId, amount, status(PENDING/APPROVED/REJECTED), processedBy, processedAt |
| `comment` | 댓글 | id, postId, userId, content, createdAt |
| `like` | 좋아요 | id, postId, userId, createdAt |
| `bookmark` | 북마크 | id, postId, userId, createdAt |

#### 주요 인덱스 및 관계

- `user(username)`: 유니크, 로그인 식별자
- `user(mscoin)`: 코인 잔액 (real 타입)
- `user(userRole)`: 권한 레벨 (숫자 기반)
  - 10: 일반 회원
  - 20/22/24: 크리에이터 (등급별 차등 지급률: 10%, 20%, 30%)
  - 40: 영업팀 멤버
  - 50: 영업팀 마스터
  - 100: 관리자
- `post(categories)`: PostgreSQL 배열 타입, 다중 카테고리 매핑
- `post(titleI18n, contentI18n)`: JSONB 타입, 다국어 번역 저장
- `video_view(userId, videoId, accessMethod)`: 복합 조회 인덱스
- `video_view(postId, uploaderId, referredBy, teamMaster)`: 워커 집계용 필드

### 2-2. Cloudflare D1 (SQLite) - 워커 집계 데이터베이스

| 테이블명 | 용도 | 주요 필드 |
|----------|------|-----------|
| `grouped_views` | 조회수 요약 | date, creatorId, postId, teamMaster, referrerId, subscriptionViews, coinViews, createdAt |
| `grouped_view_details` | 상세 시청 근거 | source_view_id, viewer_id, video_id, access_method, view_count, uploader_id, post_id, master_id, referrer_id |
| `commission_batch` | 커미션 지급 명세 | userId, date, commissionType, coinPoints, subscriptionPoints, processed(0=대기,1=완료,3=보류), post_id, metadata(json), batchId |

### 2-3. Cloudflare R2 - 오브젝트 스토리지

| 경로 패턴 | 용도 |
|-----------|------|
| `cf-stats/{period}/{date}.json` | 플랫폼 국가별 통계 스냅샷 |
| `cf-stats/{period}/{date}/creators/{creator}.json` | 크리에이터별 국가 통계 |
| `logs/` | 워커 로그 저장소 |

### 2-4. IndexedDB (브라우저 로컬)

| 저장소명 | 용도 |
|----------|------|
| `videoDB` | 시청 기록, 마지막 재생 위치, 워치 히스토리 |

---

## 3. 시청 흐름 (구독/코인 결제 포함)

이 섹션은 사용자가 영상을 시청하기 시작하는 순간부터 시청 기록이 서버에 저장되고 통계 워커에 이르기까지의 전 과정을 상세히 설명합니다.

### 3-1. 스와이프 및 권한 검증 단계 (`PlayPermissionCheck.tsx`)

사용자가 세로 스와이프하여 새로운 영상을 선택할 때마다 **즉시** 발생하는 검증 프로세스입니다. 모든 검증은 React Query의 로컬 캐시를 기준으로 수행되며, 서버 통신은 최소화된다는 것이 핵심 원칙입니다.

#### 3-1-1. Two-track 캐싱 및 상태 확인

프론트엔드는 로그인 시 `/api/users/[userId]/auth`를 통해 가져온 `userAuth` 정보를 React Query의 로컬 캐시(`['userAuth', userId]`)에 저장합니다. 이 정보에는 다음이 포함됩니다:

- **구독 상태**: `userAuth.subscription.currentPeriodEnd`
- **잔여 코인**: `userAuth.mscoin`
- **이미 구매한 영상 ID 목록**: `userAuth.purchasedVideoIds`
- **성인인증 여부**: `userAuth.adultauth`
- **추천인/마스터 정보**: `userAuth.referredBy`, `userAuth.teamMaster`

이 캐시는 `staleTime: 12시간`으로 설정되어 있으며, `refetchOnMount`, `refetchOnWindowFocus`, `refetchOnReconnect`가 모두 비활성화되어 있어 불필요한 API 호출을 방지합니다.

#### 3-1-2. 검증 순서 (if-else 체인)

```
스와이프 발생
    │
    ▼
┌─────────────────────────────────┐
│ Step 1. 성인 컨텐츠 체크          │
│  ageLimit >= 18 인 경우:         │
│  - 미로그인 → 로그인 모달 (code 1)│
│  - adultauth = false →          │
│    글로벌 성인인증 바텀시트(code 2)│
└────────────┬────────────────────┘
             │ 통과
             ▼
┌─────────────────────────────────┐
│ Step 2. 구독 확인                │
│  currentPeriodEnd >= 현재시간    │
│  → 0초 즉시 재생 (SUBSCRIPTION)  │
└────────────┬────────────────────┘
             │ 미해당
             ▼
┌─────────────────────────────────┐
│ Step 3. 기구매 확인              │
│  purchasedVideoIds에 영상ID 포함  │
│  → 0초 즉시 재생 (이미 결제 완료) │
└────────────┬────────────────────┘
             │ 미해당
             ▼
┌─────────────────────────────────┐
│ Step 4. 코인 확인 (Optimistic UI) │
│  mscoin >= 1 인 경우:            │
│  → 로컬 캐시 즉시 차감            │
│  → purchasedVideoIds에 추가       │
│  → 즉시 재생 시작                 │
│  → 백그라운드로 /api/user/coinpay  │
│    POST 비동기 전송               │
│  (실패 시 롤백 + 충전 모달)        │
│                                  │
│  mscoin < 1 인 경우:             │
│  → 코인 충전 모달 (code 3)       │
└─────────────────────────────────┘
```

#### 3-1-3. Optimistic UI의 성능 효과

서버 응답을 기다리지 않고 로컬 캐시의 코인을 즉시 차감한 후 재생을 시작합니다. 이로 인해 해외 유저의 네트워크 지연(200~500ms)이 **완전히 제거**되며, 스와이프 시 딜레이 없는 재생 환경을 제공합니다.

- 성공 시: 서버에서 트랜잭션이 정상 처리됨
- 실패 시 (잔액 부족 등): 캐시 롤백 후 재생 중단 + 충전 모ダル 표시

### 3-2. 시청 시간 추적 및 기록 단계 (`VideoPlayer.tsx` & `/api/videos/view`)

영상이 실제 재생되기 시작한 후, 시청 기록을 계층적으로 저장하는 과정입니다:

#### 3-2-1. 최초 5초 도달 시 (조회수 1 증가 트리거)

영상의 `currentTime`이 5초에 도달하면 다음이 발생합니다:

1. **IndexedDB 저장**: `videoDB`에 시청 기록과 재생 위치를 즉시 저장 (브라우저 로컬)
2. **서버 API 호출**: `isPremium` 영상인 경우 `POST /api/videos/view` 요청

#### 3-2-2. 서버의 시청 기록 처리 (`/api/videos/view/route.ts`)

```
POST /api/videos/view
    │
    ▼
┌─────────────────────────────────┐
│ 1. validateRequest()             │
│    → Lucia 세션 쿠키 검증         │
└────────────┬────────────────────┘
             │
             ▼
┌─────────────────────────────────┐
│ 2. timestamp < 5초 → 조기 반환   │
│    ("Duration too short")        │
└────────────┬────────────────────┘
             │
             ▼
┌─────────────────────────────────┐
│ 3. post.videos에서 isPremium 확인 │
│    - video.isPremium = true인    │
│      경우에만 accessMethod 판별    │
└────────────┬────────────────────┘
             │
             ▼
┌─────────────────────────────────┐
│ 4. 구독 상태 재확인              │
│    내부 fetch:                   │
│    /api/users/[userId]/auth      │
│    → currentPeriodEnd 체크       │
│    - 유효하면 SUBSCRIPTION        │
│    - 아니면 COIN                  │
└────────────┬────────────────────┘
             │
             ▼
┌─────────────────────────────────┐
│ 5. prisma.$transaction           │
│    a) VideoView upsert:          │
│       - 기존 기록 있으면          │
│         viewCount +1             │
│       - 없으면 새 행 생성         │
│         (userId, videoId,        │
│          accessMethod, postId,   │
│          uploaderId, referredBy, │
│          teamMaster)             │
│    b) UserVideoProgress upsert:  │
│       - lastVideoSequence 갱신   │
└────────────┬────────────────────┘
             │
             ▼
┌─────────────────────────────────┐
│ 6. R2에 통계용 로그 기록          │
│    - SubsView_ 또는 coinview_     │
│    (Cloudflare Stream 로그 대체)  │
└─────────────────────────────────┘
```

#### 3-2-3. 10초 단위 재생 위치 기록 (Resume 기능)

- 10초, 20초, 30초 등 10초 단위마다 브라우저 **IndexedDB**에만 재생 위치를 업데이트
- 서버에는 부하를 주지 않음
- 사용자가 앱 종료 후 재진입 시 `VideoViewClient.tsx`가 IndexedDB를 읽어 "시청 기록이 있습니다! 이어보시겠습니까?" 모달 표시

#### 3-2-4. 코인 결제 처리 (`/api/user/coinpay/route.ts`)

```
POST /api/user/coinpay (videoId, postId, uploaderId)
    │
    ▼
┌─────────────────────────────────┐
│ 1. validateRequest()             │
│    → 로그인 여부 확인             │
└────────────┬────────────────────┘
             │
             ▼
┌─────────────────────────────────┐
│ 2. prisma.$transaction 실행      │
│    a) 기존 COIN 시청 기록 확인    │
│       → 있으면 viewCount만 업데이트│
│    b) 없으면 mscoin 확인          │
│       → mscoin < 2 → 실패 반환    │
│    c) mscoin 차감 (decrement 2)   │
│    d) 새 VideoView 행 생성        │
│       (userId, videoId, postId,   │
│        uploaderId, accessMethod,  │
│        referredBy, teamMaster)    │
└─────────────────────────────────┘
```

**참고**: 코인 차감 금액은 2코인입니다. 이 정보는 향후 관리자가 `system_setting`에서 변경 가능하도록 설계되어 있습니다.

---

## 4. 포스트 CRUD 및 캐시 갱신 흐름

### 4-1. 캐시 아키텍처 개요

MegaShorts는 Next.js 15의 `force-static`과 `unstable_cache`를 활용한 정적 생성 + 태그 기반 재검증 전략을 사용합니다.

#### 캐시 계층 구조

| 계층 | 기술 | TTL/범위 | 용도 |
|------|------|---------|------|
| 브라우저 | IndexedDB + localStorage | 영구 | 시청기록, 재생위치, 뮤트상태 |
| React Query | In-memory 캐시 | 12시간(staleTime) | userAuth, 세션정보 |
| Next.js Data Cache | `unstable_cache` | 태그 기반 무효화 | 포스트 목록, 추천, 카테고리 |
| Next.js Route Cache | `force-static` | 재검증 시까지 | 전체 페이지 HTML |

### 4-2. 캐시 태그 시스템 (`src/lib/content-revalidation.ts`)

```typescript
CONTENT_TAGS = {
  home: "content:home",
  recent: "content:recent",
  recommended: "content:recommended",
  categories: "content:categories",
  posts: "content:posts",
  sliders: "content:sliders",
  settings: "content:settings",
}
```

### 4-3. 포스트 생성/수정/삭제 시 캐시 무효화

포스트의 상태가 변경되면 `invalidatePostContent()` 함수가 호출됩니다:

```typescript
invalidatePostContent({ postId, categories })
```

이 함수는 다음 작업을 수행합니다:

#### 4-3-1. 태그 재검증

- `content:home` - 홈/랜딩
- `content:recent` - 최신 페이지
- `content:recommended` - 추천 페이지
- `content:categories` - 카테고리 공통
- `content:posts` - 포스트 공통
- `content:post:{postId}` - 개별 포스트
- `content:category:{CategoryType}` - 각 카테고리
- `content:locale:{en/ko/zh}` - 각 언어별

#### 4-3-2. 경로 재검증

```
재검증 대상 경로 (locale별):

/                           → 랜딩페이지 (en, /ko, /zh)
/categories/recent          → 최신 페이지
/recommended-videos         → 추천 페이지
/posts/{postId}             → 포스트 상세
/categories/{category}      → 카테고리 페이지
/categories/combined/{combo} → 복합 카테고리 (예: action-drama)
```

**복합 카테고리 경로 생성**: 포스트가 속한 카테고리들을 조합하여 가능한 모든 조합(2개 이상)의 경로를 재검증합니다. DFS(depth-first search) 알고리즘을 사용하여 중복 없이 모든 조합을 생성합니다.

#### 4-3-3. 즉각 갱신 여부

`revalidateTag()`와 `revalidatePath()`는 Next.js 서버의 온디맨드 재검증 시스템에 의해 **즉시** 처리됩니다. 다음 요청부터는 새 데이터가 서빙됩니다. Vercel의 엣지 캐시에서도 태그 기반 무효화가 작동하므로 전 세계 CDN에서 일관성이 보장됩니다.

### 4-4. 관리자 캐시 재검증 API (`/api/revalidate/route.ts`)

관리자가 `/admin/revalidate` 페이지에서 수동으로 캐시를 재검증할 수 있습니다. 이 API는 `userRole >= OPERATION1` 이상의 권한이 필요합니다.

**지원 기능**:
- 단일 경로 재검증: `{ path: "/recommended-videos" }`
- 다중 경로 재검증: `{ paths: ["/", "/categories/recent"] }`
- 태그 재검증: `{ tag: "content:home" }` 또는 `{ tags: [...] }`
- 콘텐츠 전체 재검증: `{ scope: "content" }` - `invalidateHomeContentFromAdmin()` 호출

**locale prefix 처리**: 로케일 prefix가 없는 경로는 자동으로 모든 locale(en, ko, zh) 경로도 함께 무효화합니다.

### 4-5. 관리자 설정 변경 시 캐시 무효화 (`invalidateHomeContentFromAdmin`)

관리자가 슬라이더 설정, 시스템 설정 등을 변경하면 호출됩니다:

```
태그: home, recent, recommended, categories, sliders, settings, locale:*
경로: /, /categories/recent, /recommended-videos (모든 locale)
추가: "main-content" 태그도 함께 재검증
```

---

## 5. 랜딩페이지 정적 구성 및 재생성 로직

### 5-1. 정적 생성 전략

랜딩페이지(`MainContent` 컴포넌트)는 `export const dynamic = 'force-static'`으로 설정되어 있으며, 빌드 시점에 HTML이 미리 렌더링됩니다.

```typescript
// MainContent.tsx에서 각 데이터 소스는 unstable_cache로 캐시됨:
- getFeaturedPosts()     → 태그: home, sliders, categories, locale:*
- getLatestPosts()       → 태그: home, recent, categories, locale:*
- getRankedPosts()       → 태그: home, categories, locale:*
- getCategoryPosts()     → 태그: home, categories, locale:*,*
- getMainSliderSettings() → 태그: home, sliders, settings
```

### 5-2. 슬라이더 구성 체계

랜딩페이지는 관리자가 `SystemSetting(key='main_sliders')`에 저장한 JSON 설정에 따라 동적으로 슬라이더를 렌더링합니다:

```
슬라이더 유형:
├── featured  → 관리자 수동 선택 포스트 + featured=true 자동 보충
├── latest    → publishedAt 기준 최신순
├── ranked    → likes 또는 views 기준 랭킹
└── category  → 특정 카테고리 필터링
```

각 슬라이더는 순서(`order`) 기준으로 정렬되며, Featured 슬라이더는 항상 첫 번째로 표시됩니다.

### 5-3. 데이터 선택 쿼리 (공통 postSelect)

모든 포스트 조회는 동일한 `postSelect` 객체를 사용하여 일관된 데이터를 가져옵니다:

- 포스트 메타데이터: id, title, titleI18n, content, contentI18n, postLanguage, thumbnailId, categories, status, featured, priority, viewCount, ageLimit 등
- 비디오: sequence=1인 첫 번째 비디오 (id, sequence, subtitle)
- 사용자 정보: username, displayName
- 카운트: likes 수, comments 수

### 5-4. 재생성 트리거

| 이벤트 | 재검증 범위 |
|--------|------------|
| 포스트 생성/수정/삭제 | `invalidatePostContent()` → 관련 태그 + 경로 |
| 슬라이더 설정 변경 | `invalidateHomeContentFromAdmin()` + "main-content" 태그 |
| 시스템 설정 변경 | `invalidateHomeContentFromAdmin()` |
| 관리자 수동 재검증 | `/api/revalidate` POST |

### 5-5. 효율성 분석

- **정적 생성**: 빌드 시 HTML 생성 → TTFB 최소화
- **unstable_cache**: 태그 기반 캐시로 중복 쿼리 방지, 동일한 캐시 키로 여러 컴포넌트에서 공유
- **온디맨드 재검증**: 변경 시점만 캐시가 무효화되므로 불필요한 재빌드 없음
- **locale별 캐시 분리**: 각 언어별 독립 캐시로 한국어 변경이 영어에 영향 없음

---

## 6. 워커 기반 시청기록 수집·포인트 지급·통계 수립

### 6-1. 전체 워커 아키텍처 개요

Cloudflare Workers 환경에서 동작하는 8개의 워커가 시청 기록 수집부터 포인트 지급, 통계 집계까지 파이프라인 방식으로 처리합니다. 각 워커는 독립적으로 배포되며 D1 + R2를 공유 데이터 레이어로 사용합니다.

### 6-2. 워커 목록과 역할

| 워커명 | 파일 위치 | 역할 |
|--------|----------|------|
| `viewgroup` | `msworker/.../workers/viewgroup/` | 원본 시청 기록을 날짜/크리에이터/포스트/추천인 기준으로 그룹화 |
| `commission` | `msworker/.../workers/commission/` | 그룹화된 시청 기록을 기반으로 크리에이터/영업팀 포인트 계산 및 지급 |
| `cfstats-admin` | `msworker/.../workers/cfstats-admin/` | 플랫폼 전체 Cloudflare 접속 통계 집계 (국가별 분 단위) |
| `cfstats-creator` | `msworker/.../workers/cfstats-creator/` | 크리에이터별 Cloudflare 접속 통계 집계 |
| `postdata` | `msworker/.../workers/postdata/` | 포스트 메타데이터 워커 |
| `referral-structure` | `msworker/.../workers/referral-structure/` | 추천인 구조 및 영업팀 구조 관리 |
| `system-settings` | `msworker/.../workers/system-settings/` | 시스템 설정 동기화 |
| `team-master-settings` | `msworker/.../workers/team-master-settings/` | 영업팀 마스터 설정 관리 |
| `viewcountteam` | `msworker/.../workers/viewcountteam/` | 팀별 조회수 집계 |

### 6-3. 시청 기록 수집 및 포인트 지급 전체 흐름

#### 6-3-1. Stage 1: 원본 시청 기록 생성 (PostgreSQL)

```
사용자 시청 (5초 도달)
  → /api/videos/view POST
  → prisma.$transaction에서 VideoView 생성
  → 필드: userId, videoId, postId, uploaderId,
          accessMethod(COIN/SUBSCRIPTION),
          referredBy, teamMaster
```

이 원본 시청 기록은 Postgres의 `video_views` 테이블에 저장됩니다. 이 테이블에는 **누가, 무엇을, 어떻게(코인/구독), 누구의 추천으로, 어느 영업팀 소속으로** 보았는지가 기록됩니다.

#### 6-3-2. Stage 2: 뷰 그룹화 워커 (`viewgroup`)

```
viewgroup 워커 실행 (스케줄/트리거)
  │
  ▼
┌─────────────────────────────────┐
│ 1. Postgres video_views 읽기     │
│    - 대상 정산일의 기록           │
│    - 정렬: createdAt ASC          │
└────────────┬────────────────────┘
             │
             ▼
┌─────────────────────────────────┐
│ 2. 그룹화 기준:                   │
│    date + creatorId + postId     │
│    + teamMaster + referrerId    │
│    → 같은 조건의 시청을 하나로 묶음 │
└────────────┬────────────────────┘
             │
             ▼
┌─────────────────────────────────┐
│ 3. D1 grouped_views 저장         │
│    - subscriptionViews 합산       │
│    - coinViews 합산              │
│    - viewCount 합산              │
└────────────┬────────────────────┘
             │
             ▼
┌─────────────────────────────────┐
│ 4. D1 grouped_view_details 저장  │
│    - source_view_id (원본 ID)     │
│    - viewer_id, video_id         │
│    - access_method, view_count   │
│    - uploader_id, post_id        │
│    - master_id, referrer_id      │
└────────────┬────────────────────┘
             │
             ▼
┌─────────────────────────────────┐
│ 5. 처리량 초과 시 continue 반환   │
│    → 큐에 다음 작업 추가           │
│    (대량 데이터도 안정적 처리)      │
└─────────────────────────────────┘
```

**핵심**: `grouped_views`는 "왜 이 사람이 이 포인트를 받았는가?"에 대한 중간 요약표입니다. 원본을 매번 다시 계산하지 않기 위한 집계 레이어입니다. `grouped_view_details`는 관리자 리포트의 **비디오 단위 시청 근거(Paid View Basis Detail)**를 제공합니다.

#### 6-3-3. Stage 3: 커미션 워커 (`commission`)

```
commission 워커 실행 (viewgroup 후)
  │
  ▼
┌─────────────────────────────────┐
│ 1. D1 grouped_views 읽기         │
└────────────┬────────────────────┘
             │
             ▼
┌─────────────────────────────────┐
│ 2. Postgres에서 추가 정보 조회    │
│    - 크리에이터 등급(userRole)     │
│    - 영업팀 설정(team type)        │
│    - 추천인 구조(referredBy 체인)  │
│    - 시스템 단가 설정             │
│      subscriptionPerPoint=1000    │
│      coinPerPoint=120             │
│      viewCoinAmount=2             │
└────────────┬────────────────────┘
             │
             ▼
┌─────────────────────────────────┐
│ 3. 포인트 계산 (유형별 분리)       │
│    - CREATOR: 크리에이터 지급      │
│    - DIRECT: 직접 추천 지급       │
│    - INDIRECT: 간접 추천 지급       │
│    - NETWORK_LEVEL: 네트워크형    │
│      (HEADQUARTERS/NETWORK/        │
│       BINARY_NETWORK)              │
└────────────┬────────────────────┘
             │
             ▼
┌─────────────────────────────────┐
│ 4. D1 commission_batch 저장      │
│    - userId, date,               │
│      commissionType,             │
│      coinPoints, subscriptionPoints│
│    - processed: 0=대기,           │
│      1=완료, 3=보류               │
│    - post_id (지급 근거 preserved)│
└────────────┬────────────────────┘
             │
             ▼
┌─────────────────────────────────┐
│ 5. 지급 실행                     │
│    - processed=1 →              │
│      Postgres User.points 반영   │
│    - processed=3 →              │
│      조건 미충족 보류            │
│      (바이너리/네트워크 조건)       │
└────────────┬────────────────────┘
             │
             ▼
┌─────────────────────────────────┐
│ 6. 주간 요약 통계 생성            │
│    → 관리자/크리에이터/영업팀      │
│      수익 화면에서 조회 가능       │
└─────────────────────────────────┘
```

#### 6-3-4. 크리에이터 등급별 차등 지급률

| 역할값 | 등급 | 지급률 |
|--------|------|--------|
| 20 | 크리에이터 Lv.1 | 10% |
| 22 | 크리에이터 Lv.2 | 20% |
| 24 | 크리에이터 Lv.3 | 30% |

#### 6-3-5. 영업팀 유형과 커미션 구조

| 유형 | 커미션 타입 | 설명 |
|------|------------|------|
| HEADQUARTERS | DIRECT / INDIRECT | 본부형: 직접/간접 추천 기반 |
| NETWORK | NETWORK_LEVEL | 네트워크형: 다단계 네트워크 기반 |
| BINARY_NETWORK | NETWORK_LEVEL | 바이너리 네트워크: 트리 구조 기반 |

**바이너리/네트워크 보류**: `processed=3`은 바이너리 매칭 조건이나 네트워크 레벨 조건이 아직 미충족되어 지급이 보류된 상태입니다. 조건 충족 시 다음 정산 주기에서 자동으로 처리됩니다.

### 6-4. 통계 워커 (`cfstats-admin`, `cfstats-creator`)

#### 6-4-1. 데이터 수집 흐름

```
Cloudflare Stream 접속 로그
  │
  ▼
┌─────────────────────────────────┐
│ cfstats-lib에서 로그 페치         │
│ - fetchLogs(): CF Analytics API  │
│ - aggregateLogs(): 국가/시간별   │
│   그룹화 및 분 단위 집계          │
└────────────┬────────────────────┘
             │
             ▼
┌─────────────────────────────────┐
│ 1. D1 cf_stats 테이블 저장       │
│    - top_countries=[{country,    │
│      minutes}]                   │
│    - request_list[]: 기간별 요청  │
│    - period: daily/weekly/monthly│
└────────────┬────────────────────┘
             │
             ▼
┌─────────────────────────────────┐
│ 2. R2에 JSON 스냅샷 업로드       │
│    cf-stats/{period}/{date}.json  │
│    cf-stats/{period}/{date}/     │
│      creators/{creator}.json      │
└────────────┬────────────────────┘
             │
             ▼
┌─────────────────────────────────┐
│ 3. Next.js 통계 페이지에서 조회   │
│    - API: /api/stats/cloudflare   │
│    - fallback: R2 direct read    │
│    (Worker HTTP 실패 시 S3        │
│     signed GET 또는 CF API token)  │
└─────────────────────────────────┘
```

#### 6-4-2. 크리에이터 지도 조회 Fallback 아키텍처

```
크리에이터 수익 페이지 지도 요청
  │
  ▼
1. period=all로 크리에이터별 R2 prefix 합산
  │
  ├─ 결과가 있음 → 표시
  │
  └─ 결과가 없음 → fallbackPeriod로 해당 기간 R2 직접 조회
      │
      ├─ 결과가 있음 → 표시
      │
      └─ 실패 → S3 signed GET/List 시도
          │
          ├─ 성공 → 표시
          │
          └─ 실패 → CF API token 기반 R2 GET/List
              │
              └─ 최종 실패 → 빈 지도 (플랫폼 통계로 fallback 안 함)
```

**중요**: 크리에이터 지도는 플랫폼 전체 국가 통계로 absolute fallback하지 않습니다. 크리에이터별 데이터가 없으면 빈 지도가 정확한 표현입니다.

### 6-5. 타임존 기반 로그 시스템

- 어드민 설정(`analyticsTimeZone`)과 워커(`ANALYTICS_TIME_ZONE`) 환경변수가 연동
- Next.js `/api/admin/service/logs`에서 타임존 정보를 안전하게 파싱하여 워커로 전송
- 워커 측에서 UTC 변환을 정확히 수행하여 기간 필터링 경계 계산
- 어드민 UI(`LogTable`, `LogModal`)에서 `formatInTimeZone`으로 현지 시간대 출력

---

## 7. 추천콘텐츠 페이지 구성 로직과 최적화 전략

### 7-1. 페이지 구조

경로: `/[locale]/recommended-videos`

```
서버 (page.tsx)
  ├── getLocale() → 현재 locale 확인
  ├── getContentLanguagePolicy() → 언어 노출 정책 조회
  └── unstable_cache로 추천 포스트 조회
       - where: status=PUBLISHED
       - language policy 필터 적용
       - MSPOST/NOTIFICATION 카테고리 제외
       - sequence=1, isPremium=false인 비디오만
       - orderBy: featured DESC, priority ASC, createdAt DESC
       - take: 15
       - 캐시 태그: content:recommended, content:categories, content:locale:*

클라이언트 (RecommendedVideosClient.tsx)
  ├── 초기 15개 포스트를 props로 받아 렌더링
  ├── IndexedDB 시청 기록과 비교하여 본 영상 제외
  ├── Swiper (Virtual + Mousewheel)로 세로 스와이프 구현
  ├── 활성 슬라이드에서 5개 이내로 approaching 시 추가 로딩
  ├── fetch /api/posts/recommended?skip=N&take=15 로 페이지네이션
  ├── localStorage에 마지막 시청 인덱스 저장 (재진입 시 복원)
  ├── PWA 설치앱에서 ms_pwa_standalone=1 쿠키 기반 전체화면 최적화
  └── 영상 종료 시 다음 영상 → 마지막 포스트면 다시 필터링
```

### 7-2. 서버 렌더링 최적화

- `export const dynamic = 'force-static'`으로 정적 생성
- `unstable_cache` + 태그 기반 캐시로 중복 DB 쿼리 제거
- 캐시 키: `["recommended-videos-page-posts"]`
- 캐시 태그: `content:recommended`, `content:categories`, `content:locale:{locale}`
- `revalidate: false`로 태그 무효화 시까지 영구 캐시

### 7-3. 클라이언트 최적화

| 항목 | 전략 |
|------|------|
| **Virtual Slides** | Swiper Virtual 모듈로 메모리 효율화 (15개 한 번에, 나머지는 DOM 비움) |
| **시청 기록 필터링** | IndexedDB(`videoDB.getWatchingPostIds()`)로 sequence > 1인 포스트 제외 |
| **점진적 로딩** | 활성 인덱스 + 5개 이하 도달 시 백그라운드에서 15개 추가 페치 |
| **위치 복원** | `localStorage.ms_recommended_view_info`에 마지막 인덱스 저장, 재진입 시 복원 |
| **PWA preconnect** | Cloudflare Stream 도메인(`customer-*.cloudflarestream.com`, `videodelivery.net`)에 preconnect |
| **PWA asset warming** | PWA 설치앱에서 다음 2개 썸네일 + HLS manifest를 미리 로딩 |
| **Safe area 대응** | `env(safe-area-inset-*)` 기반 UI 오프셋, `viewport-fit=cover` |

### 7-4. PWA 특수 처리 (추천 페이지)

- `PWAEnhancer`가 standalone 상태 감지 시 `ms_pwa_standalone=1` 쿠키 설정
- 전체화면 모드에서 컨트롤 숨김 시 상단 메뉴도 함께 숨김
- Safe area 기반 레이아웃 (`top-[max(0.75rem,env(safe-area-inset-top))]`)
- 세션 수명: PWA 설치앱 90일 vs 일반 웹 30일 (Lucia 기본)
- 오프라인 fallback: `/ko/~offline` 페이지 (전체 콘텐츠 오프라인 재생 아님)

### 7-5. Workbox 캐시 전략 (PWA)

| 자산 유형 | 전략 | 설명 |
|-----------|------|------|
| 정적 JS/CSS | CacheFirst | 한 번 로드된 번들 재사용 |
| Cloudflare Stream 썸네일 | Stale-While-Revalidate | 이전 버전 표시 + 백그라운드 갱신 |
| HLS manifest (.m3u8) | NetworkFirst (3초 timeout) | 최신 manifest 우선, 실패 시 캐시 |
| 영상 세그먼트/자막 (m4s, ts, mp4, vtt) | CacheFirst + Range Requests | 구간별 캐시로 재요청 부담 감소 |

### 7-6. 콘텐츠 언어 정책 적용

- `contentLanguagePolicy`에 따라 필터링 방식이 달라짐:
  - **전체 노출 + 선택 언어 우선**: 모든 포스트 표시, 선택 언어 번역 우선
  - **선택 언어 지원 콘텐츠만 노출**: `postLanguage` 또는 `subtitle`에 선택 언어가 포함된 포스트만

---

## 8. 세션·코인·구독정보 캐싱 전략과 메뉴 노출 로직

이 섹션은 가장 자주 사용되는 세션 정보, 코인 수량, 구독 상태 등이 어디에 캐시되어 있고, 어떻게 빠르게 조회되며, 변경 시 어떤 경로로 반영되는지를 계층별로 상세히 설명합니다.

### 8-1. 전체 캐시 계층 다이어그램

```
┌────────────────────────────────────────────────────────┐
│ Layer 1: 브라우저 로컬                                  │
│                                                        │
│ ├─ Lucia Session Cookie                                │
│ │   - name: "auth" (기본)                              │
│ │   - PWA standalone: 90일 만료, custom attributes      │
│ │   - 일반 웹: 30일 만료                                │
│ │   - secure flag: 환경에 따라 동적                      │
│ │                                                      │
│ ├─ NEXT_LOCALE 쿠키                                    │
│ │   - maxAge=1년                                       │
│ │   - 비로그인: 쿠키만, 로그인: 쿠키 + DB 저장           │
│ │                                                      │
│ ├─ ms_pwa_standalone 쿠키                              │
│ │   - PWA 설치앱에서 1로 설정                           │
│ │                                                      │
│ ├─ localStorage                                        │
│ │   - videoMuted: 뮤트 상태                             │
│ │   - ms_recommended_view_info: 추천 페이지 위치          │
│ │                                                      │
│ └─ IndexedDB (videoDB)                                 │
│     - lastViews: 시청 기록 (sequence > 1)               │
│     - watchedVideos: 전체 시청 영상 ID                   │
└────────────────────────────────────────────────────────┘
                          │
                          ▼
┌────────────────────────────────────────────────────────┐
│ Layer 2: React Query (브라우저 인메모리)                 │
│                                                        │
│ ├─ ['session']                                         │
│ │   - /api/auth/session 에서 초기 데이터                │
│ │   - refetchOnWindowFocus: false                       │
│ │   - refreshSession()으로 수동 갱신 가능                │
│ │                                                      │
│ └─ ['userAuth', userId]                                │
│     - /api/users/[userId]/auth 에서 조회                 │
│     - staleTime: 12시간                                 │
│     - refetchOnMount/WindowFocus/Reconnect: 모두 false   │
│     - 포함 데이터:                                      │
│       adultauth, mscoin, purchasedVideoIds[],            │
│       subscription.currentPeriodEnd,                    │
│       referredBy, teamMaster                            │
└────────────────────────────────────────────────────────┘
                          │
                          ▼
┌────────────────────────────────────────────────────────┐
│ Layer 3: Next.js 서버 캐시 (unstable_cache)             │
│                                                        │
│ ├─ getUserAuth()                                       │
│ │   - 캐시 키: ['user-auth']                           │
│ │   - TTL: 12시간 (revalidate: 43200)                   │
│ │   - 태그: ['user-auth']                              │
│ │   - DB: prisma.user.findUnique                       │
│ │                                                      │
│ ├─ validateRequest()                                   │
│ │   - React.cache()로 동일 요청 내 중복 방지            │
│ │   - Lucia 세션 쿠키 검증                             │
│ │   - PWA 세션 쿠키 자동 갱신 처리                      │
│ │                                                      │
│ └─ unstable_cache (랜딩/추천/카테고리)                  │
│     - 태그 기반 무효화 (content:*)                      │
│     - 재검증 시까지 영구 캐시                           │
└────────────────────────────────────────────────────────┘
                          │
                          ▼
┌────────────────────────────────────────────────────────┐
│ Layer 4: 데이터베이스                                    │
│                                                        │
│ ├─ PostgreSQL (Supabase)                               │
│ │   - User 테이블: mscoin, subscription, userRole 등    │
│ │   - Session 테이블: 세션 유효성                      │
│ │   - SystemSetting: 전역 설정                          │
│ │                                                      │
│ └─ Cloudflare D1                                       │
│     - grouped_views: 시청 집계                         │
│     - commission_batch: 지급 명세                       │
│     - cf_stats: 통계 데이터                            │
└────────────────────────────────────────────────────────┘
```

### 8-2. 메뉴 항목별 정보 노출 로직

#### 8-2-1. 네비게이션 바 (Navbar)

| 확인 항목 | 데이터 소스 | 캐시 레벨 | 갱신 트리거 |
|-----------|------------|-----------|------------|
| 로그인 상태 | `useSession().user` | React Query | `refreshSession()` |
| 코인 잔액 | `useUserAuth().mscoin` | React Query (12시간) | Optimistic UI 즉시 + 서버 sync |
| 구독 상태 | `useUserAuth().subscription` | React Query (12시간) | 서버 재조회 시 |
| 성인인증 여부 | `useUserAuth().adultauth` | React Query (12시간) | 서버 재조회 시 |
| 언어 설정 | `NEXT_LOCALE` 쿠키 | 쿠키 | 언어 변경 시 |

#### 8-2-2. 시청 시 구독 확인 로직

```
스와이프 → PlayPermissionCheck 실행
  │
  ├─ userAuth 캐시 확인 (React Query, Layer 2)
  │   → subscription.currentPeriodEnd >= now
  │   → true: 즉시 재생 (0ms, 서버 통신 없음)
  │
  └─ 구독 아닌 경우
      ├─ purchasedVideoIds 확인 (메모리 배열 검색, O(1))
      │   → true: 즉시 재생
      │
      └─ mscoin 확인 (캐시된 숫자 비교)
          → coins >= 1: Optimistic UI 차감 후 재생
          → coins < 1: 충전 모달
```

**핵심**: 구독 확인은 **완전히 로컬**에서 발생합니다. 서버 왕복 0ms. purchasedVideoIds 확인도 메모리 배열의 `includes()`이므로 0ms.

### 8-3. 캐시 변경 시 즉시 반영 메커니즘

#### 8-3-1. 코인 잔액 변경

```
시나리오: 사용자가 코인으로 영상 시청

1. PlayPermissionCheck 내 Optimistic UI 즉시 실행:
   queryClient.setQueryData(['userAuth', userId], oldData => ({
     ...oldData,
     mscoin: oldData.mscoin - 1,
     purchasedVideoIds: [...oldData.purchasedVideoIds, videoId]
   }))
   → 화면에 즉시 반영 (0ms)

2. 백그라운드 fetch('/api/user/coinpay') POST
   → 서버에서 실제 트랜잭션 처리

3. 서버 성공: 반영 완료
   서버 실패: 
   → 롤백 로직 (현재 캐시 복구 후 재조회 또는 모달)
```

#### 8-3-2. 구독 상태 변경

```
시나리오: 사용자가 구독 결제를 완료

1. 결제 모달/페이지에서 완료 후
2. refreshSession() 호출 → React Query refetch
   → /api/auth/session 재요청
3. userAuth도 함께 재조회
   → /api/users/[userId]/auth 재요청
4. 새 구독 정보가 Layer 2 캐시에 반영
5. 다음 스와이프부터 새 구독 상태 적용
```

#### 8-3-3. 서버 세션 변경 (로그아웃, 다른 기기 삭제 등)

```
1. Lucia 세션 쿠키 삭제 또는 만료
2. 다음 validateRequest() → { user: null, session: null }
3. /api/auth/session 응답 변경
4. React Query ['session'] 캐시 자동 갱신
5 useSession().user = null → UI에서 비로그인 상태로 전환
```

#### 8-3-4. 사용자 정보 변경 (DB 업데이트)

```
1. 관리자 또는 사용자 본인이 DB 변경
2. getUserAuth()의 cache 태그('user-auth') 재검증 필요
3. 현재: 12시간 TTL 또는 페이지 재진입 시 refetch
4. 즉시 반영이 필요한 경우:
   - 프론트엔드: queryClient.invalidateQueries(['userAuth', userId])
   - 백엔드: revalidateTag('user-auth') 호출
```

### 8-4. 세션 동기화 메커니즘

```
SessionProvider 마운트 시:
  │
  ├─ useQuery(['session']) → /api/auth/session
  │   → initialData: 서버에서 전달받은 value
  │
  └─ userId 변경 감지 시:
      ├─ 다른 사용자인 경우 → videoDB.clearForNewUser()
      │   (IndexedDB 초기화, 이전 사용자 시청기록 삭제)
      │
      └─ 항상 실행 → /api/videos/sync
          → 서버의 watchedVideos, lastViews를 받아옴
          → videoDB.syncWithServer() 로 IndexedDB 동기화
```

### 8-5. Login 시 가져오는 전체 인증 데이터 구조

```typescript
// /api/users/[userId]/auth → UserAuthData
{
  adultauth: boolean,               // 성인인증 여부
  mscoin: number,                   // 코인 잔액
  referredBy: string | null,        // 추천인 ID
  teamMaster: boolean,              // 영업팀 마스터 여부
  subscription: {
    currentPeriodEnd: Date | null   // 구독 만료일
  } | null,
  purchasedVideoIds: string[]       // 코인으로 구매한 영상 ID 목록
}
```

이 데이터는 로그인 시점에 한 번 조회되어 React Query에 12시간 캐시되며, 시청 권한 확인의 모든 분岐점에서 사용됩니다.

---

## 9. 다국어(i18n) 및 SEO 전략

### 9-1. 언어 정책

- **기본 언어**: 영어 (English)
- **확장 언어**: 중국어 (Chinese) - 단일 소스 파일에 언어셋만 추가하여 무한 확장 가능
- **메시지 파일**: `messages/en.json`, `messages/ko.json`, `messages/zh.json`

### 9-2. URL 라우팅 정책

| 언어 | URL 패턴 | 비고 |
|------|---------|------|
| 영어 (기본) | `megashorts.com/videos` | prefix 없음, URL 깊이 최소화 |
| 한국어 | `megashorts.com/ko/videos` | locale prefix 적용 |
| 중국어 | `megashorts.com/zh/videos` | locale prefix 적용 |

- `localePrefix: 'as-needed'` 설정으로 기본 언어는 prefix 생략
- 기본 URL의 검색 노출 순위 완벽 보존

### 9-3. 동적 콘텐츠 다국어화 (Smart Fallback)

```
렌더링 시 표시 우선순위:

1. 선택 언어 번역 (titleI18n[key], contentI18n[key])
   ↓ (없으면)
2. 영어 번역 (titleI18n['en'], contentI18n['en'])
   ↓ (없으면)
3. 원문 필드 (title, content)
```

**locale alias 지원**: `KOREAN`, `ENGLISH`, `CHINESE`, `kr`, `cn` 등의 비표준 키도 매핑됩니다.

### 9-4. 포스트 데이터 구조 원칙

- `title` / `content` 원본: **반드시 영어로 저장** (글로벌 fallback + SEO 기준점)
- 다국어 번역: `titleI18n`, `contentI18n` (JSONB 필드)에 분리 저장
- `postLanguage`: 영상 오디오/자막의 실제 언어

### 9-5. 카테고리 다국어 처리

- DB 레벨: Prisma Enum 구조 (마이그레이션 리스크 회피)
- 프론트엔드 뷰: `next-intl`의 `Category` 네임스페이스로 100% 처리
- 메시지 파일: `ko.json`, `en.json`, `zh.json`에 각각 정의

### 9-6. 자막 선택 기준 (VideoPlayer)

```
VideoPlayer 자막 선택 로직:

1. 현재 locale → video user language 변환
2. 해당 언어 자막 우선 선택
3. 없으면 영어 자막 fallback
4. 둘 다 없으면 자막 없이 재생 (재생 자체는 막지 않음)
```

### 9-7. SEO 구성 요소

- `hreflang` alternate link: `[locale]/layout.tsx`에서 출력
- `x-default`: 기본 언어 대체
- `canonical`: 상대 canonical(`./`) 적용, hreflang과 충돌 없음
- Open Graph 메타데이터: 각 페이지별 `generateMetadata`에서 설정

### 9-8. 콘텐츠 언어 노출 정책 (`/admin/system`)

| 정책명 | 동작 | 비고 |
|--------|------|------|
| 전체 노출 + 선택 언어 우선 표시 | 모든 콘텐츠 표시, 번역 우선 | **기본값**, 안전한 선택 |
| 선택 언어 지원 콘텐츠만 노출 | postLanguage 또는 subtitle에 선택 언어가 있는 것만 | 콘텐츠 충분한 언어권에서만 권장 |

---

## 10. 프론트엔드 및 플랫폼 UI 구조

### 10-1. 코어 프레임워크

- **Next.js 15** (App Router): 서버 컴포넌트 + 클라이언트 컴포넌트 혼용
- **React** + **TypeScript**: 타입 안전성 보장
- **Tailwind CSS** + **Shadcn UI** (Radix 기반): 컴포넌트 디자인 시스템

### 10-2. 비디오 플레이어 시스템

- **Cloudflare Stream**: HLS 기반 비디오 호스팅 (`.m3u8` manifest, 세그먼트 파일)
- **Swiper.js**: 세로형 틱톡 스타일 무한 스크롤
  - Virtual 모듈: 메모리 효율화
  - Mousewheel 모듈: 데스크톱 마우스휠 지원
  - speed: 300ms 전환 애니메이션

### 10-3. PWA (Progressive Web App)

#### 구성 파일

| 파일 | 용도 |
|------|------|
| `next.config.mjs` | PWA 설정 |
| `public/manifest.json` | 웹앱 매니페스트 |
| `src/app/[locale]/layout.tsx` | 메타 태그 삽입 |
| `src/components/PWAInstallPrompt.tsx` | 설치 프롬프트 UI |
| `src/app/[locale]/~offline/page.tsx` | 오프라인 fallback |
| `src/lib/pwa-session.ts` | PWA 세션 관리 |
| `src/hooks/usePwaVideoChrome.ts` | PWA 비디오 chrome 제어 |
| `src/lib/pwa-video-preload.ts` | PWA 자산 미리 로딩 |

#### PWA 설치 조건

- `manifest.json` + `/sw.js` 서비스워커 + `display: standalone` + `scope: "/"` + 192/512 아이콘 조합
- 개발 모드에서는 기본 OFF (`NEXT_PUBLIC_PWA_DEV=true pnpm dev`로 활성화)
- 검증 기준: `pnpm build && pnpm start`

#### PWA vs 웹 차이점

| 항목 | 일반 웹 | PWA 설치앱 |
|------|---------|-----------|
| 세션 수명 | 30일 | 90일 |
| UI | 브라우저 탭 | standalone 앱 창 |
| 주소창 | 표시 | 숨김 |
| 이용 가능 세로 공간 | 일반 | 증가 (브라우저 UI 없음) |
| 세로 화면 고정 | 브라우저 의존 | `screen.orientation.lock("portrait")` 시도 |
| Safe area | 해당 없음 | `env(safe-area-inset-*)` 지원 |

#### 오프라인 지원 범위

- "전체 콘텐츠 오프라인 재생" 아님
- 네트워크/캐시 실패 시 `/ko/~offline` fallback 페이지 표시
- Workbox 런타임 캐시로 한 번 로드된 정적 JS/CSS, 일부 페이지 응답, 이미지, API GET 응답 재방문 시 빠르게 제공

### 10-4. 모바일 UI 최적화 (2026-05-26/27 업데이트)

- **통계 페이지 간격 통일**: `space-y-2`, `gap-2`, `mt-2`
- **PWA 설치 프롬프트**: 한국어 `"메가쇼츠를 앱처럼 사용하세요"`, 좁은 폭 기준 재배치
- **로그인 비밀번호 눈 아이콘**: `EyeOff`(숨김) / `Eye`(표시) 정상 매핑
- **UserButton**: 뷰포트 기반 max-height + 내부 세로 스크롤 (모바일 하단 메뉴 잘림 방지)
- **로그 테이블 모바일**: `sm` 미만에서 카드 뷰 레이아웃, 데스크톱 테이블 `hidden sm:block`
- **Vercel Analytics**: `NODE_ENV=production` && `VERCEL=1` 에서만 렌더링 (로컬 404 노이즈 제거)

---

## 11. 보안 및 인증 아키텍처

### 11-1. Lucia 인증 시스템

```typescript
// lucia 설정 (src/auth.ts)
{
  sessionCookie: {
    expires: false,         // 수동 관리
    attributes: {
      secure: shouldUseSecureAuthCookies()  // 환경에 따라 동적
    }
  },
  getUserAttributes: {
    id, username, displayName,
    googleId, kakaoId, naverId,
    userRole, myLanguage
  }
}
```

### 11-2. OAuth 제공자

| 제공자 | 환경변수 | Callback URL |
|--------|---------|-------------|
| Google | `GOOGLE_CLIENT_ID`, `GOOGLE_CLIENT_SECRET` | `/api/auth/callback/google` |
| Kakao | `KAKAO_CLIENT_ID`, `KAKAO_CLIENT_SECRET` | `/api/auth/callback/kakao` |
| Naver | `NAVER_CLIENT_ID`, `NAVER_CLIENT_SECRET` | `/api/auth/callback/naver` |

### 11-3. 세션 검증 흐름

```
요청 → middleware.ts → validateRequest()
  │
  ├─ 쿠키에서 sessionId 추출
  ├─ lucia.validateSession(sessionId)
  ├─ 세션 유효:
  │   ├─ fresh 세션이면 쿠키 재발급
  │   │   → PWA standalone: 90일 attributes
  │   │   → 일반: 기본 attributes
  │   └─ user, session 반환
  │
  └─ 세션 무효:
      └─ blank session cookie 발급 + null 반환
```

### 11-4. 권한 레벨 (userRole)

| 값 | 역할 | 접근 권한 |
|----|------|----------|
| 10 | 일반 회원 | 기본 콘텐츠 시청 |
| 20 | 크리에이터 Lv.1 | 콘텐츠 업로드 + 수익 10% |
| 22 | 크리에이터 Lv.2 | 콘텐츠 업로드 + 수익 20% |
| 24 | 크리에이터 Lv.3 | 콘텐츠 업로드 + 수익 30% |
| 40 | 영업팀 멤버 | 추천 커미션 |
| 50 | 영업팀 마스터 | 팀 커미션 관리 |
| 100 | 관리자 | 전체 시스템 관리 |

### 11-5. API 보호 계층

- `validateRequest()`: 모든 API의 첫 번째 방어선
- `USER_ROLE` 상수: 권한별 API 접근 제한
- 관리자 API: `userRole >= OPERATION1` 이상만 접근

---

## 12. 인프라 및 배포 전략

### 12-1. 배포 플랫폼

- **프론트엔드/백엔드**: Vercel (Next.js 자동 배포)
- **워커**: Cloudflare Workers (Wrangler CLI)
- **모니터링**: Sentry (에러 추적)

### 12-2. 환경 구분

| 환경 | 용도 | 비고 |
|------|------|------|
| 로컬 개발 | `pnpm dev` | PWA 비활성화 기본 |
| Vercel Preview | PR별 자동 배포 | 테스트 용도 |
| Vercel Production | 메인 브랜치 배포 | 운영 환경 |

### 12-3. 프리뷰 배포 시 고려사항

- Preview DB와 Production DB가 동일할 수 있음
- 관리자 설정 변경은 실제 서비스 화면에 직접 영향
- Preview 전용 환경변수/DB 분리가 가장 안전
- 로컬 빌드 중 Supabase 연결 경고는 정적 파라미터 생성 경로에서 catch 처리되어 빌드 차단 안 함

### 12-4. 빌드 검증 기준

```
타입 체크: pnpm exec tsc --noEmit --pretty false  → 통과
린트:      pnpm run lint                           → 통과 (기존 warning 유지)
빌드:      pnpm run build                          → Next.js 15.5.18 기준 성공
메시지:    messages/*.json 파싱 검증                → ko/en/zh 모두 통과
```

---

## 13. 에이전시 정산 시스템

### 13-1. 전체 정산 파이프라인 요약

```
시청 발생 → video_views(Postgres)
  ↓ (viewgroup 워커)
grouped_views + grouped_view_details (D1)
  ↓ (commission 워커)
commission_batch (D1) → User.points (Postgres)
  ↓ (cfstats 워커)
cf_stats (D1) + R2 JSON 스냅샷
  ↓ (Next.js API)
통계 페이지 UI 조회
```

### 13-2. 정산 데이터 흐름 상세

#### 단계 1: 원본 시청 기록 (PostgreSQL `video_views`)

- 누가 언제 어떤 영상을 코인 또는 구독으로 시청했는지 기록
- 추천인(`referredBy`)과 영업팀 마스터(`teamMaster`) 정보 포함

#### 단계 2: 그룹화 (`viewgroup` Worker → D1 `grouped_views`)

- 날짜 × 크리에이터 × 포스트 × 팀마스터 × 추천인 기준으로 묶음
- `grouped_view_details`: 개별 시청 근거 보존 (관리자 감사용)

#### 단계 3: 커미션 계산 (`commission` Worker → D1 `commission_batch`)

- 크리에이터 등급, 코인/구독 시청 수, 추천인 구조 기반 계산
- `post_id`를 반드시 보존 (감사 추적 필수)

#### 단계 4: 포인트 지급

- `processed=1`: 즉시 Postgres User.points 반영
- `processed=3`: 조건 미충족 보류 (다음 정산 주기 재시도)

#### 단계 5: 통계 집계 (`cfstats` Worker → D1 + R2)

- Cloudflare Stream 접속 로그를 국가별·기간별 집계
- R2에 JSON 스냅샷 저장 (Next.js 조회용 fallback)

### 13-3. 포인트 단가 설정 (최신 원장 기준)

| 설정 | 값 | 설명 |
|------|----|------|
| `subscriptionPerPoint` | 1000 | 구독 시청 1회 = 1000포인트 |
| `coinPerPoint` | 120 | 코인 시청 1회 = 120포인트 |
| `viewCoinAmount` | 2 | 영상 시청 비용 = 2코인 |

### 13-4. 지급 신청 및 승인

- `point_withdrawals` 테이블에서 관리
- 신청 조건: 이메일 인증 + 은행 정보 + 신분 확인 완료
- 상태: PENDING → APPROVED / REJECTED
- 승인 시 `processedBy`, `processedAt` 기록

---

## 14. 운영 상태 및 진행 현황

### 14-1. 최신 기준

- runId: `20260525090317`
- targetDate: `2042-06-15`
- period: `2042-W24`
- 상세 문서: `docs/AGENCY_E2E_REPORT_20260525090317.md`

### 14-2. 확인 계정

| 구분 | 아이디 |
|------|--------|
| Creator | `lv1-0317` |
| Agency (Personal/Team Master) | `hq-0317` |
| Admin | `t-admin-0317` |

### 14-3. Worker/D1 검증값

- D1 `grouped_views`: 15행
- D1 `commission_batch`: 26행
- 지급 완료: 22행
- 조건 미충족 보류: 4행

### 14-4. 국가 지도 주간 통계

| 국가 | 분 |
|------|----|
| US | 9 |
| TH | 9 |
| KR | 6 |
| JP | 6 |
| VN | 6 |

---

## 15. Payment Provider 전환 상태

### 15-1. 현재 상태 (2026-05-26)

- 레거시 한국 결제 실행 코드는 앱에서 **완전히 제거**됨
- `/subscription` 페이지는 유지되나 외부 결제 위젯은 열지 않음
- 구독/코인 구매 클릭 시 placeholder toast 표시 (글로벌 결제 제공자 구현 대기)

### 15-2. 소스 오브 트루스

| 항목 | 파일 위치 |
|------|----------|
| UI | `src/app/[locale]/(main)/(static)/subscription/Subscription.tsx` |
| 관리자 가격 스키마 | `src/lib/admin/system-settingspage.ts` |
| 관리자 가격 UI | `src/app/[locale]/(main)/admin/system/components/SystemSettings.tsx` |
| 구독 만료 유지 | `src/app/api/cron/billingkr/route.ts` |
| 결제 취소 placeholder | `src/app/api/payments/cancel/route.ts` |

### 15-3. 유지된 DB 모델 (향후 제공자용)

- `Payment`, `Subscription`, `BillingKey`, `webhookLog` → 스키마에 보존

### 15-4. 가격 정책

- Admin 설정에 legacy `price`와 global `globalPrice` 동시 유지
- `/subscription`은 `globalPrice`를 USD로 표시
- 기존 weekly/yearly 탭 동작 및 코인 선택 활성화 동작 preserv

### 15-5. 제거된 런타임 표면

- 결제 위젯 모달 및 결제 모달
- `/usermenu/payments/result/*` 결제 결과 페이지
- `/api/payments/coin/*`, `/api/payments/billing/*`, `/api/payments/statusdb`, `/api/payments/webhook` 레거시 API
- 레거시 결제 SDK 의존성 및 로컬 환경 키

### 15-6. 통계 및 커미션 격리

- 이 제거는 워커 통계나 에이전시 지급 시뮬레이션 원장에 영향 없음
- 커미션/통계 소스 원장은 그대로 유지: `video_views`, D1 `grouped_views`, `grouped_view_details`, `commission_batch`, `cf_stats`
- 향후 결제 제공자 작업은 currency/provider 필드를 보존하고 provider-neutral settlement point pool을 통계에 공급해야 함

### 15-7. 후속 구현 가이드

- `docs/GLOBAL_PAYMENT_INTEGRATION_GUIDE.md` 문서 참조
- DB, 웹훅, admin 설정, subscription 페이지, 워커 정산, 통계 통합 포인트 문서화됨

---

## 16. Pricing 및 관리 설정 안정성

### 16-1. 가격 페이지 i18n (2026-05-27)

- 가격 헤드라인이 하드코딩된 한국어 텍스트에서 `Subscription.eventHeadline` 키로 이전
- `messages/ko.json`, `messages/en.json`, `messages/zh.json` 업데이트

### 16-2. 가격 표시 안정성

- 메뉴 레이블: `Subscription / Coins` → `Pricing` (영어 네비게이션)
- `globalPrice`가 없는 이전 DB 설정 행은 `price / 1000` fallback → `$NaN` 방지
- 기존/할인 가격은 활성 USD 표시 가격의 20% 상위로 계산

### 16-3. Admin 시스템 설정 안정성

- `/api/admin/settings`는 DB 설정과 `DEFAULT_SETTINGS`를 병합하고 이전 raw JSON 설정 형태를 허용
- `SystemSettings` 숫자 포맷은 `undefined`, `null`, 문자열 값에 방어적 → `/admin/system?tab=settings` 크래시 방지

---

## 17. 로그 시스템 모바일 UI 및 검증

### 17-1. 로그 시스템 모바일/태블릿 반응형 UI 최적화

- `admin/service?tab=logs`의 `LogTable`에 모바일(`sm` 미만) 전용 카드 뷰 도입
- 각 카드: 타임스탬프, 사용자(username), 타입 아이콘, 국가, IP 주소, 로그 이벤트 설명
- 데스크톱 테이블: `hidden sm:block`으로 모바일에서 렌더링 안 함
- `LogFilters` 모바일 입력 필드에 `"User ID"` placeholder 지정
- 불필요한 `ko` 로케일 임포트 정리

### 17-2. 시간대 설정 연동 및 표기 검증

- 어드민 설정 `analyticsTimeZone` ↔ 워커 `ANALYTICS_TIME_ZONE` 환경변수 연동 확인
- Next.js `/api/admin/service/logs`: 타임존 안전하게 파싱 → 워커 전송
- 워커: 기간 필터링 바운더리 계산 시 UTC 변환 정확 수행
- 어드민 UI(`LogTable`, `LogModal`): `formatInTimeZone`으로 현지 시간대 출력 검증

---

## 18. E2E 시뮬레이션 검증 가이드

이 섹션은 `docs/AGENCY_E2E_REPORT_20260526074947.md`의 핵심 내용을 요약하여, 실제 로그인하고 검증할 수 있는 방법을 제공합니다.

### 18-1. 검증 요약

| 항목 | 값 |
|------|----|
| 검증 상태 | ✅ 통과 |
| 실행 ID | `20260526074947` |
| 정산일 | `2041-06-30` |
| 주차 키 | `2041-W26` |
| 공통 비밀번호 | `MegaTest!2026` |
| 생성 계정 | 22개 |
| 크리에이터 | 3명 |
| 영업팀 | 3개 |
| 테스트 포스트 | 6개 |
| 테스트 시청 기록 | 15건 |
| D1 커미션 행 | 34건 |
| D1 영업수수료 행 | 27건 |
| D1 영업수수료 post_id 누락 | **0건** |

### 18-2. 직접 로그인하여 확인하는 방법

#### 18-2-1. 크리에이터 수익 확인

- **아이디**: `lv1-4947`
- **비밀번호**: `MegaTest!2026`
- **확인 화면**: `/ko/usermenu/earnings?tab=statistics&period=2041-W26&unit=weekly`
- **확인 방법**:
  1. 브라우저에서 `https://www.megashorts.com/ko/login` 접속
  2. `lv1-4947` / `MegaTest!2026`으로 로그인
  3. URL에서 `period=2041-W26` 유지 확인
  4. 주간 통계 탭에서 포인트 내역 확인

#### 18-2-2. 영업팀 수익 확인

- **아이디**: `hq-4947`
- **비밀번호**: `MegaTest!2026`
- **확인 화면**: `/ko/usermenu/agency-earnings?tab=statistics&period=2041-W26&unit=weekly`
- **확인 방법**:
  1. 로그인 후 영업팀 수익 페이지로 이동
  2. HEADQUARTERS 타입 영업팀의 직접/간접 추천 커미션 확인
  3. 구성원별 포인트 분배 확인

#### 18-2-3. 관리자 시스템 통계 확인

- **아이디**: `t-admin-4947`
- **비밀번호**: `MegaTest!2026`
- **확인 화면**: `/ko/admin/system?tab=stats&period=2041-W26&unit=weekly`
- **추가 화면**: `/ko/admin/agency` (영업 설정/조직도)
- **확인 방법**:
  1. 로그인 후 관리자 시스템 통계로 이동
  2. `Paid View Basis Detail`에서 비디오 단위 시청 근거 확인
  3. `Agency Payout Detail`에서 영업수수료 post_id 보존 확인
  4. 국가 지도에서 Cloudflare 통계 스냅샷 확인

### 18-3. API로 직접 확인

로그인 세션이 있는 브라우저에서 아래 URL을 직접 열면 JSON 응답을 확인할 수 있습니다.

| API | URL |
|-----|-----|
| 크리에이터 통계 | `/api/stats/uploader?userId=codex_agency_test_20260526074947_creator_lv1&period=2041-W26` |
| 크리에이터 주간 정산 | `/api/stats/weekly?userId=codex_agency_test_20260526074947_creator_lv1&period=2041-W26&type=uploader` |
| 영업팀 통계 | `/api/stats/agency?userId=codex_agency_test_20260526074947_hq_master&period=2041-W26` |
| 영업팀 주간 정산 | `/api/stats/weekly?userId=codex_agency_test_20260526074947_hq_master&period=2041-W26&type=agency` |
| 관리자 통계 | `/api/stats/admin?period=2041-W26` |
| Cloudflare 지도 | `/api/stats/cloudflare?period=2041-W26` |

### 18-4. 테스트 계정 전체 목록

| 구분 | 아이디 | 역할 | 소속 마스터 | 추천인 | 현재 포인트 |
|------|--------|------|------------|--------|------------|
| 관리자 | t-admin-4947 | 100 | - | - | 0 |
| 크리에이터 | lv1-4947 | 20 | - | - | 372 |
| 크리에이터 | lv2-4947 | 22 | - | - | 372 |
| 크리에이터 | lv3-4947 | 24 | - | - | 72 |
| HQ 마스터 | hq-4947 | 50 | 본부 | - | 244.8 |
| HQ 멤버 | hq-a-4947 | 40 | 본부 | hq-4947 | 62 |
| HQ 멤버 | hq-b-4947 | 40 | 본부 | hq-4947 | 12 |
| HQ Lv2 | hq-l2a-4947 | 40 | 본부 | hq-a-4947 | 7.19 |
| NETWORK 마스터 | net-4947 | 50 | 네트워크 | - | 113.99 |
| NETWORK 멤버 | net-a-4947 | 40 | 네트워크 | net-4947 | 74.8 |
| BINARY 마스터 | bin-4947 | 50 | 바이너리 | - | 113.99 |

> 모든 계정 비밀번호: `MegaTest!2026`

### 18-5. 이번 테스트가 확인한 핵심 사항

1. **크리에이터 등급별 차등 지급률**이 정상 적용됨 (Lv.1: 10%, Lv.2: 20%, Lv.3: 30%)
2. **영업팀 3타입** (HEADQUARTERS, NETWORK, BINARY_NETWORK) 모두 생성 및 작동
3. **뷰 그룹화 워커**가 원본 시청 기록을 읽어 D1 `grouped_views`로 묶고, `grouped_view_details`에 상세 근거 저장
4. **커미션 워커**가 D1 `grouped_views`를 읽어 D1 `commission_batch` 생성 후 실제 사용자 포인트 반영
5. **영업수수료 post_id 누락 0건** — 감사 원장 정보 손실 없음
6. **Cloudflare 국가 통계**가 운영 `cfstats-admin`과 같은 스키마로 D1에 저장 + R2에 JSON 업로드

### 18-6. 재현 및 정리 명령

```bash
# 테스트 데이터 생성
node scripts/agency-e2e-fixture.mjs full 20260526074947

# 검증 실행
node scripts/agency-e2e-fixture.mjs verify 20260526074947

# 보고서 생성
node scripts/agency-e2e-fixture.mjs report 20260526074947

# 테스트 데이터 정리 (Postgres + D1)
node scripts/agency-e2e-fixture.mjs cleanup 20260526074947
```

### 18-7. 전체 커미션 계산 결과 요약

| 지급 유형 | 행 수 | 처리 상태 |
|-----------|-------|-----------|
| CREATOR (크리에이터 지급) | 7행 | 완료 (processed=1) |
| DIRECT (직접 추천) | 7행 | 완료 (processed=1) |
| INDIRECT (간접 추천) | 4행 | 완료 (processed=1) |
| NETWORK_LEVEL (네트워크) | 16행 | 12행 완료, 4행 보류 (processed=3) |

**보류 4행 설명**: 바이너리/네트워크 조건의 매칭이 아직 완료되지 않아 다음 정산 주기로 이월된 상태입니다. 조건 충족 시 자동 처리됩니다.

---

## 부록: 주요 파일 경로 매핑

| 기능 | 파일 경로 |
|------|----------|
| 시청 권한 체크 | `src/components/videos/PlayPermissionCheck.tsx` |
| 비디오 플레이어 | `src/components/videos/VideoPlayer.tsx` |
| 영상 상세 클라이언트 | `src/app/[locale]/(main)/video-view/[postId]/VideoViewClient.tsx` |
| 코인 결제 API | `src/app/api/user/coinpay/route.ts` |
| 시청 기록 API | `src/app/api/videos/view/route.ts` |
| 사용자 인증 API | `src/app/api/users/[userId]/auth/route.ts` |
| 세션 제공자 | `src/components/SessionProvider.tsx` |
| 사용자 Auth 쿼리 훅 | `src/hooks/queries/useUserAuth.ts` |
| 콘텐츠 재검증 | `src/lib/content-revalidation.ts` |
| 캐시 재검증 API | `src/app/api/revalidate/route.ts` |
| 메인 콘텐츠 (랜딩) | `src/components/MainContent.tsx` |
| 추천 페이지 서버 | `src/app/[locale]/(main)/recommended-videos/page.tsx` |
| 추천 페이지 클라이언트 | `src/app/[locale]/(main)/recommended-videos/RecommendedVideosClient.tsx` |
| 추천 API | `src/app/api/posts/recommended/route.ts` |
| 인증 (Lucia) | `src/auth.ts` |
| 미들웨어 | `src/middleware.ts` |
| 내용 언어 유틸 | `src/lib/content-language.ts` |
| 내용 언어 서버 유틸 | `src/lib/content-language-server.ts` |
| PWA 세션 | `src/lib/pwa-session.ts` |
| 시스템 설정 API | `src/app/api/admin/settings/route.ts` |
| 관리자 통계 UI | `src/app/[locale]/(main)/admin/system/components/SystemStats.tsx` |
| 관리자 설정 UI | `src/app/[locale]/(main)/admin/system/components/SystemSettings.tsx` |
| 크리에이터 수익 통계 | `src/app/[locale]/(main)/usermenu/earnings/PointsStatistics.tsx` |
| 워커 스키마 (D1) | `msworker/src/dailywork/shared/schema.ts` |
| viewgroup 워커 | `msworker/src/dailywork/workers/viewgroup/` |
| commission 워커 | `msworker/src/dailywork/workers/commission/` |
| cfstats-admin 워커 | `msworker/src/dailywork/workers/cfstats-admin/` |

---

> **문서 정보**  
> 이 가이드는 MegaShorts 플랫폼의 기술 아키텍처, 데이터 흐름, 캐시 전략, 워커 파이프라인, E2E 검증 시나리오를 단일 문서로 통합한 종합 참조서입니다.  
> 플랫폼의 변경 사항이 발생할 때 이 문서를 함께 업데이트하여 최신성을 유지하십시오.

---

*End of MegaShorts System Guide v1.0*
