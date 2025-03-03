import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";

export async function POST(
  request: NextRequest,
  context: { params: { id: string } }
) {
  const { id } = await context.params;
  const { content, respondedBy, isUserResponse } = await request.json();

  if (!content) {
    return new NextResponse("Content is required", { status: 400 });
  }

  const inquiry = await prisma.inquiry.findUnique({
    where: { id },
    include: {
      user: {
        select: {
          id: true,
          username: true,
          displayName: true,
        },
      },
    },
  });

  if (!inquiry) {
    return new NextResponse("Inquiry not found", { status: 404 });
  }

  let messages = [];
  if (inquiry.adminResponse) {
    try {
      messages = JSON.parse(inquiry.adminResponse);
    } catch (e) {
      if (inquiry.adminResponse) {
        messages = [{
          content: inquiry.adminResponse,
          createdAt: (inquiry.respondedAt || inquiry.createdAt).toISOString(),
          respondedBy: inquiry.respondedBy || null,
          isAdmin: true,  // 관리자 응답
        }];
      }
    }
  }

  // Add new message
  const newMessage = {
    content,
    createdAt: new Date().toISOString(),
    respondedBy: respondedBy || null,
    isAdmin: !!respondedBy,  // respondedBy가 있으면 관리자 메시지
  };
  messages.push(newMessage);

  const updatedInquiry = await prisma.inquiry.update({
    where: { id },
    data: {
      adminResponse: JSON.stringify(messages),
      // 사용자의 추가 문의인 경우 상태만 PENDING으로 변경
      ...(isUserResponse ? {
        status: "PENDING"
      } : {
        status: "IN_PROGRESS",
        respondedBy,
        respondedAt: new Date()
      })
    },
    include: {
      user: {
        select: {
          id: true,
          username: true,
          displayName: true,
        },
      },
    },
  });

  if (!isUserResponse && respondedBy) {  // respondedBy가 있을 때만 알림 생성
    try {
      await prisma.notification.create({
        data: {
          recipientId: inquiry.userId, // 문의자 ID 사용
          issuerId: inquiry.userId,
          type: 'COMMENT',
          metadata: {
            reason: `문의응답이 등록되었습니다.`,
            inquiryId: inquiry.id,
            title: inquiry.title,
            type: inquiry.type,
            respondedBy  // 응답자 이름을 메타데이터에 포함
          }
        }
      });
    } catch (error) {
      console.error('Failed to create notification:', error);
      // 알림 생성 실패해도 응답은 계속 진행
    }
  }

  // data: {
  //   type: "POST",
  //   recipientId: inquiry.userId, // 문의자 ID 사용
  //   issuerId: inquiry.userId,  // 임시로 문의자 ID 사용
  //   metadata: {
  //     inquiryId: inquiry.id,
  //     title: inquiry.title,
  //     type: inquiry.type,
  //     respondedBy  // 응답자 이름을 메타데이터에 포함
  //   }

  return NextResponse.json(updatedInquiry);
}