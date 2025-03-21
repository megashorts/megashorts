import { NextRequest, NextResponse } from 'next/server';
import { validateRequest } from '@/auth';
import prisma from '@/lib/prisma';

// 인증 정보 저장 API
export async function POST(
  request: NextRequest,
  { params }: { params: { userId: string } }
) {
  try {
    // 인증 확인
    const { user: authUser, session } = await validateRequest();
    if (!authUser || !session) {
      return NextResponse.json(
        { success: false, error: '인증되지 않은 요청입니다.' },
        { status: 401 }
      );
    }

    // 요청한 사용자 ID와 로그인한 사용자 ID가 일치하는지 확인
    // 또는 관리자 권한이 있는지 확인
    const isAdmin = authUser.userRole >= 90;
    const isSameUser = authUser.id === params.userId;

    if (!isAdmin && !isSameUser) {
      return NextResponse.json(
        { success: false, error: '권한이 없습니다.' },
        { status: 403 }
      );
    }

    // 요청 본문 파싱
    const body = await request.json();
    const { bankInfo } = body;

    if (!bankInfo) {
      return NextResponse.json(
        { success: false, error: '은행 정보가 필요합니다.' },
        { status: 400 }
      );
    }

    // 필수 필드 확인
    if (!bankInfo.accountHolder || !bankInfo.country) {
      return NextResponse.json(
        { success: false, error: '예금주와 국가 정보는 필수입니다.' },
        { status: 400 }
      );
    }

    // 기존 은행 정보 조회
    const existingWithdrawal = await prisma.pointWithdrawal.findFirst({
      where: {
        userId: params.userId,
        status: 'PENDING'
      },
      orderBy: { requestedAt: 'desc' }
    });

    // 은행 정보 저장 (기존 정보가 있으면 업데이트, 없으면 새로 생성)
    if (existingWithdrawal) {
      // 기존 정보 업데이트
      await prisma.pointWithdrawal.update({
        where: { id: existingWithdrawal.id },
        data: { bankInfo }
      });
    } else {
      // 새로운 정보 생성 (0원 출금 신청으로 생성)
      await prisma.pointWithdrawal.create({
        data: {
          userId: params.userId,
          amount: 0, // 은행 정보만 저장하는 용도
          status: 'PENDING',
          bankInfo,
          reason: '은행 정보 등록'
        }
      });
    }

    // 응답 반환
    return NextResponse.json({
      success: true,
      message: '은행 정보가 저장되었습니다.'
    });
  } catch (error) {
    console.error('은행 정보 저장 오류:', error);
    return NextResponse.json(
      { success: false, error: '서버 오류가 발생했습니다.' },
      { status: 500 }
    );
  }
}
