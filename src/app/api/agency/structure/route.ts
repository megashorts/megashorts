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
    label?: string;
    commissionRate: number;
  }>;
  canEditQualification?: boolean;
  editableRoles?: Array<{ value: number; label: string }>;
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

    if (user.id !== requestedUserId && user.userRole < USER_ROLE.OPERATION1) {
      return Response.json(
        { success: false, error: 'Forbidden' },
        { status: 403 }
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

  const qualifications = await loadAgencyQualificationOverrides(masterId);
  const tree = await buildReferralNode(
    parentId || root.id,
    parseAgencySettings(settings?.value),
    qualifications,
    parentId ? 2 : 1,
      true,
      user,
      masterId
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
  qualifications: Map<string, number>,
  level: number,
  includeChildren: boolean,
  actor: { id: string; userRole: number },
  rootMasterId: string
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
        childIds.map((childId) => buildReferralNode(childId, agencySettings, qualifications, level + 1, false, actor, rootMasterId))
      )
    : [];
  const canEditQualification = (
    user.id !== actor.id
    && user.userRole >= USER_ROLE.TEAM_MEMBER
    && user.userRole < USER_ROLE.OPERATION1
    && (
      actor.userRole >= USER_ROLE.OPERATION1
      || (actor.id === rootMasterId && (user.teamMaster === rootMasterId || user.id === rootMasterId))
    )
  );

  return {
    userId: user.id,
    username: user.username,
    displayName: user.displayName,
    email: user.email,
    referredBy: user.referredBy,
    userRole: user.userRole,
    agencyRoles: [buildAgencyRole(user, agencySettings, level, qualifications.get(user.id))],
    canEditQualification,
    editableRoles: canEditQualification ? editableAgencyRoles(agencySettings) : [],
    childrenCount: childIds.length,
    children
  };
}

function editableAgencyRoles(agencySettings: any) {
  const levels = agencyLevels(agencySettings);
  return levels.map((level: any) => ({
    value: Number(level.level),
    label: `${level.name || `Level ${level.level}`} (${Number(level.commissionRate || 0)}%)`,
  }));
}

function buildAgencyRole(
  user: { id: string; teamMaster: string | null; userRole: number },
  agencySettings: any,
  level: number,
  overrideLevel?: number
) {
  const masterId = user.teamMaster || user.id;
  const masterType = agencySettings?.masterType || 'UNKNOWN';
  const selectedLevel = Number(overrideLevel || level);
  const levels = agencyLevels(agencySettings);
  const levelConfig = levels.find((entry: any) => Number(entry.level) === selectedLevel);

  return {
    masterId,
    role: masterType,
    level: selectedLevel,
    label: levelConfig?.name || `Level ${selectedLevel}`,
    commissionRate: Number(levelConfig?.commissionRate || 0)
  };
}

function agencyLevels(agencySettings: any) {
  return agencySettings?.settings?.headquarters?.levels || agencySettings?.settings?.network?.levels || [];
}

async function loadAgencyQualificationOverrides(masterId: string) {
  const rows = await prisma.systemSetting.findMany({
    where: { key: { startsWith: `agencyQualification_${masterId}_` } },
    select: { key: true, value: true },
  });
  const map = new Map<string, number>();
  rows.forEach((row) => {
    const userId = row.key.replace(`agencyQualification_${masterId}_`, "");
    const value = row.value as any;
    const level = Number(value?.level || value);
    if (userId && Number.isFinite(level)) map.set(userId, level);
  });
  return map;
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
