// src/app/api/agency/distributions/route.ts

import { validateRequest } from '@/auth';
import prisma from '@/lib/prisma';
import { USER_ROLE } from '@/lib/constants';
import { NextRequest } from 'next/server';

export async function GET(request: NextRequest) {
  try {
    const { user } = await validateRequest();
    
    if (!user || user.userRole < USER_ROLE.TEAM_MEMBER) {
      return Response.json(
        { success: false, error: 'Unauthorized' },
        { status: 401 }
      );
    }
    
    const { searchParams } = new URL(request.url);
    const userId = searchParams.get("userId");
    const year = searchParams.get("year");
    const week = searchParams.get("week");
    
    if (!userId) {
      return Response.json(
        { success: false, error: "Missing userId parameter" },
        { status: 400 }
      );
    }
    
    // 시스템 설정에서 포인트 분배 내역 조회
    let distributions = [];
    
    if (year && week) {
      // 특정 연도와 주차에 대한 분배 내역 조회
      const distributionSetting = await prisma.systemSetting.findFirst({
        where: {
          key: `pointDistribution_${year}_W${week.padStart(2, '0')}`
        }
      });
      
      if (distributionSetting) {
        const allDistributions = distributionSetting.value as any[];
        distributions = allDistributions.filter((d: any) => 
          d.userId === userId || 
          d.distributionDetails.some((detail: any) => detail.masterId === userId)
        );
      }
    } else {
      // 최근 4주의 분배 내역 조회
      const distributionSettings = await prisma.systemSetting.findMany({
        where: {
          key: {
            startsWith: 'pointDistribution_'
          }
        },
        orderBy: {
          updatedAt: 'desc'
        },
        take: 4
      });
      
      for (const setting of distributionSettings) {
        const allDistributions = setting.value as any[];
        const userDistributions = allDistributions.filter((d: any) => 
          d.userId === userId || 
          d.distributionDetails.some((detail: any) => detail.masterId === userId)
        );
        
        distributions.push(...userDistributions);
      }
    }
    
    return Response.json({
      success: true,
      data: distributions
    });
  } catch (error) {
    console.error("Error fetching point distributions:", error);
    return Response.json(
      { success: false, error: "Internal server error" },
      { status: 500 }
    );
  }
}