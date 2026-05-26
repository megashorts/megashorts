# 글로벌 결제솔루션 연계 가이드

> 작성일: 2026-05-26  
> 목적: Toss/KRW 결제 실행부 제거 이후 Stripe 같은 글로벌 결제솔루션을 새로 붙일 때, DB/웹훅/관리자 설정/워커 정산/통계가 끊기지 않도록 필요한 연결점을 정리한다.

---

## 1. 현재 상태

- 기존 결제 실행부는 제거되어 있다.
- `/subscription` 페이지는 유지되며 가격은 관리자 `globalPrice` 기반 USD로 표시한다.
- 구독/코인 구매 버튼은 실제 결제를 호출하지 않고 `결제구현시 작동합니다` 토스트만 표시한다.
- 관리자 설정의 기존 `price`와 `globalPrice`는 유지한다.
- 결제 관련 DB 모델은 삭제하지 않는다. 후속 결제 제공자 구현에서 재사용한다.
- 시청기록 수집, 포인트 계산, 영업수수료 지급, 통계 원장은 결제 실행부 삭제와 분리되어 있어야 한다.

---

## 2. 유지해야 할 기존 DB 테이블

### `Payment`

현재 위치: `prisma/schema.prisma`

후속 구현에서 결제 원장의 중심 테이블로 사용한다. 현재 필드만으로는 글로벌 결제 제공자 연동에 부족하므로, 다음 필드 확장을 권장한다.

```prisma
model Payment {
  id                 String    @id @default(cuid())
  userId             String
  type               String    // coin, subscription, refund 등
  status             String    // pending, paid, failed, cancelled, refunded
  amount             Int       // 최소 통화 단위. USD면 cents, JPY/KRW면 integer amount
  currency           String    @default("USD")
  orderId            String    @unique
  provider           String?   // stripe, paddle 등
  providerPaymentId  String?   @unique
  providerCustomerId String?
  providerSessionId  String?
  providerPriceId    String?
  billingKey         String?
  method             String?
  approvedAt         DateTime?
  metadata           Json?
  failureReason      String?
  createdAt          DateTime  @default(now())
  updatedAt          DateTime? @updatedAt
}
```

중요 기준:

- `amount`는 항상 `currency`와 함께 읽어야 한다.
- 특정 통화로 무조건 환산하지 않는다.
- 결제 표시 통화, 결제 원장 통화, 정산 포인트 기준은 분리한다.
- 코인 지급이나 구독 활성화는 결제창 리다이렉트가 아니라 웹훅 확정 후 처리한다.

### `Subscription`

구독 상태의 앱 내부 단일 소스가 되어야 한다.

필수 연결:

- `userId`
- `status`
- `type`
- `currentPeriodStart`
- `currentPeriodEnd`
- `cancelAtPeriodEnd`
- provider subscription id 추가 권장

웹훅 연결:

- 첫 구독 결제 성공: `status='active'`, 기간 시작/종료 저장
- 정기 갱신 성공: `currentPeriodEnd` 갱신
- 결제 실패: `failCount`, `lastFailedAt`, `nextRetryAt` 갱신
- 구독 해지: `cancelAtPeriodEnd=true` 또는 즉시 `cancelled`

### `BillingKey`

기존 이름은 유지하되, Stripe 같은 provider에서는 실제 billing key가 아니라 provider customer/payment method/subscription 참조를 저장하는 방향으로 확장한다.

권장 필드:

- `provider`
- `providerCustomerId`
- `providerPaymentMethodId`
- `providerSubscriptionId`
- `status`
- 카드 표시 정보는 provider가 제공하는 비민감 마지막 4자리/브랜드만 저장

### `webhookLog`

모든 provider webhook 수신 이력을 저장한다.

필수 기준:

- `eventType`
- `payload`
- `status`
- `error`
- provider event id 추가 권장

중복 처리 방지:

- provider event id를 unique로 저장한다.
- 이미 처리한 event id는 재처리하지 않는다.
- 웹훅 처리는 idempotent 해야 한다.

---

## 3. 관리자 설정 연결

현재 설정 위치:

- 설정 타입/기본값: `src/lib/admin/system-settingspage.ts`
- 관리자 UI: `src/app/[locale]/(main)/admin/system/components/SystemSettings.tsx`
- 설정 API: `/api/admin/settings`

유지할 값:

- `subscriptionPackages[].price`
- `subscriptionPackages[].globalPrice`
- `coinPackages[].price`
- `coinPackages[].globalPrice`
- `viewCoinAmount`
- `coinToPoint`
- 업로더 지급비율
- 영업팀 지급 설정

후속 구현에서 추가 권장:

- `paymentProvider`: 기본 결제 제공자. 예: `stripe`
- `settlementBaseCurrency`: 운영 정산 기준 통화 표시값. 예: `USD`
- `subscriptionPointPoolPolicy`: 구독 매출을 포인트 풀로 변환하는 정책
- `coinPointRate`: 코인 구매/소진을 포인트 가치로 계산하는 기준
- provider price mapping:
  - weekly subscription price id
  - yearly subscription price id
  - coin package price ids
- `paymentWebhookEnabled`
- `paymentSandboxMode`

관리자 가격 설정은 결제 UI와 provider 가격 설정이 서로 어긋나지 않게 해야 한다. 실제 결제 제공자는 보통 dashboard price id를 사용하므로, 단순 숫자 가격뿐 아니라 provider price id 매핑이 필요하다.

---

## 4. `/subscription` 페이지 연결

현재 위치:

- `src/app/[locale]/(main)/(static)/subscription/Subscription.tsx`
- `SubscriptionButton.tsx`
- `CoinPurchaseButton.tsx`

현재 동작:

- 주간/연간 탭 유지
- 코인 수량 선택 전 구매 버튼 비활성화 유지
- 가격은 `globalPrice`를 USD로 표시
- 클릭 시 토스트만 표시

후속 구현:

- 구독 버튼 클릭:
  - `/api/payments/{provider}/checkout` 호출
  - body: `{ type: 'subscription', plan: 'weekly' | 'yearly' }`
  - 응답: provider checkout URL
  - 브라우저를 checkout URL로 이동
- 코인 버튼 클릭:
  - `/api/payments/{provider}/checkout` 호출
  - body: `{ type: 'coin', amount: selectedCoin }`
  - 응답 checkout URL로 이동

주의:

- 클라이언트 성공 페이지에서 코인이나 구독을 확정하지 않는다.
- 성공 페이지는 “처리 중/완료 확인” 정도만 표시한다.
- 실제 지급/활성화는 웹훅에서 처리한다.

---

## 5. 결제 API 설계

권장 경로:

- `POST /api/payments/checkout`
- `POST /api/payments/webhook`
- `POST /api/payments/cancel`
- `GET /api/payments/status?orderId=...`

### Checkout 생성

처리 순서:

1. 로그인 유저 확인
2. 관리자 설정에서 가격/price id 조회
3. `Payment`에 `pending` 원장 생성
4. provider checkout session 생성
5. provider session id를 `Payment`에 저장
6. checkout URL 반환

### Webhook

처리 순서:

1. raw body로 서명 검증
2. provider event id 중복 처리 확인
3. `webhookLog`에 pending 저장
4. 이벤트 타입별 분기
5. DB 트랜잭션으로 원장 확정 및 앱 상태 반영
6. `webhookLog.status='success'`

필수 이벤트:

- checkout/session completed
- payment succeeded
- payment failed
- subscription created
- subscription updated
- subscription cancelled
- invoice paid
- invoice payment failed
- refund created

### 코인 구매 웹훅 처리

트랜잭션 안에서 처리:

- `Payment.status='paid'`
- `Payment.approvedAt`
- `User.mscoin += purchasedCoinAmount`
- `Notification` 생성
- 중복 지급 방지: `Payment.status`가 이미 `paid`면 지급하지 않음

### 구독 웹훅 처리

트랜잭션 안에서 처리:

- `Payment.status='paid'`
- `Subscription.upsert`
- `Subscription.status='active'`
- `currentPeriodStart`, `currentPeriodEnd` 저장
- `User.subscriptionEndDate`가 남아 있다면 동일 트랜잭션에서 동기화
- `BillingKey` 또는 provider customer/subscription reference 저장

---

## 6. 워커 정산과 통계 결합

현재 워커/원장 기준:

- 원본 시청: `video_views`
- D1 집계: `grouped_views`
- 상세 시청 근거: `grouped_view_details`
- 지급 원장: `commission_batch`
- 통계 저장: `cf_stats`

결제 제공자 연동 후에도 이 구조는 유지한다.

결제와 워커의 연결점:

1. 결제 웹훅이 구독/코인 상태를 확정한다.
2. 유료 시청 발생 시 앱은 viewer의 구독 또는 코인 사용 상태를 기준으로 `video_views.access_method`를 기록한다.
3. `viewgroup` Worker가 일별 시청 원장을 `grouped_views`와 `grouped_view_details`로 저장한다.
4. `commission` Worker가 해당 기간의 유료 시청 원장과 관리자 지급 설정을 기준으로 포인트 지급 원장 `commission_batch`를 생성한다.
5. `cfstats-admin` 또는 통계 저장 단계가 `cf_stats`와 R2 `cf-stats/` 스냅샷을 저장한다.

정산 포인트 풀 기준:

- 결제 원장의 실제 통화 금액을 특정 통화로 무조건 합산하지 않는다.
- 정산 워커에는 provider 중립의 포인트 풀 값을 전달하거나, 워커가 관리자 설정에 따라 포인트 풀을 계산한다.
- 구독 시청 1회당 지급 포인트는 `subscriptionPointPool / eligibleSubscriptionViews` 방식으로 산정한다.
- 코인 시청은 `viewCoinAmount`, `coinToPoint`, 코인 소진 원장을 기준으로 산정한다.

필수 검증:

- 같은 provider webhook event를 두 번 보내도 코인/구독/포인트가 중복 반영되지 않아야 한다.
- 결제 성공 후 시청한 기록만 유료 시청으로 잡혀야 한다.
- 결제 실패/환불/구독 해지 후의 시청은 지급 대상에서 제외되어야 한다.
- `commission_batch`에는 지급 대상자, 지급 유형, 포스트, 코인/구독 시청수, 코인/구독 포인트가 보존되어야 한다.
- `grouped_view_details`에는 viewer, video, post, access method가 보존되어야 한다.

---

## 7. 관리자 통계와 리포트 연결

현재 관련 화면:

- 플랫폼 전체 통계: `/admin/system?tab=stats`
- 영업팀 통계: `/admin/agency?tab=search`
- 크리에이터 수익: `/usermenu/earnings`
- 영업자 수익: `/usermenu/agency-earnings`

후속 결제 구현 후 표시해야 할 값:

- 결제 수익 원장 요약:
  - provider
  - currency
  - gross amount
  - fee
  - net amount
  - refunded amount
- 포인트 정산 요약:
  - subscription point pool
  - coin point pool
  - creator payout total
  - agency payout total
- 기간별 상세:
  - 어떤 포스트/비디오에서 구독 시청 몇 건, 코인 시청 몇 건이 발생했는지
  - 크리에이터별 지급액
  - 영업팀별 지급액
  - 직접 추천/간접 추천/네트워크 지급액

통계 UI는 결제 provider 금액과 지급 포인트를 같은 숫자처럼 합산하지 않아야 한다. 결제 금액은 통화와 함께, 정산 결과는 포인트로 표시한다.

---

## 8. 구현 순서

1. DB migration 설계:
   - `Payment` provider/currency/session/customer 필드 추가
   - `webhookLog` provider event id 추가
   - 필요 시 provider price mapping 테이블 추가
2. 관리자 설정 확장:
   - provider 선택
   - sandbox/live mode
   - price id mapping
   - settlement point policy
3. Checkout API 구현:
   - coin
   - weekly subscription
   - yearly subscription
4. Webhook API 구현:
   - raw body 서명 검증
   - idempotency
   - Payment/Subscription/BillingKey/User/Notification 트랜잭션 처리
5. `/subscription` 버튼 연결:
   - placeholder toast 제거
   - checkout API 호출
6. 결제 취소/환불 API 구현:
   - provider API 호출
   - webhook 또는 API 결과로 DB 상태 동기화
7. 워커 정산 연결:
   - 결제 확정 원장과 유료 시청 원장의 관계 검증
   - 정산 포인트 풀 계산 기준 확정
8. E2E 검증:
   - 코인 결제 성공/실패/중복 웹훅
   - 구독 성공/갱신/실패/해지
   - 유료 시청 기록 생성
   - viewgroup 실행
   - commission 실행
   - cf_stats/R2 통계 저장
   - 관리자/크리에이터/영업팀 통계 화면 확인

---

## 9. 완료 기준

- 결제 SDK와 provider secret이 서버 전용으로만 사용된다.
- 클라이언트는 secret을 알 수 없다.
- 웹훅 서명 검증이 필수다.
- 동일 웹훅 중복 수신에도 지급이 중복되지 않는다.
- 결제 금액은 항상 통화와 provider가 같이 저장된다.
- 지급/정산은 포인트 기준으로 저장된다.
- 결제 금액과 지급 포인트를 같은 단위로 섞어 표시하지 않는다.
- 시청 원장, 지급 원장, 통계 원장에 포스트/비디오/시청방식/지급대상자/지급유형이 보존된다.
- 기존 통계 시뮬레이션은 실제 운영 원장과 동일한 필드 구조로 검증된다.
