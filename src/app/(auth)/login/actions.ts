// "use server" 지시어를 사용하여 이 함수가 서버 측에서만 실행되도록 지정합니다.
"use server";

// Lucia 인증 모듈을 불러옵니다. @/auth는 인증 관련 설정이 포함된 경로입니다.
import { lucia } from '@/auth';

// Prisma ORM(데이터베이스와 상호작용하는 도구)을 불러옵니다. @/lib/prisma는 Prisma 설정 파일 경로입니다.
import prisma from "@/lib/prisma";

// 로그인 시 사용자의 입력값을 검증하기 위한 스키마와 데이터 타입을 불러옵니다. loginSchema는 유효성 검사를 위한 규칙이 정의된 객체입니다.
import { loginSchema, LoginValues } from "@/lib/validation";

// 패스워드 해시 검증을 위한 Argon2 라이브러리에서 제공하는 `verify` 함수를 불러옵니다.
import { verify } from "@node-rs/argon2";

// Next.js에서 리디렉션 오류를 처리할 때 사용되는 `isRedirectError` 함수를 불러옵니다. 이는 리디렉션 오류인지 확인하기 위한 함수입니다.
import { isRedirectError } from "next/dist/client/components/redirect";

// Next.js에서 서버 측의 쿠키를 조작할 수 있게 하는 `cookies` 유틸리티를 불러옵니다. 이를 통해 세션 쿠키를 설정할 수 있습니다.
import { cookies } from "next/headers";

// Next.js에서 페이지를 리디렉션(다른 페이지로 이동)할 때 사용하는 `redirect` 함수를 불러옵니다.
import { redirect } from "next/navigation";

// 로그인 요청을 처리하는 비동기 함수 login을 정의합니다. 이 함수는 사용자가 입력한 로그인 데이터를 처리하고 결과를 반환합니다.
export async function login(
  // 사용자가 입력한 로그인 정보(credentials)를 함수의 매개변수로 받습니다. LoginValues는 타입이며, 사용자의 입력값 형식을 정의합니다.
  credentials: LoginValues,
): Promise<{ error: string }> {
  // try {
  //   // 사용자가 입력한 username과 password가 올바른 형식인지 loginSchema로 검증합니다. 
  //   // 올바르지 않으면 여기서 오류가 발생합니다.
  //   const { username, password } = loginSchema.parse(credentials);

  //   // Prisma를 사용하여 데이터베이스에서 사용자를 찾습니다.
  //   // 입력한 username을 대소문자 구분 없이 검색합니다.
  //   const existingUser = await prisma.user.findFirst({
  //     where: {
  //       username: {
  //         equals: username, // 사용자가 입력한 username과 일치하는 사용자를 찾습니다.
  //         mode: "insensitive", // 대소문자를 구분하지 않고 검색합니다.
  //       },
  //     },
  //   });

  try {
    // 사용자가 입력한 username과 password를 검증
    const { username, password } = loginSchema.parse(credentials);

    // 사용자가 입력한 username이 이메일일 수도 있으니 이메일 또는 유저네임을 찾아봅니다.
    const existingUser = await prisma.user.findFirst({
      where: {
        OR: [
          { username: { equals: username, mode: "insensitive" } },  // 입력한 값이 username일 경우
          { email: { equals: username, mode: "insensitive" } },     // 입력한 값이 email일 경우
        ],
      },
    });

    // 사용자가 존재하지 않거나 저장된 비밀번호 해시가 없을 경우(비밀번호를 설정하지 않았을 때),
    // "Incorrect username or password"라는 오류 메시지를 반환합니다.
    if (!existingUser || !existingUser.passwordHash) {
      return {
        error: "Incorrect username or password",
      };
    }

    // 사용자가 입력한 비밀번호를 데이터베이스에 저장된 해시 값과 비교합니다.
    // Argon2 알고리즘을 사용하여 비밀번호 해시를 검증합니다. 메모리, 시간, 출력 길이, 병렬성 등의 파라미터를 설정합니다.
    const validPassword = await verify(existingUser.passwordHash, password, {
      memoryCost: 19456, // 해시를 계산할 때 사용할 메모리 양을 설정합니다.
      timeCost: 2,       // 해시 계산 반복 횟수를 설정합니다.
      outputLen: 32,     // 출력 해시 값의 길이를 설정합니다.
      parallelism: 1,    // 병렬 처리할 스레드 수를 설정합니다.
    });

    // 비밀번호가 일치하지 않으면 "Incorrect username or password" 오류 메시지를 반환합니다.
    if (!validPassword) {
      return {
        error: "Incorrect username or password",
      };
    }

    // 비밀번호가 일치하면 Lucia 인증 시스템을 사용해 세션을 생성합니다.
    // Lucia가 사용자 ID를 받아 세션을 생성하고, 그 세션을 데이터베이스에 저장합니다.
    const session = await lucia.createSession(existingUser.id, {});

    // 생성된 세션에 대한 쿠키를 만듭니다. 세션 ID를 기반으로 세션 쿠키가 생성됩니다.
    const sessionCookie = lucia.createSessionCookie(session.id);

    // 쿠키를 설정합니다. cookies().set을 통해 세션 쿠키의 이름, 값, 속성(유효기간, 도메인 등)을 설정합니다.
    (await
      // 쿠키를 설정합니다. cookies().set을 통해 세션 쿠키의 이름, 값, 속성(유효기간, 도메인 등)을 설정합니다.
      cookies()).set(
      sessionCookie.name, // 쿠키의 이름입니다.
      sessionCookie.value, // 쿠키의 값으로 세션 ID가 저장됩니다.
      sessionCookie.attributes, // 쿠키의 속성(유효기간 등)을 설정합니다.
    );

    // 사용자가 로그인에 성공하면 홈 페이지로 리디렉션 시킵니다.
    return redirect("/");
  } catch (error) {
    // 리디렉션 오류인 경우 그대로 오류를 다시 던져 리디렉션이 발생하도록 합니다.
    if (isRedirectError(error)) throw error;

    // 그 외의 오류가 발생하면 콘솔에 오류를 출력하고, 사용자에게 일반적인 오류 메시지를 반환합니다.
    console.error(error);
    return {
      error: "Something went wrong. Please try again.", // 사용자가 볼 수 있는 일반적인 오류 메시지입니다.
    };
  }
}
