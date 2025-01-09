import { NextResponse } from 'next/server';
import { validateRequest } from '@/auth';
import prisma from '../../../../lib/prisma';

export async function GET() {
  try {
    const { user } = await validateRequest();

    // 무료 비디오가 있는 포스트를 가져옵니다
    const posts = await prisma.post.findMany({
      where: {
        videos: {
          some: {
            isPremium: false,
            // 로그인한 사용자의 경우 시청하지 않은 비디오가 있는 포스트만 가져옵니다
            ...(user ? {
              views: {
                none: {
                  userId: user.id,
                },
              },
            } : {}),
          },
        },
      },
      orderBy: [
        // 관리자가 지정한 포스트 번호순으로 정렬
        { postNum: 'asc' },
        // 생성일 순으로 정렬
        { createdAt: 'desc' },
      ],
      include: {
        videos: {
          where: {
            isPremium: false,
          },
          orderBy: {
            sequence: 'asc',
          },
          include: {
            views: true,
          },
        },
      },
    });

    return NextResponse.json(posts);
  } catch (error) {
    console.error('Failed to fetch recommended posts:', error);
    return NextResponse.json(
      { error: 'Failed to fetch recommended posts' },
      { status: 500 }
    );
  }
}
