// src/app/api/points/apply/route.ts

import { NextRequest, NextResponse } from 'next/server';
import { validateRequest } from '@/auth';
import { sendTelegramNotification } from '@/lib/telegram';
import prisma from '@/lib/prisma';
import { DEFAULT_SETTINGS } from '@/lib/admin/system-settingspage';

function systemSettingNumber(value: unknown, fallback: number) {
  const settingValue = value as { value?: unknown } | null;
  const numeric = Number(settingValue?.value ?? value);
  return Number.isFinite(numeric) ? numeric : fallback;
}

// 포인트 지급 신청 API
export async function POST(request: NextRequest) {
  try {
    // 인증 확인
    const { user: authUser, session } = await validateRequest();
    if (!authUser || !session) {
      return NextResponse.json(
        { success: false, error: '인증되지 않은 요청입니다.' },
        { status: 401 }
      );
    }

    // 요청 본문 파싱
    const body = await request.json();
    const { userId, amount, reason } = body;

    // 요청한 사용자 ID와 로그인한 사용자 ID가 일치하는지 확인
    // 또는 관리자 권한이 있는지 확인
    const isAdmin = authUser.userRole >= 90;
    const isSameUser = authUser.id === userId;

    if (!isAdmin && !isSameUser) {
      return NextResponse.json(
        { success: false, error: '권한이 없습니다.' },
        { status: 403 }
      );
    }

    // 업로더 또는 에이전시 권한 확인
    if (authUser.userRole < 20 && !isAdmin) {
      return NextResponse.json(
        { success: false, error: '업로더 또는 에이전시 권한이 필요합니다.' },
        { status: 403 }
      );
    }

    // 유효성 검사
    if (!userId || !amount || amount <= 0) {
      return NextResponse.json({
        success: false,
        error: '필수 정보가 누락되었습니다.'
      }, { status: 400 });
    }

    const [user, minWithdrawSetting] = await Promise.all([
      prisma.user.findUnique({
        where: { id: userId },
        include: {
          CreatorInfo: true
        }
      }),
      prisma.systemSetting.findUnique({
        where: { key: 'minWithdrawPoint' },
        select: { value: true },
      }),
    ]);

    if (!user) {
      return NextResponse.json({
        success: false,
        error: '사용자를 찾을 수 없습니다.'
      }, { status: 404 });
    }

    const minWithdrawPoint = systemSettingNumber(minWithdrawSetting?.value, DEFAULT_SETTINGS.minWithdrawPoint.value);
    if (Number(amount) < minWithdrawPoint) {
      return NextResponse.json({
        success: false,
        error: `최소 출금 가능 포인트는 ${minWithdrawPoint.toLocaleString()}P입니다.`
      }, { status: 400 });
    }

    if (!user.emailVerified) {
      return NextResponse.json({
        success: false,
        error: '이메일 인증이 완료되어야 포인트 지급을 신청할 수 있습니다.'
      }, { status: 400 });
    }

    // CreatorInfo 및 idCheck 확인
    if (!user.CreatorInfo || !user.CreatorInfo.idCheck) {
      return NextResponse.json({
        success: false,
        error: '포인트 지급을 위한 정보 제출이나 확인이 완료되지 않았습니다.'
      }, { status: 400 });
    }

    // 사용자 포인트 잔액 확인
    if (Number(user.points || 0) < amount) {
      return NextResponse.json({
        success: false,
        error: '신청 금액이 사용 가능한 포인트를 초과합니다.'
      }, { status: 400 });
    }

    // CreatorInfo에서 bankInfo 생성
    const bankInfo = {
      accountHolder: user.CreatorInfo.accountHolder,
      country: user.CreatorInfo.country,
      bankName: user.CreatorInfo.bankName,
      accountNumber: user.CreatorInfo.accountNumber,
      swiftCode: user.CreatorInfo.swiftCode,
      address: user.CreatorInfo.address,
      phoneNumber: user.CreatorInfo.phoneNumber,
      paypalEmail: user.CreatorInfo.paypalEmail
    };

    // PointWithdrawal 생성
    const pointWithdrawal = await prisma.pointWithdrawal.create({
      data: {
        userId,
        amount,
        bankInfo,
        reason: reason || null,
        status: 'PENDING'
      }
    });

    // 텔레그램 알림 발송
    try {
      const message = `💰 포인트 지급 신청\n\n` +
        `📋 사용자: ${user.displayName} (${user.username})\n` +
        `💵 신청 금액: ${amount.toLocaleString()} 포인트\n` +
        `💳 예금주: ${bankInfo.accountHolder}\n` +
        `🏦 은행: ${bankInfo.bankName}\n` +
        `💰 계좌: ${bankInfo.accountNumber}\n` +
        `🌍 국가: ${bankInfo.country}\n` +
        `📧 이메일: ${user.email || 'N/A'}\n` +
        `📞 전화: ${bankInfo.phoneNumber || 'N/A'}\n` +
        `🏠 주소: ${bankInfo.address || 'N/A'}\n` +
        `💬 신청 사유: ${reason || 'N/A'}\n` +
        `🆔 신청 ID: ${pointWithdrawal.id}\n\n` +
        `⚠️ 관리자 승인이 필요합니다.`;

      await sendTelegramNotification(message);
    } catch (telegramError) {
      console.error('텔레그램 알림 발송 실패:', telegramError);
      // 텔레그램 실패해도 API는 성공으로 처리
    }

    return NextResponse.json({
      success: true,
      data: pointWithdrawal
    });
  } catch (error) {
    console.error('포인트 지급 신청 오류:', error);
    return NextResponse.json(
      { success: false, error: '서버 오류가 발생했습니다.' },
      { status: 500 }
    );
  }
}
