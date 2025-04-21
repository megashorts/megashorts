import { validateRequest } from '@/auth';
import prisma from '@/lib/prisma';
import { AccessMethod } from '@prisma/client';
import { uuidv7 } from "uuidv7";

export async function POST(req: Request) {
  try {
    const { user } = await validateRequest();
    if (!user) {
      return Response.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { videoId, postId, sequence, timestamp } = await req.json();
    console.log('Request body:', { videoId, postId, sequence, timestamp });

    if (timestamp < 5) {
      return Response.json({ message: "Duration too short" });
    }

    try {
      const post = await prisma.post.findUnique({
        where: { id: postId },
        select: {
          userId: true,
          videos: {
            select: {
              id: true,
              isPremium: true
            }
          }
        }
      });

      if (!post) {
        console.error('Post not found:', postId);
        return Response.json({ error: "Post not found" }, { status: 404 });
      }

      // post.videos 안에서 id가 videoId와 같은 특정 video 객체 하나를 찾아서 video 변수에 담음
      const video = post.videos.find(v => v.id === videoId);

      if (!video) {
        console.error('Video not found:', videoId);
        return Response.json({ error: "Video not found" }, { status: 404 });
      }

      // AccessMethod 타입 명시적 지정
      let accessMethod: AccessMethod = AccessMethod.FREE;
      let viewMessage = "FREE view save";

      // userData 변수를 함수 스코프로 선언 (기본값은 null)
      let userData: any = null;

      if (video.isPremium) {
        const origin = new URL(req.url).origin;
        const response = await fetch(`${origin}/api/users/${user.id}/auth`, {
          headers: {
            cookie: req.headers.get('cookie') || ''
          }
        });

        if (!response.ok) {
          console.error('Auth check failed:', response.status);
          return Response.json({ error: "Auth check failed" }, { status: response.status });
        }

        const userData = await response.json();
        console.log('userData:', userData);

        
        if (!userData.subscriptionEndDate || new Date(userData.subscriptionEndDate) < new Date()) {
          accessMethod = AccessMethod.COIN;
          viewMessage = "COIN view save";
        } else {
          accessMethod = AccessMethod.SUBSCRIPTION;
          viewMessage = "SUBSCRIPTION view save";
        }
      }

      await prisma.$transaction(async (tx) => {
        // 기존 시청 기록 확인
        const existingView = await tx.videoView.findFirst({
          where: {
            userId: user.id,
            videoId: video.id,
            accessMethod
          },
          orderBy: {
            createdAt: 'desc'
          }
        });

        // 기록이 없을 때만 새로 생성
        if (!existingView) {
          await tx.videoView.create({
            data: {
              id: uuidv7(),
              userId: user.id,
              videoId: video.id,
              accessMethod,
              postId: postId,
              uploaderId: post.userId,
              referredBy: userData.referredBy,
              teamMaster: userData.teamMaster,
            }
          });
        }

        console.log('Updating progress:', {
          userId: user.id,
          postId,
          sequence
        });

        // UserVideoProgress 업데이트
        await tx.userVideoProgress.upsert({
          where: {
            userId_postId: {
              userId: user.id,
              postId
            }
          },
          create: {
            userId: user.id,
            postId,
            lastVideoSequence: sequence
          },
          update: {
            lastVideoSequence: sequence
          }
        });
      });

      return Response.json({ message: viewMessage });

    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown database error';
      console.error('Database error:', errorMessage);
      return Response.json({ error: errorMessage }, { status: 500 });
    }
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown server error';
    console.error('Server error:', errorMessage);
    return Response.json({ error: errorMessage }, { status: 500 });
  }
}