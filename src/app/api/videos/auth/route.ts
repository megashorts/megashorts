import { NextResponse } from 'next/server';
import { validateRequest } from '@/auth';
import prisma from '@/lib/prisma';

export async function POST(req: Request) {
  try {
    const { user } = await validateRequest();
    const { videoId } = await req.json();

    const video = await prisma.video.findUnique({
      where: { id: videoId },
      include: {
        post: true,
      },
    });

    if (!video) {
      return NextResponse.json({ error: 'Video not found' }, { status: 404 });
    }

    // 비로그인 사용자는 무료 영상만 시청 가능
    if (!user) {
      return NextResponse.json({
        canWatch: !video.isPremium,
        reason: video.isPremium ? 'login_required' : 'free'
      });
    }

    // 이미 구매한 영상인지 확인
    const existingView = await prisma.videoView.findUnique({
      where: {
        userId_videoId: {
          userId: user.id,
          videoId: video.id,
        },
      },
    });

    if (existingView) {
      return NextResponse.json({ canWatch: true, reason: 'already_purchased' });
    }

    // 구독 상태 확인
    const userWithSubscription = await prisma.user.findUnique({
      where: { id: user.id },
      include: {
        subscription: true,
      },
    });

    if (userWithSubscription?.subscription?.status === 'active') {
      return NextResponse.json({ canWatch: true, reason: 'subscription' });
    }

    // 프리미엄 영상이고 구독 중이 아닌 경우
    if (video.isPremium) {
      if (userWithSubscription && userWithSubscription.mscoin >= 2) {
        // 코인 차감
        await prisma.user.update({
          where: { id: user.id },
          data: { mscoin: userWithSubscription.mscoin - 2 },
        });

        // 시청 기록 생성
        await prisma.videoView.create({
          data: {
            userId: user.id,
            videoId: video.id,
            accessMethod: 'POINT_PAYMENT',
          },
        });

        return NextResponse.json({ 
          canWatch: true, 
          reason: 'coin_payment',
          remainingCoins: userWithSubscription.mscoin - 2
        });
      } else {
        return NextResponse.json({
          canWatch: false,
          reason: 'insufficient_coins',
        });
      }
    }

    return NextResponse.json({ canWatch: true, reason: 'free' });
  } catch (error) {
    console.error('Error checking video auth:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}