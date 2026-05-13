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
- [ ] Vercel MCP 설치 및 설정
- [ ] Supabase MCP 설치 및 설정
- [ ] Cloudflare MCP 설치 및 설정
- [ ] 연결 테스트

## Phase 3: msworker 정리 및 끊어진 API 복구 (요청#2)
- [x] 미사용 워커(agency, stats, uploader, d1-test, test-cloudflare-stream) 5개 삭제
- [x] 프론트엔드 환경변수(`NEXT_PUBLIC_STATS_API_URL`) 의존성 제거 및 로컬 API(`/api/stats/...`)로 경로 수정 완료

## Phase 3: 시청 권한 최적화 (요청#3)
- [ ] 현행 분석 보고
- [ ] KV/DO 전략 결정
- [ ] 구현

## Phase 4: 다국어 + PWA (요청#4)
- [ ] next-intl 구현
- [ ] PWA manifest + SW 구현

## Phase 5: 플랫폼 개선 (요청#5)
- [ ] 사용자 승인 후 순차 진행

## Phase 6: Stripe 구현 (요청#6)
- [ ] Stripe 결제 구현
- [ ] 토스/스트라이프 전환 로직

## Phase 7: 글로벌 성인인증 (요청#7)
- [ ] Self-declaration 방식 구현
- [ ] 기존 adultauth 연동
