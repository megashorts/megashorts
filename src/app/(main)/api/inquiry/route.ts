import { validateRequest } from '@/auth';
import prisma from "@/lib/prisma";
import { InquiryType } from "@prisma/client";

export async function POST(req: Request) {
  try {
    const { user } = await validateRequest();
    if (!user) {
      return Response.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { type, title, content, postId, userEmail } = await req.json();

    // 필수 필드 검증
    if (!type || !title || !content || !userEmail) {
      return Response.json(
        { error: "Missing required fields" },
        { status: 400 }
      );
    }

    // postId가 있는 경우 포스트 존재 여부 확인
    if (postId) {
      const post = await prisma.post.findUnique({
        where: { id: postId },
      });
      if (!post) {
        return Response.json(
          { error: "Post not found" },
          { status: 404 }
        );
      }
    }

    // Inquiry 생성
    const inquiry = await prisma.inquiry.create({
      data: {
        type: type as InquiryType,
        title,
        content,
        postId,
        userEmail,
        userId: user.id,
      },
    });

    return Response.json(inquiry);
  } catch (error) {
    console.error("Failed to create inquiry:", error);
    return Response.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}