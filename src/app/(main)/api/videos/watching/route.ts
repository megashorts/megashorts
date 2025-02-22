import { validateRequest } from '@/auth';
import prisma from '@/lib/prisma';

export async function GET(req: Request) {
  try {
    const { user } = await validateRequest();
    if (!user) {
      return Response.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const ids = searchParams.get('ids')?.split(',');

    if (!ids?.length) {
      return Response.json({ posts: [], nextCursor: null });
    }

    // videos 정보 추가
    const posts = await prisma.post.findMany({
      where: {
        id: { in: ids }
      },
      include: {
        user: true,
        videos: true,  // 비디오 정보 추가
        bookmarks: {
          where: { userId: user.id }
        },
        likes: {
          where: { userId: user.id }
        },
        _count: {
          select: {
            likes: true,
            comments: true,
            videos: true
          }
        }
      }
    });

    return Response.json({
      posts,
      nextCursor: null
    });
  } catch (error) {
    console.error('Watching error:', error);
    return Response.json({ error: "Internal error" }, { status: 500 });
  }
}
