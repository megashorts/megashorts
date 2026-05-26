import { validateRequest } from "@/auth";
import { formatStoredCreatorStats } from "@/lib/stored-stats-formatters";
import { assertStatsAccess } from "@/lib/stats-queries";
import { canOpenCreatorEarnings, isOperationsRole } from "@/lib/user-roles";
import { fetchCommissionSummaryFromWorker } from "@/lib/worker-stats";
import { getAnalyticsTimeZone } from "@/lib/analytics-timezone-server";
import prisma from "@/lib/prisma";
import { NextRequest, NextResponse } from "next/server";

export async function GET(request: NextRequest) {
  try {
    const { user } = await validateRequest();

    if (!user) {
      return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const userId = searchParams.get("userId");
    const period = searchParams.get("period") || "current";

    await assertStatsAccess(user, userId);
    if (user.id === userId && !canOpenCreatorEarnings(user.userRole)) {
      return NextResponse.json({ success: false, error: "Forbidden" }, { status: 403 });
    }
    if (user.id !== userId && !isOperationsRole(user.userRole)) {
      return NextResponse.json({ success: false, error: "Forbidden" }, { status: 403 });
    }

    const [workerSummary, cumulativeSummary, postsCount, videosCount, paidVideosCount, targetUser, timezone] = await Promise.all([
      fetchCommissionSummaryFromWorker({
        scope: "creator",
        userId: userId!,
        period,
      }),
      fetchCommissionSummaryFromWorker({
        scope: "creator",
        userId: userId!,
        period: "all",
      }),
      prisma.post.count({ where: { userId: userId! } }),
      prisma.video.count({ where: { post: { userId: userId! } } }),
      prisma.video.count({ where: { isPremium: true, post: { userId: userId! } } }),
      prisma.user.findUnique({ where: { id: userId! }, select: { points: true } }),
      getAnalyticsTimeZone(),
    ]);
    const stats = formatStoredCreatorStats(workerSummary, period);
    const cumulativeStats = formatStoredCreatorStats(cumulativeSummary, "all");
    const postIds = Array.from(new Set([
      ...(Array.isArray(stats.topPosts) ? stats.topPosts.map((post: any) => post.postId).filter(Boolean) : []),
      ...(Array.isArray(cumulativeStats.topPosts) ? cumulativeStats.topPosts.map((post: any) => post.postId).filter(Boolean) : []),
    ]));
    const posts = postIds.length > 0
      ? await prisma.post.findMany({ where: { id: { in: postIds } }, select: { id: true, title: true, postNum: true } })
      : [];
    const postMap = new Map(posts.map((post) => [post.id, post.title || `Post #${post.postNum}`]));

    return NextResponse.json({
      success: true,
      data: {
        ...stats,
        topPosts: Array.isArray(stats.topPosts)
          ? stats.topPosts.map((post: any) => ({
              ...post,
              postTitle: postMap.get(post.postId) || post.postTitle,
            }))
          : [],
        postsCount,
        videosCount,
        paidVideosCount,
        currentPoints: Number(targetUser?.points || 0),
        cumulative: {
          subscriptionViews: cumulativeStats.subscriptionViews,
          coinViews: cumulativeStats.coinViews,
          totalViews: cumulativeStats.totalViews,
          totalPoints: cumulativeStats.totalPoints,
          paidPoints: Number(targetUser?.points || 0),
          topPosts: Array.isArray(cumulativeStats.topPosts)
            ? cumulativeStats.topPosts.map((post: any) => ({
                ...post,
                postTitle: postMap.get(post.postId) || post.postTitle,
              }))
            : [],
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
