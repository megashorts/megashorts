export function emptyStoredStats(period: string, scope: string) {
  return {
    source: "empty",
    period,
    scope,
    stored: false,
  };
}

function rowPoints(row: any) {
  return Number(row.point_by_coin || row.pointByCoin || 0) + Number(row.point_by_subscription || row.pointBySubscription || 0);
}

function rowViews(row: any) {
  return Number(row.view_count_coin || row.viewCountCoin || 0) + Number(row.view_count_subscription || row.viewCountSubscription || 0);
}

function rowCoinViews(row: any) {
  return Number(row.view_count_coin || row.viewCountCoin || 0);
}

function rowSubscriptionViews(row: any) {
  return Number(row.view_count_subscription || row.viewCountSubscription || 0);
}

function rowCoinPoints(row: any) {
  return Number(row.point_by_coin || row.pointByCoin || 0);
}

function rowSubscriptionPoints(row: any) {
  return Number(row.point_by_subscription || row.pointBySubscription || 0);
}

function rowCommissionType(row: any) {
  return row.commission_type || row.commissionType || "-";
}

function commissionLabel(type: string) {
  if (type === "CREATOR") return "Creator payout";
  if (type === "DIRECT") return "Direct referral";
  if (type === "INDIRECT") return "Indirect referral";
  if (type === "NETWORK_LEVEL") return "Network level";
  return type || "-";
}

function storedRows(summary: any) {
  return Array.isArray(summary?.rows) ? summary.rows : [];
}

function buildAgencyBreakdown(rows: any[]) {
  const grouped = new Map<string, any>();

  rows.forEach((row) => {
    const type = rowCommissionType(row);
    const current = grouped.get(type) || {
      type,
      label: commissionLabel(type),
      userCount: new Set<string>(),
      subscriptionViews: 0,
      coinViews: 0,
      subscriptionPoints: 0,
      coinPoints: 0,
      totalViews: 0,
      totalPoints: 0,
    };
    const userId = row.user_id || row.userId;
    if (userId) current.userCount.add(userId);
    current.subscriptionViews += rowSubscriptionViews(row);
    current.coinViews += rowCoinViews(row);
    current.subscriptionPoints += rowSubscriptionPoints(row);
    current.coinPoints += rowCoinPoints(row);
    current.totalViews += rowViews(row);
    current.totalPoints += rowPoints(row);
    grouped.set(type, current);
  });

  return Array.from(grouped.values()).map((item) => ({
    ...item,
    userCount: item.userCount.size,
  }));
}

export function formatStoredCreatorStats(summary: any, period: string) {
  const rows = storedRows(summary);
  if (rows.length > 0) {
    const creatorRows = rows.filter((row: any) => row.commission_type === "CREATOR" || row.commissionType === "CREATOR");
    const postIds = new Set(creatorRows.map((row: any) => row.post_id || row.postId).filter(Boolean));

    return {
      ...emptyStoredStats(period, "creator"),
      source: summary?.source || "commission-worker",
      stored: true,
      postsCount: postIds.size,
      videosCount: 0,
      paidVideosCount: 0,
      totalViews: creatorRows.reduce((sum: number, row: any) => sum + rowViews(row), 0),
      subscriptionViews: creatorRows.reduce((sum: number, row: any) => sum + Number(row.view_count_subscription || row.viewCountSubscription || 0), 0),
      coinViews: creatorRows.reduce((sum: number, row: any) => sum + Number(row.view_count_coin || row.viewCountCoin || 0), 0),
      todayViews: 0,
      totalPoints: creatorRows.reduce((sum: number, row: any) => sum + rowPoints(row), 0),
      lastWeekPoints: creatorRows.reduce((sum: number, row: any) => sum + rowPoints(row), 0),
      topPosts: creatorRows.map((row: any) => ({
        postId: row.post_id || row.postId,
        postTitle: row.post_id || row.postId || "-",
        viewCount: rowViews(row),
        subscriptionViews: rowSubscriptionViews(row),
        coinViews: rowCoinViews(row),
        subscriptionPoints: rowSubscriptionPoints(row),
        coinPoints: rowCoinPoints(row),
        points: rowPoints(row),
      })),
    };
  }

  const creator = summary?.creator;
  const posts = Array.isArray(summary?.postAnalytics?.topPerformingPosts)
    ? summary.postAnalytics.topPerformingPosts
    : [];

  return {
    ...emptyStoredStats(period, "creator"),
    source: summary?.source || "commission-worker",
    stored: Boolean(summary),
    postsCount: Number(creator?.postCount || posts.length || 0),
    videosCount: 0,
    paidVideosCount: 0,
    totalViews: Number(creator?.totalViews || 0),
    subscriptionViews: Number(creator?.subscriptionViews || 0),
    coinViews: Number(creator?.coinViews || 0),
    todayViews: 0,
    totalPoints: Number(creator?.totalPoints || 0),
    lastWeekPoints: Number(creator?.totalPoints || 0),
    topPosts: posts
      .filter((post: any) => !creator?.uploaderId || post.uploaderId === creator.uploaderId)
      .map((post: any) => ({
        postId: post.postId,
        postTitle: post.postTitle || post.postId,
        viewCount: Number(post.totalViews || 0),
        subscriptionViews: Number(post.subscriptionViews || 0),
        coinViews: Number(post.coinViews || 0),
        subscriptionPoints: Number(post.subscriptionPoints || 0),
        coinPoints: Number(post.coinPoints || 0),
        points: Number(post.totalPoints || 0),
      })),
  };
}

export function formatStoredAgencyStats(summary: any, period: string) {
  const rows = storedRows(summary);
  if (rows.length > 0) {
    const subscriptionViews = rows.reduce((sum: number, row: any) => sum + Number(row.view_count_subscription || row.viewCountSubscription || 0), 0);
    const coinViews = rows.reduce((sum: number, row: any) => sum + Number(row.view_count_coin || row.viewCountCoin || 0), 0);
    const paidViewers = new Set(rows.map((row: any) => row.user_id || row.userId).filter(Boolean));

    return {
      ...emptyStoredStats(period, "agency"),
      source: summary?.source || "commission-worker",
      stored: true,
      totalReferredUsers: paidViewers.size,
      todayReferredUsers: 0,
      activeViewers: paidViewers.size,
      subscriptionViews,
      coinViews,
      totalViews: subscriptionViews + coinViews,
      totalPoints: rows.reduce((sum: number, row: any) => sum + rowPoints(row), 0),
      lastWeekPoints: rows.reduce((sum: number, row: any) => sum + rowPoints(row), 0),
      totalMembers: paidViewers.size,
      teamSummary: null,
      breakdown: buildAgencyBreakdown(rows),
      rows,
    };
  }

  const team = summary?.teamSummary;
  const creators = team?.creators || {};
  const direct = team?.directReferrers || {};
  const indirect = team?.indirectReferrers || {};
  const totalMembers = Number(creators.userCount || 0) + Number(direct.userCount || 0) + Number(indirect.userCount || 0);
  const subscriptionViews =
    Number(creators.subscriptionViews || 0) +
    Number(direct.subscriptionViews || 0) +
    Number(indirect.subscriptionViews || 0);
  const coinViews =
    Number(creators.coinViews || 0) +
    Number(direct.coinViews || 0) +
    Number(indirect.coinViews || 0);

  return {
    ...emptyStoredStats(period, "agency"),
    source: summary?.source || "commission-worker",
    stored: Boolean(team),
    totalReferredUsers: totalMembers,
    todayReferredUsers: 0,
    activeViewers: totalMembers,
    subscriptionViews,
    coinViews,
    totalViews: subscriptionViews + coinViews,
    totalPoints: Number(team?.teamTotal || 0),
    lastWeekPoints: Number(team?.teamTotal || 0),
    totalMembers,
      teamSummary: team || null,
      breakdown: buildAgencyBreakdown(rows),
  };
}

export function formatStoredAdminStats(summary: any, period: string) {
  const rows = storedRows(summary);
  if (rows.length > 0) {
    const subscriptionViews = rows.reduce((sum: number, row: any) => sum + Number(row.view_count_subscription || row.viewCountSubscription || 0), 0);
    const coinViews = rows.reduce((sum: number, row: any) => sum + Number(row.view_count_coin || row.viewCountCoin || 0), 0);
    const totalPoints = rows.reduce((sum: number, row: any) => sum + rowPoints(row), 0);
    const users = new Set(rows.map((row: any) => row.user_id || row.userId).filter(Boolean));
    const postRows = rows.filter((row: any) => row.post_id || row.postId);

    return {
      ...emptyStoredStats(period, "admin"),
      source: summary?.source || "commission-worker",
      stored: true,
      users: {
        total: users.size,
        todayNew: 0,
        deleted: 0,
        weeklySubscribers: 0,
        yearlySubscribers: 0,
      },
      coins: {
        totalPurchased: 0,
        totalUsed: coinViews,
        totalPurchaseAmount: 0,
      },
      content: {
        totalPosts: new Set(postRows.map((row: any) => row.post_id || row.postId)).size,
        totalVideos: 0,
        totalPaidVideos: 0,
      },
      views: {
        totalStreamingRequests: subscriptionViews + coinViews,
        subscriptionViews,
        coinViews,
        todayViews: 0,
      },
      points: {
        total: totalPoints,
        coin: rows.reduce((sum: number, row: any) => sum + Number(row.point_by_coin || row.pointByCoin || 0), 0),
        subscription: rows.reduce((sum: number, row: any) => sum + Number(row.point_by_subscription || row.pointBySubscription || 0), 0),
      },
      topItems: {
        posts: aggregateBy(postRows, (row) => row.post_id || row.postId).map((item) => ({
          id: item.key,
          title: item.key,
          views: item.views,
          points: item.points,
        })),
        paidPosts: aggregateBy(postRows, (row) => row.post_id || row.postId).map((item) => ({
          id: item.key,
          title: item.key,
          views: item.views,
          points: item.points,
        })),
        uploaders: aggregateBy(
          rows.filter((row: any) => row.commission_type === "CREATOR" || row.commissionType === "CREATOR"),
          (row) => row.user_id || row.userId,
        ).map((item) => ({
          id: item.key,
          name: item.key,
          points: item.points,
          views: item.views,
        })),
        agencyMembers: aggregateBy(
          rows.filter((row: any) => row.commission_type !== "CREATOR" && row.commissionType !== "CREATOR"),
          (row) => row.user_id || row.userId,
        ).map((item) => ({
          id: item.key,
          name: item.key,
          points: item.points,
          views: item.views,
        })),
        referrers: [],
        risingPosts: [],
      },
      commission: summary || null,
    };
  }

  const grand = summary?.grandTotal || {};
  const postAnalytics = summary?.postAnalytics || {};

  return {
    ...emptyStoredStats(period, "admin"),
    source: summary?.source || "commission-worker",
    stored: Boolean(summary),
    users: {
      total: Number(grand.totalUsers || 0),
      todayNew: 0,
      deleted: 0,
      weeklySubscribers: 0,
      yearlySubscribers: 0,
    },
    coins: {
      totalPurchased: 0,
      totalUsed: Number(grand.totalCoinViews || 0),
      totalPurchaseAmount: 0,
    },
    content: {
      totalPosts: Number(postAnalytics.totalPosts || 0),
      totalVideos: 0,
      totalPaidVideos: 0,
    },
    views: {
      totalStreamingRequests: Number(grand.totalCoinViews || 0) + Number(grand.totalSubscriptionViews || 0),
      subscriptionViews: Number(grand.totalSubscriptionViews || 0),
      coinViews: Number(grand.totalCoinViews || 0),
      todayViews: 0,
    },
    points: {
      total: Number(grand.totalPoints || 0),
      coin: Number(grand.totalCoinPoints || 0),
      subscription: Number(grand.totalSubscriptionPoints || 0),
    },
    topItems: {
      posts: (postAnalytics.topPerformingPosts || []).map((post: any) => ({
        id: post.postId,
        title: post.postTitle || post.postId,
        views: Number(post.totalViews || 0),
        points: Number(post.totalPoints || 0),
      })),
      paidPosts: (postAnalytics.topPerformingPosts || []).map((post: any) => ({
        id: post.postId,
        title: post.postTitle || post.postId,
        views: Number(post.totalViews || 0),
        points: Number(post.totalPoints || 0),
      })),
      uploaders: (postAnalytics.topUploaders || []).map((uploader: any) => ({
        id: uploader.uploaderId,
        name: uploader.uploaderId,
        points: Number(uploader.totalPoints || 0),
      })),
      agencyMembers: Object.entries(summary?.teamSummaries || {}).map(([id, team]: [string, any]) => ({
        id,
        name: id,
        points: Number(team?.teamTotal || 0),
      })),
      referrers: [],
      risingPosts: [],
    },
    commission: summary || null,
  };
}

export function formatStoredCreatorDetails(summary: any, period: string) {
  const stats = formatStoredCreatorStats(summary, period);

  return {
    period,
    source: stats.source,
    pointSettings: summary?.pointSettings || null,
    items: stats.topPosts,
    subscriptionViews: stats.subscriptionViews,
    coinViews: stats.coinViews,
    totalViewCount: stats.totalViews,
    totalPoints: stats.totalPoints,
  };
}

export function formatStoredAgencyDetails(summary: any, period: string) {
  const stats = formatStoredAgencyStats(summary, period);
  const team = (stats as any).teamSummary || {};
  const rows = storedRows(summary);

  return {
    period,
    source: stats.source,
    pointSettings: summary?.pointSettings || null,
    totalMembers: stats.totalMembers,
    activeViewers: stats.activeViewers,
    subscriptionViews: stats.subscriptionViews,
    coinViews: stats.coinViews,
    totalViews: stats.totalViews,
    totalPoints: stats.totalPoints,
    items: rows.map((row: any) => ({
      userId: row.user_id || row.userId,
      masterId: row.master_id || row.masterId,
      type: rowCommissionType(row),
      label: commissionLabel(rowCommissionType(row)),
      postId: row.post_id || row.postId,
      subscriptionViews: rowSubscriptionViews(row),
      coinViews: rowCoinViews(row),
      totalViews: rowViews(row),
      subscriptionPoints: rowSubscriptionPoints(row),
      coinPoints: rowCoinPoints(row),
      points: rowPoints(row),
    })),
    topMembers: team.topMembers || [],
    breakdown: (stats as any).breakdown || [],
  };
}

function aggregateBy(rows: any[], keyFor: (row: any) => string | null | undefined) {
  const grouped = new Map<string, {
    key: string;
    views: number;
    points: number;
    subscriptionViews: number;
    coinViews: number;
    subscriptionPoints: number;
    coinPoints: number;
  }>();

  rows.forEach((row) => {
    const key = keyFor(row);
    if (!key) return;
    const current = grouped.get(key) || {
      key,
      views: 0,
      points: 0,
      subscriptionViews: 0,
      coinViews: 0,
      subscriptionPoints: 0,
      coinPoints: 0,
    };
    current.views += rowViews(row);
    current.points += rowPoints(row);
    current.subscriptionViews += rowSubscriptionViews(row);
    current.coinViews += rowCoinViews(row);
    current.subscriptionPoints += rowSubscriptionPoints(row);
    current.coinPoints += rowCoinPoints(row);
    grouped.set(key, current);
  });

  return Array.from(grouped.values()).sort((a, b) => b.points - a.points);
}
