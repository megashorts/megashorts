import { validateRequest } from "@/auth";
import { USER_ROLE } from "@/lib/constants";
import prisma from "@/lib/prisma";
import { fetchCfStatsFromWorker, periodDateKey } from "@/lib/worker-stats";
import { NextRequest, NextResponse } from "next/server";

const countryCoordinates: Record<string, { latitude: number; longitude: number; country: string }> = {
  KR: { country: "KR", latitude: 36.5, longitude: 127.8 },
  US: { country: "US", latitude: 39.8, longitude: -98.6 },
  CN: { country: "CN", latitude: 35.9, longitude: 104.2 },
  JP: { country: "JP", latitude: 36.2, longitude: 138.3 },
  TH: { country: "TH", latitude: 15.8, longitude: 101.0 },
  ES: { country: "ES", latitude: 40.4, longitude: -3.7 },
  ID: { country: "ID", latitude: -2.5, longitude: 118.0 },
  VN: { country: "VN", latitude: 14.1, longitude: 108.3 },
  SG: { country: "SG", latitude: 1.35, longitude: 103.8 },
};

export async function GET(request: NextRequest) {
  try {
    const { user } = await validateRequest();

    if (!user) {
      return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const requestedUserId = searchParams.get("userId");
    const selectedPeriod = searchParams.get("period") || "current";

    if (requestedUserId && requestedUserId !== user.id && user.userRole < USER_ROLE.OPERATION1) {
      return NextResponse.json({ success: false, error: "Forbidden" }, { status: 403 });
    }

    const cfPeriod = /^\d{4}-\d{2}$/.test(selectedPeriod)
      ? "monthly"
      : /^\d{4}-\d{2}-\d{2}$/.test(selectedPeriod)
        ? "daily"
        : "weekly";
    const workerStats = await fetchCfStatsFromWorker({
      period: cfPeriod,
      date: periodDateKey(selectedPeriod),
    });
    const workerCountries = Array.isArray(workerStats?.topCountries) ? workerStats.topCountries : null;

    const stored = workerCountries ? null : await prisma.systemSetting.findFirst({
      where: {
        key: {
          startsWith: "cfStats_",
        },
      },
      orderBy: { updatedAt: "desc" },
    });
    const value = stored?.value as any;
    const topCountries = workerCountries || (Array.isArray(value?.topCountries)
      ? value.topCountries
      : Array.isArray(value?.top_countries)
        ? value.top_countries
        : []);
    const viewerDistribution = topCountries
      .map((item: any) => {
        const code = String(item.country || item.countryCode || "").toUpperCase();
        const coords = countryCoordinates[code];

        if (!coords) return null;

        return {
          ...coords,
          count: Number(item.count || item.requests || item.minutes || 0),
          minutes: Number(item.minutes || 0),
        };
      })
      .filter(Boolean);

    return NextResponse.json({
      success: true,
      data: {
        source: workerStats?.source || (stored ? "system_settings" : "empty"),
        viewerDistribution,
        topCountries,
        totalMinutes: workerStats?.totalMinutes || 0,
        requestList: workerStats?.requestList || {},
      },
    });
  } catch (error) {
    return NextResponse.json(
      { success: false, error: error instanceof Error ? error.message : String(error) },
      { status: 500 },
    );
  }
}
