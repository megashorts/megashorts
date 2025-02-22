"use server";

import { lucia } from '@/auth';
import prisma from "@/lib/prisma";
// import streamServerClient from "@/lib/stream";
import { signUpSchema, SignUpValues } from "@/lib/validation";
import { hash } from "@node-rs/argon2";
import { NotificationType } from '@prisma/client';
import { generateIdFromEntropySize } from "lucia";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";

export async function signUp(
  credentials: SignUpValues,
): Promise<{ error: string }> {
  try {
    const { username, email, password, referredBy } = signUpSchema.parse(credentials);
    const addcoinUser = 2;
    const addcoinRefferer = 2;

    const passwordHash = await hash(password, {
      memoryCost: 19456,
      timeCost: 2,
      outputLen: 32,
      parallelism: 1,
    });

    const userId = generateIdFromEntropySize(10);

    const existingUsername = await prisma.user.findFirst({
      where: {
        username: {
          equals: username,
          mode: "insensitive",
        },
      },
    });

    if (existingUsername) {
      return {
        error: "Username already taken",
      };
    }

    const existingEmail = await prisma.user.findFirst({
      where: {
        email: {
          equals: email,
          mode: "insensitive",
        },
      },
    });

    if (existingEmail) {
      return {
        error: "Email already taken",
      };
    }

    // referredBy 체크를 transaction 전에 수행
    let referrer = null;
    if (referredBy) {
      referrer = await prisma.user.findFirst({
        where: {
          username: {
            equals: referredBy,
            mode: "insensitive",
          },
        },
        select: {
          id: true,
          username: true,
        },
      });

      if (!referrer) {
        return {
          error: "The referred userId does not exist.",
        };
      }
    }

    // transaction 실행
    await prisma.$transaction(async (tx) => {
      // 새 사용자 생성
      await tx.user.create({
        data: {
          id: userId,
          username,
          displayName: username,
          email,
          passwordHash,
          referredBy: referrer?.username || null,
          // mscoin: addcoinUser,
        },
      });

      // 추천인이 있는 경우에만 포인트 지급 및 알림 생성
      if (referrer) {
        await tx.user.update({
          where: { id: referrer.id },
          data: {
            mscoin: { increment: addcoinRefferer },
          },
        });

        await tx.user.update({
          where: { id: userId },
          data: {
            mscoin: { increment: addcoinUser },
          },
        });

        await tx.notification.create({
          data: {
            issuerId: userId,
            recipientId: userId,
            type: NotificationType.COIN,
            metadata: {
              amount: addcoinUser,
              reason: '추천인 가입'
            }
          },
        });

        await tx.notification.create({
          data: {
            issuerId: userId,
            recipientId: referrer.id,
            type: NotificationType.COIN,
            metadata: {
              amount: addcoinRefferer,
              reason: '추천인 가입'
            }
          },
        });
      }

      // 3. 알림 생성
      await tx.notification.create({
        data: {
          recipientId: userId,
          issuerId: userId,
          type: 'COMMENT',
          metadata: {
            reason: '가입을 환영합니다! 🎉🎉'
          }
        }
      })

    });



    const session = await lucia.createSession(userId, {});
    const sessionCookie = lucia.createSessionCookie(session.id);
    (await cookies()).set(
      sessionCookie.name,
      sessionCookie.value,
      sessionCookie.attributes,
    );

    return redirect("/");
  } catch (error) {
    if (error instanceof Error && error.message.includes('NEXT_REDIRECT')) {
      throw error;
    }
    console.error(error);
    return {
      error: "Something went wrong. Please try again.",
    };
  }
}