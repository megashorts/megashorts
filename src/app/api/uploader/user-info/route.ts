import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { validateRequest } from '@/auth';

/**
 * 사용자 정보 조회 API
 * 
 * 이 API는 워커에서 호출하여 특정 사용자의 정보를 조회합니다.
 * 워커는 이 데이터를 기반으로 포인트 계산을 수행합니다.
 */
export async function GET(request: NextRequest) {
  try {
    // 인증 확인
    const { user } = await validateRequest();
    const authHeader = request.headers.get('Authorization');
    const apiKey = process.env.WORKER_API_KEY;
    
    if (!user?.userRole || user.userRole < 100) { // 관리자 권한 확인
      // API 키 확인
      if (!authHeader?.startsWith('Bearer ') || authHeader.split(' ')[1] !== apiKey) {
        return NextResponse.json(
          { success: false, error: 'Unauthorized' },
          { status: 401 }
        );
      }
    }
    
    // 요청 파라미터 파싱
    const url = new URL(request.url);
    const userId = url.searchParams.get('userId');
    
    if (!userId) {
      return NextResponse.json(
        { success: false, error: 'Missing userId parameter' },
        { status: 400 }
      );
    }
    
    // 사용자 정보 조회
    const userInfo = await prisma.user.findUnique({
      where: {
        id: userId
      },
      select: {
        id: true,
        username: true,
        displayName: true,
        userRole: true,
        points: true
      }
    });
    
    if (!userInfo) {
      return NextResponse.json(
        { success: false, error: 'User not found' },
        { status: 404 }
      );
    }
    
    return NextResponse.json({ 
      success: true,
      data: {
        id: userInfo.id,
        username: userInfo.username,
        displayName: userInfo.displayName,
        userRole: userInfo.userRole
      }
    });
  } catch (error) {
    console.error('Error in user-info API:', error);
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    );
  }
}
