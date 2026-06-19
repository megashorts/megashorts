// 글로벌 성인인증 API - Self-Declaration 방식 (생년월일 입력 + 동의)
// 기존 DB의 adultauth 필드와 연동

import { validateRequest } from '@/auth';
import prisma from '@/lib/prisma';
import { NextRequest, NextResponse } from 'next/server';
import { revalidateTag } from 'next/cache';

export async function POST(req: NextRequest) {
  try {
    const { user } = await validateRequest();
    if (!user) {
      return NextResponse.json(
        { error: '로그인이 필요합니다' },
        { status: 401 }
      );
    }

    const body = await req.json();
    const { birthDate, confirmed } = body as {
      birthDate?: string;
      confirmed: boolean;
    };

    // 필수 파라미터 검증
    if (!confirmed) {
      return NextResponse.json(
        { error: '성인 확인 동의가 필요합니다' },
        { status: 400 }
      );
    }
    const now = new Date();
    let parsedDate: Date | null = null;

    // 선택 입력: 생년월일을 보낸 경우에만 나이 검증 수행
    if (birthDate) {
      parsedDate = new Date(birthDate);
      if (isNaN(parsedDate.getTime())) {
        return NextResponse.json(
          { error: '유효하지 않은 날짜 형식입니다' },
          { status: 400 }
        );
      }

      // 미래 날짜 방지
      if (parsedDate > now) {
        return NextResponse.json(
          { error: '유효하지 않은 생년월일입니다' },
          { status: 400 }
        );
      }

      // 나이 계산 (만 나이 기준)
      let age = now.getFullYear() - parsedDate.getFullYear();
      const monthDiff = now.getMonth() - parsedDate.getMonth();
      if (monthDiff < 0 || (monthDiff === 0 && now.getDate() < parsedDate.getDate())) {
        age--;
      }

      // 만 18세 미만 거부
      if (age < 18) {
        return NextResponse.json(
          { error: '만 18세 이상만 성인인증이 가능합니다', isMinor: true },
          { status: 403 }
        );
      }

      // 비현실적 나이 방지 (150세 이상)
      if (age > 150) {
        return NextResponse.json(
          { error: '유효하지 않은 생년월일입니다' },
          { status: 400 }
        );
      }
    }

    // DB 업데이트: adultauth + birthDate + adultAuthAt
    await prisma.user.update({
      where: { id: user.id },
      data: {
        adultauth: true,
        birthDate: parsedDate,
        adultAuthAt: now,
      },
    });

    // 사용자 인증 캐시 무효화
    revalidateTag('user-auth');
    revalidateTag(`user-auth-${user.id}`);

    return NextResponse.json({
      success: true,
      message: '성인인증이 완료되었습니다',
    });
  } catch (error) {
    console.error('성인인증 처리 오류:', error);
    return NextResponse.json(
      { error: '성인인증 처리 중 오류가 발생했습니다' },
      { status: 500 }
    );
  }
}
