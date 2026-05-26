import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';

export async function GET() {
  try {
    const now = new Date();
    const kstMidnight = new Date(now.getTime() + 9 * 60 * 60 * 1000);
    kstMidnight.setHours(0, 0, 0, 0);
    const kstTomorrow = new Date(kstMidnight.getTime() + 24 * 60 * 60 * 1000);

    // 1. 기간이 만료된 구독 중 cancelAtPeriodEnd가 true인 경우 상태를 cancelled로 변경
    await prisma.subscription.updateMany({
      where: {
        status: 'active',
        cancelAtPeriodEnd: true,
        currentPeriodEnd: {
          lt: kstMidnight // 오늘 자정 이전에 만료된 구독
        }
      },
      data: {
        status: 'cancelled'
      }
    });

    // Legacy external auto-billing has been removed. Keep the subscription
    // expiry transition so existing subscription rows remain consistent until
    // the next global payment provider is implemented.
    const renewalCandidates = await prisma.subscription.count({
      where: {
        status: 'active',
        cancelAtPeriodEnd: false,
        currentPeriodEnd: {
          gte: kstMidnight,
          lt: kstTomorrow
        }
      }
    });

    return NextResponse.json({
      success: true,
      externalBillingEnabled: false,
      renewalCandidates,
    });

  } catch (err) {
    const error = err as Error;
    return NextResponse.json(
      { error: error.message || 'Internal server error' },
      { status: 500 }
    );
  }
}
