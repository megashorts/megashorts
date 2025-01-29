import { validateRequest } from '@/auth';
import prisma from "@/lib/prisma";
import { postSchema } from "@/lib/validation";


export async function PUT(
  request: Request,
  { params }: { params: { postId: string } }
) {
  try {
    const { user } = await validateRequest();
    if (!user) {
      return new Response("Unauthorized", { status: 401 });
    }

    const postId = params.postId;
    const post = await prisma.post.findUnique({
      where: { id: postId },
      include: { videos: true }
    });

    if (!post) {
      return new Response("Post not found", { status: 404 });
    }

    if (post.userId !== user.id) {
      return new Response("Forbidden", { status: 403 });
    }

    const data = await request.json();
    const validatedData = postSchema.parse(data);

    const updatedPost = await prisma.$transaction(async (tx) => {
      // 기존 비디오 삭제
      await tx.video.deleteMany({
        where: { postId: postId }
      });

      // 포스트 업데이트
      const post = await tx.post.update({
        where: { id: postId },
        data: {
          title: validatedData.title,
          titleOriginal: validatedData.titleOriginal,
          content: validatedData.content,
          thumbnailId: validatedData.thumbnailId,
          status: validatedData.status,
          categories: validatedData.categories,
          ageLimit: validatedData.ageLimit,
          featured: validatedData.featured,
          priority: validatedData.priority,
          postLanguage: validatedData.postLanguage,
          videoCount: validatedData.videos?.length || 0,
          updatedAt: new Date(),
          publishedAt: validatedData.status === 'PUBLISHED' ? new Date() : null,
        },
        include: {
          videos: true
        }
      });

      // 새 비디오 생성
      if (validatedData.videos && validatedData.videos.length > 0) {
        await Promise.all(
          validatedData.videos.map((video) =>
            tx.video.create({
              data: {
                postId: post.id,
                filename: video.filename,
                sequence: video.sequence,
                isPremium: video.isPremium,
                subtitle: video.subtitle || []  // Language[] 배열만 유지
              },
            })
          )
        );
      }

      return post;
    });

    return Response.json(updatedPost);
  } catch (error) {
    console.error("Error updating post:", error);
    return new Response(
      error instanceof Error ? error.message : "Failed to update post",
      { status: 500 }
    );
  }
}