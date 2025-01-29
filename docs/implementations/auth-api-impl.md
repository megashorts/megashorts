# 인증 시스템 상세 구현

구현 파일:
- src/auth.ts
- src/components/SessionProvider.tsx
- src/app/api/auth/callback/google/route.ts
- src/app/api/auth/signout/route.ts

## 1. 인증 설정

### 1.1 개요
```typescript
목적:
- 사용자 인증 관리
- 세션 처리
- OAuth 연동

특징:
- Lucia 인증 라이브러리
- Prisma 어댑터
- Google OAuth
```

### 1.2 기본 설정
```typescript
// Prisma 어댑터 설정
const adapter = new PrismaAdapter(prisma.session, prisma.user);

// Lucia 인스턴스 생성
export const lucia = new Lucia(adapter, {
  sessionCookie: {
    expires: false,
    attributes: {
      secure: process.env.NODE_ENV === "production",
    },
  },
  getUserAttributes(databaseUserAttributes) {
    return {
      id: databaseUserAttributes.id,
      username: databaseUserAttributes.username,
      displayName: databaseUserAttributes.displayName,
      avatarUrl: databaseUserAttributes.avatarUrl,
      googleId: databaseUserAttributes.googleId,
    };
  },
});
```

### 1.3 타입 정의
```typescript
// Lucia 타입 확장
declare module "lucia" {
  interface Register {
    Lucia: typeof lucia;
    DatabaseUserAttributes: DatabaseUserAttributes;
  }
}

// 사용자 속성 정의
interface DatabaseUserAttributes {
  id: string;
  username: string;
  displayName: string;
  avatarUrl: string | null;
  googleId: string | null;
}
```

## 2. OAuth 설정

### 2.1 Google OAuth
```typescript
export const google = new Google(
  process.env.GOOGLE_CLIENT_ID!,
  process.env.GOOGLE_CLIENT_SECRET!,
  `${process.env.NEXT_PUBLIC_BASE_URL}/api/auth/callback/google`,
);
```

## 3. 세션 관리

### 3.1 요청 검증
```typescript
export const validateRequest = cache(
  async (): Promise<
    { user: User; session: Session } | { user: null; session: null }
  > => {
    // 세션 쿠키 조회
    const cookieStore = await cookies();
    const sessionId = cookieStore.get(lucia.sessionCookieName)?.value ?? null;

    if (!sessionId) {
      return {
        user: null,
        session: null,
      };
    }

    // 세션 검증
    const result = await lucia.validateSession(sessionId);

    // 세션 쿠키 갱신
    try {
      if (result.session && result.session.fresh) {
        const sessionCookie = lucia.createSessionCookie(result.session.id);
        cookieStore.set(
          sessionCookie.name,
          sessionCookie.value,
          sessionCookie.attributes,
        );
      }
      if (!result.session) {
        const sessionCookie = lucia.createBlankSessionCookie();
        cookieStore.set(
          sessionCookie.name,
          sessionCookie.value,
          sessionCookie.attributes,
        );
      }
    } catch {}

    return result;
  },
);
```

## 4. 성능 최적화

### 4.1 캐싱
```typescript
1. 요청 검증
   - cache 데코레이터 사용
   - 중복 검증 방지
   - 성능 향상

2. 세션 관리
   - 세션 재사용
   - 쿠키 최적화
   - 메모리 관리
```

### 4.2 보안
```typescript
1. 세션 보안
   - 안전한 쿠키 설정
   - HTTPS 강제
   - 세션 만료 관리

2. OAuth 보안
   - 상태 검증
   - CSRF 방지
   - 리다이렉트 검증
```

## 5. 에러 처리

### 5.1 세션 에러
```typescript
1. 세션 만료
   - 자동 갱신
   - 사용자 재인증
   - 상태 복구

2. 인증 실패
   - 에러 로깅
   - 사용자 피드백
   - 복구 전략
```

### 5.2 OAuth 에러
```typescript
1. 인증 실패
   - 에러 처리
   - 재시도 로직
   - 사용자 안내

2. 상태 관리
   - 세션 정리
   - 토큰 관리
   - 상태 동기화
```

## 6. 보안 고려사항

### 6.1 인증 보안
```typescript
1. 세션 관리
   - 안전한 저장
   - 적절한 만료
   - 무효화 처리

2. 토큰 보안
   - 안전한 저장
   - 적절한 범위
   - 주기적 갱신
```

### 6.2 데이터 보안
```typescript
1. 사용자 데이터
   - 필드 필터링
   - 접근 제어
   - 암호화

2. OAuth 데이터
   - 토큰 암호화
   - 범위 제한
   - 안전한 저장
