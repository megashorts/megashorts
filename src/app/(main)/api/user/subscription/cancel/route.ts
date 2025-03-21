// subscripton cancel DB update

import { validateRequest } from "@/auth";
import prisma from "@/lib/prisma";
import { NextResponse } from "next/server";

export async function POST() {
  try {
    const { user } = await validateRequest();
    if (!user) {
      return NextResponse.json(
        { error: "인증되지 않은 요청입니다." },
        { status: 401 }
      );
    }

    await prisma.subscription.update({
      where: {
        userId: user.id,
        status: "active",
      },
      data: {
        // status는 변경하지 않고 현재 구독 기간 동안 유지
        // 구독 기간 종료 시 자동으로 취소되도록 설정
        cancelAtPeriodEnd: true,
      },
    });

    return NextResponse.json({ message: "구독이 취소되었습니다." });
  } catch (error) {
    console.error("Subscription cancellation error:", error);
    return NextResponse.json(
      { error: "구독 취소 중 오류가 발생했습니다." },
      { status: 500 }
    );
  }
}
