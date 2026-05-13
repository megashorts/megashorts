# MegaShorts 진행 체크리스트

> 최종 업데이트: 2026-05-13

## Phase 0: 분석 및 계획 수립
- [x] 프로젝트 구조 파악
- [x] msworker 워커 전수 분석
- [x] 결제 시스템(토스) 분석
- [x] 시청 권한 검사 로직 분석
- [x] 인증 시스템(Lucia) 분석
- [x] 활동 로그 시스템 분석
- [x] 종합 분석 문서 작성 ✅ (implementation_plan.md)
- [/] 사용자 피드백 대기 중

## Phase 1: MCP 설치 (요청#1)
- [x] 기존 MCP 설정 오류(mcp_config.json) 초기화 및 경고 제거
- [ ] Vercel MCP 설치 및 설정
- [ ] Supabase MCP 설치 및 설정
- [ ] Cloudflare MCP 설치 및 설정
- [ ] 연결 테스트

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
- [x] PWA 설치 유도 스낵바 구현 완료 ✅

## Phase 5: 플랫폼 개선 (요청#5)
- [ ] 사용자 승인 후 순차 진행 (Zustand 고도화 등)

## Phase 6: Stripe 구현 (요청#6)
- [ ] Stripe 결제 구현
- [ ] 토스/스트라이프 전환 로직

## Phase 7: 글로벌 성인인증 (요청#7)
- [x] Self-declaration 방식 구현 (Framer Motion 바텀시트) ✅
- [x] `verify-age` API 및 `userAuth` 캐시 무효화 연동 완료 ✅
