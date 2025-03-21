import { NextRequest, NextResponse } from 'next/server';
import { validateRequest } from '@/auth';
import prisma from '@/lib/prisma';

// 관리자 메모 저장 API
export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
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

    // 관리자 권한 확인
    if (authUser.userRole < 90) {
      return NextResponse.json(
        { success: false, error: '관리자 권한이 필요합니다.' },
        { status: 403 }
      );
    }

    // 요청 본문 파싱
    const body = await request.json();
    const { memo } = body;

    // 출금 신청 조회
    const withdrawal = await prisma.pointWithdrawal.findUnique({
      where: { id: params.id }
    });

    if (!withdrawal) {
      return NextResponse.json(
        { success: false, error: '출금 신청을 찾을 수 없습니다.' },
        { status: 404 }
      );
    }

    // 메모 업데이트
    const updatedWithdrawal = await prisma.pointWithdrawal.update({
      where: { id: params.id },
      data: {
        memo
      }
    });

    // 응답 반환
    return NextResponse.json({
      success: true,
      message: '메모가 저장되었습니다.',
      withdrawal: updatedWithdrawal
    });
  } catch (error) {
    console.error('메모 저장 오류:', error);
    return NextResponse.json(
      { success: false, error: '서버 오류가 발생했습니다.' },
      { status: 500 }
    );
  }
}
