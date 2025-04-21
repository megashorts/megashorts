// src/app/api/admin/team-master-remove/route.ts 티마스터 자격 해제

import { validateRequest } from '@/auth';
import prisma from '@/lib/prisma';
import { USER_ROLE } from '@/lib/constants';
import { NextRequest } from 'next/server';

export async function POST(request: NextRequest) {
  try {
    const { user } = await validateRequest();
    
    // 권한 확인 (OPERATION3 이상)
    if (!user || user.userRole < USER_ROLE.OPERATION3) {
      return Response.json(
        { success: false, error: 'Unauthorized' },
        { status: 401 }
      );
    }
    
    const data = await request.json();
    const { userId } = data;
    
    if (!userId) {
      return Response.json(
        { success: false, error: "Missing userId parameter" },
        { status: 400 }
      );
    }
    
    // 사용자 역할 변경 (일반 사용자로)
    await prisma.user.update({
      where: { id: userId },
      data: { userRole: USER_ROLE.USER }
    });
    
    // 팀마스터 설정 삭제
    await prisma.systemSetting.delete({
      where: { key: `agencySettings_${userId}` }
    }).catch(() => {
      // 설정이 없는 경우 무시
      console.log(`No settings found for user ${userId}`);
    });
    
    return Response.json({
      success: true,
      message: "팀마스터 설정이 해제되었습니다."
    });
  } catch (error) {
    console.error("Error removing team master:", error);
    return Response.json(
      { success: false, error: "Internal server error" },
      { status: 500 }
    );
  }
}
