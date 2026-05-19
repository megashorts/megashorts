import { validateRequest } from "@/auth";
import { USER_ROLE } from "@/lib/constants";
import prisma from "@/lib/prisma";
import { createdAtFilter, parseStatsPeriod } from "@/lib/stats-period";
import { paidAccessMethods } from "@/lib/stats-queries";
import { NextRequest, NextResponse } from "next/server";

export async function GET(request: NextRequest) {
  try {
    const { user } = await validateRequest();

    if (!user || user.userRole < USER_ROLE.OPERATION1) {
      return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const period = searchParams.get("period") || "current";
    const range = parseStatsPeriod(period);
    const filter = createdAtFilter(range);

    const [views, points] = await Promise.all([
      prisma.videoView.groupBy({
        by: ["accessMethod"],
        where: {
          accessMethod: { in: paidAccessMethods },
          ...filter,
        },
        _sum: { viewCount: true },
      }),
      prisma.pointWithdrawal.aggregate({
        where: {
          status: "APPROVED",
          requestedAt: range.start && range.end ? { gte: range.start, lte: range.end } : undefined,
        },
        _sum: { amount: true },
      }),
    ]);
    const totalViews = views.reduce((sum, item) => sum + (item._sum.viewCount || 0), 0);

    return NextResponse.json({
      success: true,
      data: {
        period: range,
        totalViews,
        totalPoints: points._sum.amount || 0,
        dailyStats: [],
        topMembers: [],
        distributionByLevel: [],
      },
    });
  } catch (error) {
    return NextResponse.json(
      { success: false, error: error instanceof Error ? error.message : String(error) },
      { status: 500 },
    );
  }
}
