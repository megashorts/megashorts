# 포인트, 영업팀, 통계 구현 가이드

## 현재 정산 파이프라인

현재 프로젝트의 저비용 정산 구조는 Next/Postgres를 실시간 원장으로 두고, Cloudflare Worker/D1/R2를 일일 집계와 배치 계산 계층으로 사용하는 방식이다.

1. 사용자가 영상을 시청하면 Next API가 `video_views`에 시청 기록을 저장한다.
2. `views-collector`, `post-data-worker`, `viewcount-team-worker` 계열 워커가 일별 시청 데이터를 수집하고 R2 `points-system-bucket` 및 D1 테이블에 저비용 집계 데이터를 저장한다.
3. `commission-worker`가 D1 `grouped_views`, `referral_structure`, `post_view_stats`, `commission_batch`, `cf_stats`를 기준으로 크리에이터 및 영업 조직 포인트를 계산한다.
4. 계산 결과는 워커에서 Next의 `/api/agency/points-apply`를 호출해 Postgres `users.points`에 지급되고, 알림은 `notifications`에 기록된다.
5. 사용자는 `/usermenu/earnings` 또는 `/usermenu/agency-earnings`에서 보유 포인트와 지급 신청 현황을 조회한다.
6. 실제 출금 신청은 `point_withdrawals`에 `PENDING`으로 저장되고, 관리자는 `/admin/system`의 포인트 출금 탭에서 승인/거절한다.

## 주요 저장소

- Postgres `users.points`: 현재 사용자가 보유한 지급 가능 포인트 잔액.
- Postgres `point_withdrawals`: 사용자의 지급 신청, 승인, 거절 기록.
- Postgres `creator_info`: 지급을 위한 계좌, 국가, 연락처, 신분확인 상태.
- Postgres `video_views`: Next에서 보유한 원본 시청 기록.
- Postgres `system_settings`: 운영 설정 및 일부 워커 동기화 자료 저장소.
- D1 `referral_structure`: 영업팀 추천 조직도와 하위 구조 집계.
- D1 `commission_batch`: 워커가 계산한 일/주차별 포인트 지급 후보 배치.
- D1 `cf_stats`: Cloudflare Stream Analytics 기반 국가별/기간별 재생 통계와 포인트 계산 기준값.
- R2 `points-system-bucket`: 일일 원천 JSON, 실패 데이터, 워커 중간 산출물 보관.

## 크리에이터 수익 페이지

`/ko/usermenu/earnings`는 `userRole >= 20` 또는 운영팀 이상 사용자에게 노출된다.

- 포인트 통계 탭은 `/api/stats/uploader`를 호출한다.
- 콘텐츠 수, 동영상 수, 유료 동영상 수, 구독/코인 유료 시청 수는 Postgres 기준으로 집계한다.
- 주차별 상세 조회는 `/api/stats/weekly?type=uploader`를 호출한다.
- 글로벌 접속자 지도는 `/api/stats/cloudflare`에서 `viewerDistribution`을 받는다.
- 현재 Cloudflare D1 `cf_stats`가 Next Postgres로 동기화되지 않은 경우 지도 데이터는 빈 배열로 반환된다.

## 포인트 지급 신청

지급 신청 조건은 다음과 같다.

- 로그인 사용자 본인 또는 운영자 권한이어야 한다.
- `users.emailVerified`가 `true`여야 한다.
- `creator_info`가 등록되어 있어야 한다.
- `creator_info.idCheck`가 `true`여야 한다.
- 신청 금액이 `users.points` 잔액 이하이어야 한다.

신청이 접수되면 `point_withdrawals`에 `PENDING`으로 저장되고 텔레그램 알림이 발송된다. 실제 포인트 차감은 승인/지급 관리 흐름에서 처리하는 구조를 유지한다.

## 영업팀 수익 페이지

`/ko/usermenu/agency-earnings`는 `userRole >= 40` 또는 운영팀 이상 사용자에게 노출된다.

- 포인트 통계 탭은 `/api/stats/agency`를 호출한다.
- 영업팀 페이지에는 글로벌 접속자 지도를 노출하지 않는다.
- 팀 기준 집계는 현재 Postgres에서 `teamMaster` 또는 `referredBy`가 해당 사용자와 연결된 사용자 집합을 기준으로 계산한다.
- 주차별 상세 조회는 `/api/stats/weekly?type=agency`를 호출한다.

## 관리자 영업 시스템

`/ko/admin/agency`는 설정, 조회, 팀마스터 설정 탭으로 구성되어 있다.

조회 탭은 다음 API를 사용한다.

- `/api/agency/structure`: 추천인 구조 조회. 최초 1단계만 반환하고, 사용자가 `+` 버튼을 누르면 해당 노드의 1단계 하위만 추가 조회한다.
- `/api/agency/distributions`: `system_settings`의 `pointDistribution_*` 기록을 연도/주차 기준으로 조회한다.
- `/api/agency/statistics`: 영업팀별 회원 수, 단계별 포인트, 일별/주별/월별 신규 회원 및 승인 포인트 통계를 반환한다.

추천인 구조에서 사용자명에 마우스를 올리면 표시 이름과 이메일이 브라우저 기본 툴팁으로 표시된다.

## 관리자 시스템 통계

`/ko/admin/system`의 통계 탭은 `/api/stats/admin`을 호출한다.

- 회원 수, 오늘 신규 가입자, 구독자 수.
- 포스트/동영상/유료 동영상 수.
- 구독/코인 유료 시청 수.
- 결제 완료 금액과 결제 건수.
- 인기 포스트, 포인트 상위 크리에이터, 포인트 상위 영업자.
- Cloudflare 국가별 통계가 동기화되어 있으면 글로벌 지도에 표시한다.

## 최종 권장 저장 전략

Postgres에 모든 통계 요약을 복제하는 방식은 최선이 아니다. 현재 구조에서는 아래처럼 역할을 나누는 것이 비용과 정확도 면에서 더 낫다.

- D1: 워커가 계산 중 사용하는 구조화 원장. `commission_batch`, `cf_stats`, `post_view_stats`, `referral_structure`가 여기에 해당한다.
- R2: 확정된 일/주/月 스냅샷. `commission-summaries/weekly/{date}.json`, `cf-stats/{period}/{date}.json`처럼 저장한다.
- Postgres: 서비스 상태 원장. `users.points`, `point_withdrawals`, `creator_info`, `payments`, `notifications`만 최소 반영한다.

현재 구현은 이 방향으로 조정되어 있다.

- `commission-worker`는 주간 정산 요약을 D1 `cf_stats.commission_data`에 저장하고, 같은 내용을 R2 `commission-summaries/weekly/{date}.json`에도 저장한다.
- `commission-worker /summary`는 R2 스냅샷을 먼저 읽고, 없으면 D1 `cf_stats`, 그래도 없으면 D1 `commission_batch` 집계를 읽는다.
- `cfstats-admin`은 Cloudflare Stream Analytics 결과를 D1 `cf_stats`에 저장하고, R2 `cf-stats/{period}/{date}.json`에도 저장한다.
- `cfstats-admin /stats`는 R2 스냅샷을 먼저 읽고, 없으면 D1 `cf_stats`를 읽는다.
- Next의 `/api/stats/*`는 워커 read API를 먼저 호출하고, 워커 결과가 없거나 미확정 주차이면 Postgres 집계를 안전망으로 사용한다.

이 구조가 적합한 이유는 다음과 같다.

- 워커가 이미 계산한 데이터를 다시 Postgres에서 재계산하지 않는다.
- 확정 데이터는 R2 파일 단위로 읽으므로 조회 비용이 예측 가능하다.
- D1은 최근/진행 중/재구성 가능한 구조화 데이터 조회에만 사용한다.
- Postgres는 사용자 잔액, 지급 신청, 알림처럼 Next 앱의 즉시 상태에 필요한 값만 갖는다.

운영 환경에는 다음 환경변수가 필요하다.

- `WORKER_API_KEY` 또는 `CRON_SECRET`
- `COMMISSION_WORKER_URL`
- `CFSTATS_ADMIN_WORKER_URL`
