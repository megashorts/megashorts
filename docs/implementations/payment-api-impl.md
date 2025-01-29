# 결제 시스템 상세 구현

구현 파일:
- src/app/(main)/usermenu/payments/PaymentModal.tsx
- src/app/(main)/usermenu/payments/result/success/page.tsx
- src/app/(main)/usermenu/payments/result/fail/page.tsx
- src/app/api/payments/route.ts

## 1. 결제 모달 구현

### 1.1 개요
```typescript
목적:
- 토스페이먼츠 연동
- 코인 구매 처리
- 결제 위젯 관리

특징:
- 실시간 결제 처리
- 사용자별 고유 키 관리
- 반응형 UI
```

### 1.2 초기화 및 설정
```typescript
interface PaymentModalProps {
  paymentAmount: number;
  coins?: number;
  onClose: () => void;
}

// 고유 주문번호 생성
const orderId = `order_${nanoid()}_${coins}`;

// 고객 키 설정
const customerKey = `${user?.id}`;

// 토스페이먼츠 초기화
const tossPayments = await loadTossPayments(process.env.NEXT_PUBLIC_TOSS_PAYMENTS_CLIENT_KEY || '');
const widgets = tossPayments.widgets({ customerKey });
```

### 1.3 결제 위젯 렌더링
```typescript
// 금액 설정
await widgets.setAmount({
  value: paymentAmount,
  currency: 'KRW'
});

// 결제 수단 및 약관 렌더링
await Promise.all([
  widgets.renderPaymentMethods({
    selector: "#payment-method",
    variantKey: "DEFAULT",
  }),
  widgets.renderAgreement({
    selector: "#agreement",
    variantKey: "AGREEMENT",
  })
]);
```

### 1.4 결제 요청 처리
```typescript
await widgets.requestPayment({
  orderId: orderId,
  orderName: coins + "MS코인",
  successUrl: `${window.location.origin}/usermenu/payments/result/success`,
  failUrl: `${window.location.origin}/usermenu/payments/result/fail`,
  customerEmail: user.email,
  customerName: user.username,
  customerMobilePhone: "01012341234",
});
```

## 2. 결제 상태 관리

### 2.1 상태 정의
```typescript
const [ready, setReady] = useState(false);
const [widgets, setWidgets] = useState<any>(null);
const [error, setError] = useState<string | null>(null);
```

### 2.2 에러 처리
```typescript
try {
  // 결제 처리 로직
} catch (err) {
  console.error('결제 요청 실패:', err);
  setError('결제 처리 중 오류가 발생했습니다.');
}
```

### 2.3 UI 상태 관리
```typescript
// 모달 스크롤 제어
useEffect(() => {
  document.body.style.overflow = 'hidden';
  return () => {
    document.body.style.overflow = 'unset';
  };
}, []);

// 버튼 상태 관리
<button 
  disabled={!ready}
  className="... disabled:bg-gray-400 disabled:cursor-not-allowed"
>
  {!ready ? '로딩중...' : '결제하기'}
</button>
```

## 3. 보안 고려사항

### 3.1 결제 검증
```typescript
1. 주문번호 관리
   - 고유성 보장
   - 난수 활용
   - 코인 정보 포함

2. 사용자 인증
   - 세션 검증
   - 권한 확인
   - 이메일 검증

3. 금액 검증
   - 서버 측 검증
   - 변조 방지
   - 로깅
```

### 3.2 데이터 보안
```typescript
1. 민감 정보 처리
   - 결제 정보 암호화
   - 토큰 관리
   - 세션 보안

2. API 보안
   - HTTPS 사용
   - CORS 설정
   - Rate limiting

3. 에러 처리
   - 상세 로깅
   - 사용자 피드백
   - 복구 전략
```

## 4. 성능 최적화

### 4.1 로딩 최적화
```typescript
1. 초기화 전략
   - 지연 로딩
   - 상태 관리
   - 캐싱

2. 렌더링 최적화
   - 비동기 처리
   - 컴포넌트 분리
   - 메모이제이션

3. 에러 처리
   - 재시도 로직
   - 폴백 UI
   - 사용자 피드백
```

### 4.2 UX 최적화
```typescript
1. 반응성
   - 로딩 상태
   - 피드백 제공
   - 애니메이션

2. 접근성
   - ARIA 레이블
   - 키보드 지원
   - 스크린리더 지원

3. 모바일 최적화
   - 반응형 디자인
   - 터치 인터랙션
   - 성능 최적화
