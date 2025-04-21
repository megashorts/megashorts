// src/app/api/admin/users/[userId]/role/route.ts 팀마스터 지정설정에서 팀마스터 유저롤 권한 부여 라우터

import { validateRequest } from '@/auth';
import prisma from '@/lib/prisma';
import { USER_ROLE } from '@/lib/constants';
import { NextRequest } from 'next/server';

export async function PATCH(request: NextRequest) {
  try {
    // URL에서 직접 userId 추출
    const url = request.url;
    const urlParts = url.split('/');
    const userId = urlParts[urlParts.length - 2]; // URL 형식: .../users/[userId]/role
    
    const { user } = await validateRequest();
    
    // 권한 확인 (OPERATION3 이상)
    if (!user || user.userRole < USER_ROLE.OPERATION3) {
      return Response.json(
        { success: false, error: 'Unauthorized' },
        { status: 401 }
      );
    }
    
    if (!userId) {
      return Response.json(
        { success: false, error: "Missing userId parameter" },
        { status: 400 }
      );
    }
    
    const body = await request.json();
    const { userRole } = body;
    
    if (userRole === undefined || typeof userRole !== 'number') {
      return Response.json(
        { success: false, error: "Invalid userRole parameter" },
        { status: 400 }
      );
    }
    
    // 현재 사용자의 username 가져오기
    const targetUser = await prisma.user.findUnique({
      where: { id: userId },
      select: { username: true }
    });

    if (!targetUser) {
      return Response.json(
        { success: false, error: "User not found" },
        { status: 404 }
      );
    }

    // 사용자 역할 업데이트
    const updatedUser = await prisma.user.update({
      where: { id: userId },
      data: { userRole, teamMaster: userId },
      select: {
        id: true,
        username: true,
        userRole: true,
        teamMaster: true
      }
    });
    
    return Response.json({
      success: true,
      user: updatedUser
    });
  } catch (error) {
    console.error("Error updating user role:", error);
    return Response.json(
      { success: false, error: "Internal server error" },
      { status: 500 }
    );
  }
}
