import { validateRequest } from '@/auth';
import prisma from '@/lib/prisma';
import { NextRequest, NextResponse } from "next/server";

export async function GET(req: NextRequest) {
  try {
    const postId = req.nextUrl.pathname.split('/')[3];
    const { user: loggedInUser } = await validateRequest();

    if (!loggedInUser) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const post = await prisma.post.findUnique({
      where: { id: postId },
      select: {
        likes: {
          where: {
            userId: loggedInUser.id,
          },
          select: {
            userId: true,
          },
        },
        _count: {
          select: {
            likes: true,
          },
        },
      },
    });

    if (!post) {
      return NextResponse.json({ error: "Post not found" }, { status: 404 });
    }

    return NextResponse.json({
      likes: post._count.likes,
      isLikedByUser: !!post.likes.length,
    });
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const postId = req.nextUrl.pathname.split('/')[3];
    const { user: loggedInUser } = await validateRequest();

    if (!loggedInUser) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const post = await prisma.post.findUnique({
      where: { id: postId },
      select: {
        userId: true,
      },
    });

    if (!post) {
      return NextResponse.json({ error: "Post not found" }, { status: 404 });
    }

    // 트랜잭션으로 처리
    const result = await prisma.$transaction(async (tx) => {
      // 좋아요 생성
      await tx.like.upsert({
        where: {
          userId_postId: {
            userId: loggedInUser.id,
            postId,
          },
        },
        create: {
          userId: loggedInUser.id,
          postId,
        },
        update: {},
      });

      // 알림 생성 (자신의 게시물이 아닐 경우에만)
      if (loggedInUser.id !== post.userId) {
        await tx.notification.create({
          data: {
            issuerId: loggedInUser.id,
            recipientId: post.userId,
            postId,
            type: "LIKE",
          },
        });
      }

      // 업데이트된 좋아요 상태 조회
      const updatedPost = await tx.post.findUnique({
        where: { id: postId },
        select: {
          likes: {
            where: {
              userId: loggedInUser.id,
            },
            select: {
              userId: true,
            },
          },
          _count: {
            select: {
              likes: true,
            },
          },
        },
      });

      return updatedPost;
    });

    // 응답 반환
    return NextResponse.json({
      likes: result?._count.likes || 0,
      isLikedByUser: true,
    });

  } catch (error) {
    console.error('Like creation error:', error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

export async function DELETE(req: NextRequest) {
  try {
    const postId = req.nextUrl.pathname.split('/')[3];
    const { user: loggedInUser } = await validateRequest();

    if (!loggedInUser) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const post = await prisma.post.findUnique({
      where: { id: postId },
      select: {
        userId: true,
      },
    });

    if (!post) {
      return NextResponse.json({ error: "Post not found" }, { status: 404 });
    }

    // 트랜잭션으로 처리
    const result = await prisma.$transaction(async (tx) => {
      // 좋아요 삭제
      await tx.like.deleteMany({
        where: {
          userId: loggedInUser.id,
          postId,
        },
      });

      // 관련 알림 삭제
      await tx.notification.deleteMany({
        where: {
          issuerId: loggedInUser.id,
          recipientId: post.userId,
          postId,
          type: "LIKE",
        },
      });

      // 업데이트된 좋아요 상태 조회
      const updatedPost = await tx.post.findUnique({
        where: { id: postId },
        select: {
          _count: {
            select: {
              likes: true,
            },
          },
        },
      });

      return updatedPost;
    });

    // 응답 반환
    return NextResponse.json({
      likes: result?._count.likes || 0,
      isLikedByUser: false,
    });

  } catch (error) {
    console.error('Like deletion error:', error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}