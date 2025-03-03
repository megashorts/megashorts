// src/app/api/admin/team-master-list/route.ts

import { validateRequest } from '@/auth';
import prisma from '@/lib/prisma';
import { USER_ROLE } from '@/lib/constants';
import { NextRequest } from 'next/server';

export async function GET(request: NextRequest) {
  try {
    const { user } = await validateRequest();
    
    // 권한 확인 (OPERATION3 이상)
    if (!user || user.userRole < USER_ROLE.OPERATION3) {
      return Response.json(
        { success: false, error: 'Unauthorized' },
        { status: 401 }
      );
    }
    
    // 팀마스터 목록 가져오기
    const teamMasters = await prisma.user.findMany({
      where: {
        userRole: USER_ROLE.TEAM_MASTER
      },
      select: {
        id: true,
        username: true,
        email: true,
        displayName: true,
        userRole: true,
        avatarUrl: true
      },
      orderBy: {
        displayName: 'asc'
      }
    });
    
    // 각 팀마스터의 설정 정보 가져오기
    const teamMastersWithSettings = await Promise.all(
      teamMasters.map(async (master) => {
        // SystemSetting 모델에서 설정 정보 가져오기
        const settingRecord = await prisma.systemSetting.findFirst({
          where: { key: `agencySettings_${master.id}` }
        });
        
        let settings = null;
        if (settingRecord) {
          try {
            // 이미 객체인 경우
            if (typeof settingRecord.value === 'object') {
              settings = settingRecord.value;
            } 
            // 문자열인 경우 파싱
            else if (typeof settingRecord.value === 'string') {
              settings = JSON.parse(settingRecord.value);
            }
          } catch (e) {
            console.error(`Invalid settings value for user ${master.id}:`, e);
          }
        }
        
        return {
          ...master,
          settings
        };
      })
    );
    
    return Response.json({
      success: true,
      teamMasters: teamMastersWithSettings
    });
  } catch (error) {
    console.error("Error fetching team masters:", error);
    return Response.json(
      { success: false, error: "Internal server error" },
      { status: 500 }
    );
  }
}
