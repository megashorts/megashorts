import { validateRequest } from "@/auth";
import prisma from "@/lib/prisma";
import { NextResponse } from "next/server";
import { hash, verify } from "@node-rs/argon2";

export async function POST(req: Request) {
  try {
    const { user } = await validateRequest();
    if (!user) {
      return NextResponse.json(
        { error: "인증되지 않은 요청입니다." },
        { status: 401 }
      );
    }

    const { currentPassword, newPassword } = await req.json();

    const dbUser = await prisma.user.findUnique({
      where: { id: user.id },
      select: { passwordHash: true, googleId: true, naverId: true, kakaoId: true },
    });

    if (!dbUser?.passwordHash) {
      return NextResponse.json(
        { error: "소셜 로그인 사용자는 비밀번호를 변경할 수 없습니다." },
        { status: 400 }
      );
    }

    // 소셜 로그인 사용자 체크
    if (dbUser.googleId) {
      return NextResponse.json(
        { error: "구글 계정으로 로그인한 사용자는 비밀번호를 변경할 수 없습니다. 구글 로그인을 이용해주세요." },
        { status: 400 }
      );
    }

    if (dbUser.naverId) {
      return NextResponse.json(
        { error: "네이버 계정으로 로그인한 사용자는 비밀번호를 변경할 수 없습니다. 네이버 로그인을 이용해주세요." },
        { status: 400 }
      );
    }

    if (dbUser.kakaoId) {
      return NextResponse.json(
        { error: "카카오 계정으로 로그인한 사용자는 비밀번호를 변경할 수 없습니다. 카카오 로그인을 이용해주세요." },
        { status: 400 }
      );
    }

    const isValid = await verify(dbUser.passwordHash, currentPassword);
    if (!isValid) {
      return NextResponse.json(
        { error: "현재 비밀번호가 일치하지 않습니다." },
        { status: 400 }
      );
    }

    const passwordHash = await hash(newPassword, {
      memoryCost: 19456,
      timeCost: 2,
      parallelism: 1,
      outputLen: 32,
    });

    await prisma.user.update({
      where: { id: user.id },
      data: { passwordHash },
    });

    return NextResponse.json({ message: "비밀번호가 변경되었습니다." });
  } catch (error) {
    console.error("Password change error:", error);
    return NextResponse.json(
      { error: "비밀번호 변경 중 오류가 발생했습니다." },
      { status: 500 }
    );
  }
}