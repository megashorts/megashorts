// src/app/api/agency/structure/route.ts

import { validateRequest } from '@/auth';
import prisma from '@/lib/prisma';
import { USER_ROLE } from '@/lib/constants';
import { NextRequest } from 'next/server';

// 추천인 노드 인터페이스 정의
interface ReferralNode {
  userId: string;
  username: string;
  referredBy: string | null;
  userRole: number;
  agencyRoles: {
    masterId: string;
    role: string;
    level: number;
    commissionRate: number;
  }[];
  children: ReferralNode[];
}

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
    
    if (!userId) {
      return Response.json(
        { success: false, error: "Missing userId parameter" },
        { status: 400 }
      );
    }
    
    // 사용자 정보 조회
    const userInfo = await prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        username: true,
        referredBy: true,
        userRole: true,
        referrals: {
          select: {
            id: true,
            username: true,
            referredBy: true,
            userRole: true,
          }
        }
      }
    });
    
    if (!userInfo) {
      return Response.json(
        { success: false, error: "User not found" },
        { status: 404 }
      );
    }
    
    // 에이전시 역할 정보 조회
    const agencyRoles = await prisma.agencyMemberRole.findMany({
      where: {
        OR: [
          { userId: userId },
          { masterId: userId }
        ]
      }
    });
    
    // 추천인 구조 구성
    const referralStructure: ReferralNode = {
      userId: userInfo.id,
      username: userInfo.username,
      referredBy: userInfo.referredBy,
      userRole: userInfo.userRole,
      agencyRoles: agencyRoles
        .filter(role => role.userId === userInfo.id)
        .map(role => ({
          masterId: role.masterId,
          role: role.role,
          level: role.level,
          commissionRate: role.commissionRate
        })),
      children: await buildReferralTree(userInfo.referrals, agencyRoles)
    };
    
    return Response.json({
      success: true,
      data: referralStructure
    });
  } catch (error) {
    console.error("Error fetching referral structure:", error);
    return Response.json(
      { success: false, error: "Internal server error" },
      { status: 500 }
    );
  }
}

// 추천인 트리 구성 함수 (명시적 반환 타입 추가)
async function buildReferralTree(
  referrals: { id: string; username: string; referredBy: string | null; userRole: number }[], 
  agencyRoles: { userId: string; masterId: string; role: string; level: number; commissionRate: number }[]
): Promise<ReferralNode[]> {
  const tree: ReferralNode[] = [];
  
  for (const referral of referrals) {
    // 하위 추천인 조회
    const subReferrals = await prisma.user.findMany({
      where: { referredBy: referral.username },
      select: {
        id: true,
        username: true,
        referredBy: true,
        userRole: true,
      }
    });
    
    tree.push({
      userId: referral.id,
      username: referral.username,
      referredBy: referral.referredBy,
      userRole: referral.userRole,
      agencyRoles: agencyRoles
        .filter(role => role.userId === referral.id)
        .map(role => ({
          masterId: role.masterId,
          role: role.role,
          level: role.level,
          commissionRate: role.commissionRate
        })),
      children: await buildReferralTree(subReferrals, agencyRoles)
    });
  }
  
  return tree;
}