import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { validateRequest } from '@/auth';

/**
 * 업로더 레벨 조회 API
 * 
 * 이 API는 워커에서 호출하여 특정 업로더의 레벨을 조회합니다.
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
        userRole: true,
        postCount: true
      }
    });
    
    if (!userInfo) {
      return NextResponse.json(
        { success: false, error: 'User not found' },
        { status: 404 }
      );
    }
    
    // 업로더 레벨 계산
    // 실제 구현에서는 userRole 값을 기반으로 업로더 레벨을 계산
    // 여기서는 간단히 userRole / 10으로 계산 (최소 1, 최대 5)
    const uploaderLevel = Math.min(5, Math.max(1, Math.floor(userInfo.userRole / 10)));
    
    return NextResponse.json({ 
      success: true,
      data: {
        id: userInfo.id,
        username: userInfo.username,
        uploaderLevel: uploaderLevel
      }
    });
  } catch (error) {
    console.error('Error in uploader-level API:', error);
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    );
  }
}
