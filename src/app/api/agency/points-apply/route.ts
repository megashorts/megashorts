import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { validateRequest } from '@/auth';

/**
 * 포인트 지급 API
 * 
 * 이 API는 워커에서 호출하여 포인트를 지급하고 자격을 업데이트합니다.
 * 주간 정산 결과를 기반으로 사용자 포인트를 업데이트합니다.
 */
export async function POST(request: NextRequest) {
  try {
    // 인증 확인
    const { user } = await validateRequest();
    const authHeader = request.headers.get('Authorization');
    const apiKey = process.env.WORKER_API_KEY;
    
    if (!user?.userRole || user.userRole < 100) { // 관리자 권한 확인
      // API 키 확인
      if (!authHeader?.startsWith('Bearer ') || authHeader.split(' ')[1] !== apiKey) {
        return NextResponse.json(
          { success: false, error: 'Unauthorized' },
          { status: 401 }
        );
      }
    }
    
    // 요청 본문 파싱
    const body = await request.json();
    const { weeklySettlementId, weekRange, distributions } = body;
    
    if (!weeklySettlementId || !weekRange || !distributions || !Array.isArray(distributions)) {
      return NextResponse.json(
        { success: false, error: 'Invalid request body' },
        { status: 400 }
      );
    }
    
    // 트랜잭션으로 포인트 지급 처리
    await prisma.$transaction(async (tx) => {
      // 포인트 지급 내역 저장
      await tx.payment.create({
        data: {
          id: weeklySettlementId,
          userId: 'system', // 시스템 사용자 ID
          type: 'AGENCY_SETTLEMENT',
          status: 'COMPLETED',
          amount: 0, // 총 지급 금액은 나중에 계산
          orderId: `settlement-${weeklySettlementId}`,
          // requestedAt: new Date(),
          approvedAt: new Date(),
          metadata: {
            weekRange,
            distributionCount: distributions.length
          }
        }
      });
      
      // 각 사용자별 포인트 지급
      for (const distribution of distributions) {
        if (distribution.grantedAmount > 0) {
          // 사용자 포인트 업데이트
          await tx.user.update({
            where: { id: distribution.userId },
            data: {
              points: {
                increment: distribution.grantedAmount
              }
            }
          });
          
          // 포인트 지급 알림 생성
          await tx.notification.create({
            data: {
              recipientId: distribution.userId,
              issuerId: 'system', // 시스템 사용자 ID
              type: 'POINT',
              read: false,
              metadata: {
                amount: distribution.grantedAmount,
                settlementId: weeklySettlementId,
                userType: distribution.userType
              }
            }
          });
        }
      }
    });
    
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error in points-apply API:', error);
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    );
  }
}
