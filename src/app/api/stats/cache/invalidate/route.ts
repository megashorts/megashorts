import { validateRequest } from "@/auth";
import { USER_ROLE } from "@/lib/constants";
import { NextResponse } from "next/server";

export async function POST() {
  const { user } = await validateRequest();

  if (!user || user.userRole < USER_ROLE.OPERATION1) {
    return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
  }

  return NextResponse.json({
    success: true,
    message: "통계 API는 현재 요청 시점 DB 집계를 사용합니다.",
  });
}
