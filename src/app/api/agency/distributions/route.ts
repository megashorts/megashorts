// src/app/api/agency/distributions/route.ts

import { validateRequest } from '@/auth';
import { getAnalyticsTimeZone } from '@/lib/analytics-timezone-server';
import { USER_ROLE } from '@/lib/constants';
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
  if (type === "DIRECT") return "Direct referral";
  if (type === "INDIRECT") return "Indirect referral";
  if (type === "NETWORK_LEVEL") return "Network level";
  if (type === "CREATOR") return "Creator payout";
  return type || "-";
}

function groupTeamRows(rows: any[]) {
  const groups = new Map<string, any>();
  const members = new Map<string, any>();

  rows.forEach((row) => {
    const type = row.commission_type || "-";
    const userId = row.user_id || "-";
    const currentGroup = groups.get(type) || {
      label: groupLabel(type),
      userIds: new Set<string>(),
      coinViews: 0,
      subscriptionViews: 0,
      coinPoints: 0,
      subscriptionPoints: 0,
      totalPoints: 0,
    };
    currentGroup.userIds.add(userId);
    currentGroup.coinViews += Number(row.view_count_coin || 0);
    currentGroup.subscriptionViews += Number(row.view_count_subscription || 0);
    currentGroup.coinPoints += Number(row.point_by_coin || 0);
    currentGroup.subscriptionPoints += Number(row.point_by_subscription || 0);
    currentGroup.totalPoints += rowPoints(row);
    groups.set(type, currentGroup);

    const currentMember = members.get(userId) || { userId, totalPoints: 0, totalViews: 0 };
    currentMember.totalPoints += rowPoints(row);
    currentMember.totalViews += rowViews(row);
    members.set(userId, currentMember);
  });

  return {
    distributions: Array.from(groups.values()).map((item) => ({
      label: item.label,
      userCount: item.userIds.size,
      coinViews: item.coinViews,
      subscriptionViews: item.subscriptionViews,
      coinPoints: item.coinPoints,
      subscriptionPoints: item.subscriptionPoints,
      totalPoints: item.totalPoints,
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
    const userId = searchParams.get("userId");
    const period = searchParams.get("period") || "current";
    
    if (!userId) {
      return Response.json(
        { success: false, error: "Missing userId parameter" },
        { status: 400 }
      );
    }
    if (user.id !== userId && user.userRole < USER_ROLE.OPERATION1) {
      return Response.json({ success: false, error: "Forbidden" }, { status: 403 });
    }

    const [workerSummary, timezone] = await Promise.all([
      fetchAgencyTeamSummaryFromWorker({
        masterId: userId,
        period,
      }),
      getAnalyticsTimeZone(),
    ]);
    const rows = Array.isArray(workerSummary?.rows) ? workerSummary.rows : [];
    const grouped = groupTeamRows(rows);
    const memberIds = Array.from(new Set([
      ...grouped.topMembers.map((member: any) => member.userId).filter(Boolean),
      ...rows.map((row: any) => row.user_id).filter(Boolean),
    ]));
    const postIds = Array.from(new Set(rows.map((row: any) => row.post_id).filter(Boolean)));
    const users = memberIds.length > 0
      ? await prisma.user.findMany({ where: { id: { in: memberIds } }, select: { id: true, username: true, displayName: true } })
      : [];
    const posts = postIds.length > 0
      ? await prisma.post.findMany({ where: { id: { in: postIds } }, select: { id: true, title: true, postNum: true } })
      : [];
    const userMap = new Map(users.map((item) => [item.id, item.displayName || item.username]));
    const postMap = new Map(posts.map((item) => [item.id, item.title || `Post #${item.postNum}`]));
    
    return Response.json({
      success: true,
      data: {
        period,
        source: workerSummary?.source || "empty",
        timezone,
        teamType: null,
        teamTotal: workerSummary?.totalPoints || 0,
        pointSettings: workerSummary?.pointSettings || null,
        detailRows: rows
          .map((row: any) => ({
            userId: row.user_id,
            userName: userMap.get(row.user_id) || row.user_id,
            commissionType: row.commission_type || "-",
            label: groupLabel(row.commission_type || "-"),
            postId: row.post_id,
            postTitle: postMap.get(row.post_id) || row.post_id || "-",
            subscriptionViews: Number(row.view_count_subscription || 0),
            coinViews: Number(row.view_count_coin || 0),
            subscriptionPoints: Number(row.point_by_subscription || 0),
            coinPoints: Number(row.point_by_coin || 0),
            totalPoints: rowPoints(row),
          }))
          .sort((a: any, b: any) => b.totalPoints - a.totalPoints),
        topMembers: grouped.topMembers.map((member: any) => ({
          ...member,
          name: userMap.get(member.userId) || member.userId,
        })),
        distributions: grouped.distributions,
      }
    });
  } catch (error) {
    console.error("Error fetching point distributions:", error);
    return Response.json(
      { success: false, error: "Internal server error" },
      { status: 500 }
    );
  }
}
