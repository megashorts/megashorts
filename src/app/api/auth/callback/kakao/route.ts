import { kakao, lucia } from '@/auth';
import kyInstance from "@/lib/ky";
import prisma from "@/lib/prisma";
import { slugify } from "@/lib/utils";
import { OAuth2RequestError } from "arctic";
import { generateIdFromEntropySize } from "lucia";
import { cookies } from "next/headers";
import { NextRequest } from "next/server";

export async function GET(req: NextRequest) {
  const code = req.nextUrl.searchParams.get("code");
  const state = req.nextUrl.searchParams.get("state");

  const storedState = (await cookies()).get("state")?.value;

  if (!code || !state || !storedState || state !== storedState) {
    return new Response(null, { status: 400 });
  }

  try {
    const tokens = await kakao.validateAuthorizationCode(code);
    console.log('Tokens received:', tokens);

    // 토큰 값 직접 추출
    const accessToken = typeof tokens.accessToken === 'function' 
      ? tokens.accessToken() 
      : tokens.accessToken;

    console.log('Access token:', accessToken);

    const kakaoUser = await kyInstance
      .get("https://kapi.kakao.com/v2/user/me", {
        headers: {
          Authorization: `Bearer ${accessToken}`,
          "Accept-Language": "ko",
        },
      })
      .json<{
        id: number;
        properties: {
          nickname: string;
        };
        kakao_account?: {
          email?: string;
          profile?: {
            nickname: string;
          }
        };
      }>();

    const nickname = kakaoUser.properties.nickname || kakaoUser.kakao_account?.profile?.nickname;

    const existingUser = await prisma.user.findUnique({
      where: { kakaoId: String(kakaoUser.id) },
    });

    if (existingUser) {
      const session = await lucia.createSession(existingUser.id, {});
      const sessionCookie = lucia.createSessionCookie(session.id);
      (await cookies()).set(
        sessionCookie.name,
        sessionCookie.value,
        sessionCookie.attributes
      );

      return new Response(null, {
        status: 302,
        headers: { Location: `/?event=kakao_login&username=${existingUser.username}` },
      });
    }

    // 이메일이 있는 경우 중복 체크
    if (kakaoUser.kakao_account?.email) {
      const existingEmail = await prisma.user.findUnique({
        where: { email: kakaoUser.kakao_account.email }
      });

      if (existingEmail) {
        return new Response(null, {
          status: 302,
          headers: {
            Location: `/?event=error&error=${encodeURIComponent('This email is already registered')}`
          }
        });
      }
    }

    const userId = generateIdFromEntropySize(10);
    const username = slugify(nickname || 'user') + "-" + userId.slice(0, 4);

    // 이메일이 있는 경우에만 저장, 없으면 null로 저장
    await prisma.$transaction(async (tx) => {
      await tx.user.create({
        data: {
          id: userId,
          username,
          displayName: nickname || 'User',
          kakaoId: String(kakaoUser.id),
          email: kakaoUser.kakao_account?.email,
        },
      });

      await tx.notification.create({
        data: {
          recipientId: userId,
          issuerId: userId,
          type: 'COMMENT',
          metadata: {
            reason: 'welcome_msg'
          }
        }
      });
    });

    const session = await lucia.createSession(userId, {});
    const sessionCookie = lucia.createSessionCookie(session.id);
    (await cookies()).set(
      sessionCookie.name,
      sessionCookie.value,
      sessionCookie.attributes
    );

    return new Response(null, {
      status: 303,
      headers: { Location: `/?event=kakao_signup&username=${username}` },
    });
  } catch (error) {
    console.error('Kakao callback error:', {
      name: error instanceof Error ? error.name : 'Unknown',
      message: error instanceof Error ? error.message : String(error),
      stack: error instanceof Error ? error.stack : undefined
    });
    
    if (error instanceof OAuth2RequestError) {
      return new Response(null, { status: 400 });
    }

    const errorMessage = error instanceof Error ? error.message : 'Internal Server Error';
    return new Response(null, {
      status: 302,
      headers: {
        Location: `/?event=error&error=${encodeURIComponent(errorMessage)}`
      }
    });
  }
}
