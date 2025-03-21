import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { validateRequest } from '@/auth';

/**
 * 구독자 수 조회 API
 * 
 * 이 API는 워커에서 호출하여 주간 및 연간 구독자 수를 조회합니다.
 * 워커는 이 데이터를 기반으로 포인트 계산을 수행합니다.
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
    
    // 현재 날짜 기준으로 활성 구독자 수 조회
    const now = new Date();
    
    // 구독 정보 조회
    const subscriptions = await prisma.subscription.findMany({
      where: {
        status: 'active',
        currentPeriodEnd: {
          gte: now
        }
      },
      select: {
        id: true,
        type: true
      }
    });
    
    // 주간 및 연간 구독자 수 계산
    let weeklySubscribers = 0;
    let yearlySubscribers = 0;
    
    for (const subscription of subscriptions) {
      if (subscription.type === 'weekly') {
        weeklySubscribers++;
      } else if (subscription.type === 'yearly') {
        yearlySubscribers++;
      }
    }
    
    return NextResponse.json({ 
      success: true,
      data: {
        weekly: weeklySubscribers,
        yearly: yearlySubscribers,
        total: weeklySubscribers + yearlySubscribers
      }
    });
  } catch (error) {
    console.error('Error in subscribers-count API:', error);
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    );
  }
}
