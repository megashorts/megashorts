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
      // 각 사용자별 포인트 지급
      for (const distribution of distributions) {
        if (distribution.grantedAmount > 0) {
          const orderId = `settlement-${weeklySettlementId}-${distribution.userId}`;
          const existingPayment = await tx.payment.findUnique({
            where: { orderId },
            select: { id: true }
          });

          if (existingPayment) {
            continue;
          }

          // 사용자 포인트 업데이트
          await tx.user.update({
            where: { id: distribution.userId },
            data: {
              points: {
                increment: distribution.grantedAmount
              }
            }
          });

          await tx.payment.upsert({
            where: {
              orderId
            },
            update: {
              status: 'COMPLETED',
              amount: Math.round(distribution.grantedAmount),
              approvedAt: new Date(),
              metadata: {
                weekRange,
                settlementId: weeklySettlementId,
                distribution
              }
            },
            create: {
              userId: distribution.userId,
              type: 'AGENCY_SETTLEMENT',
              status: 'COMPLETED',
              amount: Math.round(distribution.grantedAmount),
              orderId,
              approvedAt: new Date(),
              metadata: {
                weekRange,
                settlementId: weeklySettlementId,
                distribution
              }
            }
          });
          
          // 포인트 지급 알림 생성
          await tx.notification.create({
            data: {
              recipientId: distribution.userId,
              issuerId: distribution.userId,
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

      const distributionKey = buildDistributionKey(weekRange, weeklySettlementId);
      await tx.systemSetting.upsert({
        where: { key: distributionKey },
        update: {
          value: distributions,
          valueType: 'json',
          description: '워커 정산 포인트 분배 내역'
        },
        create: {
          key: distributionKey,
          value: distributions,
          valueType: 'json',
          description: '워커 정산 포인트 분배 내역'
        }
      });
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

function buildDistributionKey(weekRange: string, fallback: string) {
  const weekMatch = String(weekRange || '').match(/(\d{4})-?W?(\d{1,2})/);

  if (weekMatch) {
    return `pointDistribution_${weekMatch[1]}_W${weekMatch[2].padStart(2, '0')}`;
  }

  return `pointDistribution_${fallback}`;
}
