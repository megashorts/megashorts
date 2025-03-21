import { NextRequest, NextResponse } from 'next/server';
import { validateRequest } from '@/auth';

// 포인트 지급 신청 API
export async function POST(request: NextRequest) {
  try {
    // 인증 확인
    const { user: authUser, session } = await validateRequest();
    if (!authUser || !session) {
      return NextResponse.json(
        { success: false, error: '인증되지 않은 요청입니다.' },
        { status: 401 }
      );
    }

    // 요청 본문 파싱
    const body = await request.json();
    const { userId, amount, reason } = body;

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

    // 업로더 또는 에이전시 권한 확인
    if (authUser.userRole < 20 && !isAdmin) {
      return NextResponse.json(
        { success: false, error: '업로더 또는 에이전시 권한이 필요합니다.' },
        { status: 403 }
      );
    }

    // 필수 파라미터 확인
    if (!userId || !amount || !reason) {
      return NextResponse.json(
        { success: false, error: '필수 파라미터가 누락되었습니다.' },
        { status: 400 }
      );
    }

    // Cloudflare Worker API 호출
    const workerUrl = process.env.NEXT_PUBLIC_STATS_API_URL || 'https://stats-api.msdevcm.workers.dev';
    const response = await fetch(`${workerUrl}/api/points/apply`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        userId,
        amount,
        reason,
        requestedBy: authUser.id
      })
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      return NextResponse.json(
        { 
          success: false, 
          error: errorData.error || '포인트 지급 신청 중 오류가 발생했습니다.',
          status: response.status
        },
        { status: response.status }
      );
    }

    const data = await response.json();
    
    // 응답 반환
    return NextResponse.json(data);
  } catch (error) {
    console.error('포인트 지급 신청 오류:', error);
    return NextResponse.json(
      { success: false, error: '서버 오류가 발생했습니다.' },
      { status: 500 }
    );
  }
}
