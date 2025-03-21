import { validateRequest } from '@/auth';
import prisma from "@/lib/prisma";
import { NextRequest, NextResponse } from "next/server";

export async function POST(req: NextRequest) {
  try {
    // 현재 사용자 확인
    const { user } = await validateRequest();
    if (!user) {
      return NextResponse.json(
        { error: "인증되지 않은 사용자입니다" },
        { status: 401 }
      );
    }

    // 요청 본문 파싱
    const body = await req.json();
    const { 
      orderId, 
      status, // 'try', 'fail', 'confirm' 등
      paymentKey,
      amount,
      type, // 'coin' 또는 'subscription'
      method, // 결제 방식 (weekly, yearly, upgrade 등) 또는 결제 수단 정보
      failureReason,
      metadata // 추가 정보 (코인 수량, 화폐 등)
    } = body;

    if (!orderId || !status) {
      return NextResponse.json(
        { error: "필수 파라미터가 누락되었습니다" },
        { status: 400 }
      );
    }

    // 상태에 따른 처리
    switch (status) {
      case 'try': {
        // 결제 시도 정보 저장 (신규 생성)
        if (!amount || !type) {
          return NextResponse.json(
            { error: "결제 시도 시 금액과 타입은 필수입니다" },
            { status: 400 }
          );
        }

        const payment = await prisma.payment.create({
          data: {
            userId: user.id,
            type: type,
            status: 'try',
            amount: parseInt(amount),
            orderId: orderId,
            // requestedAt: new Date(),
            method: method || null,
            metadata: metadata || {}
          }
        });

        return NextResponse.json({ success: true, payment });
      }

      case 'fail': {
        // 결제 실패 정보 업데이트
        const payment = await prisma.payment.findUnique({
          where: { orderId }
        });

        if (!payment) {
          return NextResponse.json(
            { error: "결제 정보를 찾을 수 없습니다" },
            { status: 404 }
          );
        }

        // 다른 사용자의 결제 정보는 업데이트할 수 없음
        if (payment.userId !== user.id) {
          return NextResponse.json(
            { error: "권한이 없습니다" },
            { status: 403 }
          );
        }

        const updatedPayment = await prisma.payment.update({
          where: { orderId },
          data: {
            status: 'fail',
            failureReason: failureReason || '알 수 없는 오류',
            updatedAt: new Date()
          }
        });

        return NextResponse.json({ success: true, payment: updatedPayment });
      }

      case 'confirm': {
        // 웹훅으로 결제 확인 정보 업데이트
        const payment = await prisma.payment.findUnique({
          where: { orderId }
        });

        if (!payment) {
          return NextResponse.json(
            { error: "결제 정보를 찾을 수 없습니다" },
            { status: 404 }
          );
        }

        // 다른 사용자의 결제 정보는 업데이트할 수 없음
        if (payment.userId !== user.id) {
          return NextResponse.json(
            { error: "권한이 없습니다" },
            { status: 403 }
          );
        }

        const updateData: any = {
          status: 'confirm',
          updatedAt: new Date()
        };

        if (paymentKey) updateData.paymentKey = paymentKey;
        if (method) updateData.method = method;

        // 메타데이터 업데이트 (기존 메타데이터와 병합)
        if (metadata) {
          const existingMetadata = typeof payment.metadata === 'object' && payment.metadata !== null 
            ? payment.metadata 
            : {};
            
          updateData.metadata = {
            ...existingMetadata,
            ...metadata
          };
        }

        const updatedPayment = await prisma.payment.update({
          where: { orderId },
          data: updateData
        });

        return NextResponse.json({ success: true, payment: updatedPayment });
      }

      default:
        return NextResponse.json(
          { error: "지원하지 않는 상태입니다" },
          { status: 400 }
        );
    }
  } catch (error) {
    console.error("Payment statusdb error:", error);
    return NextResponse.json(
      { error: "결제 상태 처리 중 오류가 발생했습니다" },
      { status: 500 }
    );
  }
}
