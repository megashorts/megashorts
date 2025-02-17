import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';

export async function GET() {
  // 1. 일반 API 응답 테스트
  return NextResponse.json({ message: 'Test endpoint' });
}

export async function POST() {
  // 2. DB 작업 테스트
  try {
    // 테스트용 임시 사용자 생성
    const testUser = await prisma.user.update({
      where: {
        id: 'avtpj76tmacx3ln4'
      },
      data: {
        bio: `Test update at ${new Date().toISOString()}`
      }
    });
    
    return NextResponse.json({ success: true, user: testUser });
  } catch (error) {
    console.error('Test error:', error);
    return NextResponse.json({ success: false, error: 'Test failed' }, { status: 500 });
  }
}