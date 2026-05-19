import { validateRequest } from "@/auth";
import { USER_ROLE } from "@/lib/constants";
import { getAdminStats } from "@/lib/stats-queries";
import { fetchCommissionSummaryFromWorker } from "@/lib/worker-stats";
import { NextRequest, NextResponse } from "next/server";

export async function GET(request: NextRequest) {
  try {
    const { user } = await validateRequest();

    if (!user || user.userRole < USER_ROLE.OPERATION1) {
      return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const period = searchParams.get("period") || "current";

    const fallback = await getAdminStats(period);
    const workerSummary = await fetchCommissionSummaryFromWorker({
      scope: "admin",
      period,
    });

    return NextResponse.json({
      success: true,
      data: {
        ...fallback,
        source: workerSummary?.source || "postgres",
        commission: workerSummary || null,
        views: {
          ...fallback.views,
          totalStreamingRequests: workerSummary?.grandTotal?.totalCoinViews != null
            ? workerSummary.grandTotal.totalCoinViews + workerSummary.grandTotal.totalSubscriptionViews
            : fallback.views.totalStreamingRequests,
          subscriptionViews: workerSummary?.grandTotal?.totalSubscriptionViews ?? fallback.views.subscriptionViews,
          coinViews: workerSummary?.grandTotal?.totalCoinViews ?? fallback.views.coinViews,
        },
      },
    });
  } catch (error) {
    return NextResponse.json(
      { success: false, error: error instanceof Error ? error.message : String(error) },
      { status: 500 },
    );
  }
}
