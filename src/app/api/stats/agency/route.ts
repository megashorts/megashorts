import { validateRequest } from "@/auth";
import { USER_ROLE } from "@/lib/constants";
import { assertStatsAccess, getAgencyStats } from "@/lib/stats-queries";
import { fetchCommissionSummaryFromWorker } from "@/lib/worker-stats";
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

    const fallback = await getAgencyStats(userId!, period);
    const workerSummary = await fetchCommissionSummaryFromWorker({
      scope: "agency",
      userId: userId!,
      period,
    });
    const team = workerSummary?.teamSummary;

    return NextResponse.json({
      success: true,
      data: {
        ...fallback,
        source: workerSummary?.source || "postgres",
        totalPoints: team?.teamTotal ?? fallback.totalPoints,
        subscriptionViews:
          (team?.creators?.subscriptionViews || 0) +
          (team?.directReferrers?.subscriptionViews || 0) +
          (team?.indirectReferrers?.subscriptionViews || 0) || fallback.subscriptionViews,
        coinViews:
          (team?.creators?.coinViews || 0) +
          (team?.directReferrers?.coinViews || 0) +
          (team?.indirectReferrers?.coinViews || 0) || fallback.coinViews,
      },
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    const status = message === "Forbidden" ? 403 : message === "Missing userId" ? 400 : 500;

    return NextResponse.json({ success: false, error: message }, { status });
  }
}
