"use server";

import { headers } from 'next/headers';
import type { LoginLog } from '@/lib/activity-logger/types';

export async function testServerAction() {
  try {
    const headersList = await headers();
    const ip = headersList.get('x-forwarded-for')?.split(',')[0] || 
               headersList.get('x-real-ip') || 
               '0.0.0.0';
    const userAgent = headersList.get('user-agent') || 'unknown';

    // 로그 데이터 생성
    const logData: LoginLog = {
      type: 'login',
      category: 'login',
      event: 'attempt',
      method: 'email',
      ip,
      userAgent
    };

    return { 
      success: true,
      logData  // 로그 데이터를 결과와 함께 반환
    };
  } catch (error) {
    console.error('Test action error:', error);
    return { success: false, error };
  }
}
