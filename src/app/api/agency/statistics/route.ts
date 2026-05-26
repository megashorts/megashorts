import { validateRequest } from '@/auth';
import { getAnalyticsTimeZone } from '@/lib/analytics-timezone-server';
import { USER_ROLE, USER_ROLE_NAME_EN } from '@/lib/constants';
import prisma from '@/lib/prisma';
import { fetchAgencyTeamSummaryFromWorker } from '@/lib/worker-stats';
import { NextRequest } from 'next/server';

function rowPoints(row: any) {
  return Number(row.point_by_coin || 0) + Number(row.point_by_subscription || 0);
}

function rowViews(row: any) {
  return Number(row.view_count_coin || 0) + Number(row.view_count_subscription || 0);
}

function groupLabel(type: string) {
  if (type === 'DIRECT') return 'Direct referral';
  if (type === 'INDIRECT') return 'Indirect referral';
  if (type === 'NETWORK_LEVEL') return 'Network level';
  if (type === 'CREATOR') return 'Creator payout';
  return type || '-';
}

function buildTeamStats(rows: any[]) {
  const groups = new Map<string, any>();
  const members = new Map<string, any>();

  rows.forEach((row) => {
    const type = row.commission_type || '-';
    const userId = row.user_id || '-';
    const currentGroup = groups.get(type) || {
      type,
      label: groupLabel(type),
      userIds: new Set<string>(),
      subscriptionViews: 0,
      coinViews: 0,
      points: 0,
    };
    currentGroup.userIds.add(userId);
    currentGroup.subscriptionViews += Number(row.view_count_subscription || 0);
    currentGroup.coinViews += Number(row.view_count_coin || 0);
    currentGroup.points += rowPoints(row);
    groups.set(type, currentGroup);

    const currentMember = members.get(userId) || { userId, name: userId, totalPoints: 0, totalViews: 0 };
    currentMember.totalPoints += rowPoints(row);
    currentMember.totalViews += rowViews(row);
    members.set(userId, currentMember);
  });

  const groupList = Array.from(groups.values());
  const memberIds = new Set(rows.map((row) => row.user_id).filter(Boolean));

  return {
    totalMembers: memberIds.size,
    totalViews: rows.reduce((sum, row) => sum + rowViews(row), 0),
    subscriptionViews: rows.reduce((sum, row) => sum + Number(row.view_count_subscription || 0), 0),
    coinViews: rows.reduce((sum, row) => sum + Number(row.view_count_coin || 0), 0),
    totalPoints: rows.reduce((sum, row) => sum + rowPoints(row), 0),
    membersByLevel: groupList.map((group, index) => ({
      level: index + 1,
      count: group.userIds.size,
      label: group.label,
    })),
    pointsByLevel: groupList.map((group, index) => ({
      level: index + 1,
      points: group.points,
      label: group.label,
    })),
    topMembers: Array.from(members.values()).sort((a, b) => b.totalPoints - a.totalPoints).slice(0, 10),
  };
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
    const userId = searchParams.get('userId');
    const period = searchParams.get('period') || 'current';

    if (!userId) {
      return Response.json(
        { success: false, error: 'Missing userId parameter' },
        { status: 400 }
      );
    }

    if (user.id !== userId && user.userRole < USER_ROLE.OPERATION1) {
      return Response.json({ success: false, error: 'Forbidden' }, { status: 403 });
    }

    const [workerSummary, timezone, teamMembers] = await Promise.all([
      fetchAgencyTeamSummaryFromWorker({
        masterId: userId,
        period,
      }),
      getAnalyticsTimeZone(),
      prisma.user.findMany({
        where: {
          OR: [{ id: userId }, { teamMaster: userId }],
          userRole: { gte: USER_ROLE.TEAM_MEMBER, lt: USER_ROLE.OPERATION1 },
        },
        select: { id: true, userRole: true },
      }),
    ]);
    const rows = Array.isArray(workerSummary?.rows) ? workerSummary.rows : [];
    const stats = buildTeamStats(rows);
    const membersByRole = Array.from(
      teamMembers.reduce((map, member) => {
        map.set(member.userRole, (map.get(member.userRole) || 0) + 1);
        return map;
      }, new Map<number, number>()),
    )
      .sort((a, b) => a[0] - b[0])
      .map(([role, count]) => ({
        level: role,
        count,
        label: (USER_ROLE_NAME_EN as Record<number, string>)[role] || `Role ${role}`,
      }));
    const memberIds = (stats.topMembers || []).map((member: any) => member.userId).filter(Boolean);
    const users = memberIds.length > 0
      ? await prisma.user.findMany({ where: { id: { in: memberIds } }, select: { id: true, username: true, displayName: true } })
      : [];
    const userMap = new Map(users.map((item) => [item.id, item.displayName || item.username]));

    return Response.json({
      success: true,
      data: {
        ...stats,
        topMembers: (stats.topMembers || []).map((member: any) => ({
          ...member,
          name: userMap.get(member.userId) || member.name,
        })),
        source: workerSummary?.source || 'empty',
        pointSettings: workerSummary?.pointSettings || null,
        timezone,
        totalMembers: teamMembers.length,
        payoutMembers: stats.totalMembers,
        membersByRole,
        totalAgencies: teamMembers.length,
        totalManagers: 1,
      }
    });
  } catch (error) {
    console.error('Error fetching agency statistics:', error);
    return Response.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    );
  }
}
