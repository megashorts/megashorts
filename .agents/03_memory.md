# MegaShorts 개발 메모리 (에러/해결/구조변경 기록)

> 최종 업데이트: 2026-05-13

## 2026-05-13 — 최초 프로젝트 분석

### 프로젝트 핵심 구조
- **Auth**: Lucia v3 + Arctic (Google/Kakao/Naver OAuth) + 이메일 인증
- **DB**: Supabase PostgreSQL + Prisma ORM + Cloudflare D1(워커용)
- **결제**: 토스페이먼츠(테스트모드) - billing/coin 두 가지 유형
- **스트리밍**: Cloudflare Stream (HLS) + @cloudflare/stream-react
- **로그**: Cloudflare R2 + Workers (커스텀 활동 로그)
- **시청기록**: IndexedDB(클라이언트) + Supabase(서버) 이중 관리
- **상태관리**: Zustand + TanStack Query
- **UI**: Radix UI + Tailwind CSS + Framer Motion

### msworker 구조 (정리 완료)
- `src/index.ts` — 메인 로그 워커 (megashorts-logs, R2 기반 로그 수집/압축)
- 🗑️ `src/agency/`, `src/stats/`, `src/uploader/` — 기존 프론트엔드 통신용 워커였으나 Next.js API로 이관됨에 따라 **완전 삭제** 완료 (2026-05-13)
- 🗑️ `src/d1-test/`, `test-cloudflare-stream/` — 테스트 스크립트 삭제 완료
- `src/dailywork/workers/viewgroup/` — 시청기록 그룹화 (스케줄)
- `src/dailywork/workers/postdata/` — 유료시청 포스트 카운트 (Queue 기반)
- `src/dailywork/workers/viewcountteam/` — 영업팀 시청카운트
- `src/dailywork/workers/cfstats-admin/` — CF 스트림 통계(관리자)
- `src/dailywork/workers/cfstats-creator/` — CF 스트림 통계(크리에이터)
- `src/dailywork/workers/commission/` — 커미션 정산
- `src/dailywork/workers/payments-collector-worker/` — 결제 수집
- `src/dailywork/workers/referral-structure-worker/` — 추천인 구조
- `src/dailywork/workers/system-settings/` — 시스템 설정
- `src/dailywork/workers/team-master-settings/` — 팀마스터 설정
- `src/dailywork/workers/workersmanager/` — 워커 관리자
- `test-cloudflare-stream/` — ⚠️ 테스트 스크립트 폴더 (미사용, 삭제 대상)

### 시청 권한 검사 현황
- `PlayPermissionCheck.tsx`가 활성 사용 중
- `VideoPermissionCheck.tsx`는 전체 주석처리 (미사용)
- 검사 순서: 성인인증 → 구독확인 → 코인결제(자동차감)
- `useUserAuth` 훅이 `/api/users/[userId]/auth`에서 adultauth + subscription 정보 가져옴
- staleTime 12시간으로 설정 → 결제 직후 반영 지연 가능성 있음

### 결제 시스템 현황
- 토스페이먼츠: billing(구독) + coin(일회성) 두 가지 결제 경로
- billing: authKey(빌링키) 기반 → subscription upsert + payment 기록
- coin: paymentKey 기반 → 토스 confirm API 호출 → user mscoin 증가
- webhook: 결제 상태 변경 시 subscription/coin 자동 처리
- 가격: 주간 8,500원, 연간 190,000원, 코인 10/70/350/700개

### 주요 환경변수
- NEXT_PUBLIC_LOGS_WORKER_URL → megashorts-logs 워커 연결
- REFERRAL_STRUCTURE_WORKER_URL → referral-structure 워커 연결
- TOSS_PAYMENTS_SECRET_KEY → 토스 서버 인증
- NEXT_PUBLIC_TOSS_PAYMENTS_CLIENT_KEY → 토스 클라이언트

### 아키텍처 공식 문서화
- 플랫폼 전체 아키텍처(비디오 재생 권한, KV 캐싱, 다국어 SEO, 결제 구조 등)의 단일 소스 해설을 위해 `04_architecture.md` 파일 생성 (2026-05-13)
