// src/app/api/admin/users/[userId]/role/route.ts

import { validateRequest } from '@/auth';
import prisma from '@/lib/prisma';
import { USER_ROLE } from '@/lib/constants';
import { NextRequest } from 'next/server';

export async function PATCH(
  request: NextRequest,
  { params }: { params: { userId: string } }
) {
  try {
    const { user } = await validateRequest();
    
    // 권한 확인 (OPERATION3 이상)
    if (!user || user.userRole < USER_ROLE.OPERATION3) {
      return Response.json(
        { success: false, error: 'Unauthorized' },
        { status: 401 }
      );
    }
    
    const userId = params.userId;
    
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
    
    // 사용자 역할 업데이트
    const updatedUser = await prisma.user.update({
      where: { id: userId },
      data: { userRole },
      select: {
        id: true,
        username: true,
        userRole: true
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
