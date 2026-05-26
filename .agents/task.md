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

## Phase 3: 로그인/회원가입 등 인증 관련 페이지 다국어 적용
- `[x]` `login/LoginForm.tsx`, `login/LoginPage.tsx` 등 로그인 관련 페이지
- `[x]` `signup/SignUpForm.tsx`, `signup/page.tsx` 등 회원가입 페이지
- `[x]` `reset-password` 페이지
- `[x]` `en.json`, `ko.json`, `zh.json` 에 번역 키 추가

## 에러 체크: 타입스크립트 이슈 해결
- `[x]` `FullScreenVideo.tsx` 내 `url` 프로퍼티 조회 에러 수정 완료
- `[x]` `Post.tsx` 등 내 `@prisma/client` `Media` 부재 에러 등 핵심 에러 해결 완료

## 2026-05-23 정산/통계 실제 재검증
- `[x]` `node scripts/agency-e2e-fixture.mjs verify 20260519060836` 실제 Supabase/Cloudflare D1 검증 통과
- `[x]` 로컬 production 서버에서 크리에이터/영업팀/관리자 통계 API 실제 응답 확인
- `[x]` 배포 Worker `/summary`, `/stats` 조회 불일치 확인 후 Next 통계 조회를 Cloudflare D1 직접 조회 기준으로 전환
- `[x]` 개인 영업팀 통계가 팀 전체가 아닌 본인 지급 완료 커미션만 합산되도록 검증
- `[x]` 과거 W23 플랫폼 국가 지도 API 검증 완료. 최신 지도 검증 기준은 W24 운영 `cfstats-admin` 스키마형 D1/R2 스냅샷
- `[x]` commission Worker의 네이티브 daily/monthly 실행 저장 모드 구현
- `[x]` commission Worker의 weekly 저장 모드와 D1/R2 기간 요약 저장 기준 검증
- `[x]` 운영자/크리에이터/영업자/영업팀 통계 화면의 누적 정보와 기간 리포트 분리
- `[x]` MapLibre 지도 basemap을 CARTO raster로 교체하고 `tiles.openfreemap.org` 호출 제거
- `[x]` 운영자 팀마스터 선택 API를 OPERATION1 이상 접근 기준으로 교정
- `[ ]` Stripe/global USD 결제 승인 및 정산 반영 구현
- `[x]` 팀마스터 제거 시 기존 팀원 처리 정책 확정 및 구현

## 2026-05-25 통계 UI/원장/권한 재검증
- `[x]` 개인 크리에이터/영업자 수익 화면에서 누적 카드와 기간 조회 결과 분리
- `[x]` 개인/영업팀 수익 조회 단위를 주간/월간으로 정리하고 일별 지급 조회 제거
- `[x]` 영업자 개인 수익 화면에서 지도 제거, 하위 추천 구조 탭 추가
- `[x]` 팀마스터 하위 멤버 자격 변경 API 구현 및 `hq-a 40 -> 45 -> 40` 실제 검증 후 원복
- `[x]` 영업팀 Lookup의 별도 Point Distribution 탭 제거, Statistics 하단 지급 상세로 통합
- `[x]` D1 `commission_batch` 실제 필드 확인 후 viewer/video 없는 정보는 UI에서 임의 생성하지 않도록 정리
- `[x]` 2042-W23 원장의 누락된 `pointSettings` 보강 및 API 반환 확인
- `[x]` 2042-W23 기준 검증 폐기, 최신 fixture `20260525090317 / 2042-W24`로 전체 시뮬레이션 재생성 및 검증
- `[x]` fixture 스크립트 짧은 username 충돌, postId 생성, cleanup, 지도 seed의 `commission_data` 삭제 문제 수정
- `[x]` `cfstats-admin` R2 `date=all` 누적 조회 구현
- `[x]` `_next/static/chunks` PWA precache 제외 및 Workbox stale chunk 404 완화 확인
- `[x]` 최소 출금 포인트 UI/서버 검증을 시스템 설정과 연결
- `[x]` 한글 검증 문서 최신화: `docs/STATS_E2E_VERIFICATION_20260525.md`

## 2026-05-26 운영 스키마 기반 통계/R2 재검증
- `[x]` `node scripts/agency-e2e-fixture.mjs full 20260525090317` 실제 실행 완료
- `[x]` D1 `grouped_views` 15행, `commission_batch` 26행, 지급완료 22행/보류 4행 확인
- `[x]` D1 `cf_stats` daily/weekly/monthly 3행을 운영 `cfstats-admin` 저장 형식으로 생성 확인
- `[x]` `scripts/agency-e2e-r2-stats-snapshot.mjs` 추가
- `[x]` `points-system-bucket/cf-stats/` R2 platform/creator daily/weekly/monthly 객체 12개 업로드 완료
- `[x]` Cloudflare MCP R2 list로 weekly platform/creator 객체 존재 확인
- `[x]` 타입/워커 타입/스크립트 문법/프로덕션 빌드 검증 통과
- `[ ]` 최신 빌드 UI 서버 직접 확인: 현재 실행환경 `listen EPERM`으로 미완료
