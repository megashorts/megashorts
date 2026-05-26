import { validateRequest } from "@/auth";
import { USER_ROLE } from "@/lib/constants";
import { formatStoredAdminStats } from "@/lib/stored-stats-formatters";
import prisma from "@/lib/prisma";
import { fetchCommissionSummaryFromWorker, fetchPayoutPointBreakdownFromD1 } from "@/lib/worker-stats";
import { getAnalyticsTimeZone } from "@/lib/analytics-timezone-server";
import { NextRequest, NextResponse } from "next/server";

const PAID_PAYMENT_STATUSES = ["DONE", "done", "PAID", "paid", "APPROVED", "approved", "SUCCESS", "success", "CONFIRMED", "confirmed", "COMPLETED", "completed"];

export async function GET(request: NextRequest) {
  try {
    const { user } = await validateRequest();

    if (!user || user.userRole < USER_ROLE.OPERATION1) {
      return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const period = searchParams.get("period") || "current";

    const [workerSummary, cumulativeSummary] = await Promise.all([
      fetchCommissionSummaryFromWorker({
        scope: "admin",
        period,
      }),
      fetchCommissionSummaryFromWorker({
        scope: "admin",
        period: "all",
      }),
    ]);
    const now = new Date();
    const kstToday = new Date(now.getTime() + 9 * 60 * 60 * 1000).toISOString().slice(0, 10);
    const kstYesterdayStart = new Date(`${kstToday}T00:00:00.000Z`);
    kstYesterdayStart.setUTCDate(kstYesterdayStart.getUTCDate() - 1);
    kstYesterdayStart.setUTCHours(kstYesterdayStart.getUTCHours() - 9);
    const kstYesterdayEnd = new Date(kstYesterdayStart.getTime() + 24 * 60 * 60 * 1000 - 1);

    const [
      totalUsers,
      yesterdayNewUsers,
      totalPosts,
      totalVideos,
      totalPaidVideos,
      cumulativePayments,
      yesterdayPayments,
      payoutPointBreakdown,
      timezone,
    ] = await Promise.all([
      prisma.user.count(),
      prisma.user.count({ where: { createdAt: { gte: kstYesterdayStart, lte: kstYesterdayEnd } } }),
      prisma.post.count(),
      prisma.video.count(),
      prisma.video.count({ where: { isPremium: true } }),
      prisma.payment.findMany({
        where: { status: { in: PAID_PAYMENT_STATUSES } },
        select: { amount: true, type: true },
      }),
      prisma.payment.findMany({
        where: {
          status: { in: PAID_PAYMENT_STATUSES },
          OR: [
            { approvedAt: { gte: kstYesterdayStart, lte: kstYesterdayEnd } },
            { createdAt: { gte: kstYesterdayStart, lte: kstYesterdayEnd } },
          ],
        },
        select: { amount: true, type: true },
      }),
      fetchPayoutPointBreakdownFromD1({ period: "all" }),
      getAnalyticsTimeZone(),
    ]);
    const stats = formatStoredAdminStats(workerSummary, period);
    const cumulativeStats = formatStoredAdminStats(cumulativeSummary, "all");
    const postIds = [
      ...(stats.topItems.posts || []),
      ...(stats.topItems.paidPosts || []),
    ].map((item: any) => item.id).filter(Boolean);
    const userIds = [
      ...(stats.topItems.uploaders || []),
      ...(stats.topItems.agencyMembers || []),
    ].map((item: any) => item.id).filter(Boolean);
    const [posts, users] = await Promise.all([
      postIds.length > 0
        ? prisma.post.findMany({ where: { id: { in: postIds } }, select: { id: true, title: true, postNum: true } })
        : [],
      userIds.length > 0
        ? prisma.user.findMany({ where: { id: { in: userIds } }, select: { id: true, username: true, displayName: true } })
        : [],
    ]);
    const postMap = new Map(posts.map((post) => [post.id, post.title || `Post #${post.postNum}`]));
    const userMap = new Map(users.map((item) => [item.id, item.displayName || item.username]));
    const topItems = {
      ...stats.topItems,
      posts: (stats.topItems.posts || []).map((item: any) => ({ ...item, title: postMap.get(item.id) || item.title })),
      paidPosts: (stats.topItems.paidPosts || []).map((item: any) => ({ ...item, title: postMap.get(item.id) || item.title })),
      uploaders: (stats.topItems.uploaders || []).map((item: any) => ({ ...item, name: userMap.get(item.id) || item.name })),
      agencyMembers: (stats.topItems.agencyMembers || []).map((item: any) => ({ ...item, name: userMap.get(item.id) || item.name })),
    };
    const cumulativeSubscriptionRevenue = cumulativePayments
      .filter((payment) => String(payment.type || "").toLowerCase().includes("sub"))
      .reduce((sum, payment) => sum + Number(payment.amount || 0), 0);
    const cumulativeCoinRevenue = cumulativePayments
      .filter((payment) => String(payment.type || "").toLowerCase().includes("coin"))
      .reduce((sum, payment) => sum + Number(payment.amount || 0), 0);
    const yesterdayRevenue = yesterdayPayments.reduce((sum, payment) => sum + Number(payment.amount || 0), 0);

    return NextResponse.json({
      success: true,
      data: {
        ...stats,
        topItems,
        users: {
          ...stats.users,
          total: totalUsers,
          yesterdayNew: yesterdayNewUsers,
        },
        content: {
          ...stats.content,
          totalPosts,
          totalVideos,
          totalPaidVideos,
        },
        cumulative: {
          subscriptionViews: cumulativeStats.views.subscriptionViews,
          coinViews: cumulativeStats.views.coinViews,
          subscriptionRevenue: cumulativeSubscriptionRevenue,
          coinRevenue: cumulativeCoinRevenue,
          totalRevenue: cumulativeSubscriptionRevenue + cumulativeCoinRevenue,
          yesterdayRevenue,
          revenuePoints: payoutPointBreakdown?.revenuePoints || 0,
          creatorPaidPoints: payoutPointBreakdown?.creatorPaidPoints || 0,
          agencyPaidPoints: payoutPointBreakdown?.agencyPaidPoints || 0,
          paidPoints: payoutPointBreakdown?.paidPoints ?? cumulativeStats.points.total,
        },
        timezone,
      },
    });
  } catch (error) {
    return NextResponse.json(
      { success: false, error: error instanceof Error ? error.message : String(error) },
      { status: 500 },
    );
  }
}
