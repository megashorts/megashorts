// src/app/api/admin/users/search/route.ts

import { validateRequest } from '@/auth';
import prisma from '@/lib/prisma';
import { USER_ROLE } from '@/lib/constants';
import { NextRequest } from 'next/server';

export async function GET(request: NextRequest) {
  try {
    const { user } = await validateRequest();
    
    // 권한 확인 (TEAM_MASTER 이상)
    if (!user || user.userRole < USER_ROLE.TEAM_MASTER) {
      return Response.json(
        { success: false, error: 'Unauthorized' },
        { status: 401 }
      );
    }
    
    const { searchParams } = new URL(request.url);
    const query = searchParams.get("q");
    
    if (!query || query.length < 2) {
      return Response.json(
        { success: false, error: "Search query must be at least 2 characters" },
        { status: 400 }
      );
    }
    
    // 사용자 검색 (유저네임 또는 이메일)
    const users = await prisma.user.findMany({
      where: {
        OR: [
          { username: { contains: query, mode: 'insensitive' } },
          { email: { contains: query, mode: 'insensitive' } },
          { displayName: { contains: query, mode: 'insensitive' } }
        ]
      },
      select: {
        id: true,
        username: true,
        email: true,
        displayName: true,
        userRole: true,
        avatarUrl: true
      },
      take: 10 // 최대 10명까지만 반환
    });
    
    return Response.json({
      success: true,
      users
    });
  } catch (error) {
    console.error("Error searching users:", error);
    return Response.json(
      { success: false, error: "Internal server error" },
      { status: 500 }
    );
  }
}
