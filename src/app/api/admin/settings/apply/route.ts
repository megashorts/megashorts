// apply for setting page

import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";

// 환경변수로 관리할 시스템 설정 키 목록
const SYSTEM_ENV_KEYS = [
  'serviceLogEnabled',   // 서비스 로그
  'viewCoinAmount',      // COIN_PAY
  'eventCoin1Amount',    // EVENT_COIN1
  'eventCoin2Amount',    // EVENT_COIN2
  'minWithdrawPoint',    // MIN_WITHDRAW
  'referralCoinAmount'   // REFERRAL_COIN
];

// 환경변수 키 매핑 (시스템 설정 키 -> 환경변수 이름)
const ENV_KEY_MAP: Record<string, string> = {
  'serviceLogEnabled': 'SYSTEM_SERVICELOGENABLED',
  'viewCoinAmount': 'SYSTEM_VIEWCOINAMOUNT',
  'eventCoin1Amount': 'SYSTEM_EVENTCOIN1AMOUNT',
  'eventCoin2Amount': 'SYSTEM_EVENTCOIN2AMOUNT',
  'minWithdrawPoint': 'SYSTEM_MINWITHDRAWPOINT',
  'referralCoinAmount': 'SYSTEM_REFERRALCOINAMOUNT'
};

export async function POST() {
  try {
    // 1. 시스템 설정 조회 (지정된 키만)
    const settings = await prisma.systemSetting.findMany({
      where: {
        key: {
          in: SYSTEM_ENV_KEYS
        }
      }
    });

    // 2. 환경변수 객체 생성
    const envUpdates = settings.map(setting => {
      const settingValue = setting.value as { enabled: boolean; value: string | number | boolean };
      const envKey = ENV_KEY_MAP[setting.key];
      
      // 불리언 값은 'true'/'false' 문자열로, 나머지는 문자열로 변환
      const envValue = typeof settingValue.value === 'boolean' 
        ? String(settingValue.value) 
        : String(settingValue.value);

      return {
        key: envKey,
        value: envValue,
        type: 'plain' as const,
        target: ['production', 'preview', 'development'] as const
      };
    });

    // 3. Vercel 환경변수 업데이트
    const response = await fetch(
      `https://api.vercel.com/v1/projects/${process.env.VERCEL_PROJECT_ID}/env`,
      {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${process.env.VERCEL_ACCESS_TOKEN}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ envs: envUpdates })
      }
    );

    if (!response.ok) {
      const errorData = await response.json();
      console.error('Vercel API Error:', errorData);
      throw new Error('Failed to update Vercel environment variables');
    }

    return NextResponse.json({ 
      success: true,
      updated: envUpdates.map(env => env.key)
    });
  } catch (error) {
    console.error('Failed to apply settings:', error);
    return NextResponse.json(
      { error: 'Failed to apply settings' },
      { status: 500 }
    );
  }
}
