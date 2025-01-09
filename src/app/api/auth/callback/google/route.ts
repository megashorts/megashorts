import { google, lucia, validateRequest } from '@/auth';
// 구글 OAuth 인증을 위한 'google'과 인증 시스템인 'lucia'를 가져옴. 구글 OAuth를 통해 인증 코드를 받아 사용자를 인증하는 데 필요.

import kyInstance from "@/lib/ky"; 
// HTTP 요청을 간단하게 처리하기 위한 ky 라이브러리 인스턴스. 구글 API에 요청을 보내 사용자 정보를 가져오는 데 사용.

import prisma from "@/lib/prisma"; 
// Prisma는 데이터베이스 ORM(Object-Relational Mapping)으로, 데이터베이스에 쉽게 접근하고 조작할 수 있음. 
// 여기서는 사용자가 이미 가입한 구글 계정인지 확인하거나 새로운 사용자를 등록하는 데 사용.

// import streamServerClient from "@/lib/stream"; 
// Stream 서버 클라이언트를 가져옴. 사용자의 정보를 외부 서비스에 저장하거나 관리하는 데 사용.

import { slugify } from "@/lib/utils"; 
// `slugify` 함수는 문자열을 URL-friendly하게 변환. 예: 구글 사용자의 이름을 적절히 변환하여 고유한 사용자명을 생성할 때 사용.

import { OAuth2RequestError } from "arctic"; 
// OAuth 인증 중 오류를 처리하기 위한 에러 클래스. 구글 인증 중 문제가 발생할 경우 오류 처리를 담당.

import { generateIdFromEntropySize } from "lucia"; 
// Lucia 인증 시스템의 고유한 ID 생성 함수. 새로운 사용자가 로그인할 때 고유한 사용자 ID를 만들 때 사용.

import { cookies } from "next/headers"; 
// Next.js의 headers에서 쿠키를 가져와 세션 정보나 상태 값을 저장하고 확인하는 데 사용. OAuth 과정에서 중요한 값들이 쿠키에 저장됨.

import { NextRequest } from "next/server"; 
// Next.js에서 서버로 들어오는 요청을 처리하는 Request 타입. 여기서는 로그인 시 인증 코드와 상태 값을 확인하는 데 사용.

export async function GET(req: NextRequest) {
  const code = req.nextUrl.searchParams.get("code");
  const state = req.nextUrl.searchParams.get("state");
  // 사용자가 구글 로그인 후 리다이렉트될 때 URL에 포함된 'code'(인증 코드)와 'state'(요청 무결성을 보장하는 값)를 가져옴.

  const storedState = (await cookies()).get("state")?.value;
  const storedCodeVerifier = (await cookies()).get("code_verifier")?.value;
  // 이전에 클라이언트에 저장한 'state'와 'code_verifier'를 쿠키에서 가져옴.
  // 이 값들은 OAuth 보안 절차의 일부로, 요청의 신뢰성을 보장하는 데 필요.

  if (!code || !state || !storedState || !storedCodeVerifier || state !== storedState) {
    return new Response(null, { status: 400 });
    // 인증 코드나 상태 값이 없거나, 저장된 'state'와 현재 'state'가 다르면 요청이 변조되었을 가능성이 있으므로 400 에러 반환.
  }

  try {
    const tokens = await google.validateAuthorizationCode(code, storedCodeVerifier);
    // 구글로부터 받은 인증 코드와 검증자를 사용해 액세스 토큰을 요청하고 검증. 이 토큰은 구글 사용자 정보에 접근하는 데 사용됨.

    const googleUser = await kyInstance
      .get("https://www.googleapis.com/oauth2/v1/userinfo", {
        headers: {
          Authorization: `Bearer ${tokens.accessToken}`,
        },
      })
      .json<{ id: string; name: string }>();
    // ky를 사용해 구글 API에 요청을 보내고, 사용자의 정보를 JSON 형태로 받아옴. 
    // 여기서는 구글 사용자 ID와 이름을 가져옴.

    const existingUser = await prisma.user.findUnique({
      where: { googleId: googleUser.id },
    });
    // 데이터베이스에서 해당 구글 ID로 가입된 사용자가 있는지 확인. 
    // 구글 ID가 일치하는 사용자가 이미 있는 경우, 그 사용자의 정보를 가져옴.

    if (existingUser) {
      const session = await lucia.createSession(existingUser.id, {});
      const sessionCookie = lucia.createSessionCookie(session.id);
      // 사용자가 이미 존재할 경우, 새로운 세션을 생성하고 그 세션 정보를 쿠키에 저장.

      (await
        // 사용자가 이미 존재할 경우, 새로운 세션을 생성하고 그 세션 정보를 쿠키에 저장.
        cookies()).set(sessionCookie.name, sessionCookie.value, sessionCookie.attributes);
      // 세션 쿠키를 설정해 사용자가 로그인 상태를 유지할 수 있도록 함.

      return new Response(null, {
        status: 302,
        headers: { Location: "/" },
      });
      // 로그인에 성공하면 홈페이지로 리다이렉트.
    }

    const userId = generateIdFromEntropySize(10);
    // 새로운 사용자를 위한 고유한 사용자 ID 생성. 10비트 크기의 난수를 사용해 고유한 ID를 만듦.

    const username = slugify(googleUser.name) + "-" + userId.slice(0, 4);
    // 구글 사용자 이름을 URL-friendly한 형식으로 변환하고, 고유성을 위해 ID의 일부를 추가해 사용자명을 생성.
    // src/lib/utils.ts : export function slugify(input: string): string {

    await prisma.$transaction(async (tx) => {
      await tx.user.create({
        data: {
          id: userId,
          username,
          displayName: googleUser.name,
          googleId: googleUser.id,
        },
      });
      // Prisma 트랜잭션을 사용해 데이터베이스에 새로운 사용자 정보를 저장. 
      // 트랜잭션을 사용하면 여러 데이터베이스 작업이 하나의 단위로 처리됨.

      // await streamServerClient.upsertUser({
      //   id: userId,
      //   username,
      //   name: username,
      // });
      // 외부 Stream 서버에도 새 사용자 정보를 업로드.
    });

    const session = await lucia.createSession(userId, {});
    const sessionCookie = lucia.createSessionCookie(session.id);
    (await cookies()).set(sessionCookie.name, sessionCookie.value, sessionCookie.attributes);
    // 새로운 사용자에 대한 세션을 생성하고, 세션 쿠키를 설정해 로그인 상태를 유지.

    return new Response(null, {
      status: 302,
      headers: { Location: "/" },
    });
    // 성공적으로 로그인하면 메인 페이지로 리다이렉트.
  } catch (error) {
    console.error(error);
    if (error instanceof OAuth2RequestError) {
      return new Response(null, { status: 400 });
      // OAuth 인증 과정에서 발생한 오류를 처리. 잘못된 요청이면 400 상태 반환.
    }
    return new Response(null, { status: 500 });
    // 그 외의 오류는 서버 오류로 처리하고 500 상태 반환.
  }
}
