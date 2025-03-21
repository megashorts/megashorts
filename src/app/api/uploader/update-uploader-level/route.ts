import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { validateRequest } from '@/auth';

/**
 * 업로더 레벨 업데이트 API
 * 
 * 이 API는 워커에서 호출하여 특정 업로더의 레벨을 업데이트합니다.
 * 워커는 이 API를 통해 업로더 레벨을 변경합니다.
 */
export async function POST(request: NextRequest) {
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
    
    // 요청 본문 파싱
    const body = await request.json();
    const { userId, level } = body;
    
    if (!userId || !level || typeof level !== 'number' || level < 1 || level > 5) {
      return NextResponse.json(
        { success: false, error: 'Invalid request body' },
        { status: 400 }
      );
    }
    
    // 사용자 존재 여부 확인
    const userExists = await prisma.user.findUnique({
      where: {
        id: userId
      },
      select: {
        id: true
      }
    });
    
    if (!userExists) {
      return NextResponse.json(
        { success: false, error: 'User not found' },
        { status: 404 }
      );
    }
    
    // 업로더 레벨 업데이트
    // 실제 구현에서는 userRole 값을 업데이트
    // 여기서는 간단히 level * 10으로 계산
    const newUserRole = level * 10;
    
    await prisma.user.update({
      where: {
        id: userId
      },
      data: {
        userRole: newUserRole
      }
    });
    
    // 레벨 변경 알림 생성
    await prisma.notification.create({
      data: {
        recipientId: userId,
        issuerId: 'system', // 시스템 사용자 ID
        type: 'POINT',
        read: false,
        metadata: {
          type: 'LEVEL_CHANGE',
          newLevel: level
        }
      }
    });
    
    return NextResponse.json({ 
      success: true,
      data: {
        id: userId,
        newLevel: level
      }
    });
  } catch (error) {
    console.error('Error in update-uploader-level API:', error);
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    );
  }
}
