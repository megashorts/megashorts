import { validateRequest } from '@/auth';
import prisma from '@/lib/prisma';
import { AccessMethod } from '@prisma/client';

export async function GET(
  request: Request,
  { params }: { params: { videoId: string } }
) {
  try {
    const { user } = await validateRequest();
    if (!user) {
      return new Response("Unauthorized", { status: 401 });
    }

    const videoId = params.videoId;

    // 비디오 시청 기록 확인
    const videoView = await prisma.videoView.findUnique({
      where: {
        userId_videoId: {
          userId: user.id,
          videoId: videoId
        }
      }
    });

    // 코인으로 구매한 기록이 있으면 true 반환
    const hasPurchased = videoView?.accessMethod === AccessMethod.POINT_PAYMENT;

    return Response.json({ hasPurchased });
  } catch (error) {
    console.error('Error checking video access:', error);
    return new Response(
      error instanceof Error ? error.message : "Internal server error",
      { status: 500 }
    );
  }
}

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
      await tx.user.update({
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

      return videoView;
    });

    return Response.json(result);
  } catch (error) {
    console.error('Error purchasing video access:', error);
    return new Response(
      error instanceof Error ? error.message : "Internal server error",
      { status: 500 }
    );
  }
}