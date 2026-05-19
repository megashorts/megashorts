import { validateRequest } from '@/auth';
import prisma from '@/lib/prisma';
import { USER_ROLE } from '@/lib/constants';
import { NextRequest } from 'next/server';

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

    if (!userId) {
      return Response.json(
        { success: false, error: 'Missing userId parameter' },
        { status: 400 }
      );
    }

    const members = await prisma.user.findMany({
      where: {
        OR: [
          { id: userId },
          { teamMaster: userId }
        ]
      },
      select: {
        id: true,
        username: true,
        userRole: true,
        points: true,
        createdAt: true
      }
    });

    const membersByLevelMap = new Map<number, number>();
    const pointsByLevelMap = new Map<number, number>();
    let totalPoints = 0;

    members.forEach(member => {
      const level = normalizeAgencyLevel(member.userRole);
      const points = Number(member.points || 0);

      membersByLevelMap.set(level, (membersByLevelMap.get(level) || 0) + 1);
      pointsByLevelMap.set(level, (pointsByLevelMap.get(level) || 0) + points);
      totalPoints += points;
    });

    const totalManagers = members.filter(member => member.userRole >= USER_ROLE.TEAM_AGENCY).length;
    const memberIds = members.map(member => member.id);
    const since = new Date();
    since.setDate(since.getDate() - 90);
    const withdrawals = await prisma.pointWithdrawal.findMany({
      where: {
        userId: { in: memberIds },
        requestedAt: { gte: since }
      },
      select: {
        userId: true,
        amount: true,
        status: true,
        requestedAt: true
      },
      orderBy: { requestedAt: 'desc' }
    });
    const dailyStats = buildTimeSeries('day', 14, members, withdrawals);
    const weeklyStats = buildTimeSeries('week', 12, members, withdrawals);
    const monthlyStats = buildTimeSeries('month', 6, members, withdrawals);

    return Response.json({
      success: true,
      data: {
        totalMembers: members.length,
        totalAgencies: members.filter(member => member.userRole >= USER_ROLE.TEAM_MEMBER).length,
        totalManagers,
        totalPoints,
        membersByLevel: toSortedArray(membersByLevelMap, 'count'),
        pointsByLevel: toSortedArray(pointsByLevelMap, 'points'),
        dailyStats,
        weeklyStats,
        monthlyStats,
        topMembers: members
          .sort((a, b) => Number(b.points || 0) - Number(a.points || 0))
          .slice(0, 5)
          .map(member => ({
            id: member.id,
            name: member.username,
            points: Number(member.points || 0)
          }))
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

function normalizeAgencyLevel(userRole: number): number {
  if (userRole >= USER_ROLE.TEAM_MASTER) return 1;
  if (userRole >= USER_ROLE.TEAM_AGENCY) return 2;
  if (userRole >= USER_ROLE.TEAM_MEMBER) return 3;
  return 0;
}

function toSortedArray(map: Map<number, number>, valueKey: 'count' | 'points') {
  return Array.from(map.entries())
    .sort(([a], [b]) => a - b)
    .map(([level, value]) => ({
      level,
      [valueKey]: value
    }));
}

function buildTimeSeries(
  unit: 'day' | 'week' | 'month',
  count: number,
  members: Array<{ createdAt: Date }>,
  withdrawals: Array<{ amount: number; status: string; requestedAt: Date }>
) {
  const buckets = new Map<string, { label: string; newMembers: number; points: number; applications: number }>();
  const now = new Date();

  for (let index = count - 1; index >= 0; index -= 1) {
    const date = new Date(now);

    if (unit === 'day') date.setDate(now.getDate() - index);
    if (unit === 'week') date.setDate(now.getDate() - index * 7);
    if (unit === 'month') date.setMonth(now.getMonth() - index);

    const key = getBucketKey(date, unit);
    buckets.set(key, { label: key, newMembers: 0, points: 0, applications: 0 });
  }

  members.forEach(member => {
    const key = getBucketKey(member.createdAt, unit);
    const bucket = buckets.get(key);
    if (bucket) bucket.newMembers += 1;
  });

  withdrawals.forEach(withdrawal => {
    const key = getBucketKey(withdrawal.requestedAt, unit);
    const bucket = buckets.get(key);
    if (!bucket) return;

    bucket.applications += 1;
    if (withdrawal.status === 'APPROVED') {
      bucket.points += withdrawal.amount;
    }
  });

  return Array.from(buckets.values());
}

function getBucketKey(date: Date, unit: 'day' | 'week' | 'month') {
  const year = date.getUTCFullYear();
  const month = String(date.getUTCMonth() + 1).padStart(2, '0');
  const day = String(date.getUTCDate()).padStart(2, '0');

  if (unit === 'month') return `${year}-${month}`;
  if (unit === 'week') {
    const start = new Date(Date.UTC(year, date.getUTCMonth(), date.getUTCDate()));
    const weekday = start.getUTCDay() || 7;
    start.setUTCDate(start.getUTCDate() - weekday + 1);
    const jan4 = new Date(Date.UTC(start.getUTCFullYear(), 0, 4));
    const jan4Day = jan4.getUTCDay() || 7;
    const week1 = new Date(jan4.getTime() - (jan4Day - 1) * 86400000);
    const week = Math.ceil(((start.getTime() - week1.getTime()) / 86400000 + 1) / 7);

    return `${start.getUTCFullYear()}-W${String(week).padStart(2, '0')}`;
  }

  return `${year}-${month}-${day}`;
}
