// app/api/creator-info/[userId]/route.ts

import { NextRequest, NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';
import { sendTelegramNotification } from '@/lib/telegram';

const prisma = new PrismaClient();

export async function POST(
  request: NextRequest,
  { params }: { params: { userId: string } }
) {
  try {
    const { userId } = params;
    const data = await request.json();

    const {
      accountHolder,
      bankName,
      accountNumber,
      country,
      swiftCode,
      paypalEmail,
      phoneNumber,
      address
    } = data;

    // 필수 필드 검증
    if (!accountHolder || !bankName || !accountNumber) {
      return NextResponse.json({
        success: false,
        error: '필수 정보(예금주, 은행명, 계좌번호)가 누락되었습니다.'
      }, { status: 400 });
    }

    // 사용자 존재 확인
    const user = await prisma.user.findUnique({
      where: { id: userId }
    });

    if (!user) {
      return NextResponse.json({
        success: false,
        error: '사용자를 찾을 수 없습니다.'
      }, { status: 404 });
    }

    // CreatorInfo 생성 또는 업데이트
    const creatorInfo = await prisma.creatorInfo.upsert({
      where: { userId },
      update: {
        accountHolder,
        bankName,
        accountNumber,
        country: country || 'KR',
        swiftCode: swiftCode || null,
        paypalEmail: paypalEmail || null,
        phoneNumber: phoneNumber || null,
        address: address || null
      },
      create: {
        userId,
        accountHolder,
        bankName,
        accountNumber,
        country: country || 'KR',
        swiftCode: swiftCode || null,
        paypalEmail: paypalEmail || null,
        phoneNumber: phoneNumber || null,
        address: address || null,
        idCheck: false // 기본값은 false, 관리자가 별도로 확인 후 변경
      }
    });

    // 텔레그램 알림 발송
    try {
      const message = `🆕 크리에이터 정보 등록/수정\n\n` +
        `📋 사용자: ${user.displayName} (${user.username})\n` +
        `💳 예금주: ${accountHolder}\n` +
        `🏦 은행: ${bankName}\n` +
        `💰 계좌: ${accountNumber}\n` +
        `🌍 국가: ${country}\n` +
        `📧 이메일: ${user.email || 'N/A'}\n` +
        `📞 전화: ${phoneNumber || 'N/A'}\n` +
        `🏠 주소: ${address || 'N/A'}\n` +
        `🔍 신분증 확인: ${creatorInfo.idCheck ? '완료' : '대기 중'}\n\n` +
        `⚠️ 관리자 확인이 필요합니다.`;

      await sendTelegramNotification(message);
    } catch (telegramError) {
      console.error('텔레그램 알림 발송 실패:', telegramError);
      // 텔레그램 실패해도 API는 성공으로 처리
    }

    return NextResponse.json({
      success: true,
      data: creatorInfo
    });

  } catch (error) {
    console.error('크리에이터 정보 저장 오류:', error);
    return NextResponse.json({
      success: false,
      error: '크리에이터 정보 저장 중 오류가 발생했습니다.'
    }, { status: 500 });
  }
}