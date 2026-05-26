import { validateRequest } from "@/auth";
import { USER_ROLE } from "@/lib/constants";
import { formatStoredAdminStats } from "@/lib/stored-stats-formatters";
import prisma from "@/lib/prisma";
import { fetchCommissionSummaryFromWorker, fetchPayoutDetailRowsFromD1, fetchPayoutPointBreakdownFromD1, fetchViewDetailRowsFromD1 } from "@/lib/worker-stats";
import { parseStatsPeriod } from "@/lib/stats-period";
import { NextRequest, NextResponse } from "next/server";

const PAID_PAYMENT_STATUSES = ["DONE", "done", "PAID", "paid", "APPROVED", "approved", "SUCCESS", "success", "CONFIRMED", "confirmed", "COMPLETED", "completed"];
const PROCESSED_WITHDRAWAL_STATUSES = ["APPROVED", "COMPLETED", "PAID", "PROCESSED"];

function periodWhere(period: string, field = "createdAt") {
  const range = parseStatsPeriod(period);
  if (!range.start || !range.end) return {};

  return {
    [field]: {
      gte: range.start,
      lte: range.end,
    },
  };
}

function sumAmount(payments: Array<{ amount: number | null }>) {
  return payments.reduce((sum, payment) => sum + Number(payment.amount || 0), 0);
}

function rowPoints(row: any) {
  return Number(row.point_by_coin || 0) + Number(row.point_by_subscription || 0);
}

function rowViews(row: any) {
  return Number(row.view_count_coin || 0) + Number(row.view_count_subscription || 0);
}

function rowType(row: any) {
  return row.commission_type || "-";
}

function commissionLabel(type: string) {
  if (type === "CREATOR") return "Creator payout";
  if (type === "DIRECT") return "Direct referral";
  if (type === "INDIRECT") return "Indirect referral";
  if (type === "NETWORK_LEVEL") return "Network level";
  return type || "-";
}

function aggregateRows(rows: any[], keyFor: (row: any) => string | null | undefined) {
  const grouped = new Map<string, any>();

  rows.forEach((row) => {
    const key = keyFor(row);
    if (!key) return;
    const current = grouped.get(key) || {
      id: key,
      views: 0,
      subscriptionViews: 0,
      coinViews: 0,
      points: 0,
      subscriptionPoints: 0,
      coinPoints: 0,
    };
    current.views += rowViews(row);
    current.subscriptionViews += Number(row.view_count_subscription || 0);
    current.coinViews += Number(row.view_count_coin || 0);
    current.points += rowPoints(row);
    current.subscriptionPoints += Number(row.point_by_subscription || 0);
    current.coinPoints += Number(row.point_by_coin || 0);
    grouped.set(key, current);
  });

  return Array.from(grouped.values()).sort((a, b) => b.points - a.points);
}

export async function GET(request: NextRequest) {
  try {
    const { user } = await validateRequest();

    if (!user || user.userRole < USER_ROLE.OPERATION1) {
      return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const period = searchParams.get("period") || "current";

    const [workerSummary, payoutRows, payoutPointBreakdown] = await Promise.all([
      fetchCommissionSummaryFromWorker({
        scope: "admin",
        period,
      }),
      fetchPayoutDetailRowsFromD1({ period }),
      fetchPayoutPointBreakdownFromD1({ period }),
    ]);
    const viewDetailRows = await fetchViewDetailRowsFromD1({ period });
    const stats = formatStoredAdminStats(workerSummary, period);
    const createdAt = periodWhere(period);
    const requestedAt = periodWhere(period, "requestedAt");
    const processedAt = periodWhere(period, "processedAt");
    const creatorRows = payoutRows.filter((row: any) => rowType(row) === "CREATOR");
    const agencyRows = payoutRows.filter((row: any) => rowType(row) !== "CREATOR");
    const postIds = Array.from(new Set([
      ...(stats.topItems.posts || []).map((item: any) => item.id),
      ...payoutRows.map((row: any) => row.post_id),
      ...viewDetailRows.map((row: any) => row.post_id),
    ].filter(Boolean)));
    const videoIds = Array.from(new Set(viewDetailRows.map((row: any) => row.video_id).filter(Boolean)));
    const uploaderIds = Array.from(new Set([
      ...(stats.topItems.uploaders || []).map((item: any) => item.id),
      ...creatorRows.map((row: any) => row.user_id),
    ].filter(Boolean)));
    const agencyIds = Array.from(new Set([
      ...(stats.topItems.agencyMembers || []).map((item: any) => item.id),
      ...agencyRows.map((row: any) => row.user_id),
      ...agencyRows.map((row: any) => row.master_id),
    ].filter(Boolean)));
    const posts = postIds.length > 0
      ? await prisma.post.findMany({ where: { id: { in: postIds } }, select: { id: true, title: true, postNum: true } })
      : [];
    const videos = videoIds.length > 0
      ? await prisma.video.findMany({ where: { id: { in: videoIds } }, select: { id: true, sequence: true, postId: true, isPremium: true } })
      : [];
    const postMap = new Map(posts.map((post) => [post.id, post.title || `Post #${post.postNum}`]));
    const videoMap = new Map(videos.map((video) => [video.id, video]));
    const [
      newUsers,
      newPosts,
      newVideos,
      newPaidVideos,
      periodPayments,
      withdrawalRequested,
      withdrawalProcessed,
      uploaderUsers,
      agencyUsers,
    ] = await Promise.all([
      prisma.user.count({ where: createdAt }),
      prisma.post.count({ where: createdAt }),
      prisma.video.count({ where: createdAt }),
      prisma.video.count({ where: { ...createdAt, isPremium: true } }),
      prisma.payment.findMany({
        where: {
          OR: [{ approvedAt: (periodWhere(period, "approvedAt") as any).approvedAt }, { ...createdAt }],
          status: { in: PAID_PAYMENT_STATUSES },
        },
        select: { amount: true, type: true },
      }),
      prisma.pointWithdrawal.aggregate({
        where: requestedAt,
        _sum: { amount: true },
        _count: { _all: true },
      }),
      prisma.pointWithdrawal.aggregate({
        where: {
          ...processedAt,
          status: { in: PROCESSED_WITHDRAWAL_STATUSES },
        },
        _sum: { amount: true },
        _count: { _all: true },
      }),
      uploaderIds.length > 0
        ? prisma.user.findMany({ where: { id: { in: uploaderIds } }, select: { id: true, username: true, displayName: true } })
        : [],
      agencyIds.length > 0
        ? prisma.user.findMany({ where: { id: { in: agencyIds } }, select: { id: true, username: true, displayName: true, userRole: true } })
        : [],
    ]);
    const uploaderMap = new Map(uploaderUsers.map((item) => [item.id, item.displayName || item.username]));
    const agencyMap = new Map(agencyUsers.map((item) => [item.id, item]));
    const subscriptionRevenue = sumAmount(periodPayments.filter((payment) => String(payment.type || "").toLowerCase().includes("sub")));
    const coinRevenue = sumAmount(periodPayments.filter((payment) => String(payment.type || "").toLowerCase().includes("coin")));
    const aggregatedCreators = aggregateRows(creatorRows, (row) => row.user_id);
    const aggregatedAgencyMembers = aggregateRows(agencyRows, (row) => row.user_id);
    const aggregatedPosts = aggregateRows(payoutRows, (row) => row.post_id);
    const topCreators = (aggregatedCreators.length > 0 ? aggregatedCreators : stats.topItems.uploaders || []).slice(0, 5).map((item: any) => ({
      ...item,
      name: uploaderMap.get(item.id) || item.name,
    }));
    const topAgencyMembers = aggregatedAgencyMembers
      .filter((item: any) => Number(agencyMap.get(item.id)?.userRole || 0) < USER_ROLE.TEAM_MASTER)
      .slice(0, 5)
      .map((item: any) => ({
        ...item,
        name: agencyMap.get(item.id)?.displayName || agencyMap.get(item.id)?.username || item.name,
      }));
    const payoutDetails = payoutRows
      .map((row: any) => ({
        recipientId: row.user_id,
        recipientName:
          uploaderMap.get(row.user_id) ||
          agencyMap.get(row.user_id)?.displayName ||
          agencyMap.get(row.user_id)?.username ||
          row.user_id,
        teamMasterId: row.master_id,
        teamMasterName:
          agencyMap.get(row.master_id)?.displayName ||
          agencyMap.get(row.master_id)?.username ||
          row.master_id ||
          "-",
        type: rowType(row),
        label: commissionLabel(rowType(row)),
        postId: row.post_id,
        postTitle: postMap.get(row.post_id) || row.post_id || "-",
        subscriptionViews: Number(row.view_count_subscription || 0),
        coinViews: Number(row.view_count_coin || 0),
        subscriptionPoints: Number(row.point_by_subscription || 0),
        coinPoints: Number(row.point_by_coin || 0),
        totalViews: rowViews(row),
        totalPoints: rowPoints(row),
      }))
      .sort((a: any, b: any) => b.totalPoints - a.totalPoints);
    const agencyTypeBreakdown = aggregateRows(agencyRows, (row) => rowType(row)).map((item: any) => ({
      ...item,
      label: commissionLabel(item.id),
    }));
    const viewBasisDetails = viewDetailRows
      .map((row: any) => {
        const video = videoMap.get(row.video_id);
        return {
          postId: row.post_id,
          postTitle: postMap.get(row.post_id) || row.post_id || "-",
          videoId: row.video_id,
          videoLabel: video ? `Video ${video.sequence}${video.isPremium ? " / Paid" : ""}` : row.video_id,
          uploaderId: row.uploader_id,
          masterId: row.master_id,
          referrerId: row.referrer_id,
          accessMethod: row.access_method,
          viewers: Number(row.viewers || 0),
          views: Number(row.views || 0),
        };
      })
      .sort((a: any, b: any) => b.views - a.views);

    return NextResponse.json({
      success: true,
      data: {
        period,
        totalViews: stats.views.totalStreamingRequests,
        totalPoints: stats.points.total,
        items: (aggregatedPosts.length > 0 ? aggregatedPosts : stats.topItems.posts || []).map((item: any) => ({
          ...item,
          title: postMap.get(item.id) || item.title,
        })),
        cards: [
          { title: "New / Deleted Users", value: `${newUsers}/0`, note: "Signups / Deleted" },
          { title: "New Content", value: `${newPosts}/${newVideos}/${newPaidVideos}`, note: "Post / Videos / Paid" },
          { title: "Paid Views", value: `${stats.views.subscriptionViews}/${stats.views.coinViews}`, note: "Subscription / Coin" },
          { title: "Payment Revenue", value: `${subscriptionRevenue}/${coinRevenue}`, note: "Subscription / Coin" },
          {
            title: "Revenue Points",
            value: `${Number(payoutPointBreakdown?.revenuePoints || 0)}/${Number(payoutPointBreakdown?.creatorPaidPoints || 0)}/${Number(payoutPointBreakdown?.agencyPaidPoints || 0)}`,
            note: "Revenue Points / Creator / Agency",
          },
          { title: "Point Payout", value: `${payoutDetails.reduce((sum: number, row: any) => sum + row.totalPoints, 0)}`, note: "Completed creator + agency payout points" },
          {
            title: "Withdrawal Requested / Processed",
            value: `${Number(withdrawalRequested._sum.amount || 0)}/${Number(withdrawalProcessed._sum.amount || 0)}`,
            note: `Requested ${withdrawalRequested._count._all} / Processed ${withdrawalProcessed._count._all}`,
          },
        ],
        topPaidPosts: (stats.topItems.paidPosts || stats.topItems.posts || []).slice(0, 5).map((item: any) => ({
          ...item,
          title: postMap.get(item.id) || item.title,
        })),
        topCreators,
        topAgencyMembers,
        creatorPayoutDetails: payoutDetails.filter((row: any) => row.type === "CREATOR"),
        agencyPayoutDetails: payoutDetails.filter((row: any) => row.type !== "CREATOR"),
        agencyTypeBreakdown,
        viewBasisDetails,
      },
    });
  } catch (error) {
    return NextResponse.json(
      { success: false, error: error instanceof Error ? error.message : String(error) },
      { status: 500 },
    );
  }
}
