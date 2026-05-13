import { validateRequest } from '@/auth';
import prisma from "@/lib/prisma";
import { NextResponse } from "next/server";

export async function GET() {
  const { user } = await validateRequest();
  
  if (!user) {
    return NextResponse.json(
      { subscription: null, subscriptionEndDate: null, isActive: false }
    );
  }

  const subscription = await prisma.subscription.findUnique({
    where: { userId: user.id },
    select: {
      type: true,
      status: true,
      currentPeriodEnd: true
    }
  });

  return NextResponse.json({
    subscription: subscription?.type || null,
    subscriptionEndDate: subscription?.currentPeriodEnd || null,
    isActive: subscription?.status === 'active'
  });
}