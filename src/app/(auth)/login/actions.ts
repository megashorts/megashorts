"use server";

import { lucia } from '@/auth';
import prisma from "@/lib/prisma";
import { loginSchema, LoginValues } from "@/lib/validation";
import { verify } from "@node-rs/argon2";
import { cookies, headers } from "next/headers";
import { redirect } from "next/navigation";

export async function login(
  credentials: LoginValues,
): Promise<{ error?: string; identifier?: string }> {
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
        error: "Incorrect username or password",
        identifier: username
      };
    }

    const validPassword = await verify(existingUser.passwordHash, password);

    if (!validPassword) {
      return {
        error: "Incorrect username or password",
        identifier: username
      };
    }

    const session = await lucia.createSession(existingUser.id, {});
    const sessionCookie = lucia.createSessionCookie(session.id);
    (await cookies()).set(
      sessionCookie.name,
      sessionCookie.value,
      sessionCookie.attributes
    );

    // 성공 시 사용자 정보 반환
    const result = {
      identifier: existingUser.email || existingUser.username
    };

    redirect("/");

    // 이 코드는 실행되지 않지만 TypeScript를 위해 필요
    return result;
  } catch (error) {
    if (error instanceof Error && error.message.includes('NEXT_REDIRECT')) {
      throw error;
    }

    console.error(error);
    return {
      error: "Something went wrong. Please try again.",
      identifier: credentials.username
    };
  }
}
