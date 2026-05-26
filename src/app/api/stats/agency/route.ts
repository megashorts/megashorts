import { validateRequest } from "@/auth";
import { USER_ROLE } from "@/lib/constants";
import { formatStoredAgencyStats } from "@/lib/stored-stats-formatters";
import { assertStatsAccess } from "@/lib/stats-queries";
import { canOpenAgencyEarnings, isOperationsRole } from "@/lib/user-roles";
import { fetchCommissionSummaryFromWorker } from "@/lib/worker-stats";
import { getAnalyticsTimeZone } from "@/lib/analytics-timezone-server";
import prisma from "@/lib/prisma";
import { NextRequest, NextResponse } from "next/server";

export async function GET(request: NextRequest) {
  try {
    const { user } = await validateRequest();

    if (!user || user.userRole < USER_ROLE.TEAM_MEMBER) {
      return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const userId = searchParams.get("userId");
    const period = searchParams.get("period") || "current";

    await assertStatsAccess(user, userId);
    if (user.id === userId && !canOpenAgencyEarnings(user.userRole)) {
      return NextResponse.json({ success: false, error: "Forbidden" }, { status: 403 });
    }
    if (user.id !== userId && !isOperationsRole(user.userRole)) {
      return NextResponse.json({ success: false, error: "Forbidden" }, { status: 403 });
    }

    const now = new Date();
    const kstToday = new Date(now.getTime() + 9 * 60 * 60 * 1000).toISOString().slice(0, 10);
    const kstTodayStart = new Date(`${kstToday}T00:00:00.000Z`);
    kstTodayStart.setUTCHours(kstTodayStart.getUTCHours() - 9);

    const [workerSummary, cumulativeSummary, targetUser, referredTotal, referredToday, timezone] = await Promise.all([
      fetchCommissionSummaryFromWorker({
        scope: "agency",
        userId: userId!,
        period,
      }),
      fetchCommissionSummaryFromWorker({
        scope: "agency",
        userId: userId!,
        period: "all",
      }),
      prisma.user.findUnique({ where: { id: userId! }, select: { points: true } }),
      prisma.user.count({ where: { referredBy: userId! } }),
      prisma.user.count({
        where: {
          referredBy: userId!,
          createdAt: {
            gte: kstTodayStart,
          },
        },
      }),
      getAnalyticsTimeZone(),
    ]);
    const stats = formatStoredAgencyStats(workerSummary, period);
    const cumulativeStats = formatStoredAgencyStats(cumulativeSummary, "all");

    return NextResponse.json({
      success: true,
      data: {
        ...stats,
        totalReferredUsers: referredTotal,
        todayReferredUsers: referredToday,
        currentPoints: Number(targetUser?.points || 0),
        cumulative: {
          subscriptionViews: cumulativeStats.subscriptionViews,
          coinViews: cumulativeStats.coinViews,
          totalViews: cumulativeStats.totalViews,
          totalPoints: cumulativeStats.totalPoints,
          breakdown: cumulativeStats.breakdown || [],
          paidPoints: Number(targetUser?.points || 0),
        },
        timezone,
      },
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    const status = message === "Forbidden" ? 403 : message === "Missing userId" ? 400 : 500;

    return NextResponse.json({ success: false, error: message }, { status });
  }
}
