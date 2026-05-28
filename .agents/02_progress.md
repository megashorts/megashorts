# MegaShorts 진행 체크리스트

> 최종 업데이트: 2026-05-22

## Phase 0: 분석 및 계획 수립
- [x] 프로젝트 구조 파악
- [x] msworker 워커 전수 분석
- [x] 결제 시스템(토스) 분석
- [x] 시청 권한 검사 로직 분석
- [x] 인증 시스템(Lucia) 분석
- [x] 활동 로그 시스템 분석
- [x] 종합 분석 문서 작성 ✅ (implementation_plan.md)
- [x] 사용자 피드백 반영 및 문서 기준 확정

## Phase 1: MCP 설치 (요청#1)
- [x] 기존 MCP 설정 오류(mcp_config.json) 초기화 및 경고 제거
- [x] Vercel MCP 설치 및 설정 (`~/.codex/config.toml`, `.mcp.json`) 완료
- [x] Supabase MCP 설치 및 설정 (`~/.codex/config.toml`, `.mcp.json`) 완료
- [x] Cloudflare MCP 설치 및 설정 (`~/.codex/config.toml`, `.mcp.json`) 완료
- [x] 연결 테스트/도구 인식 확인 완료

## Phase 3: msworker 정리 및 끊어진 API 복구 (요청#2)
- [x] 미사용 워커(agency, stats, uploader, d1-test, test-cloudflare-stream) 5개 삭제
- [x] 프론트엔드 환경변수(`NEXT_PUBLIC_STATS_API_URL`) 의존성 제거 및 로컬 API(`/api/stats/...`)로 경로 수정 완료
- [x] TypeScript 빌드 에러 97개 전면 수정 및 로컬 서버 실행 복구 완료 ✅

## Phase 3: 시청 권한 최적화 (요청#3)
- [x] 현행 분석 보고 ✅
- [x] Two-track 캐싱 전략 수립 (Client Memory + Async Server Sync) ✅
- [x] `PlayPermissionCheck.tsx` Optimistic UI 구현 완료 ✅

## Phase 4: 다국어 + PWA (요청#4)
- [x] next-intl 구현 (URL Prefix: /ko, /zh, 기본: en) ✅
- [x] PWA manifest + SW 구현 (@ducanh2912/next-pwa) ✅
- [x] Phase 1: 다국어 설정 및 메시지 파일 생성
- [x] Phase 2: 네비게이션 컴포넌트 다국어 적용 (8개 파일)
- [x] 이슈 해결: 데스크탑 랜딩페이지 사이드바 노출 버그 해결 (MenuBar.tsx에서 next-intl/routing의 usePathname 사용)
- [x] Phase 3: 로그인/회원가입/비밀번호 재설정 등 인증 페이지 다국어 적용 완료

## Phase 5: 프론트엔드 전면 다국어화 (요청#5)
- [x] Subscription 컴포넌트(구독, 코인) next-intl 적용 완료
- [x] Notice 컴포넌트(목록, 상세) next-intl 적용 완료
- [x] Company 컴포넌트(소개, 이용약관, 개인정보처리방침) next-intl 적용 완료
- [x] Categories 컴포넌트 next-intl 적용 완료
- [x] 카테고리 다국어화: Enum 유지 + next-intl `Category` 네임스페이스 전환 완료
- [x] 하드코딩 `CATEGORIES`/`getCategoryName` 전량 제거, PostModal/PostEditor/CategorySelect/PostPage 수정
- [x] TypeScript 빌드 검증: `tsc --noEmit` 에러 0건 통과 ✅
- [x] 포스트/영상 동적 콘텐츠 다국어 정책 구축: 선택 언어 -> 영어 -> 원문 fallback 적용 ✅
- [x] `/admin/system` 콘텐츠 언어 노출 정책 추가: 전체 노출 fallback / 선택 언어 지원 콘텐츠 필터링 전환 가능 ✅
- [x] 랜딩, 카테고리, 추천 영상, 카드, 그리드, 모달, 상세, 영상 재생 화면에 콘텐츠 언어 정책 적용 ✅
- [x] 영상 자막 선택 로직 개선: 한국어 고정 제거, 선택 언어 우선 + 영어 fallback 적용 ✅
- [x] 검증 완료: `npm run lint`, `npx tsc --noEmit`, `npm run build` 통과 ✅
- [x] 2026-05-20 다국어 불일치 보정: i18n alias 키 지원, 상세 페이지 Decimal 직렬화 오류 수정, 카테고리/모달/추천/유저메뉴 주요 문구 다국어 적용 ✅
- [x] 2026-05-20 로그인 세션 불일치 버그 해결: SSR 하이드레이션 캐시로 인해 클라이언트 마운트 시 세션 API(/api/auth/session)가 재호출되지 않던 캐시 락 현상 해결 ✅
- [x] 2026-05-20 admin/service 및 admin/agency 영역의 한글 하드코딩 텍스트 전량 영문화 처리 완료 (Logs, Users, Inquiry 컴포넌트 포함) ✅

## Phase 6: Stripe 구현 (요청#6)
- [ ] Stripe 결제 구현
- [ ] 토스/스트라이프 전환 로직

## Phase 7: 글로벌 성인인증 (요청#7)
- [x] Self-declaration 방식 구현 (Framer Motion 바텀시트) ✅
- [x] `verify-age` API 및 `userAuth` 캐시 무효화 연동 완료 ✅

## Phase 8: 시간대 단일화 및 워커 기본값 고정 (2026-05-21)
- [x] Next 관리자 설정 `analyticsTimeZone` 추가 및 저장/조회 경로 연결 완료 ✅
- [x] `/api/admin/service/logs` 타임존 파라미터 자동 주입/정규화 적용 완료 ✅
- [x] 로그 모달/테이블/필터 표시 시간을 관리자 설정 타임존 기준으로 통일 완료 ✅
- [x] 워커 공유 시간대 유틸(`shared/timezone.ts`) 도입 및 체인 전파 통일 완료 ✅
- [x] `viewgroup -> postdata -> viewcountteam -> commission -> cfstats-admin` 시간대 파라미터 전달 통일 완료 ✅
- [x] `cfstats-admin`, `cfstats-creator`, `commission`, `viewcountteam`, `postdata`, `viewgroup` 시간대 기준 집계 경계 정리 완료 ✅
- [x] 전체 워커 `wrangler.toml`에 `ANALYTICS_TIME_ZONE = "Asia/Seoul"` 기본값 명시 완료(12개) ✅
- [x] 아키텍처 문서(`04_architecture.md`) 시간대 운영 기준/설정 위치/검증 커맨드 업데이트 완료 ✅

## Phase 9: 운영 문서 동기화 스킬화 (2026-05-21)
- [x] 커스텀 스킬 `ops-doc-sync` 생성 완료 (`~/.codex/skills/ops-doc-sync`) ✅
- [x] 스킬 번들 검증 스크립트 `check_timezone_defaults.sh` 추가 완료 ✅
- [x] 검증 실행 결과 PASS 확인 (워커 `wrangler.toml` 12개 모두 `ANALYTICS_TIME_ZONE` 선언) ✅

## Phase 10: ops-doc-sync 실동기화 (2026-05-21)
- [x] `ops-doc-sync` 스킬로 `.agents/04_architecture.md`, `.agents/02_progress.md`, `.agents/03_memory.md` 동기화 완료 ✅
- [x] 공유용 E2E 요약본은 최신 단일 문서 `docs/STATS_E2E_VERIFICATION_20260525.md`로 대체 완료 ✅
- [x] 시간대 기본값 검증 재실행 PASS 확인 (`check_timezone_defaults.sh`) ✅
- [x] 운영자 확인용 시간대 설정 위치(Next `analyticsTimeZone`, Cloudflare `ANALYTICS_TIME_ZONE`) 문서 명시 완료 ✅

## Phase 11: 운영 문서 재동기화 (2026-05-22)
- [x] 랜딩/카테고리 캐시 전략 및 on-demand revalidation 설명을 아키텍처 문서에 초보자 기준으로 보강 완료 ✅
- [x] `submitPost`의 `PUBLISHED -> DRAFT` 전환 무효화 보강 내용 문서 반영 완료 ✅
- [x] E2E 요약본의 영업팀 통계 확인 절차를 `usermenu/agency-earnings` + `admin/agency?tab=search`(Lookup) 기준으로 재작성 완료 ✅
- [x] 플랫폼 통계 확인 절차를 `admin/system` Stats 탭 클릭 순서형 가이드로 보강 완료 ✅
- [x] 시간대 기본값 검증 스크립트 재실행 PASS 확인 ✅

## Phase 12: PWA 설치 앱 최적화 (2026-05-23)
- [x] PWA 설치 앱 감지 및 전역 부트스트랩 추가 (`PWAEnhancer`) ✅
- [x] PWA 설치 앱 세션 90일 연장 API 및 로그인 연동 구현 ✅
- [x] 추천 영상/실제 영상 시청 페이지 PWA 모바일 전용 전체화면형 UI 적용 ✅
- [x] 컨트롤 숨김 상태에서 모든 PWA 설치 앱의 상단 로고/메뉴줄 자동 숨김 구현 ✅
- [x] PWA 설치 앱에서 portrait orientation lock 시도 및 fallback 유지 ✅
- [x] 추천/시청 영상 다음 썸네일/HLS 시작 구간 프리로드 구현 ✅
- [x] PWA 오프라인/네트워크 실패 시 유료 영상 시청 기록 큐잉 및 온라인 복귀 재전송 구현 ✅
- [x] 설치 사용자 분석/트래킹은 구현 제외 ✅
- [x] 검증: `pnpm build` 성공, manifest/SW/API 응답 확인 ✅
- [x] OS별 PWA 설치 위치/홈 화면 아이콘 생성 기준 문서화 완료 ✅

## Phase 13: 저장 통계 조회/지도/권한 정리 (2026-05-23)
- [x] 크리에이터/영업팀 수익 메뉴 및 직접 접근 권한 분리 완료 ✅
- [x] `/api/stats/uploader`, `/api/stats/agency`, `/api/stats/admin`, `/api/stats/weekly`, `/api/stats/reports`를 워커 저장 결과 조회 기준으로 정리 ✅
- [x] 통계 화면의 기간 선택을 Day / Week / Month로 통일 완료 ✅
- [x] 개인/플랫폼 지도 UI를 MapLibre GL JS + CARTO raster basemap + 국가 중심좌표 버블 방식으로 교체 완료 ✅
- [x] `cfstats-admin` 크리에이터별 국가 통계 R2 저장 경로 추가 완료 ✅
- [x] `/admin/system?tab=stats&period=...` 직접 링크가 Stats 탭을 열도록 변경 완료 ✅
- [x] `/admin/agency?tab=search` Lookup 하위 탭을 저장 통계 기준으로 정리 완료 ✅
- [x] 공유용 문서는 최신 단일 문서 `docs/STATS_E2E_VERIFICATION_20260525.md`로 통합 완료 ✅
- [x] 검증: `pnpm exec tsc --noEmit`, `pnpm exec tsc --noEmit -p msworker/tsconfig.json`, `pnpm exec next build` 통과 ✅

## Phase 14: 정산/로그/가격/운영 조회 재검증 (2026-05-23)
- [x] 로그 워커 저장 이벤트를 영문 기본값 + 원문 다국어 보존(`eventI18n`) 구조로 보강 완료 ✅
- [x] 관리자 로그 테이블/모달이 영문 이벤트를 우선 표시하고 원문을 상세에서 확인하도록 정리 완료 ✅
- [x] `/ko/admin/agency?tab=search`에서 운영자가 팀마스터를 선택해 Referral / Distribution / Statistics를 조회하도록 보강 완료 ✅
- [x] `/api/agency/structure`의 타인 팀 구조 조회 권한을 운영 권한 기준으로 제한 완료 ✅
- [x] 구독 시청 기록 API가 기존 행도 `createdAt`/`viewCount`를 갱신하도록 수정 완료 ✅
- [x] 구독/코인 구매 화면이 관리자 `subscriptionPackages`, `coinPackages` 설정 금액을 반영하도록 수정 완료 ✅
- [x] E2E fixture 스크립트가 `dotenv` 패키지 누락만으로 중단되지 않도록 선택 로딩 처리 완료 ✅
- [x] 실제 API 검증 중 배포 Worker `/summary`/`/stats`가 조회가 아니라 실행처럼 동작하는 문제 확인 및 Next 통계 조회의 Worker HTTP 기본 비활성화 완료 ✅
- [x] Next 통계 API를 Cloudflare D1 저장값 직접 조회 기준으로 전환 완료 (`ENABLE_WORKER_STATS_HTTP=1`일 때만 Worker HTTP 사용) ✅
- [x] 개인 영업팀 수익 통계가 팀 전체가 아니라 본인 지급 완료 커미션(`commission_batch.processed = 1`)만 합산하도록 수정 완료 ✅
- [x] 과거 W23 지도 통계 fixture seed 검증 완료. 최신 기준은 Phase 18의 운영 `cfstats-admin` 스키마형 D1/R2 스냅샷 ✅
- [x] 실제 로컬 production API 검증 완료: admin `1478.35P/38 views`, creator LV1 `372P/6 views`, HQ master `244.8P/5 views` ✅
- [x] 재검증 보고서는 최신 단일 문서 `docs/STATS_E2E_VERIFICATION_20260525.md`로 통합 완료 ✅
- [x] 검증: `./node_modules/.bin/tsc --noEmit`, `./node_modules/.bin/tsc --noEmit -p msworker/tsconfig.json`, `pnpm exec next build` 통과 ✅
- [x] commission Worker의 `daily`/`monthly` 기간별 실행 결과 저장 모드와 중복 지급 방지 기준 분리 ✅ 2026-05-24
- [ ] Stripe 또는 글로벌 달러 결제 승인/환율/정산 반영 경로 구현
- [x] 팀마스터 제거 시 기존 팀원 이관/해체/추천 구조 정리 정책 확정 및 구현 ✅ 2026-05-24

## 현재 미완료 항목 (2026-05-23 기준)
- Phase 6: Stripe 결제 구현
- Phase 6: 토스/스트라이프 전환 로직
- Phase 14: Stripe 또는 글로벌 달러 결제 승인/환율/정산 반영 경로 구현

## Phase 15: 통계 화면/권한/검증 문서 재정리 (2026-05-24)
- [x] 기존 네 화면 책임 재정의: creator 개인, agency 개인, agency 팀 전체, system 플랫폼 전체 ✅
- [x] 개인 영업자 수익과 영업팀 전체 통계를 D1 `user_id`/`master_id` 기준으로 분리 ✅
- [x] 운영자 사용자 테이블 액션에 `View`, `Earnings`, `Profile` 진입 추가 ✅
- [x] 수익/통계 UI에서 내부 D1 source 문자열 제거 및 긴 ID overflow 방지 ✅
- [x] 크리에이터 콘텐츠 표기를 `포스트/동영상(유료)` 형식으로 변경하고 실제 Prisma video count 반영 ✅
- [x] 개인 영업자 수익 화면에서 팀 전체 정보성 표현 제거, 개인 지급 행 기준으로 정산표 구성 ✅
- [x] 영업팀 `Point Distribution`, `Statistics`를 master_id 팀 전체 저장 원장 기준으로 채움 ✅
- [x] 플랫폼 지도 tooltip 색상 수정 및 D1 국가 통계 버블 검증 ✅
- [x] Next PWA precache에서 stale build manifest 제외해 localhost Workbox 404 원인 완화 ✅
- [x] 20260519060836 테스트 계정 로그인 ID/email 단순화 완료 (`lv1`, `hq`, `net`, `bin` 등) ✅
- [x] 최신 검증 문서 작성: `docs/STATS_E2E_VERIFICATION_20260525.md` ✅
- [x] 오래된 실패/혼선 보고서 제거: `docs/AGENCY_E2E_REPORT_20260519055818.md`, `docs/AGENCY_E2E_REPORT_20260519060453.md` ✅
- [x] 통계 API/UI 시간대 표기를 `Asia/Seoul` 시스템 설정 기준으로 수정 ✅
- [x] commission Worker가 지급 완료 원장을 기준으로 `daily`, `weekly`, 월말 `monthly` 정산 요약을 D1/R2에 저장하도록 수정 ✅
- [x] 팀마스터 제거 시 팀 해체 정책 적용: 팀원 `teamMaster` 해제, 영업팀 역할 일반 회원화, 팀 내부 추천 연결 해제, D1 추천 구조 제거 시도 ✅
- [x] 검증: `npm run lint`, `npm run build`, `npx tsc --noEmit -p msworker/tsconfig.json`, timezone defaults script, 인증 쿠키 기반 local API checks, 임시 계정 기반 팀마스터 제거 API 실검증 통과 ✅
- [x] 운영자/개인 통계 화면 누적 카드와 기간 리포트 분리, 조회 필터를 지도 아래로 이동 ✅
- [x] 지도 basemap을 CARTO raster로 변경해 OpenFreeMap glyph 404 제거, hover tooltip 색상 고정 ✅
- [x] `/api/stats/reports` 기간 리포트 카드/Top 리스트 확장 ✅
- [x] 팀마스터 영업시스템 메뉴 노출 및 Lookup 자신의 팀 자동 고정 기준 정리 ✅
- [x] 운영자 Lookup 팀마스터 목록 API를 OPERATION1 이상 접근으로 교정하고 실제 응답 확인 ✅

## Phase 16: 통계 원장 필드 기반 UI/권한 재검증 (2026-05-25)
- [x] 크리에이터/영업자 개인 수익 화면을 누적 카드 -> 지도(크리에이터만) -> 기간 필터 -> 기간 상세 순서로 재정리 ✅
- [x] 개인/팀 수익 조회에서 `daily` 제거, 주간/월간 지급 원장 조회 기준으로 정리 ✅
- [x] `/usermenu/agency-earnings`에 하위 추천 구조 탭 추가 및 팀마스터 자격 변경 API(`/api/agency/structure/role`) 구현 ✅
- [x] `/admin/agency?tab=search` Lookup 하위 탭을 `Referral Structure`, `Statistics`로 정리하고 지급 상세를 Statistics 하단에 포함 ✅
- [x] D1 `commission_batch` 실제 필드 확인 후 화면 표시 범위를 포스트/유형/시청방식/포인트로 제한 ✅
- [x] 2042-W23 D1 `cf_stats.commission_data`에 누락된 `pointSettings` 계산 기준값 보강 ✅
- [x] `cfstats-admin` R2 누적 조회(`date=all`) 지원 추가, 크리에이터별 R2 파일 누적 합산 경로 구현 ✅
- [x] Workbox stale chunk 404 완화: `_next/static/chunks` precache 제외 및 runtime `NetworkOnly` 확인 ✅
- [x] 포인트 출금 신청 최소값 UI/서버 검증을 `minWithdrawPoint` 설정과 연결 ✅
- [x] 운영팀 OPERATION1 이상이 영업팀 설정/Lookup 대상 팀마스터를 선택하도록 권한 기준 교정 ✅
- [x] 검증: `npm run lint`, `npm run build`, `npx tsc --noEmit -p msworker/tsconfig.json`, timezone defaults script 통과 ✅
- [x] 실제 local production API/page 검증 완료: creator, agency 개인, agency team, admin stats, reports, cloudflare map, structure, role update ✅
- [x] 최신 한글 검증 문서 작성 및 이전 문서 삭제: `docs/STATS_E2E_VERIFICATION_20260525.md` ✅

## Phase 17: fixture 재생성 및 W24 기준 확정 (2026-05-25)
- [x] 기존 `2042-W23` fixture는 최신 UI/원장 구조 검증 기준에서 제외 ✅
- [x] 새 fixture `20260525090317`, 검증일 `2042-06-15`, 주차 `2042-W24` 전체 재생성 ✅
- [x] viewgroup Worker 실제 호출: D1 `grouped_views` 15행 생성 확인 ✅
- [x] commission Worker 실제 호출: D1 `commission_batch` 26행, 지급 완료 22행, 보류 4행 확인 ✅
- [x] 지급 신청/승인 예시 6건 생성 확인 ✅
- [x] weekly `cf_stats.commission_data.pointSettings` 보존 확인: `subscriptionPerPoint=1000`, `coinPerPoint=120`, `viewCoinAmount=2` ✅
- [x] fixture 스크립트 수정: 짧은 username 유니크 처리, postId suffix 생성, cleanup manifest user id 처리, 지도 seed upsert 방식 변경 ✅
- [x] 최신 문서 갱신: `docs/STATS_E2E_VERIFICATION_20260525.md`, `docs/AGENCY_E2E_REPORT_20260525090317.md` ✅

## Phase 18: 운영 스키마 기반 R2 지도 스냅샷 재검증 (2026-05-26)
- [x] `node scripts/agency-e2e-fixture.mjs full 20260525090317` 실제 실행 완료 ✅
- [x] Supabase/Postgres 계정/포스트/시청 원장 재생성 확인 ✅
- [x] viewgroup Worker 실행 및 D1 `grouped_views` 15행 확인 ✅
- [x] commission Worker 실행 및 D1 `commission_batch` 26행, 지급 완료 22행, 보류 4행 확인 ✅
- [x] D1 `cf_stats`를 운영 `cfstats-admin` 형식(`top_countries=[{country,minutes}]`, 기간별 `request_list`)으로 생성 확인 ✅
- [x] `scripts/agency-e2e-r2-stats-snapshot.mjs` 추가: 운영 R2 경로 `cf-stats/{period}/{date}.json`, `cf-stats/{period}/{date}/creators/{creator}.json` 업로드 자동화 ✅
- [x] `points-system-bucket/cf-stats/` R2 객체 12개 업로드 완료 ✅
- [x] Cloudflare MCP R2 list로 weekly platform/creator 객체 4개 존재, content-type `application/json`, size/last_modified 확인 ✅
- [x] 검증: `npx tsc --noEmit`, `npx tsc --noEmit -p msworker/tsconfig.json`, `node --check` 2개 스크립트, `npm run build` 통과 ✅
- [ ] 최신 빌드 로컬 UI 서버 직접 확인: 현재 실행환경에서 `listen EPERM` 및 escalated 서버 실행 거부로 미완료
- [x] Phase 19: 결제 시스템 종합 분석 업데이트 및 전수조사 (2026-05-26)
  - [x] 결제 구현 및 구독 정보 전수조사 (프론트엔드 및 백엔드 API 20여 개) 완료 ✅
  - [x] 결제 시스템 현황 종합 분석 보고서를 docs 폴더로 이동 및 업데이트 완료 (`docs/PAYMENT_SYSTEM_ANALYSIS.md`) ✅
  - [x] 관리자 페이지 결제기록 탭 추가 설계안 수립 완료 ✅
  - [x] 구독 정보 단일 소스화 (Single Source of Truth) 개선 계획 수립 완료 ✅
  - [x] Stripe 결제 시스템 전환 상세 설계(삭제 가이드, Checkout 및 Webhook 아키텍처 재설계, 크론 및 취소 수정본) 수립 완료 ✅
  - [x] 다중 통화 결제 원장과 정산 포인트 기준 분리 설계 완료 ✅


## Phase 20: 통계 지도/상세 지급 리포트 누락 보정 (2026-05-26)
- [x] 이전 완료 보고 재검토: 상세 지급 리포트와 크리에이터 지도 R2 read-back이 완전하지 않았음을 명시 ✅
- [x] `src/lib/worker-stats.ts`에 R2 S3 직접 조회 fallback 추가: platform/creator `cf-stats/` 스냅샷 및 `date=all` prefix 합산 지원 ✅
- [x] `/api/stats/reports`를 D1 `commission_batch` 지급 완료 원장 기반 상세 리포트로 확장 ✅
- [x] 플랫폼 전체 통계 화면에 포스트별 지급 근거, 크리에이터 지급 상세, 영업팀 지급 상세, 직접/간접/네트워크 지급 유형 합계 추가 ✅
- [x] viewgroup Worker 상세 원장 `grouped_view_details` 추가: viewer/video/accessMethod 단위 시청 근거 저장 경로 구현 ✅
- [x] 플랫폼 전체 통계 화면에 `Paid View Basis Detail` 추가: 상세 원장이 있으면 포스트/비디오/시청방식/시청자수/시청수 표시 ✅
- [x] `Top Marketer Payouts (Excluding Masters)`를 실제 D1 지급 수령자 기준으로 재계산하고 팀마스터 이상 제외 기준 적용 ✅
- [x] 관리자 영업팀 Lookup API의 한국어 고정 그룹/역할 라벨을 영어 라벨로 교정 ✅
- [x] MapLibre 지도 hover popup 이중 말풍선 UI 제거 ✅
- [x] 검증: `pnpm exec tsc --noEmit --pretty false`, `pnpm run build`, 관리자 한국어 잔존 문자열 검색 통과 ✅
- [x] `20260525090317 / 2042-W24` fixture 원장 재생성 완료: `d1GroupedViewDetailRows=15`, `d1GroupedViewRows=15`, `d1CommissionRows=26`, `passed=true` ✅
- [x] 검증 보고서 `docs/AGENCY_E2E_REPORT_20260525090317.md`에 `grouped_view_details` 상세 시청 근거 섹션 추가 ✅

## Phase 21: 영업수수료 post_id 원장 보존 및 W26 재검증 (2026-05-26)
- [x] `commission` Worker 저장 단계에서 팀/영업수수료 `post_id`를 버리던 문제 수정 ✅
- [x] 영업수수료 저장 기준을 `user/date/type/batch/postId` 단위로 변경하여 포스트별 지급 근거 보존 ✅
- [x] `scripts/agency-e2e-fixture.mjs` 검증 기준에 `processed=1` 영업수수료 `post_id` 누락 시 실패 조건 추가 ✅
- [x] 사용자가 `commission-worker` 배포 완료: version `da3fe573-fd2d-4a8f-aa91-31f4ae61f188` ✅
- [x] 새 fixture `20260526074947`, 검증일 `2041-06-30`, 주차 `2041-W26` 재생성 완료 ✅
- [x] D1 검증: `commission_batch=34`, `agencyCommissionRows=27`, `agencyCommissionRowsMissingPost=0`, `processedAgencyCommissionRowsMissingPost=0`, `passed=true` ✅
- [x] R2 지도 스냅샷 확인: `points-system-bucket/cf-stats/weekly/2041-06-30` platform 1개 + creator 3개 객체 존재, `application/json` ✅
- [x] 최신 보고서 생성: `docs/AGENCY_E2E_REPORT_20260526074947.md` ✅

## Phase 22: 크리에이터 지도 누적 조회 fallback 보정 (2026-05-26)
- [x] 실제 증상 확인: `lv1-4947` 수익 페이지에서 `2041-W26` URL이어도 크리에이터 지도는 내부적으로 `period=all` 누적 API를 호출해 빈 지도로 표시될 수 있음 ✅
- [x] `/api/stats/cloudflare`에 `fallbackPeriod` 지원 추가: 크리에이터 `period=all` 결과가 비면 선택 주차/월의 크리에이터 R2 객체를 재조회 ✅
- [x] `/usermenu/earnings` 통계 화면이 `period=all&fallbackPeriod={selectedPeriod}`로 Cloudflare 지도 API를 호출하도록 수정 ✅
- [x] `src/lib/worker-stats.ts`에 R2 S3 signed read/list 실패 시 Cloudflare API token 기반 R2 object read/list fallback 추가 ✅
- [x] 검증: `pnpm exec tsc --noEmit --pretty false`, `pnpm exec tsc --noEmit -p msworker/tsconfig.json --pretty false`, 수정 범위 `git diff --check` 통과 ✅
- [ ] 실제 브라우저에서 `lv1-4947` 로그인 후 `/ko/usermenu/earnings?tab=statistics&period=2041-W26&unit=weekly` 지도 렌더링 확인 필요

## Phase 23: Toss/KRW 결제 실행부 제거 및 USD 표시 전환 (2026-05-26)
- [x] `/subscription` 페이지 유지: 주간/연간 선택, 코인 수량 선택 후 구매 버튼 활성화 UX 유지 ✅
- [x] `/subscription` 가격 표시를 관리자 `globalPrice` 기반 USD 표기로 전환 ✅
- [x] 구독/코인 구매 클릭 시 실제 결제 호출 대신 `결제구현시 작동합니다` 토스트 표시 ✅
- [x] 결제 모달/결과 페이지/중계 API 삭제: `PaymentModal`, `BillingModal`, `payments/result`, `payments/coin`, `payments/billing`, `payments/statusdb`, `payments/webhook` ✅
- [x] Toss SDK 의존성과 로컬 Toss 환경변수 제거 ✅
- [x] DB 모델과 관리자 가격 설정은 보존: `Payment`, `Subscription`, `BillingKey`, `webhookLog`, `subscriptionPackages`, `coinPackages` ✅
- [x] `/api/cron/billingkr` 외부 자동청구 제거, 구독 만료 상태 정리만 유지 ✅
- [x] `/api/payments/cancel` 외부 취소 호출 제거, 다음 글로벌 결제 제공자 구현 전 `501` 응답으로 고정 ✅
- [x] 후속 글로벌 결제솔루션 연계 가이드 작성: `docs/GLOBAL_PAYMENT_INTEGRATION_GUIDE.md` ✅

## Phase 24: 로그 시스템 모바일 반응형 UI 최적화 및 시간대/영문화 검증 (2026-05-27)
- [x] `LogTable.tsx` 모바일 전용 카드 뷰 리스트 레이아웃 추가 및 데스크톱 테이블 분리 (`hidden sm:block`) ✅
- [x] `LogFilters.tsx` 모바일 뷰 User ID Input placeholder 보완 및 미사용 `ko` 로케일 정리 ✅
- [x] 어드민 설정 타임존(`analyticsTimeZone`)과 워커 타임존(`ANALYTICS_TIME_ZONE`) 연동 및 UI 표기 검증 ✅
- [x] 워커 전역 커스텀 로그 호출(`saveLogDirectly`, `sendLogToWorker`) 내의 활성 한글 문자열 전량 영어로 교체 완료 ✅
- [x] 컴파일 검사 `pnpm exec tsc --noEmit` 및 빌드 `pnpm run build` 통과 ✅
- [x] `.agents/04_architecture.md` 아키텍처 문서 동기화 완료 ✅

## Phase 25: 자막 위치 일관성 확보 및 33% 높이 조절 (2026-05-27)
- [x] 모든 재생 환경(프리뷰, 정식재생, PWA)에서 자막 위치를 비디오 프레임 하단 기준 33% 높이로 일관되게 고정 ✅
- [x] `VTTCue`의 `snapToLines = false` 및 `line = 67` 설정을 도입하여 디바이스 및 전체화면 상태와 관계없이 균일한 높이 구현 ✅
- [x] iOS 환경에서의 초기 자막 로딩 시 위치 조정을 위한 `MANIFEST_PARSED` 핸들러 내 자막 트랙 설정 보완 ✅
- [x] TypeScript 빌드 및 컴파일러 오류가 발생하지 않음을 검증 (`npx tsc --noEmit`) ✅

## Phase 26: 컨텐츠 모달 상단 프리뷰 우측 여백 최적화 (2026-05-27)
- [x] 컨텐츠 모달(`PostModal.tsx`) 내 영상 프리뷰 영역이 가로 가용 공간을 가득 채우도록 `flex-grow` 적용 ✅
- [x] 우측 아이콘 컨테이너에 `flex-shrink-0`을 적용하여 찌그러지지 않고 모달 우측 경계선에 정렬되도록 레이아웃 최적화 완료 ✅
- [x] `npx tsc --noEmit`을 통한 빌드 안정성 및 TypeScript 컴파일 오류 없음 검증 완료 ✅

## Phase 27: 프리뷰 영어 랜딩 샘플 포스트 stale 캐시 보정 (2026-05-28)
- [x] 랜딩 홈 라우트를 `dynamic = 'force-dynamic'`, `revalidate = 0`으로 전환하여 프리뷰/운영 홈이 오래된 서버 캐시에 묶이지 않도록 수정 ✅
- [x] `MainContent`의 무기한 `unstable_cache` 래퍼를 제거하고 `noStore()` 기반 request-time Prisma 조회로 전환 ✅
- [x] 영어 기본 URL 정책 확인: `/en`은 `localePrefix: 'as-needed'`에 따라 `/`로 canonicalize되고 `NEXT_LOCALE=en`, `<html lang="en">` 상태로 동작 ✅
- [x] Vercel Preview에서 PWA 생성을 비활성화하고 `preview.megashorts.com`에 남아 있을 수 있는 기존 서비스워커만 정리하도록 제한 ✅
- [x] 영향 범위 확인: 정적 JS/CSS/이미지, 카테고리/최근/추천 페이지의 태그 캐시, 포스트 생성/수정/삭제 on-demand 무효화 경로는 유지 ✅
- [x] 검증: `pnpm -s tsc --noEmit`, Vercel 배포 `dpl_8vzhx9ggo4AbKBqbAmfcWTsQFRHY`, `preview.megashorts.com` alias, `/en` HTML의 최신 agency sample post 노출 확인 ✅
