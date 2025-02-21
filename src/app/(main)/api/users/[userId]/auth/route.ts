// 클라이언트의 성인인증(adultauth)과 구독상태(subscriptionEndDate) 확인에 사용. 비디오 시청 권한 체크에 필수적인 API

import { validateRequest } from '@/auth';
import prisma from '@/lib/prisma';
import { unstable_cache } from 'next/cache';

// 사용자 인증 데이터 캐시 함수
const getUserAuth = unstable_cache(
  async (userId: string) => {
    const userData = await prisma.user.findUnique({
      where: { id: userId },
      select: {
        adultauth: true,
        subscriptionEndDate: true
      }
    });
    return userData;
  },
  ['user-auth'],
  {
    revalidate: 60 * 60 * 12,  // 12시간 캐시
    tags: ['user-auth']
  }
);

export async function GET(
  req: Request,
  { params }: { params: { userId: string } }
) {
  try {
    const { userId } = await params;  // await 추가
    const { user } = await validateRequest();
    
    if (!user || user.id !== userId) {
      return Response.json({ error: "Unauthorized" }, { status: 401 });
    }

    const userData = await prisma.user.findUnique({
      where: { id: userId },
      select: {
        adultauth: true,
        subscriptionEndDate: true
      }
    });

    if (!userData) {
      return Response.json({ error: "User not found" }, { status: 404 });
    }

    return Response.json(userData);
  } catch (error) {
    console.error('Auth data fetch error:', error);
    return Response.json({ error: "Internal error" }, { status: 500 });
  }
}