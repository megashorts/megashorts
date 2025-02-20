import { headers } from 'next/headers';
import prisma from '@/lib/prisma';

interface PaymentMetadata {
  coins?: number;
  subscriptionType?: 'weekly' | 'yearly';
  isAutoPayment?: boolean;
  nextPeriodEnd?: string;
  periodEnd?: string;
}

export async function POST(req: Request) {
  try {
    const headersList = await headers();
    const signature = headersList.get('x-tosspayments-signature');
    if (!signature) {
      return Response.json({ error: 'Missing signature' }, { status: 401 });
    }

    const payload = await req.json();
    
    // webhookLog 모델 사용 (camelCase)
    const log = await prisma.webhookLog.create({
      data: {
        eventType: payload.eventType,
        payload,
        status: 'pending'
      }
    });

    try {
      if (payload.eventType === 'PAYMENT_STATUS_CHANGED') {
        const { status, orderId, paymentKey } = payload;
        
        const payment = await prisma.payment.findUnique({
          where: { orderId }
        });

        if (!payment) {
          throw new Error(`Payment not found: ${orderId}`);
        }

        const metadata = payment.metadata as PaymentMetadata;

        switch (status) {
          case 'DONE': {
            await prisma.$transaction(async (tx) => {
              await tx.payment.update({
                where: { id: payment.id },
                data: {
                  status: 'success',
                  paymentKey,
                  approvedAt: new Date(),
                  updatedAt: new Date()
                }
              });

              if (payment.type === 'coin' && metadata.coins) {
                await tx.user.update({
                  where: { id: payment.userId },
                  data: {
                    mscoin: { increment: metadata.coins }
                  }
                });
              } else if (payment.type === 'subscription' && metadata.subscriptionType) {
                const periodEnd = metadata.isAutoPayment && metadata.nextPeriodEnd
                  ? new Date(metadata.nextPeriodEnd)
                  : metadata.periodEnd
                  ? new Date(metadata.periodEnd)
                  : undefined;

                if (periodEnd) {
                  await tx.subscription.update({
                    where: { userId: payment.userId },
                    data: {
                      status: 'active',
                      currentPeriodEnd: periodEnd,
                      updatedAt: new Date()
                    }
                  });

                  await tx.user.update({
                    where: { id: payment.userId },
                    data: {
                      subscriptionEndDate: periodEnd
                    }
                  });
                }
              }
            });
            break;
          }

          case 'CANCELED': {
            await prisma.$transaction(async (tx) => {
              await tx.payment.update({
                where: { id: payment.id },
                data: {
                  status: 'cancelled',
                  updatedAt: new Date()
                }
              });

              if (payment.type === 'coin' && payment.status === 'success' && metadata.coins) {
                await tx.user.update({
                  where: { id: payment.userId },
                  data: {
                    mscoin: { decrement: metadata.coins }
                  }
                });
              } else if (payment.type === 'subscription') {
                await tx.subscription.update({
                  where: { userId: payment.userId },
                  data: {
                    status: 'cancelled',
                    updatedAt: new Date()
                  }
                });
              }
            });
            break;
          }
        }
      }

      await prisma.webhookLog.update({
        where: { id: log.id },
        data: { status: 'success' }
      });

      return new Response('OK');
    } catch (err) {
      const error = err as Error;
      await prisma.webhookLog.update({
        where: { id: log.id },
        data: { 
          status: 'failed',
          error: error.message || 'Unknown error'
        }
      });
      throw error;
    }
  } catch (err) {
    const error = err as Error;
    console.error('Webhook error:', error);
    return new Response('Error', { status: 500 });
  }
}