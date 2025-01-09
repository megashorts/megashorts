import { validateRequest } from '@/auth';
import prisma from '@/lib/prisma';
import { AccessMethod } from '@prisma/client';

export async function POST(
  request: Request,
  { params }: { params: { videoId: string } }
) {
  try {
    const { user } = await validateRequest();
    if (!user) {
      return new Response("Unauthorized", { status: 401 });
    }

    const videoId = params.videoId;

    // 비디오가 존재하는지 확인
    const video = await prisma.video.findUnique({
      where: { id: videoId }
    });

    if (!video) {
      return new Response("Video not found", { status: 404 });
    }

    // 이미 구매했는지 확인
    const existingView = await prisma.videoView.findUnique({
      where: {
        userId_videoId: {
          userId: user.id,
          videoId: videoId
        }
      }
    });

    if (existingView?.accessMethod === AccessMethod.POINT_PAYMENT) {
      return new Response("Already purchased", { status: 400 });
    }

    // 트랜잭션으로 코인 차감과 시청 기록 생성
    const result = await prisma.$transaction(async (tx) => {
      // 사용자의 현재 코인 수 확인
      const currentUser = await tx.user.findUnique({
        where: { id: user.id },
        select: { mscoin: true }
      });

      if (!currentUser || currentUser.mscoin < 2) {
        throw new Error("Insufficient coins");
      }

      // 코인 차감
      const updatedUser = await tx.user.update({
        where: { id: user.id },
        data: { mscoin: { decrement: 2 } }
      });

      // 시청 기록 생성 또는 업데이트
      const videoView = await tx.videoView.upsert({
        where: {
          userId_videoId: {
            userId: user.id,
            videoId: videoId
          }
        },
        create: {
          userId: user.id,
          videoId: videoId,
          accessMethod: AccessMethod.POINT_PAYMENT,
          lastTimestamp: 0
        },
        update: {
          accessMethod: AccessMethod.POINT_PAYMENT
        }
      });

      // 알림 생성
      await tx.notification.create({
        data: {
          type: 'COIN',
          recipientId: user.id,
          issuerId: user.id,
          metadata: {
            amount: 2,
            action: 'video_purchase',
            videoId: videoId
          }
        }
      });

      return {
        videoView,
        remainingCoins: updatedUser.mscoin
      };
    });

    return Response.json(result);
  } catch (error) {
    console.error('Error purchasing video access:', error);
    
    if (error instanceof Error && error.message === "Insufficient coins") {
      return new Response("Insufficient coins", { status: 400 });
    }

    return new Response(
      error instanceof Error ? error.message : "Internal server error",
      { status: 500 }
    );
  }
}