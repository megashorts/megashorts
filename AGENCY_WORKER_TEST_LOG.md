# 영업/워커 시스템 테스트 및 개선 기록

## 범위
- 운영 투입 전 Cloudflare Worker 기반 영업 자동화 시스템을 검증한다.
- 테스트 데이터는 `codex_agency_test_*` 식별자로 격리한다.
- 테스트 외 실제 사용자, 게시물, 포인트는 수정하지 않는다.

## 2026-05-18 1단계 - 기준 상태 확인
- 수정 전 `msworker` TypeScript 빌드가 실패했다.
- 여러 하위 워커의 `wrangler.toml`이 `-c path/to/wrangler.toml` 방식 배포 시 잘못된 엔트리 경로를 사용하고 있었다.
- `team-master-settings`가 삭제된 기존 `src/agency/agency-types`를 import하고 있었다.
- `referral-structure-worker`는 기존 필드명 `getTotalPoint`를 사용했지만, 공유 D1 스키마는 `getDownlinePoint`를 정의하고 있었다.

## 2026-05-18 2단계 - 최소 빌드 수정
- 삭제된 기존 `agency-types` import를 제거하고 `team-master-settings` 안에 필요한 최소 `MasterSettings` 타입을 직접 정의했다.
- 추천 구조 포인트 필드명을 D1 스키마에 맞게 `getTotalPoint`에서 `getDownlinePoint`로 변경했다.
- 하위 워커 엔트리를 `main = "index.ts"`로 변경해 각 워커가 자기 config 폴더 기준으로 정상 해석되게 했다.
- `msworker`에서 `npm exec tsc -- --noEmit` 통과.
- dailywork 전체 워커의 엔트리 파일 존재 여부 확인 통과.
- `msworker`에서 `wrangler deploy --dry-run` 실행 시 모든 워커 번들링 성공.
- 남은 경고: Cloudflare 큐s 설정에서 `max_concurrent_executions`는 무시되고, 공식 필드는 `max_concurrency`였다.

## 2026-05-18 3단계 - 큐 동시성 설정 수정
- queue consumer 설정의 `max_concurrent_executions = 1`을 `max_concurrency = 1`로 교체했다.
- `msworker` TypeScript 검사 통과.
- 영향받은 queue 워커(`postdata`, `viewcountteam`, `viewgroup`) dry-run 통과, 알 수 없는 필드 경고 제거 확인.

## 2026-05-18 4단계 - 런타임 접근 기준 확인
- Cloudflare MCP API 호출은 인증 오류로 실패했다. 따라서 토큰/계정 권한이 해결되기 전까지 Cloudflare API 기반 검사/배포 결과는 신뢰할 수 없다.
- 원격 live worker smoke check 결과 일부 워커는 배포되어 있었지만, `referral-structure.msdevcm.workers.dev`와 `workers-manager.msdevcm.workers.dev`는 Cloudflare 1042를 반환했다. `referral-structure-worker.msdevcm.workers.dev`는 존재하며 root 요청은 404를 반환했다.
- 중요 발견: `cfstats-admin`의 GET 엔드포인트는 단순 조회가 아니라 처리/쓰기 동작을 수행한다. 따라서 read-only health check로 사용하면 안 된다.
- 로컬 `.env`의 `CLOUDFLARE_API_TOKEN`으로 원격 D1 조회를 시도했으나 Cloudflare 7403 오류가 발생했다. 계정이 유효하지 않거나 권한이 없다.
- 로컬 D1에는 기존 `payments`, `views`만 있었고, `src/dailywork/shared/migrations.sql`을 로컬에만 적용했다. 이후 로컬 D1에 `referral_structure`, `grouped_views`, `post_view_stats`, `cf_stats`, `commission_batch` 등 영업/통계 테이블이 생성됐다.
- Supabase Prisma 조회는 sandbox 네트워크 제한 때문에 처음에는 차단됐다. 이후 명시적 네트워크 승인으로 테스트했다.

## 2026-05-18 5단계 - 1차 정확성 수정
- `viewgroup` 완료 후 바로 `VIEWCOUNTTEAM_WORKER`로 건너뛰던 흐름을 수정해 먼저 `POSTDATA_WORKER`를 호출하게 했다.
- 회원가입 영업 설정 조회 키를 기존 `team_master_settings_${masterId}`에서 실제 사용 중인 `agencySettings_${masterId}`로 변경했다.
- 회원가입 후 referral sync 대상이 추천인 ID로 잘못 전달되던 문제를 새 사용자 ID로 수정했다.
- referral worker 기본 URL을 존재하지 않는 `referral-structure.msdevcm.workers.dev`에서 실제 배포 URL인 `referral-structure-worker.msdevcm.workers.dev`로 변경했다.
- referral sync client가 실패 시 조용히 `false`를 반환하지 않고 예외를 던지도록 수정했다.
- `referral-structure-worker`에 API key 검증을 추가하고 local wrangler var를 추가했다.
- 추천 구조 `add` 동작을 user/master 기준 idempotent하게 만들어 중복 행과 중복 상위라인 증가를 방지했다.
- referral remove 차감이 하위 수만 빼던 문제를 제거 대상 본인과 하위 수를 포함하도록 1차 수정했다. 이후 16단계에서 비리프 제거 방식으로 다시 정교화했다.
- 검증: `msworker` TypeScript 통과.
- 검증: `viewgroup`, `referral-structure-worker` wrangler dry-run 통과.
- 당시 root Next TypeScript는 기존 `src/app/api/admin/users/[userId]/route.ts:312`의 `subscription.updatedAt` 타입 문제만 남아 있었다.

## 2026-05-18 6단계 - Supabase E2E 픽스처 생성
- `scripts/agency-e2e-fixture.mjs`를 추가해 격리된 `codex_agency_test_*` 사용자/게시물/영상/시청기록/설정을 생성하고 정리할 수 있게 했다.
- 첫 setup 시 `posts.postNum` sequence 불일치가 드러났다. 스크립트에서 `max(postNum)+1`을 명시적으로 할당하도록 수정했다.
- 부분 실패한 fixture를 정리했다. `codex_agency_test_*` 사용자 6명 제거, 게시물 제거 없음.
- target date `2026-05-17` 기준 fixture run `20260517214433` 생성.
- fixture는 `HEADQUARTERS`, `NETWORK`, `BINARY_NETWORK` 3개 마스터를 포함한다. 각 구조는 direct, level2, level3 회원과 4개 시청기록을 가진다.
- manifest 위치: `.tmp/agency-e2e-20260517214433.json`.

## 2026-05-18 7단계 - 로컬 D1 영속성 함정 확인
- Wrangler local D1 state는 워커 config 폴더 사이에서 자동 공유되지 않는다.
- `wrangler d1 execute --local`에 `-c`를 주지 않으면 `msworker/.wrangler/state`를 사용하지만, `wrangler dev -c src/dailywork/workers/<worker>/wrangler.toml`은 각 worker config 폴더 기준 state를 사용했다.
- E2E 테스트에서는 모든 워커 실행에 공유 persistence 경로 `msworker/src/dailywork/workers/referral-structure-worker/.wrangler/state`를 사용했다.
- 이 점은 배포/테스트 함정이다. `--persist-to`나 `-c`가 일관되지 않으면 `no such table`로 거짓 실패하거나, 잘못된 D1 state를 보고 거짓 성공할 수 있다.

## 2026-05-18 8단계 - 추천 구조 E2E
- 인증 수정 후 로컬 `referral-structure-worker`에 Bearer token 없이 접근하면 401을 반환하는 것을 확인했다.
- run `20260517214433`의 테스트 마스터/회원 15명을 모두 D1 추천 구조에 sync했다.
- 테스트 사용자 중복 add는 success와 `updatedUplines: 0`을 반환했다. 중복 추가 방지가 정상이다.
- level 계산을 `uplineDepth + 1`로 수정했다. headquarters 테스트에서 master/direct/level2/level3이 1/2/3/4 레벨로 매핑되며, 기존처럼 non-master가 level 0이 되는 문제가 사라졌다.

## 2026-05-18 9단계 - 일일 워커 체인 E2E
- `viewgroup`을 `2026-05-17`에 실행해 Supabase `video_views` 12개를 D1 `grouped_views` 9개로 그룹화했다. 총 coin view 6개, subscription view 6개였다.
- `postdata`는 테스트 게시물 3개에 대해 각 게시물 coin view 2개, subscription view 2개 통계를 만들었다.
- `viewcountteam`은 세 구조 모두의 팀 시청 수를 업데이트했다. direct/downline count가 grouped referrer 의미와 일치했다.
- 로컬 worker dev 프로세스 간 service binding은 자주 `[not connected]` 상태였다. 그래서 검증은 수동 순차 호출로 수행했다. 로컬 격리 테스트에서는 예상되는 현상이지만 자동 체인 디버깅 시 고려해야 한다.

## 2026-05-18 10단계 - 커미션 결함 수정 및 재검증
- 다중 batch payout 버그를 발견하고 수정했다. 페이지네이션된 commission 실행마다 다른 `batchId`가 만들어져 최종 batch만 지급되고 이전 batch가 미지급으로 남는 문제였다.
- 같은 settlement date의 모든 미처리 batch를 최종 지급 대상으로 처리하도록 추가했다.
- 주차 범위 버그를 발견하고 수정했다. `getWeekDateRange()`는 월요일~일요일을 의도했지만 KST date-only 변환이 하루 뒤틀렸다. date-only UTC 계산으로 교체했다.
- 같은 주차 중복 정산 guard를 추가했다. 해당 주에 non-SYSTEM processed commission이 이미 있으면 fresh start는 `already_processed`를 반환하고 0포인트를 지급한다.
- 미완료 정산 guard를 추가했다. 해당 주에 non-SYSTEM unprocessed row가 있으면 fresh start는 `pending_commissions_exist`를 반환하고 두 번째 정산을 시작하지 않는다.
- codex 테스트 포인트/commission row만 초기화한 뒤 `2026-05-17` 커미션을 로컬 재실행했다.
- 최종 D1 결과: 처리 완료 commission row 15개, 미처리 테스트 row 0개, 총 280.8P.
- 최종 Supabase 결과가 격리 테스트 사용자 16명에 대해 D1과 정확히 일치했다. 주요 합계: uploader 144, HQ master 43.2, HQ direct A 1.68, HQ level2 0.72, network master 22.32, network level2 21.6, network direct A 1.68, binary master 22.32, binary level2 21.6, binary direct A 1.68.
- 같은 날짜 재실행은 `already_processed`, `payoutAmount: 0`을 반환해 중복 지급 차단을 확인했다.
- 최종 commission 수정 후 `msworker` TypeScript 통과.

## 2026-05-18 당시 남은 리스크 / 미수정 항목
- 당시에는 `viewgroup`, `postdata`, `viewcountteam`이 날짜 단위 idempotent하지 않았다. 재실행 시 grouped row가 중복되거나 누적 통계가 다시 증가할 수 있었다. 이 문제는 이후 11~14단계에서 수정/검증했다.
- 당시 Supabase 포인트 지급은 D1 processed flag 업데이트와 단일 atomic transaction이 아니었다. Supabase 지급 성공 후 D1 processed 업데이트 실패 시 retry가 중복 지급할 수 있었다. 이 문제는 이후 `processed = 2` 상태와 optimistic lock으로 완화했다.
- `BINARY_NETWORK`는 현재 NETWORK processor와 같은 수학으로 계산된다. 가입/직속 제한과 타입 구분은 있지만 left/right leg balancing 또는 require-both-legs payout 규칙은 아직 구현되어 있지 않다.
- 당시 fixture에서는 구독 매출 설정 때문에 subscription payout이 0이었다. 이 문제는 이후 15단계에서 구독 결제 fixture로 검증했다.
- 당시 `/api/agency/structure` route는 전체 주석 상태여서 관리자 structure tab이 동작하지 않을 수 있었다. 이후 실제 API로 교체했다.
- 당시 `Agencysearch.tsx` 통계 탭은 dummy data를 사용했다. 이후 실제 API로 연결했다.
- 팀마스터 제거 flow는 `/api/admin/team-master-remove`만 호출하는 것으로 보였고 referral worker 정리 여부 검증이 필요했다. 이후 추천구조 제거/회원탈퇴 경로를 별도 검증했다.
- 여러 시크릿이 wrangler config/dev 파일에 평문으로 있었다. 운영 전 Cloudflare 시크릿s 또는 보호된 env로 옮기고 키를 회전해야 한다.
- Cloudflare 원격 API/D1 검증은 token/account 권한 오류로 막혔다. 원격 배포 상태는 HTTP smoke test만 수행했고, Cloudflare API 기반 authoritative inspection은 하지 못했다.

## 2026-05-18 테스트 데이터 상태
- Supabase fixture run은 남아 있다: `20260517214433`.
- Manifest: `.tmp/agency-e2e-20260517214433.json`.
- 검사가 더 필요 없으면 cleanup 명령은 `node scripts/agency-e2e-fixture.mjs cleanup 20260517214433`이다.
- 현재 테스트 사용자는 최종 성공 커미션 테스트로 인해 nonzero point를 가진다. 모두 `codex_agency_test_20260517214433_` prefix로 격리되어 있다.
- 추가 cf_stats 검증: weekly `grandTotal.totalCommissions`, `grandTotal.totalPoints`, point settings view stats를 확인했다.

## 2026-05-18 11단계 - 멱등성 강화
- `viewgroup` 그룹 ID를 random에서 date/uploader/post/master/referrer 기반 deterministic ID로 변경했다.
- `viewgroup` fresh start 시 대상 날짜의 `grouped_views`만 삭제한 뒤 Supabase `video_views`에서 재생성하도록 변경했다.
- `viewgroup` 로컬 재실행 확인: `2026-05-17` 두 번 실행 모두 row 9개, coin view 6개, subscription view 6개로 동일했다.
- `postdata` write를 additive increment에서 D1 `grouped_views` 전체 기준 exact set으로 변경했다. `grouped_views`가 authoritative할 때 반복 실행해도 postdata 통계가 중복 증가하지 않는다.
- `viewcountteam` write도 additive increment에서 D1 `grouped_views`와 현재 `referral_structure` 기준 exact set으로 변경했다.

## 2026-05-18 12단계 - 더 안전한 커미션 지급 상태 머신
- Supabase point update 전에 D1 `processed = 2` 상태를 추가했다. 의미는 processing/claimed이다.
- Supabase point update는 `users.points` 값에 대한 optimistic locking과 retry를 사용한다.
- Supabase 지급 성공 후 D1 row는 `processed = 2`에서 `processed = 1`로 이동한다.
- Supabase 지급 실패 시 claimed row는 retry 가능하도록 `processed = 0`으로 되돌린다.
- Supabase 지급은 성공했지만 D1 최종 mark가 실패하면 row는 `processed = 2`로 남긴다. 자동 retry를 막아 중복 지급을 방지하고, 운영자가 수동 점검해야 한다.
- fresh commission start는 settlement week에 `processed = 0`, `1`, `2` non-SYSTEM row가 남아 있는 경우 상태에 맞게 차단한다.

## 2026-05-18 13단계 - 바이너리 네트워크 및 관리자 API 수정
- binary signup direct-referral limit 수정: 사용자는 `referredBy`를 referrer user ID로 저장하므로 count도 입력 username이 아니라 `referrer.id` 기준으로 확인하게 했다.
- weekly commission summary에서 `BINARY_NETWORK`를 generic `network`로 접지 않고 `binary_network`로 보존하게 했다.
- 완전히 주석 처리되어 있던 `/api/agency/structure` route를 실제 Supabase/Prisma referral-tree API로 교체했다.
- `/api/agency/statistics`를 추가하고 관리자 agency statistics tab이 hard-coded dummy data 대신 실제 API를 읽게 했다.
- unrelated admin user API TypeScript 오류는 PATCH response query에서 `subscription.updatedAt`을 select하도록 수정해 해결했다.
- 검증: `msworker` TypeScript 통과.
- 검증: root `npm exec tsc -- --noEmit --incremental false --pretty false` 통과.

## 2026-05-18 14단계 - 강화 후 런타임 재검증
- `postdata` 두 번째 실행 검증을 direct local D1 SQLite read로 완료했다. 테스트 게시물 3개 모두 `coin_views = 2`, `subscription_views = 2`로 유지되어 중복 증가가 없었다.
- `postdata/index.ts`, `viewcountteam/index.ts`의 남은 queue write path도 exact-set 방식으로 수정했다.
- queue path 수정 후 root Next typecheck와 `msworker` typecheck 통과.
- `viewcountteam`을 `2026-05-17`에 첫 번째/두 번째 로컬 실행한 결과 D1 referral view stats가 동일했다.
- 각 master: `direct_views = 2`, `total_downline_views = 2`.
- 각 direct_a: `direct_views = 1`, `total_downline_views = 1`.
- 각 level2: `direct_views = 1`, `total_downline_views = 0`.
- codex 테스트 D1 commission row, weekly cf_stats row, referral payout counter, Supabase user point만 초기화한 뒤 commission을 재실행했다.
- 새 payout state machine 이후 최종 commission 상태: codex test user 관련 D1 row는 모두 `processed = 1`, 총 13개, 합계 280.8P.
- Supabase point는 D1과 정확히 일치했다. uploader 144, HQ master 43.2, HQ direct A 1.68, HQ level2 0.72, network master 22.32, network direct A 1.68, network level2 21.6, binary master 22.32, binary direct A 1.68, binary level2 21.6.
- 같은 commission date 재실행은 `already_processed`, `payoutAmount: 0`을 반환했다.
- weekly summary 검증: binary master team type은 `binary_network`, `grandTotal.totalPoints = 280.8`.
- binary signup limit static/data-shape check: signup은 `referredBy`를 user ID로 저장하고, 코드는 `referrer.id` 기준으로 count한다.

## 2026-05-18 15단계 - 구독 매출 커미션 검증
- 구독 매출 버그 발견: commission worker가 weekly `Payment` row를 method/date만 기준으로 합산해 실패/대기/non-subscription 결제가 포함될 수 있었다.
- weekly payment revenue filter를 `type = subscription`, `status in (success, confirm)`, `method = weekly`만 포함하도록 수정했다.
- date-boundary 버그 발견: `.lte('YYYY-MM-DD')`는 종료일 00:00 이후 결제를 제외했다. 결제 조회 범위를 `T00:00:00.000Z`부터 `T23:59:59.999Z`까지로 수정했다.
- fixture cleanup을 강화해 codex 테스트 `Payment`, `BillingKey`, `Subscription` row를 user 삭제 전에 삭제하도록 했다.
- run `20260517214433`에 대해 격리된 구독 매출 fixture를 생성했다. 성공 weekly subscription 결제 600 1건과 실패 weekly subscription 결제 9999 1건을 만들었다. 실패 결제는 의도적으로 포함해 제외되는지 검증했다.
- codex test point, D1 commission row, weekly cf_stats, referral payout counter만 초기화한 뒤 `2026-05-17` commission을 재실행했다.
- point settings 검증: `subscriptionPerPoint = 100`, `weeklyPayments.amount = 600`, `weeklyPayments.count = 1`, `totalSubscriptionViews = 6`. 실패 결제 9999는 제외됐다.
- Supabase payout에서 0.01P rounding drift를 발견하고 수정했다. D1 per-user 합계는 `32.02`인데 JS floating addition/truncation으로 Supabase가 `32.01`을 기록할 수 있었다. 지급 집계는 이제 0.01P 정수 단위로 처리한다.
- 구독 매출 포함 최종 D1 commission 결과: processed row 17개, coin point 280.8, subscription point 116.1, total 396.9.
- 최종 Supabase point는 모든 codex 사용자에 대해 D1과 정확히 일치했다. binary master 32.02, network master 32.02, HQ master 61.2, uploader 204 포함.
- 같은 날짜 재실행은 `already_processed`, `payoutAmount = 0`을 반환했다.
- 검증: 수정 후 `msworker` TypeScript 통과.

## 2026-05-18 16단계 - 추천구조 제거 / 하위 승격 검증
- 제거 버그 발견: `referral-structure-worker`는 삭제 사용자를 descendant chain에서 제거하지만, descendant를 팀에 남겨둔 채 upline count를 `deletedUser.downlineMemberCount + 1`만큼 차감했다. 비리프 사용자가 탈퇴하면 active downline count가 과소 계산된다.
- 제거 의미를 수정했다. 삭제 대상의 직속 하위는 삭제 대상의 직접 추천인으로 승격시키고, descendant의 `uplineChain`, `uplineDepth`, `level`을 재계산한다. upline count는 삭제 대상 본인 1명만 차감한다.
- direct downline array 수정: 삭제 대상은 기존 추천인의 `downlineUsers`에서 제거하고, 승격된 직속 하위는 그 추천인의 `downlineUsers`에 추가한다.
- account-delete route를 수정해 사용자 삭제 전 직속 추천 하위들의 `referredBy`를 삭제 사용자 추천인으로 재배정한다. 상위 추천인이 없으면 team master로 재배정한다. 이렇게 Supabase referral link와 D1 승격 동작이 맞춰진다.
- 런타임 테스트는 HQ master 아래 임시 사용자 `codex_agency_remove_20260518_parent`, `codex_agency_remove_20260518_child`를 사용했다.
- 제거 전: parent는 level 2이고 `downlineUsers`에 child를 가진다. child는 level 3이고 chain은 `/parent/hq_master/`였다. 두 임시 사용자를 추가하자 HQ master downline count는 4에서 6으로 증가했다.
- parent 제거 후: parent row 삭제, child는 level 2로 승격, chain은 `/hq_master/`, HQ master `downlineUsers`에는 parent 대신 child가 들어갔다. HQ master downline count는 5가 되어 제거된 parent 1명만 차감된 것을 확인했다.
- Supabase 재배정 로직도 임시 child로 확인했다. `referredBy`가 parent에서 HQ master로 변경됐다.
- cleanup 검증: child 제거 후 HQ master downline count는 4로 돌아왔고, 임시 D1 row는 0개, 임시 Supabase user도 0명이었다.
- 검증: root Next typecheck 통과, `msworker` typecheck 통과.

## 2026-05-18 17단계 - 커스텀 로그 워커 보안 검증
- 치명적 로그 시스템 버그 발견: `megashorts-logs` worker의 POST API key validation이 주석 처리되어 있었고, GET log read도 인증이 없었다. 워커 URL에 접근 가능한 누구나 fake log를 쓰거나 R2 log를 읽을 수 있었다.
- POST, GET, 수동 `/__scheduled` fetch-trigger 호출에 API key validation을 강제했다.
- log worker에서 valid API key와 request header를 출력하던 debug logging을 제거했다.
- CORS header에 `X-API-Key`를 포함하고, 허용되지 않은 origin은 log access 전에 거부하도록 했다.
- browser activity logger가 `Authorization: Bearer ...`와 `X-API-Key`를 모두 보내도록 했다. unload 시 인증 헤더를 보낼 수 없는 `sendBeacon` 대신 `fetch(..., keepalive: true)`를 사용하도록 변경했다.
- admin logs UI가 GET log read 시 worker auth header를 포함하도록 수정했다.
- `msworker/wrangler.toml`에서 사용하지 않는 Cloudflare account/API/R2 token 값을 제거했다. `API_KEY`는 현재 로컬/기존 배포 호환성 때문에 config에 남겨두었지만, 운영 전 Cloudflare 시크릿으로 옮기고 회전해야 한다.
- 로컬 log worker 런타임 검증: 무인증 POST는 401, 인증 POST는 200, 무인증 GET은 401, 인증 GET은 200을 반환했고 `codex auth test` 로그 조회가 확인됐다.
- 검증: log 변경 후 root Next typecheck 통과, `msworker` typecheck 통과.

## 2026-05-18 18단계 - 최종 로컬 검증 스냅샷
- 최종 `msworker` typecheck: `npm exec tsc -- --noEmit` 통과.
- 최종 root Next typecheck: `npm exec tsc -- --noEmit --incremental false --pretty false` 통과.
- 최종 local D1 commission snapshot for codex fixture `20260517214433`: `processed = 1`, 17 rows, 총 396.9P.
- 최종 local D1 임시 referral cleanup snapshot: `codex_agency_remove_20260518_%` row = 0.
- 임시 cleanup 후 HQ master D1 direct list는 direct A와 direct B만 남았고, `downline_member_count = 4`로 원래 fixture 계층과 일치했다.
- commission, referral-structure, log worker의 로컬 Wrangler dev session을 종료했다.

## 2026-05-18 현재 결론과 남은 확인 사항

### 1. 지금 정상 동작 확인이 끝난 것
- 로컬 코드 기준으로 영업팀 가입/추천구조 생성은 정상 동작을 확인했다.
- 로컬 코드 기준으로 시청기록 그룹화, 게시물 통계, 팀 시청 통계는 반복 실행해도 숫자가 중복 증가하지 않도록 수정했고 검증했다.
- 로컬 코드 기준으로 커미션 자동 계산과 Supabase 포인트 지급은 정상 동작을 확인했다.
- 코인 시청 커미션과 구독 시청 커미션을 모두 검증했다.
- 같은 날짜 정산을 다시 실행해도 중복 지급되지 않는 것을 확인했다.
- 회원 탈퇴 또는 추천구조 제거 시 하위 회원이 끊기지 않고 상위 추천인으로 승격되는 것을 확인했다.
- 관리자 영업 통계/구조 API의 주석 처리 문제와 dummy data 문제를 수정했다.
- 커스텀 로그 워커는 인증 없이 쓰기/조회가 되던 보안 문제를 수정했고, 인증 없는 요청은 401로 막히는 것을 확인했다.
- root Next 프로젝트 TypeScript 검사와 `msworker` TypeScript 검사는 모두 통과했다.

### 2. 아직 “완벽히 운영 확인 완료”라고 말할 수 없는 이유
- 내가 로컬 환경과 Supabase 테스트 데이터로는 정상 동작을 검증했다.
- 하지만 Cloudflare 실제 계정에 배포된 원격 Worker와 원격 D1을 Cloudflare API로 직접 확인하지 못했다.
- 이유는 현재 제공된 Cloudflare token/account 권한이 맞지 않아 API 조회가 실패했기 때문이다.
- 따라서 결론은 다음과 같다: “코드는 로컬 검증 기준 정상이다. 하지만 실제 Cloudflare 배포본이 이 수정본과 동일하게 올라갔는지는 아직 확인하지 못했다.”

### 3. Cloudflare 권한 문제를 해결하는 방법
- Cloudflare 계정 소유자 또는 관리자 권한이 있는 계정으로 Cloudflare Dashboard에 로그인한다.
- `My Profile` 또는 `Profile` 메뉴에서 `API Tokens`로 이동한다.
- `Create Token`을 누르고 `Custom token`을 만든다.
- 권한은 최소한 다음이 필요하다.
- `Workers Scripts: Edit` - Worker 배포와 코드 확인에 필요하다.
- `D1: Edit` - 원격 D1 테이블과 데이터를 조회/마이그레이션/검증하는 데 필요하다.
- `Workers R2 Storage: Edit` - 로그 R2 bucket 확인과 로그 시스템 검증에 필요하다.
- `Workers Tail: Read` - 배포된 Worker 로그 확인에 필요하다.
- 계정 범위는 이 프로젝트의 Worker와 D1이 들어 있는 Cloudflare Account로 제한한다.
- token 생성 후 한 번만 표시되는 값을 안전하게 저장한다.
- 그 token을 터미널 환경변수 `CLOUDFLARE_API_TOKEN`으로 넣은 뒤 내가 `wrangler whoami`, `wrangler d1 list`, 원격 D1 조회, 원격 Worker 배포 확인을 실행하면 된다.
- token을 채팅에 그대로 붙여 넣는 것은 권장하지 않는다. 가능하면 로컬 `.env` 또는 shell 환경변수에 직접 넣는 방식이 안전하다.

### 4. 시크릿/키 문제는 무엇인가
- 현재 일부 worker 설정 파일에는 API key나 Supabase service role key가 평문으로 들어 있다.
- 기능 테스트에는 문제가 없지만, 운영 보안 기준으로는 좋지 않다.
- 운영 전에는 Cloudflare `wrangler 시크릿 put`으로 `SUPABASE_SERVICE_ROLE_KEY`, `WORKER_API_KEY`, `API_KEY` 같은 값을 Worker 시크릿으로 옮겨야 한다.
- 시크릿으로 옮긴 뒤에는 wrangler config 파일에서 평문 key를 제거해야 한다.
- 이미 파일에 노출된 key는 교체/회전하는 것이 안전하다.
- 이 작업은 기능 오류가 아니라 보안 정리 작업이다. 다만 운영 전에는 반드시 하는 것이 좋다.

### 5. 바이너리 네트워크는 현재 무엇이 되는가
- 현재 시스템에서 `BINARY_NETWORK`는 “직속 하위 회원 수 제한”과 “통계/요약에서 binary_network로 구분”은 동작한다.
- 현재 커미션 지급 수학은 일반 `NETWORK`와 같다.
- 즉, 지금의 binary는 “가입 구조 제한이 있는 네트워크형”으로 동작한다.
- 만약 원하는 바이너리 네트워크가 “좌측/우측 두 다리”, “약한 쪽 실적 기준 지급”, “두 다리가 모두 있어야 지급” 같은 전형적인 바이너리 보상 방식이라면, 그 기능은 아직 구현되어 있지 않다.
- 그런 방식이 필요하면 DB에 left/right leg 정보가 필요하고, 가입 배치 UI와 커미션 계산기를 별도로 만들어야 한다.
- 반대로 “현재처럼 직속 2명 제한만 있으면 된다”면 지금 구현은 목적에 맞게 동작한다.

### 6. 내가 권장하는 다음 순서
- 먼저 Cloudflare 권한 있는 API token을 준비한다.
- 내가 그 token으로 원격 Worker/D1 상태를 조회하고, 실제 배포본이 로컬 수정본과 같은지 확인한다.
- 원격 확인이 끝나면 필요한 Worker들을 배포한다.
- 배포 후 실제 URL 기준으로 다시 smoke test와 원격 D1 검증을 한다.
- 그 다음 시크릿을 Cloudflare 시크릿으로 옮기고 노출 key를 회전한다.
- 마지막으로 바이너리 네트워크가 단순 2명 제한인지, 좌/우 다리 보상인지 결정한다.

## 2026-05-18 Cloudflare 현재 키 식별 정보
- 로컬 파일에서 확인된 Cloudflare account ID: `923201050a960d4c64fb9b90a88cb956`.
- 로컬 파일에서 확인된 Cloudflare email: `msdevcm@gmail.com`.
- 현재 API token이 들어 있는 환경변수명: `CLOUDFLARE_API_TOKEN`.
- token 전체값은 보안상 문서에 쓰지 않는다. 식별용으로만 보면 현재 token은 `9bbf...arweT` 형태다.
- 이 token은 `.env`와 `msworker/.dev.vars`에 들어 있다.
- Cloudflare 대시보드에 표시되는 token 이름은 로컬 파일에 없어서 알 수 없다.
- Cloudflare 대시보드에서 `msdevcm@gmail.com` 사용자 기준 `My Profile > API Tokens`로 들어가면 현재 token을 찾을 수 있다.
- token 이름을 모르면 token 목록에서 `Account ID 923201050a960d4c64fb9b90a88cb956` 계정에 권한이 연결된 token, 최근 사용 시간이 있는 token, Stream/R2 관련 권한이 있는 token을 우선 확인한다.
- 현재 원격 D1 조회가 실패했으므로 이 token에는 D1/Workers 권한이 없거나, 다른 account에만 제한되어 있을 가능성이 높다.
- token 권한 수정 시 필요한 권한은 최소 `Workers Scripts: Edit`, `D1: Edit`, `Workers R2 Storage: Edit`, `Workers Tail: Read`이다.
- R2 S3 방식 access key도 별도로 있다. 식별용 Access Key ID는 `6f822...d8`이다. 이것은 Cloudflare API token이 아니라 R2 S3 호환 API용 key라 Worker/D1 배포 권한 문제 해결에는 직접적인 답이 아니다.

## 2026-05-18 19단계 - Cloudflare 권한 재확인 및 원격 배포
- 기존 Cloudflare API token 권한 수정 후 `wrangler whoami`, `wrangler d1 list`, `wrangler r2 bucket list`가 성공했다.
- 확인된 Cloudflare Account ID: `923201050a960d4c64fb9b90a88cb956`.
- 확인된 D1: `megashorts-db` / `52d25396-2a61-42a8-904f-2d7956cede44`.
- 확인된 R2 bucket: `logs-bucket`, `points-system-bucket`, `points-system-bucket-dev`.
- 원격 D1 스키마 확인 결과 `referral_structure`, `grouped_views`, `post_view_stats`, `commission_batch`, `cf_stats` 핵심 테이블과 현재 코드가 요구하는 컬럼이 존재했다.
- 원격 D1에는 필요한 스키마가 이미 있었으므로 불필요한 원격 마이그레이션 쓰기는 실행하지 않았다.
- 배포 전 dry-run으로 주요 워커 번들링을 다시 확인했다.
- 배포 완료 워커: `megashorts-logs`, `referral-structure-worker`, `viewgroup`, `post-data-worker`, `viewcount-team-worker`, `commission-worker`, `team-master-settings`, `cfstats-admin`, `cfstats-creator`.
- `workers-manager`는 현재 Cloudflare 계정에 같은 이름의 Worker가 없어 배포 이력 조회가 실패했다. 현재 영업/커미션 핵심 체인에는 포함하지 않았다.

## 2026-05-18 20단계 - 공개 실행 엔드포인트 보안 보강
- 배포 후 추가 점검에서 `viewgroup`, `postdata`, `viewcountteam`, `commission`, `cfstats-admin`의 공개 HTTP 실행 엔드포인트가 인증 없이 쓰기/정산/통계 동작을 실행할 수 있는 리스크를 발견했다.
- 공통 워커 인증 유틸을 추가했다. `WORKER_API_KEY` 또는 `CRON_SECRET`가 맞지 않으면 실행형 HTTP 요청은 401을 반환한다.
- 워커 간 service binding 호출에는 `Authorization: Bearer ...`와 `X-API-Key`를 붙이도록 수정했다.
- `viewgroup`, `postdata`, `viewcountteam`, `commission`, `cfstats-admin`에 `WORKER_API_KEY` var를 추가했다.
- 수정 후 `msworker` TypeScript 검사 통과, root Next TypeScript 검사 통과, Cloudflare dry-run 통과, 원격 재배포 완료.
- 원격 무인증 차단 smoke test 결과: `viewgroup`, `post-data-worker`, `viewcount-team-worker`, `commission-worker` POST, `commission-worker?date=...` GET, `cfstats-admin?date=...` GET, `referral-structure-worker` POST, `megashorts-logs` GET 모두 401을 반환했다.

## 2026-05-18 21단계 - 커스텀 로그 워커 추가 보정
- 원격 로그 워커 인증 테스트 중 단일 로그 객체 POST가 `logs is not iterable` 500을 내는 문제를 발견했다.
- 로그 POST body를 배열과 단일 객체 모두 허용하도록 수정했다.
- 기존 R2 로그 파일이 단일 객체 형태로 남아 있어도 배열로 정규화해 병합하도록 보정했다.
- 수정 후 `msworker` TypeScript 검사 통과, root Next TypeScript 검사 통과, `megashorts-logs` dry-run 및 재배포 완료.
- 재검증 curl은 현재 세션의 외부 실행 승인 한도 때문에 마지막 확인을 완료하지 못했다. 다음 세션에서 인증 POST/GET을 다시 확인해야 한다.

## 2026-05-18 22단계 - 네트워크/바이너리 지급 조건 로직 추가
- 기존 구현은 바이너리 직접 추천 2명 제한은 일부 있었지만, “조건 전에는 계산/누적만 하고 포인트는 지급하지 않다가 조건 달성 시 누적 지급” 로직은 없었다.
- `commission_batch.processed = 3`을 보류 상태로 사용하도록 추가했다. 의미: 계산 완료, 아직 지급 조건 미충족으로 Supabase 포인트 미지급.
- 네트워크/바이너리 팀 커미션은 지급 전에 팀마스터 설정의 `network.payoutQualification`을 확인한다.
- 일반 네트워크 기본값: 지급 조건 비활성화.
- 네트워크 바이너리 기본값: 직접 하위회원 2명 이상일 때 지급 가능.
- 조건 미충족 시 커미션 row는 `processed = 3`으로 보류되고 Supabase 포인트는 증가하지 않는다.
- 이후 정산 실행 시 보류 row를 다시 확인해 조건을 충족한 사용자는 누적 보류분을 Supabase 포인트로 지급한다.
- 보류 해제 지급분은 해당 커미션 row만 기준으로 `referral_structure` 포인트 누적에도 반영되도록 별도 업데이트 경로를 추가했다.
- 관리자 영업 설정 저장값에 `network.payoutQualification`을 추가했다.
- `/admin/agency` 상세 설정 화면에 “하위회원 조건 충족 전 커미션 지급 보류” 설정 UI를 추가했다.
- 바이너리 네트워크 저장 기본값은 `enabled: true`, `memberCount: 2`, `countMode: direct`, `directReferralLimit: 2`다.
- 회원가입 바이너리 직접 추천 제한은 하드코딩 2명 대신 설정값 `binaryNetwork.directReferralLimit` 또는 지급 조건 memberCount를 우선 사용한다.
- 수정 후 `msworker` TypeScript 검사 통과, root Next TypeScript 검사 통과.
- 이후 보류 커미션 재실행 경로를 추가 보강했다. 기존 주차에 `processed = 3` 보류 row만 남아 있거나, 이미 처리 완료 row와 보류 row가 같이 있을 때도 새 정산을 중복 실행하지 않고 보류 row의 조건 충족 여부만 확인한다.
- 보류 커미션 해제 확인 범위를 해당 정산 주차로 제한할 수 있게 했다.
- 수정 후 `msworker` TypeScript 검사 통과, root Next TypeScript 검사 통과.

## 2026-05-18 23단계 - 최종 원격 재배포 및 비파괴 검증
- `commission-worker` 최종 수정본 dry-run 통과.
- `megashorts-logs` 최종 수정본 dry-run 통과.
- `commission-worker` 원격 재배포 완료. 배포 Version ID: `0b9868d9-e1e5-4a84-99f1-adc4c964d1ce`.
- `megashorts-logs` 원격 재배포 완료. 배포 Version ID: `728b9850-4b94-4e23-9bb5-7e473d8e0d63`.
- 원격 `commission-worker` 무인증 POST는 401을 반환했다. 인증 없는 정산 실행은 차단된다.
- 원격 `megashorts-logs` 무인증 GET은 401을 반환했다. 인증 없는 로그 조회는 차단된다.
- 원격 `megashorts-logs` 인증 POST 단일 객체 테스트는 200을 반환했다.
- 원격 `megashorts-logs` 인증 GET 조회 테스트는 200을 반환했고, `codex-remote-auth-test` 로그가 조회됐다.
- 원격 D1 읽기 전용 확인 결과 non-SYSTEM `commission_batch`는 `processed = 1` 13건, `processed = 3` 보류 커미션은 0건이었다.
- 실제 원격 정산 실행은 Supabase 사용자 포인트를 변경할 수 있으므로 실행하지 않았다. 현재 테스트 단계에서 원격 비파괴 검증은 완료했다.

## 2026-05-19 24단계 - 전체 재검증 계획과 쉬운 용어 정리

### 1. 현재 결론을 먼저 명확히 정리
- “모든 것이 완벽히 끝났다”라고 말하려면 아직 남은 확인이 있다.
- 커스텀 로그 워커는 핵심 보안 문제와 단일 객체 저장 오류를 수정했고, 원격에서 인증 쓰기/조회까지 정상 확인했다.
- 커스텀 로그 워커에 남은 점검은 “대량 로그”, “잘못된 날짜/필터”, “R2 파일이 커졌을 때 조회 성능”, “관리자 화면에서 실제 조회가 끊기지 않는지”이다.
- 일반 네트워크와 총판대리점 구조는 기존 테스트에서 핵심 정산 흐름이 정상으로 확인됐다.
- 바이너리 네트워크는 사용자가 설명한 요구사항, 즉 “일반 네트워크와 같지만 직속 하위회원 기본 제한 2명, 조건 전 보류, 조건 충족 후 누적 지급” 기준으로 맞춰 개선했다.
- 바이너리 네트워크에 남은 점검은 실제 테스트 데이터로 “1명일 때 보류”, “2명 달성 후 누적 지급”, “중복 실행 시 중복 지급 없음”을 직접 확인하는 것이다.

### 2. 쉬운 용어 정리
- 시크릿 전환: API 키, 비밀번호, Supabase 서비스 키처럼 남에게 보이면 안 되는 값을 설정 파일에 글자로 적어두지 않고 Cloudflare의 숨김 보관함에 넣는 작업이다.
- 키 회전: 이미 파일이나 화면에 노출됐을 수 있는 키를 새 키로 바꾸고, 예전 키는 더 이상 못 쓰게 폐기하는 작업이다.
- 즉시 내가 할 수 있는 것: 현재 키 값을 Cloudflare 시크릿으로 옮기고, 설정 파일에서 평문 키를 제거하는 것.
- 사용자의 대시보드 권한이 필요한 것: Supabase 서비스 키 자체를 새로 발급하거나, Cloudflare API token 자체를 새로 만들고 예전 token을 폐기하는 것.
- 기능 검증과 키 회전은 다르다. 기능 검증은 시스템이 맞게 작동하는지 보는 것이고, 키 회전은 노출 위험을 줄이는 보안 정리다.

### 3. 다음 단계 진행 원칙
- 한 단계를 수정하면 반드시 타입검사나 실행 테스트를 통과한 뒤 다음 단계로 간다.
- 사용자/게시물/포인트를 바꿀 수 있는 테스트는 `codex` 식별자가 붙은 격리 테스트 데이터로만 수행한다.
- 실제 운영 사용자나 실제 게시물의 포인트, 추천구조, 게시물 통계는 임의로 수정하지 않는다.
- 테스트를 위해 생성한 데이터는 어떤 식별자를 썼는지 이 문서에 남긴다.
- 수정한 파일과 테스트 결과를 매 단계 기록한다.

### 4. 전체 체크리스트
- 1단계: Next 메인 프로젝트 폰트 설정을 영어 `Montserrat`, 중국어 `Noto Sans SC`, 한국어 기존 로컬 폰트로 분리하고 타입검사를 통과시킨다.
- 2단계: Cloudflare Worker 설정 파일에 평문 비밀값이 남아 있는지 다시 점검한다.
- 3단계: 가능한 값은 Cloudflare 시크릿으로 옮기고, 설정 파일의 평문 비밀값을 제거한다.
- 4단계: 커스텀 로그 워커를 인증 없음/인증 있음/단일 로그/복수 로그/조회 필터 기준으로 다시 테스트한다.
- 5단계: 일반 네트워크 정산을 테스트 데이터 기준으로 다시 검증한다.
- 6단계: 바이너리 네트워크 정산을 “직속 1명 보류, 직속 2명 지급, 재실행 중복 지급 없음” 기준으로 검증한다.
- 7단계: 총판대리점 구조 정산과 통계 생성이 기존 의도대로 동작하는지 검증한다.
- 8단계: 관리자 화면 `/admin/agency`에서 저장한 설정이 Worker 정산 로직까지 같은 의미로 전달되는지 확인한다.
- 9단계: 모든 검증 결과를 이 문서와 `.agents/04_architecture.md`에 한글로 반영한다.

### 5. 이번 단계에서 통과한 항목
- 영어/중국어/한국어 폰트 분리 코드를 반영했다.
- root Next 프로젝트 TypeScript 검사를 통과했다.

## 2026-05-19 25단계 - 시크릿 전환, 로그 시스템 보안 개선, 원격 검증

### 1. 시크릿 전환 결과
- Worker 설정 파일의 평문 비밀값을 제거했다.
- 제거 대상: `API_KEY`, `WORKER_API_KEY`, `CRON_SECRET`, `SUPABASE_SERVICE_ROLE_KEY`.
- 남긴 값: `SUPABASE_URL`처럼 주소 성격의 값.
- Cloudflare 시크릿 등록과 재배포를 완료한 Worker:
- `megashorts-logs` / Version ID `9c9a01f5-aedf-4832-aeaf-6af60ca8926a`
- `viewgroup` / Version ID `d46642f6-e6b7-43c0-931e-710bd6111249`
- `post-data-worker` / Version ID `a13b2af0-00a5-4b81-a54b-3304ca4dd2e5`
- `referral-structure-worker` / Version ID `59f6ee56-57ba-4411-9d60-7864d0f6082e`
- `viewcount-team-worker` / Version ID `aaee58f4-a224-4585-94fd-d2939c9f0cc2`
- `team-master-settings` / Version ID `c76b5ba3-63f1-4ab0-8cb0-41b4b0c0843e`
- `commission-worker` / Version ID `d824c596-2809-4726-a014-2a18c8320068`
- `cfstats-admin` / Version ID `10e59eb0-7876-40e0-bbb4-48a3e086e14c`
- 시크릿 전환 후 원격 smoke test에서 인증 없는 실행 경로는 401로 차단됐다.
- 로그 Worker 인증 POST/GET은 200으로 정상 동작했다.

### 2. 커스텀 로그 시스템 추가 개선
- 이전 상태는 “Worker 자체는 인증을 요구하지만 브라우저 코드가 `NEXT_PUBLIC_WORKER_API_KEY`를 사용하면 키가 공개된다”는 문제가 있었다.
- 이 상태는 완벽한 보안이라고 볼 수 없으므로 구조를 개선했다.
- `megashorts-logs`에 `PUBLIC_LOG_WRITE_KEY`를 추가했다.
- 쓰기 전용 키는 POST 로그 저장만 허용한다.
- 쓰기 전용 키로 GET 로그 조회를 시도하면 401을 반환한다.
- 관리자 조회는 새 서버 API `/api/admin/service/logs`가 Worker 관리자 키를 서버에서 붙여 호출한다.
- 일반 브라우저 활동 로그는 `NEXT_PUBLIC_LOG_WRITE_KEY`가 있으면 Cloudflare Worker로 직접 보내고, 없으면 `/api/logs` 서버 프록시를 사용한다.
- 원격 검증 결과:
- 쓰기 전용 키 POST: 200 성공.
- 쓰기 전용 키 GET: 401 차단.
- 관리자 키 GET: 200 성공 및 테스트 marker 조회 확인.
- `megashorts-logs` 최종 재배포 Version ID: `977fc05d-ba01-4521-b6d2-be6d274a6259`.

### 3. 바이너리 네트워크 조건 보류 버그 발견 및 수정
- 테스트 중 `BINARY_NETWORK`에서 보류가 생겨야 하는데 바로 지급되는 문제를 발견했다.
- 원인: 예전 설정 필드 `network.autoQualification.enabled = false`가 바이너리 기본 조건보다 먼저 적용됐다.
- 사용자의 요구사항 기준으로 바이너리는 새 `network.payoutQualification`이 없으면 기본적으로 직접 하위 2명 조건을 적용해야 한다.
- 수정 내용: `BINARY_NETWORK`는 `network.payoutQualification`이 없을 때 예전 `autoQualification=false`를 무시하고 기본값 `enabled=true`, `memberCount=2`, `countMode=direct`를 사용하도록 바꿨다.
- 수정 후 `msworker` TypeScript 검사 통과.
- root Next TypeScript 검사 통과.
- 수정본 `commission-worker` 재배포 Version ID: `ad8cf56a-6bc9-497a-8259-a57413859c47`.

### 4. 영업팀 구조별 원격 E2E 검증
- 테스트 데이터는 `codex_agency_test_*` 접두사로 격리했다.
- 최종 검증 runId: `20260518170624`.
- 최종 검증 날짜: `2026-06-07`.
- Supabase에 테스트 사용자, 게시물, 시청기록을 생성했다.
- `referral-structure-worker`로 추천구조를 먼저 생성했다.
- 원격 Worker 체인을 실행했다: `viewgroup -> postdata -> viewcountteam -> commission`.
- 모든 Worker는 최종 `success`까지 도달했다.
- HEADQUARTERS 계열 직접/간접 커미션은 지급 완료 상태 `processed=1`로 확인됐다.
- 일반 NETWORK 커미션은 지급 완료 상태 `processed=1`로 확인됐다.
- BINARY_NETWORK 1차 정산에서 직접 하위 2명 조건 미달인 row 2건이 `processed=3` 보류 상태로 저장됐다.
- 이후 `binary_direct_a`에게 두 번째 직속 하위를 추가하고 추천구조를 동기화하자 보류분 1건이 해제되어 1.68 포인트가 지급됐다.
- 이후 `binary_level2`에게 두 번째 직속 하위를 추가하고 추천구조를 동기화하자 남은 보류분 1건이 해제되어 21.6 포인트가 지급됐다.
- 최종 D1 조회 결과 `BINARY_NETWORK` 보류 row는 남아 있지 않았다.
- 같은 날짜로 commission을 다시 실행했을 때 `already_processed`, `payoutAmount=0`이 반환되어 중복 지급이 차단됐다.

### 5. 오늘 확인된 명확한 답
- 커스텀 로그 시스템은 이제 “인증 없는 조회/쓰기 차단”, “단일/배열 로그 저장”, “쓰기 전용 키와 관리자 조회 키 분리”까지 원격 검증했다.
- 다만 대량 트래픽 부하, R2 파일 장기 누적 성능, 운영 알림/모니터링은 별도 부하 테스트 영역이다.
- 일반 NETWORK와 HEADQUARTERS 계열은 이번 원격 E2E에서 정상 지급을 확인했다.
- BINARY_NETWORK는 조건 보류/해제 버그를 발견했고 수정/배포/원격 검증까지 완료했다.
- 현재 사용자가 설명한 바이너리 요구사항, 즉 “일반 네트워크와 같은 계산 + 직접 하위 기본 2명 조건 + 조건 전 보류 + 조건 충족 후 누적 지급” 기준으로는 정상 동작을 확인했다.

### 6. 테스트 데이터 정리
- 원격 D1에서 `codex_agency_test_%` 접두사의 테스트 row만 삭제했다.
- 삭제 후 D1 확인 결과 `commission_batch`, `grouped_views`, `referral_structure`, `post_view_stats`의 codex 테스트 row는 0건이다.
- Supabase에서 `codex_agency_test_%` 접두사의 테스트 사용자/게시물/시청기록을 정리했다.
- Supabase 정리 결과: 사용자 82명, 게시물 15건 삭제.

### 7. Vercel 배포 환경변수 주의사항
- 운영 배포에서 Vercel 비용을 줄이려면 Vercel 프로젝트 환경변수에 `NEXT_PUBLIC_LOG_WRITE_KEY`를 추가해야 한다.
- 값은 로컬 `.env` 파일의 `NEXT_PUBLIC_LOG_WRITE_KEY=...` 오른쪽 문자열을 그대로 사용한다.
- 이 값은 Cloudflare 로그 Worker 시크릿 `PUBLIC_LOG_WRITE_KEY`와 반드시 같아야 한다.
- 값이 없으면 브라우저 로그가 `/api/logs` Next 서버 프록시로 가므로 기능은 동작하지만 Vercel 요청 비용이 늘 수 있다.
- `NEXT_PUBLIC_LOG_WRITE_KEY`가 있으면 브라우저 로그가 `NEXT_PUBLIC_LOGS_WORKER_URL`로 직접 POST되어 Cloudflare 쪽에서 처리된다.
- 이 키는 쓰기 전용 키라 GET 조회는 401로 막혀야 한다.
