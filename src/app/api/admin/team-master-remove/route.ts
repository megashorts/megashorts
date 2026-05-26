// src/app/api/admin/team-master-remove/route.ts 티마스터 자격 해제

import { validateRequest } from '@/auth';
import prisma from '@/lib/prisma';
import { USER_ROLE } from '@/lib/constants';
import { NextRequest } from 'next/server';

const AGENCY_ROLE_MIN = USER_ROLE.TEAM_MEMBER;
const AGENCY_ROLE_MAX = USER_ROLE.OPERATION1;

async function removeReferralStructure(userId: string, masterId: string) {
  const referralWorkerUrl = process.env.REFERRAL_STRUCTURE_WORKER_URL || 'https://referral-structure-worker.msdevcm.workers.dev';
  const apiKey = process.env.WORKER_API_KEY || process.env.NEXT_PUBLIC_WORKER_API_KEY;

  if (!apiKey) {
    return { success: false, skipped: true, error: 'WORKER_API_KEY is not configured' };
  }

  const response = await fetch(`${referralWorkerUrl}/sync-user-referral-structure`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${apiKey}`,
    },
    body: JSON.stringify({
      userId,
      action: 'remove',
      masterId,
    }),
  });

  const result = await response.json().catch(() => null);
  const errorMessage = typeof result?.error === 'string' ? result.error : '';
  const missingStructure = errorMessage.includes('추천인 구조 정보를 찾을 수 없습니다');

  return {
    success: missingStructure || (response.ok && result?.success !== false),
    skipped: missingStructure,
    status: response.status,
    error: result?.error,
  };
}

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
        { success: false, error: 'Missing userId parameter' },
        { status: 400 }
      );
    }

    const target = await prisma.user.findUnique({
      where: { id: userId },
      select: { id: true, username: true, userRole: true },
    });

    if (!target) {
      return Response.json(
        { success: false, error: 'User not found' },
        { status: 404 }
      );
    }

    const teamUsers = await prisma.user.findMany({
      where: {
        OR: [
          { id: userId },
          { teamMaster: userId },
        ],
      },
      select: { id: true, userRole: true },
    });

    const teamUserIds = Array.from(new Set(teamUsers.map((item) => item.id)));
    const agencyRoleUserIds = teamUsers
      .filter((item) => item.userRole >= AGENCY_ROLE_MIN && item.userRole < AGENCY_ROLE_MAX)
      .map((item) => item.id);

    await prisma.$transaction([
      prisma.user.update({
        where: { id: userId },
        data: {
          userRole: USER_ROLE.USER,
          teamMaster: null,
          referredBy: null,
        },
      }),
      prisma.user.updateMany({
        where: { id: { in: teamUserIds } },
        data: { teamMaster: null },
      }),
      prisma.user.updateMany({
        where: {
          id: { in: agencyRoleUserIds },
          NOT: { id: userId },
        },
        data: { userRole: USER_ROLE.USER },
      }),
      prisma.user.updateMany({
        where: {
          id: { in: teamUserIds },
          referredBy: { in: teamUserIds },
        },
        data: { referredBy: null },
      }),
      prisma.systemSetting.deleteMany({
        where: {
          OR: [
            { id: userId },
            { key: `agencySettings_${userId}` },
          ],
        },
      }),
    ]);

    const referralSyncResults = await Promise.allSettled(
      teamUserIds
        .filter((id) => id !== userId)
        .map((id) => removeReferralStructure(id, userId)),
    );

    const failedReferralSyncs = referralSyncResults.filter(
      (result) => result.status === 'rejected' || (result.status === 'fulfilled' && !result.value.success && !result.value.skipped),
    ).length;
    
    return Response.json({
      success: true,
      message: '팀마스터 설정이 해제되었습니다.',
      data: {
        removedMasterId: userId,
        affectedUsers: teamUserIds.length,
        demotedAgencyUsers: agencyRoleUserIds.length,
        referralStructureSync: {
          attempted: Math.max(teamUserIds.length - 1, 0),
          failed: failedReferralSyncs,
        },
      },
    });
  } catch (error) {
    console.error('Error removing team master:', error);
    return Response.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    );
  }
}
