// 클라이언트의 성인인증(adultauth)과 구독상태(subscriptionEndDate) 확인에 사용. 비디오 시청 권한 체크에 필수적인 API인 src/app/api/users/[userId]/auth/route.ts

import { validateRequest } from '@/auth';
import prisma from '@/lib/prisma';
import { unstable_cache } from 'next/cache';

// 사용자 인증 데이터 캐시 함수
const getUserAuth = (userId: string) => unstable_cache(
  async () => {
    const userData = await prisma.user.findUnique({
      where: { id: userId },
      select: {
        referredBy: true,
        teamMaster: true,
        adultauth: true,
        mscoin: true,
        subscription: {
          select: {
            currentPeriodEnd: true
          }
        },
        videoViews: {
          where: {
            accessMethod: 'COIN'
          },
          select: {
            videoId: true
          }
        }
      }
    });

    if (!userData) return null;

    return {
      ...userData,
      purchasedVideoIds: userData.videoViews.map(v => v.videoId),
      videoViews: undefined // omit the raw array
    };
  },
  ['user-auth', userId],
  {
    revalidate: 60 * 60 * 12,  // 12시간 캐시
    tags: ['user-auth', `user-auth-${userId}`]
  }
)();

export async function GET(
  req: Request,
  { params }: { params: Promise<{ userId: string }> } // Next.js 15 requires params to be Promise
) {
  try {
    const { userId } = await params;
    const { user } = await validateRequest();
    
    if (!user || user.id !== userId) {
      return Response.json({ error: "Unauthorized" }, { status: 401 });
    }

    const userData = await getUserAuth(userId);

    if (!userData) {
      return Response.json({ error: "User not found" }, { status: 404 });
    }

    return Response.json(userData);
  } catch (error) {
    console.error('Auth data fetch error:', error);
    return Response.json({ error: "Internal error" }, { status: 500 });
  }
}