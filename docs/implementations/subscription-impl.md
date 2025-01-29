# 구독 시스템 상세 구현

구현 파일:
- src/hooks/useSubscription.ts
- src/app/api/subscription/status/route.ts
- src/app/api/subscription/cancel/route.ts
- src/components/auth/CancelSubscriptionDialog.tsx

## 1. 구독 상태 관리

### 1.1 개요
```typescript
목적:
- 구독 상태 조회
- 구독 정보 캐싱
- 실시간 상태 관리

특징:
- React Query 사용
- 타입 안정성
- 자동 갱신
```

### 1.2 구독 정보 타입
```typescript
interface SubscriptionInfo {
  isActive: boolean;
  subscription: 'weekly' | 'yearly' | null;
}
```

### 1.3 구독 훅 구현
```typescript
export function useSubscription() {
  const { user } = useSession();

  return useQuery<SubscriptionInfo>({
    queryKey: ['subscription-info'],
    queryFn: () => kyInstance.get('/api/subscription/status').json(),
    enabled: !!user?.id,
    staleTime: 12 * 60 * 60 * 1000, // 12시간
  });
}
```

## 2. 성능 최적화

### 2.1 캐싱 전략
```typescript
1. 쿼리 캐싱
   - staleTime: 12시간
   - 불필요한 요청 방지
   - 성능 향상

2. 상태 관리
   - 자동 갱신
   - 낙관적 업데이트
   - 에러 처리
```

### 2.2 데이터 동기화
```typescript
1. 실시간 업데이트
   - 구독 상태 변경 감지
   - 캐시 무효화
   - 자동 재조회

2. 에러 처리
   - 재시도 로직
   - 폴백 상태
   - 사용자 피드백
```

## 3. 보안 고려사항

### 3.1 인증 및 권한
```typescript
1. 사용자 검증
   - 세션 확인
   - 권한 검증
   - 접근 제어

2. 데이터 보안
   - 암호화
   - 토큰 관리
   - 세션 보안
```

### 3.2 데이터 무결성
```typescript
1. 상태 검증
   - 유효성 검사
   - 타입 검증
   - 데이터 정합성

2. 에러 처리
   - 예외 처리
   - 로깅
   - 복구 전략
```

## 4. 사용자 경험

### 4.1 상태 표시
```typescript
1. 로딩 상태
   - 초기 로딩
   - 갱신 중
   - 에러 상태

2. 피드백
   - 구독 상태 표시
   - 만료 알림
   - 갱신 안내
```

### 4.2 접근성
```typescript
1. UI 접근성
   - 상태 알림
   - 스크린리더 지원
   - 키보드 접근성

2. 오류 처리
   - 명확한 메시지
   - 복구 옵션
   - 도움말 제공
```

## 5. 구독 관리

### 5.1 구독 상태
```typescript
1. 상태 확인
   - 활성 상태
   - 구독 유형
   - 만료 일자

2. 상태 업데이트
   - 구독 활성화
   - 구독 취소
   - 구독 변경
```

### 5.2 구독 기능
```typescript
1. 구독 처리
   - 신규 구독
   - 구독 갱신
   - 구독 취소

2. 결제 연동
   - 결제 처리
   - 영수증 발행
   - 환불 처리
