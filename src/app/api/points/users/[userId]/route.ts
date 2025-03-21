import { NextRequest, NextResponse } from 'next/server';
import { validateRequest } from '@/auth';
import prisma from '@/lib/prisma';

// 사용자 정보 조회 API
export async function GET(
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

    // 사용자 정보 조회
    const user = await prisma.user.findUnique({
      where: { id: params.userId },
      select: {
        id: true,
        username: true,
        email: true,
        emailVerified: true,
        points: true,
        userRole: true,
      },
    });

    if (!user) {
      return NextResponse.json(
        { success: false, error: '사용자를 찾을 수 없습니다.' },
        { status: 404 }
      );
    }

    // 은행 정보 조회
    const bankInfo = await prisma.pointWithdrawal.findFirst({
      where: { 
        userId: params.userId,
        status: { in: ['APPROVED', 'PENDING'] }
      },
      orderBy: { requestedAt: 'desc' },
      select: { bankInfo: true }
    });

    // 응답 반환
    return NextResponse.json({
      success: true,
      data: {
        ...user,
        bankInfo: bankInfo?.bankInfo || null
      },
    });
  } catch (error) {
    console.error('사용자 정보 조회 오류:', error);
    return NextResponse.json(
      { success: false, error: '서버 오류가 발생했습니다.' },
      { status: 500 }
    );
  }
}
