import { NextRequest, NextResponse } from "next/server";

export async function GET(req: NextRequest) {
  const searchParams = req.nextUrl.searchParams;
  const code = searchParams.get("code");
  const message = searchParams.get("message");
  
  // 실패 로그 기록
  console.error("Payment failed:", { code, message });
  
  // TODO: 결제 실패 처리
  // 1. DB에 실패 기록 저장
  // 2. 필요한 경우 관리자에게 알림
  
  // 에러 메시지와 함께 구독 페이지로 리다이렉트
  return NextResponse.redirect(
    new URL(
      `/subscription?error=${encodeURIComponent(message || "결제가 취소되었습니다. 실패 라우터파일메시지")}`,
      req.url
    )
  );
}
