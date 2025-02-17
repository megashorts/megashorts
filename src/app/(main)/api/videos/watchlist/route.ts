import { validateRequest } from '@/auth';
import prisma from '@/lib/prisma';

export async function POST(req: Request) {
  try {
    const { user } = await validateRequest();
    if (!user) {
      return Response.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { postIds, cursor } = await req.json();
    
    if (!Array.isArray(postIds)) {
      return Response.json({ error: "Invalid postIds" }, { status: 400 });
    }

    console.log('Watchlist request:', { postIds, cursor });
    const limit = 20;

    // 시청 중인 포스트 조회 (브라우저에서 제공한 videoIds 기반)
    const posts = await prisma.post.findMany({
      where: {
        id: { in: postIds }
      },
      include: {
        user: true,
        videos: {
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
    console.error('Watchlist error:', error);
    return Response.json({ error: "Internal error" }, { status: 500 });
  }
}
