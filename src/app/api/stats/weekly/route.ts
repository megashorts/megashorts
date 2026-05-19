import { validateRequest } from "@/auth";
import { USER_ROLE } from "@/lib/constants";
import { assertStatsAccess, getWeeklyAgencySettlement, getWeeklyCreatorSettlement } from "@/lib/stats-queries";
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
    const type = searchParams.get("type") || "uploader";

    await assertStatsAccess(user, userId);

    if (type === "agency") {
      if (user.userRole < USER_ROLE.TEAM_MEMBER && user.userRole < USER_ROLE.OPERATION1) {
        return NextResponse.json({ success: false, error: "Forbidden" }, { status: 403 });
      }

      const fallback = await getWeeklyAgencySettlement(userId!, period);
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
          totalMembers:
            (team?.creators?.userCount || 0) +
            (team?.directReferrers?.userCount || 0) +
            (team?.indirectReferrers?.userCount || 0) || fallback.totalMembers,
        },
      });
    }

    const fallback = await getWeeklyCreatorSettlement(userId!, period);
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
        totalViewCount: creator?.totalViews ?? fallback.totalViewCount,
        totalPoints: creator?.totalPoints ?? fallback.totalPoints,
      },
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    const status = message === "Forbidden" ? 403 : message === "Missing userId" ? 400 : 500;

    return NextResponse.json({ success: false, error: message }, { status });
  }
}
