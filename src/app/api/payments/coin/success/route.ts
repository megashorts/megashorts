import { validateRequest } from '@/auth';
import prisma from "@/lib/prisma";
import { NextRequest, NextResponse } from "next/server";

export async function GET(req: NextRequest) {
  const searchParams = req.nextUrl.searchParams;
  const orderId = searchParams.get("orderId");
  const paymentKey = searchParams.get("paymentKey");
  const amount = searchParams.get("amount");

  // null 체크를 먼저 수행
  if (!orderId || !paymentKey || !amount) {
    return NextResponse.redirect(
      new URL("/subscription?error=필수 파라미터가 누락되었습니다", req.url)
    );
  }

  try {
    // 현재 사용자 확인
    const { user } = await validateRequest();
    if (!user) {
      return NextResponse.redirect(
        new URL("/subscription?error=인증되지 않은 사용자입니다", req.url)
      );
    }

    // 결제 승인 요청
    const url = "https://api.tosspayments.com/v1/payments/confirm";
    const secretKey = process.env.TOSS_PAYMENTS_SECRET_KEY;
    if (!secretKey) throw new Error("토스페이먼츠 시크릿 키가 설정되지 않았습니다.");

    const basicToken = Buffer.from(secretKey + ":", "utf-8").toString("base64");

    const response = await fetch(url, {
      method: "POST",
      headers: {
        Authorization: `Basic ${basicToken}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        paymentKey,
        orderId,
        amount,
      }),
    });

    const data = await response.json();

    if (!response.ok) {
      console.error("Payment confirmation failed:", data);
      return NextResponse.redirect(
        new URL(`/subscription?error=${data.message}`, req.url)
      );
    }
    
    // 결제 시도 정보 조회
    const paymentTry = await prisma.payment.findUnique({
      where: { orderId }
    });

    if (!paymentTry) {
      console.error("Payment try record not found:", orderId);
      throw new Error("결제 시도 정보를 찾을 수 없습니다");
    }

    // 메타데이터에서 코인 수량 추출
    const metadata = paymentTry.metadata as { coins: number; currency: string } | null;
    const coins = metadata?.coins;
    
    if (!coins) {
      console.error("Invalid coins value in metadata:", paymentTry.metadata);
      throw new Error("코인 수량을 확인할 수 없습니다");
    }

    // 트랜잭션으로 결제 완료 처리
    await prisma.$transaction(async (tx) => {
      // 1. 결제 정보 업데이트
      await tx.payment.update({
        where: { orderId },
        data: {
          status: 'confirm',
          paymentKey: paymentKey,
          approvedAt: new Date(),
          method: data.method, // 토스페이먼츠에서 반환한 실제 결제 방식
        }
      });

      // 2. 사용자 코인 증가
      await tx.user.update({
        where: { id: user.id },
        data: {
          mscoin: {
            increment: coins
          }
        }
      });

      // 3. 알림 생성
      await tx.notification.create({
        data: {
          recipientId: user.id,
          issuerId: user.id,
          type: 'COIN',
          metadata: {
            amount: coins,
            reason: '코인구매'
          }
        }
      });
    });

    // 성공 응답 반환
    return NextResponse.json({
      success: true,
      coins,
      amount: Number(amount).toLocaleString()
    });
  } catch (error) {
    console.error("Payment processing error:", error);
    return NextResponse.redirect(
      new URL("/subscription?error=결제 처리 중 오류가 발생했습니다", req.url)
    );
  }
}
