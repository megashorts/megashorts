import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { validateRequest } from '@/auth';

// 설정 키 상수
const SETTING_KEYS = {
  LOGGING_CATEGORIES: 'logging_categories',
  MAIN_PAGE_LAYOUT: 'main_page_layout'
} as const;

// 설정 조회
export async function GET(request: NextRequest) {
  try {
    // URL에서 설정 키 가져오기
    const key = request.nextUrl.searchParams.get('key');
    if (!key) {
      return NextResponse.json({ error: 'Setting key is required' }, { status: 400 });
    }

    // 설정 조회
    const setting = await prisma.systemSetting.findUnique({
      where: { key }
    });

    return NextResponse.json({
      success: true,
      data: setting?.value ?? null
    });

  } catch (error) {
    console.error('Failed to fetch setting:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// 설정 업데이트
export async function POST(request: NextRequest) {
  try {
    // 관리자 권한 체크 - 설정 변경 시에만 체크
    const { user } = await validateRequest();
    if (!user || user.userRole < 90) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // 요청 데이터 파싱
    const body = await request.json();
    const { key, value } = body;

    if (!key || value === undefined) {
      return NextResponse.json(
        { error: 'Key and value are required' },
        { status: 400 }
      );
    }

    // 설정별 유효성 검사
    if (key === SETTING_KEYS.LOGGING_CATEGORIES) {
      if (typeof value !== 'object' || !value) {
        return NextResponse.json(
          { error: 'Invalid logging categories format' },
          { status: 400 }
        );
      }
    }

    // 설정 업데이트 또는 생성
    const setting = await prisma.systemSetting.upsert({
      where: { key },
      update: {
        value,
        updatedBy: user.id,
        updatedAt: new Date()
      },
      create: {
        key,
        value,
        updatedBy: user.id
      }
    });

    return NextResponse.json({
      success: true,
      data: setting
    });

  } catch (error) {
    console.error('Failed to update setting:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
