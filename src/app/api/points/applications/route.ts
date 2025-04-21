import { NextRequest, NextResponse } from 'next/server';
import { validateRequest } from '@/auth';

// 포인트 지급 신청 내역 조회 API
export async function GET(request: NextRequest) {
  try {
    // 인증 확인
    const { user: authUser, session } = await validateRequest();
    if (!authUser || !session) {
      return NextResponse.json(
        { success: false, error: '인증되지 않은 요청입니다.' },
        { status: 401 }
      );
    }

    // 쿼리 파라미터 파싱
    const url = new URL(request.url);
    const userId = url.searchParams.get('userId');
    const period = url.searchParams.get('period') || 'all';

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

    // Cloudflare Worker API 호출
    const workerUrl = process.env.NEXT_PUBLIC_STATS_API_URL || 'https://stats-api.msdevcm.workers.dev';
    const response = await fetch(`${workerUrl}/api/points/applications?userId=${userId}&period=${period}`, {
      headers: {
        'Content-Type': 'application/json'
      }
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      return NextResponse.json(
        { 
          success: false, 
          error: errorData.error || '지급 신청 내역 조회 중 오류가 발생했습니다.',
          status: response.status
        },
        { status: response.status }
      );
    }

    const data = await response.json();
    
    // 응답 반환
    return NextResponse.json(data);
  } catch (error) {
    console.error('지급 신청 내역 조회 오류:', error);
    return NextResponse.json(
      { success: false, error: '서버 오류가 발생했습니다.' },
      { status: 500 }
    );
  }
}
