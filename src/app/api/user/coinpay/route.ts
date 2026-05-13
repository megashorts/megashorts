

// 중복 기록외 정상작동 버젼
import { validateRequest } from '@/auth';
import prisma from '@/lib/prisma';
import { uuidv7 } from 'uuidv7';

export async function POST(req: Request) {
  try {
    const { user } = await validateRequest();
    if (!user) {
      return new Response(
        JSON.stringify({ success: false, error: "Unauthorized" }), 
        { status: 401, headers: { 'Content-Type': 'application/json' } }
      );
    }

    // const { videoId } = await req.json();
    const { videoId, postId, uploaderId } = await req.json();
    console.log('Coin payment request:', { userId: user.id, videoId, postId, uploaderId });
    if (!videoId || !postId || !uploaderId) {
      return new Response(
        JSON.stringify({ success: false, error: "Missing post or uploader or VideoId info" }), 
        { status: 400, headers: { 'Content-Type': 'application/json' } }
      );
    }

    // 트랜잭션 시작
    const result = await prisma.$transaction(async (tx) => {
      // 1. 락을 걸고 시청 기록 확인
      const existingView = await tx.videoView.findFirst({
        where: {
          userId: user.id,
          videoId,
          accessMethod: 'COIN'
        },
        select: {
          id: true,
          viewCount: true
        },
        orderBy: {
          createdAt: 'desc'
        }
      });

      // 2. 시청 기록이 있는 경우
      if (existingView) {
        // 조회수만 업데이트
        await tx.videoView.update({
          where: { id: existingView.id },
          data: {
            viewCount: existingView.viewCount + 1,
            createdAt: new Date()
          }
        });

        console.log('Updated existing view:', {
          userId: user.id,
          videoId,
          newViewCount: existingView.viewCount + 1
        });

        return {
          type: 'EXISTING_VIEW',
          success: true,
          alreadyPurchased: true
        };
      }

      // 3. 새로운 시청인 경우: 코인 잔액 확인
      const currentUser = await tx.user.findUnique({
        where: { id: user.id },
        select: { 
          mscoin: true, 
          referredBy: true,
          teamMaster: true,
        }
      });

      if (!currentUser || currentUser.mscoin < 2) {
        return {
          type: 'INSUFFICIENT_COINS',
          success: false,
          error: 'Insufficient coins'
        };
      }

      // 4. 코인 차감
      const updatedUser = await tx.user.update({
        where: { id: user.id },
        data: {
          mscoin: {
            decrement: 2
          }
        }
      });

      console.log('Coins deducted:', {
        userId: user.id,
        deducted: 2,
        remainingCoins: updatedUser.mscoin
      });

      // 5. 새 시청 기록 생성
      const newView = await tx.videoView.create({
        // data: {
        //   id: uuidv7(),
        //   userId: user.id,
        //   videoId,
        //   accessMethod: 'COIN',
        //   viewCount: 1,
        //   createdAt: new Date()
        // }

        data: {
          id: uuidv7(),
          userId: user.id,
          videoId,
          accessMethod: 'COIN',
          viewCount: 1,
          postId: postId,
          uploaderId: uploaderId,
          referredBy: currentUser.referredBy,
          teamMaster: currentUser.teamMaster,
          createdAt: new Date()
        }

      });

      console.log('Created new view record:', {
        userId: user.id,
        videoId,
        viewId: newView.id
      });

      return {
        type: 'NEW_VIEW',
        success: true,
        remainingCoins: updatedUser.mscoin
      };
    });

    return new Response(
      JSON.stringify(result),
      { status: 200, headers: { 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Coin payment error:', error);
    return new Response(
      JSON.stringify({
        success: false,
        error: error instanceof Error ? error.message : "Internal error"
      }),
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    );
  }
}

