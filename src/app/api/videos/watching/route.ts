import { NextResponse } from 'next/server';
import { validateRequest } from '@/auth';
import prisma from '@/lib/prisma';

export async function GET(req: Request) {
  try {
    const { user } = await validateRequest();
    if (!user) {
      return new NextResponse('Unauthorized', { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const cursor = searchParams.get('cursor');
    const limit = 20;

    // 시청 중인 포스트 조회
    const posts = await prisma.post.findMany({
      where: {
        videos: {
          some: {
            AND: [
              { sequence: { not: 1 } },
              {
                views: {
                  some: {
                    userId: user.id,
                    // lastTimestamp: { gt: 0 }
                  }
                }
              }
            ]
          }
        }
      },
      include: {
        user: true,
        videos: {
          where: {
            views: {
              some: {
                userId: user.id
              }
            }
          },
          include: {
            views: {
              where: {
                userId: user.id
              }
            }
          }
        },
        _count: {
          select: {
            likes: true,
            comments: true,
            videos: true
          }
        }
      },
      orderBy: {
        createdAt: 'desc'
      },
      take: limit + 1,
      ...(cursor ? { cursor: { id: cursor }, skip: 1 } : {}),
    });

    let nextCursor: string | null = null;
    if (posts.length > limit) {
      const nextItem = posts.pop();
      nextCursor = nextItem?.id || null;
    }

    return NextResponse.json({
      posts,
      nextCursor,
    });
  } catch (error) {
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}