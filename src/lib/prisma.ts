import { PrismaClient } from '@prisma/client';

// 기본 Prisma 클라이언트만 유지
// DB 작업 로깅은 API 라우트에서 activity-logger를 통해 처리
const prismaClientSingleton = () => {
  return new PrismaClient({
    log: process.env.NODE_ENV === 'development' 
      ? ['error', 'warn']  // 개발 환경에서는 에러와 경고만 로깅
      : ['error']          // 프로덕션에서는 에러만 로깅
  });
};

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined
};

const prisma = globalForPrisma.prisma ?? prismaClientSingleton();

if (process.env.NODE_ENV !== 'production') globalForPrisma.prisma = prisma;

export default prisma;
