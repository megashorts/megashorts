"use server";

import { lucia, validateRequest } from '@/auth';
import { cookies } from "next/headers";

interface LogoutResult {
  success: boolean;
  userInfo?: {
    username: string;
  };
}

export async function logout(): Promise<LogoutResult> {
  try {
    console.log('서버: 로그아웃 시작');
    const { session, user } = await validateRequest();
    console.log('서버: validateRequest 결과', { session: !!session, user: !!user });

    if (!session) {
      console.log('서버: 세션 없음');
      return { success: false };
    }

    // 사용자 정보 저장
    const userInfo = {
      username: user.username
    };
    console.log('서버: 사용자 정보', userInfo);

    // 세션 삭제
    console.log('서버: 세션 삭제 시작');
    await lucia.invalidateSession(session.id);
    const sessionCookie = lucia.createBlankSessionCookie();
    (await cookies()).set(
      sessionCookie.name,
      sessionCookie.value,
      sessionCookie.attributes
    );
    console.log('서버: 세션 삭제 완료');

    console.log('서버: 응답 반환');
    return { 
      success: true,
      userInfo
    };
  } catch (error) {
    console.error('서버: 로그아웃 에러', error);
    return { success: false };
  }
}
