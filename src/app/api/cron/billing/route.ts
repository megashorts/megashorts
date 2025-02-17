import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { Prisma } from '@prisma/client';

export async function GET(req: Request) {
  try {
    const now = new Date();
    const kstMidnight = new Date(now.getTime() + 9 * 60 * 60 * 1000);
    kstMidnight.setHours(0, 0, 0, 0);
    const kstTomorrow = new Date(kstMidnight.getTime() + 24 * 60 * 60 * 1000);

    const subscriptions = await prisma.subscription.findMany({
      where: {
        status: 'active',
        currentPeriodEnd: {
          gte: kstMidnight,
          lt: kstTomorrow
        }
      },
      include: {
        billingKey: true  // billingKeys -> billingKey
      }
    });

    for (const subscription of subscriptions) {
      if (!subscription.billingKey || subscription.billingKey.status !== 'active') continue;

      const amount = subscription.type === 'weekly' ? 8500 : 190000;
      const orderId = `AUTO_${subscription.userId}_${Date.now()}`;

      try {
        const response = await fetch(
          `https://api.tosspayments.com/v1/billing/${subscription.billingKey.billingKey}`,
          {
            method: 'POST',
            headers: {
              Authorization: `Basic ${btoa(process.env.TOSS_PAYMENTS_SECRET_KEY + ':')}`,
              'Content-Type': 'application/json'
            },
            body: JSON.stringify({
              amount,
              orderId,
              customerKey: subscription.billingKey.customerKey,
              orderName: `${subscription.type} 구독 자동결제`
            })
          }
        );

        if (!response.ok) {
          throw new Error('결제 요청 실패');
        }

        // metadata를 Record<string, any> 타입으로 지정
        const metadata: Record<string, any> = {
          subscriptionType: subscription.type,
          isAutoPayment: true,
          nextPeriodEnd: subscription.type === 'weekly'
            ? new Date(subscription.currentPeriodEnd.getTime() + 7 * 24 * 60 * 60 * 1000).toISOString()
            : new Date(subscription.currentPeriodEnd.getFullYear() + 1, subscription.currentPeriodEnd.getMonth(), subscription.currentPeriodEnd.getDate()).toISOString()
        };

        await prisma.payment.create({
          data: {
            userId: subscription.userId,
            type: 'subscription',
            status: 'pending',
            amount,
            orderId,
            billingKey: subscription.billingKey.billingKey,
            method: 'card',
            requestedAt: new Date(),
            metadata: metadata as Prisma.InputJsonValue  // 타입 캐스팅
          }
        });

      } catch (err) {
        const error = err as Error;
        
        await prisma.subscription.update({
          where: { id: subscription.id },
          data: {
            failCount: { increment: 1 },
            lastFailedAt: new Date(),
            nextRetryAt: new Date(Date.now() + 24 * 60 * 60 * 1000)
          }
        });

        console.error('Auto billing failed:', {
          userId: subscription.userId,
          error: error.message || 'Unknown error'
        });
      }
    }

    return NextResponse.json({ success: true });

  } catch (err) {
    const error = err as Error;
    return NextResponse.json(
      { error: error.message || 'Internal server error' },
      { status: 500 }
    );
  }
}