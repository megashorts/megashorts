# MegaShorts 구현 계획 및 실행 결과 정리

> 최종 업데이트: 2026-05-25

## 목적
이 문서는 초기 다국어/i18n 확장 계획 문서를 실제 구현 결과 기준으로 정리한 최종본입니다.
승인 대기 문구나 가정형 표현은 제거하고, 현재 기준의 완료/미완료 상태만 유지합니다.

## 완료된 범위

### 1) 다국어/라우팅/SEO 기반
- `next-intl` 라우팅 적용 (`localePrefix: 'as-needed'`)
- 기본 언어 `en`, 보조 언어 `ko`, `zh` 운영
- `hreflang`/canonical 정책 적용

### 2) 사용자향 정적/동적 다국어
- 정적 UI 문구 번역 리소스 분리(`messages/en|ko|zh.json`)
- 카테고리/모달/상세/추천/영상 재생 등 핵심 화면 다국어 반영
- 동적 콘텐츠 fallback 규칙 적용(선택 언어 -> 영어 -> 원문)
- 자막 선택 규칙 개선(선택 언어 우선 + 영어 fallback)

### 3) 운영 안정화
- 로그인 세션 하이드레이션 캐시 불일치 수정
- Decimal 직렬화 이슈 수정
- 관리자 서비스/에이전시 영역 영문화 정리
- 시간대 운영 기준 단일화(`analyticsTimeZone`, `ANALYTICS_TIME_ZONE`)
- 운영 문서 동기화 스킬(`ops-doc-sync`) 생성 및 적용

### 4) 통계/영업팀 정산 조회 안정화
- 크리에이터 개인 수익, 영업자 개인 수익, 영업팀 전체 정보, 플랫폼 전체 통계의 화면 책임 분리
- D1 `commission_batch` 지급 완료 원장 기준의 개인 `user_id`/팀 `master_id` 조회 분리
- 개인/영업팀 수익 조회는 주간/월간 기준으로 정리, 플랫폼 전체 통계는 일/주/月 유지
- MapLibre + CARTO raster basemap 국가 버블 지도 적용
- 영업자 개인 페이지 하위 추천 구조 탭 및 팀마스터 자격 변경 API 추가
- 최신 한글 검증 문서: `docs/STATS_E2E_VERIFICATION_20260525.md`

## 현재 미완료 범위

### Phase 6: Stripe 구현 (유일한 미완료)
- [ ] Stripe 결제 구현
- [ ] 토스/스트라이프 전환 로직

## 참고 문서
- 진행 체크리스트: `.agents/02_progress.md`
- 운영/아키텍처 기준: `.agents/04_architecture.md`
- 변경 메모리 로그: `.agents/03_memory.md`
