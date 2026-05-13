import { NextRequest, NextResponse } from 'next/server';
import { validateRequest } from '@/auth';
import prisma from '@/lib/prisma';

// 포인트 지급 내역 조회 API
export async function GET(request: NextRequest) {
  try {
    // 1. 인증 확인
    const { user: authUser, session } = await validateRequest();
    if (!authUser || !session) {
      return NextResponse.json(
        { success: false, error: '인증되지 않은 요청입니다.' },
        { status: 401 }
      );
    }

    // 2. 쿼리 파라미터
    const url = new URL(request.url);
    const userId = url.searchParams.get('userId');
    const period = url.searchParams.get('period') || 'all';

    // 3. 권한 확인 (본인 또는 관리자만 가능)
    const isAdmin = authUser.userRole >= 90;
    const isSameUser = authUser.id === userId;
    if (!isAdmin && !isSameUser) {
      return NextResponse.json(
        { success: false, error: '권한이 없습니다.' },
        { status: 403 }
      );
    }

    // 4. 기간 필터링 (예시: all, 30d, 90d, 1y 등 지원 가능)
    let dateFilter: Date | undefined;
    if (period !== 'all') {
      const now = new Date();
      if (period === '30d') {
        dateFilter = new Date(now.setDate(now.getDate() - 30));
      } else if (period === '90d') {
        dateFilter = new Date(now.setDate(now.getDate() - 90));
      } else if (period === '1y') {
        dateFilter = new Date(now.setFullYear(now.getFullYear() - 1));
      }
    }

    // 5. DB 조회
    const withdrawals = await prisma.pointWithdrawal.findMany({
      where: {
        userId: userId!,
        ...(dateFilter ? { requestedAt: { gte: dateFilter } } : {})
      },
      orderBy: { requestedAt: 'desc' }
    });

    // 6. 응답 반환
    return NextResponse.json({
      success: true,
      withdrawals
    });

  } catch (error) {
    console.error('지급 내역 조회 오류:', error);
    return NextResponse.json(
      { success: false, error: '서버 오류가 발생했습니다.' },
      { status: 500 }
    );
  }
}
