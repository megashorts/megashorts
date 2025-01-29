# 알림 API 상세 구현

구현 파일:
- src/app/api/notifications/route.ts
- src/components/NoticeSidebar.tsx
- src/components/NavLinks.tsx

## 1. 알림 조회 API (/api/notifications)

### 1.1 개요
```typescript
목적:
- 사용자별 알림 목록 조회
- 페이지네이션 처리
- 알림 상태 관리

특징:
- 커서 기반 페이지네이션
- 페이지당 10개 알림
- 최신순 정렬
```

### 1.2 요청 구조
```typescript
요청:
GET /api/notifications?cursor={string}

응답:
interface NotificationsPage {
  notifications: NotificationData[];
  nextCursor: string | null;
}
```

### 1.3 데이터베이스 조회
```typescript
const notifications = await prisma.notification.findMany({
  where: {
    recipientId: user.id,
  },
  include: notificationsInclude,
  orderBy: { createdAt: "desc" },
  take: pageSize + 1,
  cursor: cursor ? { id: cursor } : undefined,
});

const nextCursor = notifications.length > pageSize ? notifications[pageSize].id : null;

const data: NotificationsPage = {
  notifications: notifications.slice(0, pageSize),
  nextCursor,
};
```

### 1.4 권한 검증
```typescript
const { user } = await validateRequest();
if (!user) {
  return Response.json({ error: "Unauthorized" }, { status: 401 });
}
```

### 1.5 에러 처리
```typescript
try {
  // 알림 조회 로직
} catch (error) {
  console.error(error);
  return Response.json({ error: "Internal server error" }, { status: 500 });
}
```

## 2. 알림 삭제 API (/api/notifications)

### 2.1 개요
```typescript
목적:
- 사용자의 모든 알림 삭제
- 알림 초기화
- 읽음 상태 관리
```

### 2.2 요청 구조
```typescript
요청:
DELETE /api/notifications

응답:
200 OK 또는 에러 응답
```

### 2.3 데이터베이스 처리
```typescript
await prisma.notification.deleteMany({
  where: {
    recipientId: user.id,
  },
});
```

### 2.4 권한 검증
```typescript
const { user } = await validateRequest();
if (!user) {
  return Response.json({ error: "Unauthorized" }, { status: 401 });
}
```

### 2.5 에러 처리
```typescript
try {
  // 알림 삭제 로직
} catch (error) {
  console.error(error);
  return Response.json({ error: "Internal server error" }, { status: 500 });
}
```

## 3. 성능 고려사항

### 3.1 데이터베이스 최적화
```typescript
1. 인덱스 활용
   - recipientId에 인덱스
   - createdAt에 인덱스
   - 복합 인덱스 고려

2. 페이지네이션
   - 커서 기반 구현
   - 페이지 크기 제한
   - 효율적인 정렬

3. 쿼리 최적화
   - 필요한 필드만 조회
   - 조인 최소화
   - N+1 문제 방지
```

### 3.2 캐싱 전략
```typescript
1. 응답 캐싱
   - 짧은 TTL 설정
   - 상태 변경 시 무효화
   - 부분 캐싱

2. 데이터베이스 캐싱
   - 읽기 전용 복제본
   - 결과셋 캐싱
   - 쿼리 캐싱

3. 클라이언트 캐싱
   - 상태 관리
   - 낙관적 업데이트
   - 실시간 동기화
```

### 3.3 실시간 처리
```typescript
1. 이벤트 처리
   - 비동기 처리
   - 대기열 사용
   - 재시도 로직

2. 동시성 제어
   - 락 사용
   - 버전 관리
   - 충돌 해결

3. 확장성
   - 수평적 확장
   - 샤딩 고려
   - 부하 분산
