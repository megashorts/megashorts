import { validateRequest } from "@/auth";
import { assertStatsAccess, getCreatorStats } from "@/lib/stats-queries";
import { fetchCommissionSummaryFromWorker } from "@/lib/worker-stats";
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

    const fallback = await getCreatorStats(userId!, period);
    const workerSummary = await fetchCommissionSummaryFromWorker({
      scope: "creator",
      userId: userId!,
      period,
    });
    const creator = workerSummary?.creator;

    return NextResponse.json({
      success: true,
      data: {
        ...fallback,
        source: workerSummary?.source || "postgres",
        totalViews: creator?.totalViews ?? fallback.totalViews,
        subscriptionViews: creator?.subscriptionViews ?? fallback.subscriptionViews,
        coinViews: creator?.coinViews ?? fallback.coinViews,
        totalPoints: creator?.totalPoints ?? fallback.totalPoints,
        postsCount: creator?.postCount ?? fallback.postsCount,
      },
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    const status = message === "Forbidden" ? 403 : message === "Missing userId" ? 400 : 500;

    return NextResponse.json({ success: false, error: message }, { status });
  }
}
