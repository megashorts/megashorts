// src/app/(auth)/login/actions.ts
"use server";

import { lucia } from '@/auth';
import prisma from "@/lib/prisma";
import { loginSchema, LoginValues } from "@/lib/validation";
import { verify } from "@node-rs/argon2";
import { cookies } from "next/headers";
// redirect 제거

export async function login(
  credentials: LoginValues,
): Promise<{ 
  success: boolean;
  error?: string; 
  identifier?: string;
}> {
  try {
    const { username, password } = loginSchema.parse(credentials);

    const existingUser = await prisma.user.findFirst({
      where: {
        OR: [
          { username: { equals: username, mode: "insensitive" } },
          { email: { equals: username, mode: "insensitive" } },
        ],
      },
    });

    if (!existingUser || !existingUser.passwordHash) {
      return {
        success: false,
        error: "Incorrect username or password",
        identifier: username
      };
    }

    // 여기에 차단 상태 체크 추가
    if (existingUser.blockedUntil && existingUser.blockedUntil > new Date()) {
      const remainingMinutes = Math.ceil(
        (existingUser.blockedUntil.getTime() - new Date().getTime()) / (1000 * 60)
      );
      return {
        success: false,
        error: `계정이 잠겼습니다. ${remainingMinutes}분 후에 다시 시도해주세요.`,
        identifier: username
      };
    }

    const validPassword = await verify(existingUser.passwordHash, password);

    if (!validPassword) {
      // 실패 시 시도 횟수 증가
      await prisma.user.update({
        where: { id: existingUser.id },
        data: {
          loginAttempts: existingUser.loginAttempts + 1,
          blockedUntil: existingUser.loginAttempts >= 4 ? 
            new Date(Date.now() + 10 * 60 * 1000) : null
        }
      });

      return {
        success: false,
        error: "Incorrect username or password",
        identifier: username
      };
    }

    // 로그인 성공 시 기존 세션 삭제 및 카운터 초기화
    const sessionCleanup = await prisma.$transaction([
      // 기존 세션 모두 삭제
      prisma.session.deleteMany({
        where: {
          userId: existingUser.id
        }
      }),
      // 로그인 시도 카운터 초기화
      prisma.user.update({
        where: { id: existingUser.id },
        data: {
          loginAttempts: 0,
          blockedUntil: null
        }
      })
    ]);

    // 새 세션 생성
    const session = await lucia.createSession(existingUser.id, {});
    const sessionCookie = lucia.createSessionCookie(session.id);
    (await cookies()).set(
      sessionCookie.name,
      sessionCookie.value,
      sessionCookie.attributes
    );

    // 리다이렉트 대신 성공 반환
    return {
      success: true,
      identifier: existingUser?.email || existingUser?.username || username
    };
  } catch (error) {
    console.error(error);
    return {
      success: false,
      error: "Something went wrong. Please try again.",
      identifier: credentials.username
    };
  }
}