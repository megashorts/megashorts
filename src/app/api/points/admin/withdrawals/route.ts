import { NextRequest, NextResponse } from 'next/server';
import { validateRequest } from '@/auth';
import prisma from '@/lib/prisma';

// 출금 신청 내역 조회 API
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

    // 관리자 권한 확인 (userRole이 20 이상이면 접근 허용)
    if (authUser.userRole < 20) {
      return NextResponse.json(
        { success: false, error: '관리자 권한이 필요합니다.' },
        { status: 403 }
      );
    }

    // 쿼리 파라미터 파싱
    const url = new URL(request.url);
    const status = url.searchParams.get('status') || 'all';
    const period = url.searchParams.get('period') || 'all';
    const search = url.searchParams.get('search') || '';
    const page = parseInt(url.searchParams.get('page') || '1', 10);
    const limit = parseInt(url.searchParams.get('limit') || '10', 10);

    // 필터 조건 구성
    const where: any = {};
    
    // 상태 필터
    if (status !== 'all') {
      where.status = status;
    }
    
    // 기간 필터
    if (period !== 'all') {
      const now = new Date();
      let startDate: Date;
      
      switch (period) {
        case '7days':
          startDate = new Date(now.setDate(now.getDate() - 7));
          break;
        case '30days':
          startDate = new Date(now.setDate(now.getDate() - 30));
          break;
        case '90days':
          startDate = new Date(now.setDate(now.getDate() - 90));
          break;
        default:
          startDate = new Date(0); // 1970년 1월 1일
      }
      
      where.requestedAt = {
        gte: startDate
      };
    }
    
    // 검색 필터
    if (search) {
      where.OR = [
        {
          user: {
            username: {
              contains: search,
              mode: 'insensitive'
            }
          }
        },
        {
          user: {
            displayName: {
              contains: search,
              mode: 'insensitive'
            }
          }
        },
        {
          bankInfo: {
            path: ['accountNumber'],
            string_contains: search
          }
        }
      ];
    }

    // 총 개수 조회
    const total = await prisma.pointWithdrawal.count({ where });
    
    // 페이지네이션 적용하여 데이터 조회
    const withdrawals = await prisma.pointWithdrawal.findMany({
      where,
      include: {
        user: {
          select: {
            username: true,
            displayName: true,
            userRole: true
          }
        },
        processor: {
          select: {
            username: true,
            displayName: true
          }
        }
      },
      orderBy: {
        requestedAt: 'desc'
      },
      skip: (page - 1) * limit,
      take: limit
    });

    // 응답 데이터 가공
    const formattedWithdrawals = withdrawals.map(withdrawal => ({
      id: withdrawal.id,
      userId: withdrawal.userId,
      username: withdrawal.user.username,
      displayName: withdrawal.user.displayName,
      userRole: withdrawal.user.userRole,
      amount: withdrawal.amount,
      status: withdrawal.status,
      bankInfo: withdrawal.bankInfo,
      requestedAt: withdrawal.requestedAt,
      processedAt: withdrawal.processedAt,
      processedBy: withdrawal.processedBy,
      processor: withdrawal.processor ? {
        username: withdrawal.processor.username,
        displayName: withdrawal.processor.displayName
      } : null,
      reason: withdrawal.reason,
      paymentAmount: withdrawal.paymentAmount,
      exchangeRate: withdrawal.exchangeRate,
      memo: withdrawal.memo
    }));

    // 응답 반환
    return NextResponse.json({
      success: true,
      withdrawals: formattedWithdrawals,
      pagination: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit)
      }
    });
  } catch (error) {
    console.error('출금 신청 내역 조회 오류:', error);
    return NextResponse.json(
      { success: false, error: '서버 오류가 발생했습니다.' },
      { status: 500 }
    );
  }
}
