import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { InquiryStatus, InquiryType } from "@prisma/client";
import { validateRequest } from "@/auth";

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;
  const status = searchParams.get("status") as InquiryStatus | null;
  const date = searchParams.get("date");
  const startDate = searchParams.get("startDate");
  const endDate = searchParams.get("endDate");
  const username = searchParams.get("username");
  const page = parseInt(searchParams.get("page") || "1");
  const limit = parseInt(searchParams.get("limit") || "10");

  const where = {
    ...(status && { status }),
    ...(startDate && endDate && { 
      createdAt: {
        gte: new Date(startDate),
        lte: new Date(new Date(endDate).setHours(23, 59, 59, 999)),
      }
    }),
    ...(date && !startDate && !endDate && { 
      createdAt: {
        gte: new Date(new Date(date).setHours(0, 0, 0, 0)),
        lt: new Date(new Date(date).setHours(24, 0, 0, 0)),
      }
    }),
    ...(username && {
      user: {
        username: {
          contains: username,
          mode: "insensitive" as const,
        },
      },
    }),
  };

  const [inquiries, total] = await Promise.all([
    prisma.inquiry.findMany({
      where,
      take: limit,
      skip: (page - 1) * limit,
      orderBy: {
        createdAt: "desc",
      },
      include: {
        user: {
          select: {
            id: true,
            username: true,
            displayName: true,
          },
        },
        post: {  // post 정보 추가
          select: {
            title: true,
          },
        },
      },
    }),
    prisma.inquiry.count({ where }),
  ]);

  // Parse messages for each inquiry
  const inquiriesWithMessages = inquiries.map(inquiry => {
    let messages = [];
    if (inquiry.adminResponse) {
      try {
        messages = JSON.parse(inquiry.adminResponse);
      } catch (e) {
        if (inquiry.adminResponse) {
          messages = [{
            content: inquiry.adminResponse,
            createdAt: (inquiry.respondedAt || inquiry.createdAt).toISOString(),
            respondedBy: inquiry.respondedBy,
          }];
        }
      }
    }

    return {
      ...inquiry,
      messages,
      postTitle: inquiry.post?.title,
    };
  });

  return NextResponse.json({
    inquiries: inquiriesWithMessages,
    total,
    totalPages: Math.ceil(total / limit),
    currentPage: page,
  });
}

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

    // 관리자들에게 알림 생성
    const admins = await prisma.user.findMany({
      where: {
        userRole: {
          gte: 60, // gte(크거나 같음)와 lte(작거나 같음)
          lte: 80  
        }
      }
    });

    await Promise.all(admins.map(admin => 
      prisma.notification.create({
        data: {
          recipientId: admin.id,
          issuerId: user.id,
          type: 'COMMENT',
          metadata: {
            reason: '회원문의가 등록되었습니다'
          }
        }
      })
    ));

    return Response.json(inquiry);
  } catch (error) {
    console.error("Failed to create inquiry:", error);
    return Response.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}