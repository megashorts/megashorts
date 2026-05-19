import { AccessMethod, Prisma } from "@prisma/client";
import prisma from "@/lib/prisma";
import { USER_ROLE } from "@/lib/constants";
import { createdAtFilter, getCurrentIsoWeek, parseStatsPeriod, requestedAtFilter } from "@/lib/stats-period";

export const paidAccessMethods = [AccessMethod.SUBSCRIPTION, AccessMethod.COIN];

export function toNumber(value: Prisma.Decimal | number | null | undefined) {
  if (value == null) return 0;
  return Number(value);
}

export async function assertStatsAccess(requestUser: { id: string; userRole: number }, targetUserId?: string | null) {
  if (!targetUserId) throw new Error("Missing userId");

  if (requestUser.id === targetUserId || requestUser.userRole >= USER_ROLE.OPERATION1) {
    return;
  }

  const target = await prisma.user.findUnique({
    where: { id: targetUserId },
    select: { id: true, teamMaster: true, referredBy: true },
  });

  if (!target) throw new Error("User not found");

  if (target.teamMaster === requestUser.id) return;

  throw new Error("Forbidden");
}

export async function getCreatorStats(userId: string, period = "current") {
  const range = parseStatsPeriod(period);
  const dateFilter = createdAtFilter(range);
  const todayRange = parseStatsPeriod(new Date().toISOString().slice(0, 10));

  const [user, postsCount, videosCount, paidVideosCount, views, todayViews, lastApprovedWithdrawal] = await Promise.all([
    prisma.user.findUnique({
      where: { id: userId },
      select: { id: true, points: true },
    }),
    prisma.post.count({ where: { userId } }),
    prisma.video.count({ where: { post: { userId } } }),
    prisma.video.count({ where: { isPremium: true, post: { userId } } }),
    prisma.videoView.groupBy({
      by: ["accessMethod"],
      where: {
        uploaderId: userId,
        accessMethod: { in: paidAccessMethods },
        ...dateFilter,
      },
      _sum: { viewCount: true },
    }),
    prisma.videoView.aggregate({
      where: {
        uploaderId: userId,
        accessMethod: { in: paidAccessMethods },
        ...createdAtFilter(todayRange),
      },
      _sum: { viewCount: true },
    }),
    prisma.pointWithdrawal.aggregate({
      where: {
        userId,
        status: "APPROVED",
        ...requestedAtFilter(parseStatsPeriod(previousWeekKey())),
      },
      _sum: { amount: true },
    }),
  ]);

  const subscriptionViews = views.find((item) => item.accessMethod === AccessMethod.SUBSCRIPTION)?._sum.viewCount || 0;
  const coinViews = views.find((item) => item.accessMethod === AccessMethod.COIN)?._sum.viewCount || 0;

  return {
    period: range,
    postsCount,
    videosCount,
    paidVideosCount,
    totalViews: subscriptionViews + coinViews,
    subscriptionViews,
    coinViews,
    todayViews: todayViews._sum.viewCount || 0,
    totalPoints: toNumber(user?.points),
    lastWeekPoints: lastApprovedWithdrawal._sum.amount || 0,
  };
}

export async function getAgencyStats(userId: string, period = "current") {
  const range = parseStatsPeriod(period);
  const dateFilter = createdAtFilter(range);
  const todayRange = parseStatsPeriod(new Date().toISOString().slice(0, 10));

  const members = await prisma.user.findMany({
    where: {
      OR: [
        { id: userId },
        { teamMaster: userId },
        { referredBy: userId },
      ],
    },
    select: {
      id: true,
      userRole: true,
      points: true,
      createdAt: true,
    },
  });
  const memberIds = members.map((member) => member.id);

  const [activeViewers, paidViews, todayReferredUsers, lastApprovedWithdrawal] = await Promise.all([
    prisma.videoView.findMany({
      where: {
        userId: { in: memberIds },
        accessMethod: { in: paidAccessMethods },
        ...dateFilter,
      },
      distinct: ["userId"],
      select: { userId: true },
    }),
    prisma.videoView.groupBy({
      by: ["accessMethod"],
      where: {
        userId: { in: memberIds },
        accessMethod: { in: paidAccessMethods },
        ...dateFilter,
      },
      _sum: { viewCount: true },
    }),
    prisma.user.count({
      where: {
        OR: [{ teamMaster: userId }, { referredBy: userId }],
        ...createdAtFilter(todayRange),
      },
    }),
    prisma.pointWithdrawal.aggregate({
      where: {
        userId,
        status: "APPROVED",
        ...requestedAtFilter(parseStatsPeriod(previousWeekKey())),
      },
      _sum: { amount: true },
    }),
  ]);

  const subscriptionViews = paidViews.find((item) => item.accessMethod === AccessMethod.SUBSCRIPTION)?._sum.viewCount || 0;
  const coinViews = paidViews.find((item) => item.accessMethod === AccessMethod.COIN)?._sum.viewCount || 0;

  return {
    period: range,
    totalReferredUsers: Math.max(0, members.length - 1),
    todayReferredUsers,
    activeViewers: activeViewers.length,
    subscriptionViews,
    coinViews,
    totalViews: subscriptionViews + coinViews,
    totalPoints: members.reduce((sum, member) => sum + toNumber(member.points), 0),
    lastWeekPoints: lastApprovedWithdrawal._sum.amount || 0,
  };
}

export async function getWeeklyCreatorSettlement(userId: string, period = "current") {
  const range = parseStatsPeriod(period);
  const rows = await prisma.videoView.groupBy({
    by: ["postId", "accessMethod"],
    where: {
      uploaderId: userId,
      accessMethod: { in: paidAccessMethods },
      ...createdAtFilter(range),
    },
    _sum: { viewCount: true },
  });
  const postIds = [...new Set(rows.map((row) => row.postId))];
  const posts = await prisma.post.findMany({
    where: { id: { in: postIds } },
    select: { id: true, title: true },
  });
  const postMap = new Map(posts.map((post) => [post.id, post.title || post.id]));
  const itemMap = new Map<string, any>();

  rows.forEach((row) => {
    const current = itemMap.get(row.postId) || {
      postId: row.postId,
      postTitle: postMap.get(row.postId) || row.postId,
      date: range.label,
      viewCount: 0,
      subscriptionViews: 0,
      coinViews: 0,
      points: 0,
    };
    const viewCount = row._sum.viewCount || 0;

    current.viewCount += viewCount;
    if (row.accessMethod === AccessMethod.SUBSCRIPTION) current.subscriptionViews += viewCount;
    if (row.accessMethod === AccessMethod.COIN) current.coinViews += viewCount;
    itemMap.set(row.postId, current);
  });

  const items = Array.from(itemMap.values());

  return {
    period: range,
    items,
    totalViewCount: items.reduce((sum, item) => sum + item.viewCount, 0),
    totalPoints: items.reduce((sum, item) => sum + item.points, 0),
  };
}

export async function getWeeklyAgencySettlement(userId: string, period = "current") {
  const stats = await getAgencyStats(userId, period);

  return {
    ...stats,
    totalMembers: stats.totalReferredUsers,
    totalPoints: stats.totalPoints,
  };
}

export async function getAdminStats(period = "current") {
  const range = parseStatsPeriod(period);
  const todayRange = parseStatsPeriod(new Date().toISOString().slice(0, 10));
  const dateFilter = createdAtFilter(range);

  const [
    totalUsers,
    todayNewUsers,
    subscriptions,
    posts,
    videos,
    paidVideos,
    paidViews,
    todayViews,
    payments,
    topPosts,
    topUploaders,
    topAgencyMembers,
  ] = await Promise.all([
    prisma.user.count(),
    prisma.user.count({ where: createdAtFilter(todayRange) }),
    prisma.subscription.groupBy({
      by: ["type"],
      where: { status: "active" },
      _count: { _all: true },
    }),
    prisma.post.count(),
    prisma.video.count(),
    prisma.video.count({ where: { isPremium: true } }),
    prisma.videoView.groupBy({
      by: ["accessMethod"],
      where: {
        accessMethod: { in: paidAccessMethods },
        ...dateFilter,
      },
      _sum: { viewCount: true },
    }),
    prisma.videoView.aggregate({
      where: {
        accessMethod: { in: paidAccessMethods },
        ...createdAtFilter(todayRange),
      },
      _sum: { viewCount: true },
    }),
    prisma.payment.aggregate({
      where: { status: { in: ["COMPLETED", "completed", "DONE", "done"] } },
      _sum: { amount: true },
      _count: { _all: true },
    }),
    prisma.post.findMany({
      orderBy: { viewCount: "desc" },
      take: 5,
      select: { id: true, title: true, viewCount: true },
    }),
    prisma.user.findMany({
      where: { userRole: { gte: USER_ROLE.CREATOR_Lv1, lt: USER_ROLE.TEAM_MEMBER } },
      orderBy: { points: "desc" },
      take: 5,
      select: { id: true, username: true, displayName: true, points: true },
    }),
    prisma.user.findMany({
      where: { userRole: { gte: USER_ROLE.TEAM_MEMBER, lt: USER_ROLE.OPERATION1 } },
      orderBy: { points: "desc" },
      take: 5,
      select: { id: true, username: true, displayName: true, points: true },
    }),
  ]);

  const subscriptionViews = paidViews.find((item) => item.accessMethod === AccessMethod.SUBSCRIPTION)?._sum.viewCount || 0;
  const coinViews = paidViews.find((item) => item.accessMethod === AccessMethod.COIN)?._sum.viewCount || 0;
  const weeklySubscribers = subscriptions.find((item) => item.type === "weekly")?._count._all || 0;
  const yearlySubscribers = subscriptions.find((item) => item.type === "yearly")?._count._all || 0;

  return {
    period: range,
    users: {
      total: totalUsers,
      todayNew: todayNewUsers,
      deleted: 0,
      weeklySubscribers,
      yearlySubscribers,
    },
    coins: {
      totalPurchased: payments._count._all,
      totalUsed: coinViews,
      totalPurchaseAmount: payments._sum.amount || 0,
    },
    content: {
      totalPosts: posts,
      totalVideos: videos,
      totalPaidVideos: paidVideos,
    },
    views: {
      totalStreamingRequests: subscriptionViews + coinViews,
      subscriptionViews,
      coinViews,
      todayViews: todayViews._sum.viewCount || 0,
    },
    topItems: {
      posts: topPosts.map((post) => ({ id: post.id, title: post.title || post.id, views: post.viewCount })),
      paidPosts: topPosts.map((post) => ({ id: post.id, title: post.title || post.id, views: post.viewCount })),
      uploaders: topUploaders.map((user) => ({
        id: user.id,
        name: user.displayName || user.username,
        points: toNumber(user.points),
      })),
      agencyMembers: topAgencyMembers.map((user) => ({
        id: user.id,
        name: user.displayName || user.username,
        points: toNumber(user.points),
      })),
      referrers: [],
      risingPosts: [],
    },
  };
}

function previousWeekKey() {
  const now = new Date();
  const previous = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
  const previousWeek = getCurrentIsoWeek(previous);

  return `${previousWeek.year}-W${String(previousWeek.week).padStart(2, "0")}`;
}
