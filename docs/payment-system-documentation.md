# 결제 시스템 구조 및 구현 문서

## 1. 현재 구현된 결제 시스템

### A. 폴더 구조
```plaintext
src/app/(main)/api/payments/
├── route.ts              // 일반 결제 처리
├── success/
│   └── route.ts         // 코인 구매 성공 처리
├── fail/
│   └── route.ts         // 코인 구매 실패 처리
└── billing/            // 정기 구독 관련
    ├── route.ts        // 정기 결제 처리
    ├── success/
    │   └── route.ts    // 빌링키 발급 성공 처리
    └── fail/
        └── route.ts    // 빌링키 발급 실패 처리
```

### B. 코인 구매 흐름
1. Subscription.tsx에서 코인 선택
```typescript
const coinOptions = [    
  { value: 10, price: 1_400 },
  { value: 70, price: 10_000 },
  { value: 350, price: 45000 },
  { value: 700, price: 85000 }
];
```

2. PaymentModal로 토스페이먼츠 결제 요청
3. 성공 시 /api/payments/success로 리다이렉트
4. 코인 증가 및 결제 기록 저장

### C. 정기 구독 흐름
1. Subscription.tsx에서 구독 선택
```typescript
const subscriptionPlans = {
  weekly: {
    type: 'weekly',
    title: '주간 구독',
    price: 8500,
    originalPrice: 13000,
    period: '1주',
    description: '모든 콘텐츠 무제한 이용.'
  },
  yearly: {
    type: 'yearly',
    title: '연간 구독',
    price: 190000,
    originalPrice: 260000,
    period: '1년',
    description: '모든 콘텐츠 무제한 이용.'
  }
};
```

2. BillingModal로 빌링키 발급 요청
```typescript
await payment.requestBillingAuth({
  method: "CARD",
  successUrl: `${origin}/usermenu/payments/result/billing/success?type=${type}&amount=${amount}`,
  failUrl: `${origin}/usermenu/payments/result/billing/fail`
})
```

3. 성공 시 /api/payments/billing/success에서 처리:
```typescript
// 빌링키 저장
await prisma.billingKey.create({
  data: {
    userId,
    billingKey: authKey,
    customerKey,
    status: 'active'
  }
})

// 결제 정보 저장
await prisma.payment.create({
  data: {
    userId,
    type: 'subscription',
    status: 'success',
    amount: parseInt(amount),
    orderId,
    billingKey: authKey,
    method: 'card',
    metadata: {
      subscriptionType: type
    }
  }
})

// 구독 정보 생성/업데이트
await prisma.subscription.upsert({
  where: { userId },
  create: {
    userId,
    status: 'active',
    type,
    currentPeriodStart,
    currentPeriodEnd,
  },
  update: {
    status: 'active',
    type,
    currentPeriodStart,
    currentPeriodEnd,
  }
})
```

## 2. 추가 구현 필요사항

### A. 스키마 수정
```prisma
// 결제 실패 기록을 위한 필드 추가
model Subscription {
  // 기존 필드들...
  failCount       Int       @default(0)  // 결제 실패 횟수
  lastFailedAt    DateTime? // 마지막 실패 시각
  nextRetryAt     DateTime? // 다음 재시도 시각
}

// 웹훅 로그 기록용
model WebhookLog {
  id        String   @id @default(cuid())
  eventType String   // BILLING_PAYMENT_APPROVED, BILLING_PAYMENT_FAILED 등
  payload   Json     // 웹훅 원본 데이터
  status    String   // success, failed
  error     String?  // 에러 메시지
  createdAt DateTime @default(now())

  @@map("webhook_logs")
}
```

### B. 새로운 파일 추가

1. 웹훅 처리 (src/app/(main)/api/payments/webhook/route.ts)
```typescript
export async function POST(req: Request) {
  try {
    const payload = await req.json();
    
    // 웹훅 로그 생성
    const log = await prisma.webhookLog.create({
      data: {
        eventType: payload.eventType,
        payload,
        status: 'pending'
      }
    });

    if (payload.eventType === 'BILLING_PAYMENT_APPROVED') {
      const subscription = await handlePaymentSuccess(payload);
      await updateWebhookLog(log.id, 'success');
    }

    if (payload.eventType === 'BILLING_PAYMENT_FAILED') {
      await handlePaymentFailure(payload);
      await updateWebhookLog(log.id, 'failed', payload.errorCode);
    }

    return new Response('OK');
  } catch (error) {
    console.error('Webhook error:', error);
    return new Response('Error', { status: 500 });
  }
}
```

2. 결제 내역 조회 (src/app/(main)/usermenu/users/[username]/components/PaymentHistory.tsx)
```typescript
export default function PaymentHistory() {
  const [activeTab, setActiveTab] = useState('all');
  const { data: payments } = useQuery(['payments', userId, activeTab], 
    () => fetchPayments(userId, activeTab)
  );

  return (
    <div className="space-y-4">
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList>
          <TabsTrigger value="all">전체 내역</TabsTrigger>
          <TabsTrigger value="coin">코인 구매/사용</TabsTrigger>
          <TabsTrigger value="subscription">구독 결제</TabsTrigger>
        </TabsList>
        <TabsContent value="all">
          <PaymentList payments={payments} />
        </TabsContent>
        <TabsContent value="coin">
          <CoinHistory payments={payments} />
        </TabsContent>
        <TabsContent value="subscription">
          <SubscriptionHistory payments={payments} />
        </TabsContent>
      </Tabs>
    </div>
  );
}
```

3. 결제 내역 API (src/app/(main)/api/users/[userId]/payments/route.ts)
```typescript
export async function GET(
  req: Request,
  { params }: { params: { userId: string } }
) {
  const { searchParams } = new URL(req.url);
  const type = searchParams.get('type') || 'all';
  const page = parseInt(searchParams.get('page') || '1');
  const limit = 20;

  const where = {
    userId: params.userId,
    ...(type !== 'all' && { type }),
  };

  const [payments, total] = await prisma.$transaction([
    prisma.payment.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      skip: (page - 1) * limit,
      take: limit,
    }),
    prisma.payment.count({ where }),
  ]);

  return Response.json({
    payments,
    pagination: {
      total,
      pages: Math.ceil(total / limit),
      current: page,
    },
  });
}
```

## 3. 데이터 저장 구조

### A. 코인 구매 시
```typescript
// 1. Payment 테이블
{
  userId: string,
  type: 'coin',
  status: 'success',
  amount: number,
  orderId: string,
  method: 'card'
}

// 2. User 테이블
{
  mscoin: { increment: coinAmount }
}
```

### B. 정기 구독 시
```typescript
// 1. BillingKey 테이블
{
  userId: string,
  billingKey: string,
  customerKey: string,
  status: 'active'
}

// 2. Subscription 테이블
{
  userId: string,
  type: 'weekly' | 'yearly',
  status: 'active',
  currentPeriodStart: Date,
  currentPeriodEnd: Date
}

// 3. Payment 테이블
{
  userId: string,
  type: 'subscription',
  status: 'success',
  amount: number,
  orderId: string,
  billingKey: string,
  method: 'card'
}
```

## 4. 서비스 시나리오

### A. 정기 결제 자동화
1. 매일 자정에 토스페이먼츠가 결제 시도
2. 결제 결과를 웹훅으로 전송
3. 성공 시:
   - 구독 기간 연장
   - 결제 기록 생성
   - 사용자 알림
4. 실패 시:
   - 실패 횟수 증가
   - 다음 재시도 일정 설정
   - 사용자 알림
   - 3회 실패 시 구독 정지

### B. 사용자 경험
1. 결제 내역 조회:
   - 전체/코인/구독 필터링
   - 페이지네이션
   - 상세 내역 확인
2. 알림:
   - 결제 예정 알림 (3일 전)
   - 결제 성공/실패 알림
   - 구독 만료 예정 알림
3. 구독 관리:
   - 현재 구독 상태 확인
   - 결제 수단 변경
   - 구독 해지/일시정지

## 5. 구현 우선순위
1. 웹훅 처리 (결제 자동화 필수)
2. 결제 내역 조회 페이지
3. 알림 시스템
4. 구독 관리 기능

## 6. 시간 처리
- DB는 UTC로 저장
- 표시할 때 KST로 변환:
```typescript
const kstDate = new Date(date.getTime() + (9 * 60 * 60 * 1000));
```

## 7. 웹훅 설정
1. 토스페이먼츠 관리자 페이지에서 설정
2. Vercel 배포 시 자동으로 수신 가능
3. 별도 워커 파일은 통계 구현 시 추가

이렇게 구현하면:
1. 코인 구매와 정기 구독의 명확한 분리
2. 각각의 결제 흐름 독립적 관리
3. 안정적인 정기 결제 처리
4. 투명한 결제 내역 제공
5. 사용자 친화적 UI
6. 효율적인 구독 관리
가 가능해집니다.
