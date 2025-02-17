import { validateRequest } from '@/auth';
import prisma from '@/lib/prisma';

export async function GET(req: Request) {
  try {
    const { user } = await validateRequest();
    if (!user) {
      return Response.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const cursor = searchParams.get('cursor');
    const limit = 20;

    // 시청 중인 포스트 조회 (2화 이상 본 포스트만)
    const posts = await prisma.post.findMany({
      where: {
        videos: {
          some: {
            AND: [
              { sequence: { gt: 1 } },  // 2화 이상인 영상이 있는 포스트
              {
                views: {
                  some: {
                    userId: user.id
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

    return Response.json({
      posts,
      nextCursor,
    });
  } catch (error) {
    console.error('Watching error:', error);
    return Response.json({ error: "Internal error" }, { status: 500 });
  }
}
