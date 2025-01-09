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

    // TODO: 결제 성공 처리
    // 1. DB에 결제 정보 저장
    // 2. 사용자의 구독/코인 상태 업데이트
    

    // orderId에서 코인 수량 추출 (orderId 형식: order_nanoid_coins)
    const coins = parseInt(orderId.split('_')[2]);

    if (!coins) {
      throw new Error("코인 수량을 확인할 수 없습니다");
    }

    // 트랜잭션으로 결제 완료 처리
    await prisma.$transaction(async (tx) => {
      // 1. 결제 정보 저장
      await tx.payment.create({
        data: {
          userId: user.id,
          type: 'coin',
          status: 'success',
          amount: parseInt(amount || '0'),
          orderId: orderId,
          paymentKey: paymentKey,
          requestedAt: new Date(),
          approvedAt: new Date(),
          metadata: {
            coins: coins
          }
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
