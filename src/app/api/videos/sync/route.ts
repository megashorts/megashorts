// 사용자가 로그인할 때 서버의 시청 기록을 IndexedDB로 동기화하는 API. 브라우저에 데이터가 없으면 서버 데이터로 생성
// 브라우저 데이터와 서버 데이터가 다르면 서버 데이터로 업데이트

import { validateRequest } from '@/auth';
import prisma from '@/lib/prisma';

export async function GET(req: Request) {
  try {
    const { user } = await validateRequest();
    if (!user) {
      return Response.json({ error: "Unauthorized" }, { status: 401 });
    }

    // 시청한 유료 동영상 목록 조회
    const watchedVideos = await prisma.videoView.findMany({
      where: {
        userId: user.id,
      },
      select: {
        videoId: true
      }
    });

    // 포스트별 마지막 시청 정보 조회
    const lastViews = await prisma.userVideoProgress.findMany({
      where: {
        userId: user.id
      },
      select: {
        postId: true,
        lastVideoSequence: true
      }
    });

    console.log('Sync response:', {  // 디버깅 로그 추가
      watchedVideos: watchedVideos.length,
      lastViews: lastViews.map(v => ({
        postId: v.postId,
        sequence: v.lastVideoSequence
      }))
    });

    return Response.json({
      watchedVideos,
      lastViews: lastViews.map(view => ({
        postId: view.postId,
        sequence: view.lastVideoSequence,
        timestamp: 0  // 브라우저에서만 관리
      }))
    });
  } catch (error) {
    console.error('Sync error:', error);
    return Response.json({ error: "Internal error" }, { status: 500 });
  }
}
