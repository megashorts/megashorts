import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { validateRequest } from '@/auth';

/**
 * 업로더 정보 내보내기 API
 * 
 * 이 API는 워커에서 호출하여 업로더 정보를 가져옵니다.
 * 워커는 이 데이터를 기반으로 포인트 계산을 수행합니다.
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
    
    // 업로더 정보 가져오기 (포스트가 있는 사용자)
    const uploaders = await prisma.user.findMany({
      where: {
        postCount: {
          gt: 0
        }
      },
      select: {
        id: true,
        username: true,
        userRole: true,
        points: true,
        posts: {
          select: {
            id: true
          },
          take: 1
        }
      }
    });
    
    // 데이터 변환
    const formattedUploaders = uploaders.map(uploader => ({
      id: uploader.id,
      username: uploader.username,
      uploaderLevel: Math.max(1, Math.floor(uploader.userRole / 10)), // userRole을 기반으로 업로더 레벨 계산
      points: uploader.points
    }));
    
    return NextResponse.json({ 
      success: true,
      data: formattedUploaders
    });
  } catch (error) {
    console.error('Error in uploaders-export API:', error);
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    );
  }
}
