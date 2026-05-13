// app/api/points/applications/route.ts

import { NextRequest, NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const userId = searchParams.get('userId');
    const period = searchParams.get('period');

    if (!userId) {
      return NextResponse.json({
        success: false,
        error: 'userId가 필요합니다.'
      }, { status: 400 });
    }

    // 기간별 필터링 조건 설정
    let dateFilter = {};
    
    if (period && period !== 'all') {
      const now = new Date();
      
      if (period.includes('Q1')) {
        // 1분기: 1월 1일 ~ 3월 31일
        const year = parseInt(period.split('-')[0]);
        dateFilter = {
          requestedAt: {
            gte: new Date(`${year}-01-01`),
            lte: new Date(`${year}-03-31T23:59:59`)
          }
        };
      } else if (period.includes('-')) {
        // 월별: 2025-01, 2025-02 등
        const [year, month] = period.split('-');
        const startDate = new Date(`${year}-${month}-01`);
        const endDate = new Date(startDate.getFullYear(), startDate.getMonth() + 1, 0, 23, 59, 59);
        
        dateFilter = {
          requestedAt: {
            gte: startDate,
            lte: endDate
          }
        };
      }
    }

    // PointWithdrawal 조회
    const applications = await prisma.pointWithdrawal.findMany({
      where: {
        userId,
        ...dateFilter
      },
      orderBy: {
        requestedAt: 'desc'
      },
      select: {
        id: true,
        amount: true,
        status: true,
        requestedAt: true,
        processedAt: true,
        reason: true
      }
    });

    // 응답 데이터 포맷팅
    const formattedApplications = applications.map(app => ({
      id: app.id,
      amount: app.amount,
      status: app.status,
      createdAt: app.requestedAt.toISOString().split('T')[0], // YYYY-MM-DD 형식
      processedAt: app.processedAt ? app.processedAt.toISOString().split('T')[0] : null,
      reason: app.reason
    }));

    return NextResponse.json({
      success: true,
      data: {
        applications: formattedApplications
      }
    });

  } catch (error) {
    console.error('신청 내역 조회 오류:', error);
    return NextResponse.json({
      success: false,
      error: '신청 내역 조회 중 오류가 발생했습니다.'
    }, { status: 500 });
  }
}