import { NextRequest, NextResponse } from 'next/server';
import { validateRequest } from '@/auth';
import prisma from '@/lib/prisma';

// 출금 신청 거부 API
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
    const { reason, memo } = body;

    // 출금 신청 조회
    const withdrawal = await prisma.pointWithdrawal.findUnique({
      where: { id: params.id },
      include: {
        user: true
      }
    });

    if (!withdrawal) {
      return NextResponse.json(
        { success: false, error: '출금 신청을 찾을 수 없습니다.' },
        { status: 404 }
      );
    }

    // 이미 처리된 신청인지 확인
    if (withdrawal.status !== 'PENDING') {
      return NextResponse.json(
        { success: false, error: '이미 처리된 출금 신청입니다.' },
        { status: 400 }
      );
    }

    // 트랜잭션으로 출금 신청 거부 및 사용자 포인트 복구
    const result = await prisma.$transaction(async (tx) => {
      // 출금 신청 상태 업데이트
      const updatedWithdrawal = await tx.pointWithdrawal.update({
        where: { id: params.id },
        data: {
          status: 'REJECTED',
          processedAt: new Date(),
          processedBy: authUser.id,
          reason: reason || '관리자에 의해 거부됨',
          memo: memo || withdrawal.memo
        }
      });

      // 사용자 포인트 복구 (0원 신청이 아닌 경우에만)
      if (withdrawal.amount > 0) {
        await tx.user.update({
          where: { id: withdrawal.userId },
          data: {
            points: {
              increment: withdrawal.amount
            }
          }
        });
      }

      return updatedWithdrawal;
    });

    // 응답 반환
    return NextResponse.json({
      success: true,
      message: '출금 신청이 거부되었습니다.',
      withdrawal: result
    });
  } catch (error) {
    console.error('출금 신청 거부 오류:', error);
    return NextResponse.json(
      { success: false, error: '서버 오류가 발생했습니다.' },
      { status: 500 }
    );
  }
}
