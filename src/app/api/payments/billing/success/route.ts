'use server'

import { NextRequest, NextResponse } from 'next/server'
import prisma from '@/lib/prisma'
import { validateRequest } from '@/auth';

export async function GET(req: NextRequest) {
  const searchParams = req.nextUrl.searchParams
  const type = searchParams.get('type')
  const amount = searchParams.get('amount')
  const customerKey = searchParams.get('customerKey')
  const authKey = searchParams.get('authKey')

  const message = type === 'weekly'
  ? '주간구독이 시작되었습니다!'
  : type === 'yearly'
  ? '연간구독이 시작되었습니다!'
  : type === 'upgrade'
  ? '연간구독으로 업그레이드 되었습니다!'
  : '알 수 없는 구독 유형입니다.';

  if (!type || !amount || !customerKey || !authKey) {
    return NextResponse.json(
      { error: '필수 파라미터가 누락되었습니다.' },
      { status: 400 }
    )
  }

  try {
    // 현재 사용자 확인
    const { user } = await validateRequest();
    if (!user) {
      return NextResponse.redirect(
        new URL("/subscription?error=인증되지 않은 사용자입니다", req.url)
      );
    }
    
    // customerKey에서 userId 추출 (형식: userId_date_amount)
    const userId = customerKey.split('_')[0]

    // 빌링키 저장
    await prisma.billingKey.create({
      data: {
        userId,
        billingKey: authKey,
        customerKey,
        status: 'active'
      }
    })

    // 결제 정보 저장
    const orderId = `${customerKey}_${Date.now()}`
    await prisma.payment.create({
      data: {
        userId,
        type: 'subscription',
        status: 'success',
        amount: parseInt(amount),
        orderId,
        billingKey: authKey,
        method: 'card',
        requestedAt: new Date(),
        approvedAt: new Date(),
        metadata: {
          subscriptionType: type
        }
      }
    })

    // 구독 정보 생성/업데이트
    // const currentPeriodStart = new Date()
    // const currentPeriodEnd = new Date()
    // if (type === 'weekly') {
    //   currentPeriodEnd.setDate(currentPeriodEnd.getDate() + 7)
    // } else {
    //   currentPeriodEnd.setFullYear(currentPeriodEnd.getFullYear() + 1)
    // }

    // 구독 정보 생성/업데이트
    const currentPeriodStart = new Date();
    let currentPeriodEnd = new Date();

    if (type === 'weekly') {
      // weekly 타입: 현재 날짜로부터 7일 뒤가 종료일
      currentPeriodEnd.setDate(currentPeriodEnd.getDate() + 7);
    } else if (type === 'yearly') {
      // yearly 타입: 현재 날짜로부터 1년 뒤가 종료일
      currentPeriodEnd.setFullYear(currentPeriodEnd.getFullYear() + 1);
    } else if (type === 'upgrade') {
      // upgrade 타입: 현재 구독 만료일로부터 1년 뒤가 종료일
      const currentSubscription = await prisma.subscription.findUnique({
        where: { userId: user.id },
      });

      if (currentSubscription && currentSubscription.currentPeriodEnd) {
        currentPeriodEnd = new Date(currentSubscription.currentPeriodEnd);
        currentPeriodEnd.setFullYear(currentPeriodEnd.getFullYear() + 1);
      } else {
        throw new Error('현재 구독 정보가 없습니다. 업그레이드를 진행할 수 없습니다.');
      }
    } else {
      throw new Error('유효하지 않은 구독 타입입니다.');
    }


    await prisma.subscription.upsert({
      where: { userId },
      create: {
        userId,
        status: 'active',
        type,
        currentPeriodStart,
        currentPeriodEnd,
      },
      update: {
        status: 'active',
        type,
        currentPeriodStart,
        currentPeriodEnd,
      }
    })

    // User 모델의 subscriptionEndDate 업데이트
    await prisma.user.update({
      where: { id: userId },
      data: {
        subscriptionEndDate: currentPeriodEnd
      }
    })

    // 3. 알림 생성
    await prisma.notification.create({
      data: {
        recipientId: userId,
        issuerId: userId,
        type: 'COMMENT',
        metadata: {
          reason: message
        }
      }
    })

    // 성공 페이지로 리다이렉트
    // return NextResponse.redirect(new URL('/usermenu/payments/result/billing/success', req.url))

    // 성공 응답 반환
    return NextResponse.json({
      success: true,
      type,
      amount: Number(amount).toLocaleString()
    });
  
  } catch (error) {
    console.error('결제 처리 중 오류 발생:', error)
    return NextResponse.redirect(new URL('/usermenu/payments/result/billing/fail', req.url))
  }
}
