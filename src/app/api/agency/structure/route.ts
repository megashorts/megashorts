import { validateRequest } from '@/auth';
import prisma from '@/lib/prisma';
import { USER_ROLE } from '@/lib/constants';
import { NextRequest } from 'next/server';

interface ReferralNode {
  userId: string;
  username: string;
  displayName: string;
  email: string | null;
  referredBy: string | null;
  userRole: number;
  agencyRoles: Array<{
    masterId: string | null;
    role: string;
    level: number;
    commissionRate: number;
  }>;
  childrenCount: number;
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
    const requestedUserId = searchParams.get('userId');
    const parentId = searchParams.get('parentId');

    if (!requestedUserId) {
      return Response.json(
        { success: false, error: 'Missing userId parameter' },
        { status: 400 }
      );
    }

    const root = await prisma.user.findUnique({
      where: { id: requestedUserId },
      select: {
        id: true,
        username: true,
        referredBy: true,
        userRole: true,
        teamMaster: true
      }
    });

    if (!root) {
      return Response.json(
        { success: false, error: 'User not found' },
        { status: 404 }
      );
    }

    const masterId = root.teamMaster || root.id;
    const settings = await prisma.systemSetting.findUnique({
      where: { key: `agencySettings_${masterId}` },
      select: { value: true }
    });

    const tree = await buildReferralNode(
      parentId || root.id,
      parseAgencySettings(settings?.value),
      parentId ? 2 : 1,
      true
    );

    return Response.json({
      success: true,
      data: tree
    });
  } catch (error) {
    console.error('Error fetching referral structure:', error);
    return Response.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    );
  }
}

async function buildReferralNode(
  userId: string,
  agencySettings: any,
  level: number,
  includeChildren: boolean
): Promise<ReferralNode> {
  const user = await prisma.user.findUniqueOrThrow({
    where: { id: userId },
    select: {
      id: true,
      username: true,
      displayName: true,
      email: true,
      referredBy: true,
      userRole: true,
      teamMaster: true,
      referrals: {
        select: {
          id: true
        },
        orderBy: {
          createdAt: 'asc'
        }
      }
    }
  });
  const childIds = user.referrals.map((child) => child.id);
  const children = includeChildren
    ? await Promise.all(
        childIds.map((childId) => buildReferralNode(childId, agencySettings, level + 1, false))
      )
    : [];

  return {
    userId: user.id,
    username: user.username,
    displayName: user.displayName,
    email: user.email,
    referredBy: user.referredBy,
    userRole: user.userRole,
    agencyRoles: [buildAgencyRole(user, agencySettings, level)],
    childrenCount: childIds.length,
    children
  };
}

function buildAgencyRole(
  user: { id: string; teamMaster: string | null; userRole: number },
  agencySettings: any,
  level: number
) {
  const masterId = user.teamMaster || user.id;
  const masterType = agencySettings?.masterType || 'UNKNOWN';
  const levels = agencySettings?.settings?.headquarters?.levels || agencySettings?.settings?.network?.levels || [];
  const levelConfig = levels.find((entry: any) => Number(entry.level) === level);

  return {
    masterId,
    role: masterType,
    level,
    commissionRate: Number(levelConfig?.commissionRate || 0)
  };
}

function parseAgencySettings(value: unknown) {
  if (!value) return null;
  if (typeof value === 'string') {
    try {
      return JSON.parse(value);
    } catch {
      return null;
    }
  }
  return value;
}
