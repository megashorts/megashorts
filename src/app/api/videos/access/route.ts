import { NextRequest } from "next/server";
import { validateRequest } from '@/auth';
import prisma from "@/lib/prisma";

export async function GET(
  request: NextRequest,
  { params }: { params: { videoId: string } }
) {
  const { user } = await validateRequest();
  if (!user) {
    return Response.json({ hasPurchased: false }, { status: 401 });
  }

  // 시청 권한과 구독 정보를 한 번에 조회
  const [videoView, subscription] = await Promise.all([
    prisma.videoView.findUnique({
      where: {
        userId_videoId: {
          userId: user.id,
          videoId: params.videoId,
        }
      },
    }),
    prisma.subscription.findUnique({
      where: { userId: user.id },
      select: {
        status: true,
        currentPeriodEnd: true,
      },
    })
  ]);

  // 구독 상태 확인
  const hasActiveSubscription = subscription?.status === 'active' && 
    new Date(subscription.currentPeriodEnd) > new Date();

  return Response.json({
    hasPurchased: !!videoView,
    hasSubscription: hasActiveSubscription,
  });
}