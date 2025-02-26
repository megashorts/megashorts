import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { InquiryStatus } from "@prisma/client";

export async function PATCH(
  request: NextRequest,
  context: { params: { id: string } }
) {
  const { id } = await context.params;
  const { status, respondedBy } = await request.json();

  if (!status || !Object.values(InquiryStatus).includes(status)) {
    return new NextResponse("Invalid status", { status: 400 });
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

  // Parse existing messages
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
        }];
      }
    }
  }

  // Add status change message
  if (status !== inquiry.status) {
    const newMessage = {
      content: `상태가 ${
        status === 'PENDING' ? '대기중' :
        status === 'IN_PROGRESS' ? '진행중' :
        '완료'
      }으로 변경되었습니다.`,
      createdAt: new Date().toISOString(),
      respondedBy: respondedBy || null,
      isSystem: true,
    };
    messages.push(newMessage);
  }

  const updatedInquiry = await prisma.inquiry.update({
    where: { id },
    data: {
      status,
      adminResponse: JSON.stringify(messages),
      // 관리자가 상태를 변경할 때만 respondedBy 업데이트
      ...(respondedBy && { respondedBy }),
      ...(status === "IN_PROGRESS" && !inquiry.respondedAt && {
        respondedAt: new Date(),
      }),
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

  return NextResponse.json({
    ...updatedInquiry,
    messages,
  });
}
