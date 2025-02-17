import { validateRequest } from '@/auth';
import prisma from '@/lib/prisma';

export async function POST(req: Request) {
  try {
    const { user } = await validateRequest();
    if (!user || user.userRole < 15) {
      return Response.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const { paymentKey } = await req.json();
    if (!paymentKey) {
      return Response.json(
        { error: 'Payment key is required' },
        { status: 400 }
      );
    }

    const response = await fetch(
      `https://api.tosspayments.com/v1/payments/${paymentKey}/cancel`,
      {
        method: 'POST',
        headers: {
          Authorization: `Basic ${btoa(process.env.TOSS_PAYMENTS_SECRET_KEY + ':')}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          cancelReason: '관리자 취소'
        })
      }
    );

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.message || 'Cancel request failed');
    }

    return Response.json({ success: true });
  } catch (err) {
    const error = err as Error;
    return Response.json(
      { error: error.message || 'Internal server error' },
      { status: 500 }
    );
  }
}