# 메가쇼츠 결제 시스템 구조 및 흐름

## 목차
1. [데이터베이스 구조](#1-데이터베이스-구조)
2. [구독 결제 시스템](#2-구독-결제-시스템)
3. [코인 결제 시스템](#3-코인-결제-시스템)
4. [웹훅 처리 시스템](#4-웹훅-처리-시스템)
5. [정기 자동 결제 시스템](#5-정기-자동-결제-시스템)
6. [구독 취소 시스템](#6-구독-취소-시스템)
7. [전체 시스템 흐름도](#7-전체-시스템-흐름도)

---

## 1. 데이터베이스 구조

### 주요 테이블

#### Subscription 테이블
```
- id: String (PK)
- userId: String (FK -> User.id)
- status: String (active, cancelled, inactive)
- type: String (weekly, monthly, yearly)
- currentPeriodStart: DateTime
- currentPeriodEnd: DateTime
- cancelAtPeriodEnd: Boolean
- createdAt: DateTime
- updatedAt: DateTime
- failCount: Int
- lastFailedAt: DateTime?
- nextRetryAt: DateTime?
```

#### BillingKey 테이블
```
- id: String (PK)
- userId: String (FK -> User.id)
- subscriptionId: String (FK -> Subscription.id)
- billingKey: String
- customerKey: String
- status: String (active, inactive)
- cardCompany: String?
- cardNumber: String?
- createdAt: DateTime
- updatedAt: DateTime
```

#### Payment 테이블
```
- id: String (PK)
- userId: String (FK -> User.id)
- type: String (subscription, coin)
- status: String (pending, success, fail, cancelled, confirm)
- amount: Int
- orderId: String
- paymentKey: String?
- billingKey: String?
- method: String?
- approvedAt: DateTime?
- metadata: Json?
- failureReason: String?
- createdAt: DateTime
- updatedAt: DateTime?
```

#### User 테이블 (결제 관련 필드)
```
- id: String (PK)
- subscriptionEndDate: DateTime?
- mscoin: Int
```

#### webhookLog 테이블
```
- id: String (PK)
- eventType: String
- payload: Json
- status: String
- error: String?
- createdAt: DateTime
```

---

## 2. 구독 결제 시스템

### 초기 구독 결제 프로세스

#### 관련 파일 및 함수
- **클라이언트 컴포넌트**: `src/app/(main)/usermenu/payments/BillingModal.tsx`
  - 사용자에게 구독 옵션 제공 및 결제 요청 처리
  - 토스페이먼츠 결제창 호출

- **결제 시도 API**: `src/app/api/payments/try/route.ts`
  - 결제 시도 정보 DB에 저장
  - 주요 함수: `POST` - 결제 시도 정보 생성

- **결제 성공 처리 API**: `src/app/api/payments/billing/success/route.ts`
  - 결제 성공 시 처리 로직
  - 주요 함수: `GET` - 결제 성공 처리 및 구독 정보 업데이트
  - 빌링키 생성 및 저장
  - 구독 정보 생성 및 업데이트
  - 사용자 구독 종료일 업데이트
  - 캐시 무효화 (`revalidateTag('user-auth')`)

- **결제 실패 처리 API**: `src/app/api/payments/billing/fail/route.ts`
  - 결제 실패 시 처리 로직
  - 주요 함수: `GET` - 결제 실패 정보 저장

- **결제 상태 업데이트 API**: `src/app/api/payments/statusdb/route.ts`
  - 결제 상태 업데이트 처리
  - 주요 함수: `POST` - 결제 상태 업데이트

### 구독 결제 DB 처리 흐름
1. 사용자가 구독 결제 시도 → `Payment` 테이블에 `status: 'pending'`으로 저장
2. 결제 성공 시 → `Payment` 테이블 `status: 'success'` 업데이트
3. 빌링키 생성 → `BillingKey` 테이블에 저장
4. 구독 정보 생성/업데이트 → `Subscription` 테이블 업데이트
5. 사용자 정보 업데이트 → `User` 테이블의 `subscriptionEndDate` 업데이트

---

## 3. 코인 결제 시스템

### 코인 구매 프로세스

#### 관련 파일 및 함수
- **클라이언트 컴포넌트**: `src/app/(main)/usermenu/payments/PaymentModal.tsx`
  - 사용자에게 코인 구매 옵션 제공
  - 토스페이먼츠 결제창 호출

- **결제 시도 API**: `src/app/api/payments/try/route.ts`
  - 결제 시도 정보 DB에 저장
  - 주요 함수: `POST` - 결제 시도 정보 생성

- **결제 성공 처리 API**: `src/app/api/payments/coin/success/route.ts`
  - 결제 성공 시 처리 로직
  - 주요 함수: `GET` - 결제 성공 처리 및 코인 정보 업데이트
  - 사용자 코인 증가
  - 알림 생성

- **결제 실패 처리 API**: `src/app/(main)/usermenu/payments/result/coin/fail/page.tsx`
  - 결제 실패 시 UI 처리

- **결제 상태 업데이트 API**: `src/app/api/payments/statusdb/route.ts`
  - 결제 상태 업데이트 처리
  - 주요 함수: `POST` - 결제 상태 업데이트

### 코인 결제 DB 처리 흐름
1. 사용자가 코인 구매 시도 → `Payment` 테이블에 `status: 'pending'`으로 저장
2. 결제 성공 시 → `Payment` 테이블 `status: 'success'` 업데이트
3. 사용자 코인 증가 → `User` 테이블의 `mscoin` 필드 증가
4. 알림 생성 → `Notification` 테이블에 코인 구매 알림 저장

---

## 4. 웹훅 처리 시스템

### 웹훅 처리 프로세스

#### 관련 파일 및 함수
- **웹훅 처리 API**: `src/app/api/payments/webhook/route.ts`
  - 토스페이먼츠에서 전송하는 웹훅 처리
  - 주요 함수: `POST` - 웹훅 이벤트 처리
  - 웹훅 로그 저장
  - 결제 상태 업데이트
  - 결제 유형에 따른 추가 처리 (구독/코인)

### 웹훅 처리 흐름
1. 토스페이먼츠에서 웹훅 이벤트 수신
2. 웹훅 로그 저장 → `webhookLog` 테이블에 저장
3. 결제 정보 조회 → `Payment` 테이블에서 `orderId`로 조회
4. 결제 상태 업데이트 → `Payment` 테이블 상태 업데이트
5. 결제 유형에 따른 추가 처리:
   - 코인 결제 성공 시 → 사용자 코인 증가 및 알림 생성
   - 구독 결제 성공 시 → 구독 정보 업데이트
   - 결제 취소 시 → 코인 차감 또는 구독 취소 처리

### 구독 취소 처리 (웹훅)
- 구독 결제 취소 시:
  - 현재 구독 기간이 남아있는 경우 → `Subscription` 테이블의 `cancelAtPeriodEnd: true`로 설정
  - 이미 만료된 경우 → `Subscription` 테이블의 `status: 'cancelled'`로 변경

---

## 5. 정기 자동 결제 시스템

### 정기 자동 결제 프로세스

#### 관련 파일 및 함수
- **크론 작업 API**: `src/app/api/cron/billingkr/route.ts`
  - 정기 자동 결제 처리
  - 주요 함수: `GET` - 자동 결제 처리 및 구독 상태 업데이트
  - 만료된 구독 처리
  - 자동 결제 요청
  - 결제 실패 처리

### 정기 자동 결제 흐름
1. 크론 작업 실행 (매일)
2. 만료된 구독 중 취소 예정인 구독 처리:
   ```typescript
   // 기간이 만료된 구독 중 cancelAtPeriodEnd가 true인 경우 상태를 cancelled로 변경
   await prisma.subscription.updateMany({
     where: {
       status: 'active',
       cancelAtPeriodEnd: true,
       currentPeriodEnd: {
         lt: kstMidnight // 오늘 자정 이전에 만료된 구독
       }
     },
     data: {
       status: 'cancelled'
     }
   });
   ```

3. 오늘 만료되는 활성 구독 중 자동 갱신이 필요한 구독 조회:
   ```typescript
   // 오늘 만료되는 활성 구독 중 자동 갱신이 필요한 구독만 조회
   const subscriptions = await prisma.subscription.findMany({
     where: {
       status: 'active',
       cancelAtPeriodEnd: false, // 취소 예정이 아닌 구독만 처리
       currentPeriodEnd: {
         gte: kstMidnight,
         lt: kstTomorrow
       }
     },
     include: {
       billingKey: true
     }
   });
   ```

4. 각 구독에 대해 자동 결제 요청:
   - 토스페이먼츠 API를 통해 빌링키로 결제 요청
   - 결제 정보 저장 → `Payment` 테이블에 저장

5. 결제 실패 시 처리:
   - 실패 카운트 증가
   - 다음 재시도 시간 설정
   - 실패 로그 기록

---

## 6. 구독 취소 시스템

### 구독 취소 프로세스

#### 관련 파일 및 함수
- **구독 취소 API**: `src/app/(main)/api/user/subscription/cancel/route.ts`
  - 사용자 구독 취소 처리
  - 주요 함수: `POST` - 구독 취소 처리
  - 구독 상태 업데이트 (cancelAtPeriodEnd 설정)

### 구독 취소 흐름
1. 사용자가 구독 취소 요청
2. 구독 정보 업데이트:
   ```typescript
   await prisma.subscription.update({
     where: {
       userId: user.id,
       status: "active",
     },
     data: {
       // status는 변경하지 않고 현재 구독 기간 동안 유지
       // 구독 기간 종료 시 자동으로 취소되도록 설정
       cancelAtPeriodEnd: true,
     },
   });
   ```

3. 구독 취소 응답 반환

### 구독 취소 후 처리
- 현재 구독 기간 동안은 구독 상태 유지 (`status: 'active'`)
- 구독 기간 종료 시 크론 작업에서 상태 변경 (`status: 'cancelled'`)
- 자동 결제 중단 (크론 작업에서 `cancelAtPeriodEnd: true`인 구독은 자동 결제 제외)

---

## 7. 전체 시스템 흐름도

### 구독 결제 흐름
```
사용자 → 구독 결제 모달 → 결제 시도 API → 토스페이먼츠 결제창
→ 결제 성공/실패 → 결제 성공/실패 API → DB 업데이트
→ 웹훅 수신 → 웹훅 처리 API → DB 업데이트
```

### 코인 결제 흐름
```
사용자 → 코인 결제 모달 → 결제 시도 API → 토스페이먼츠 결제창
→ 결제 성공/실패 → 결제 성공/실패 API → DB 업데이트 (코인 증가)
→ 웹훅 수신 → 웹훅 처리 API → DB 업데이트
```

### 정기 자동 결제 흐름
```
크론 작업 실행 → 만료된 구독 처리 → 자동 결제 대상 조회
→ 토스페이먼츠 API 결제 요청 → DB 업데이트
→ 웹훅 수신 → 웹훅 처리 API → DB 업데이트
```

### 구독 취소 흐름
```
사용자 → 구독 취소 요청 → 구독 취소 API → DB 업데이트 (cancelAtPeriodEnd: true)
→ 구독 기간 종료 → 크론 작업 → DB 업데이트 (status: 'cancelled')
```

### 결제 상태 변경 흐름
```
결제 시도: pending → 결제 성공: success → 웹훅 확인: confirm
결제 시도: pending → 결제 실패: fail
결제 성공: success → 결제 취소: cancelled
```

### 구독 상태 변경 흐름
```
구독 시작: inactive → active
구독 취소 요청: active + cancelAtPeriodEnd: true
구독 기간 종료 후: cancelled
