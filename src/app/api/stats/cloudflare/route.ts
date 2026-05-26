import { validateRequest } from "@/auth";
import { USER_ROLE } from "@/lib/constants";
import { countryCenters, normalizeCountryCode } from "@/lib/country-centers";
import prisma from "@/lib/prisma";
import { inferStatsPeriodUnit, periodDateKey } from "@/lib/stats-period";
import { fetchCfStatsFromWorker } from "@/lib/worker-stats";
import { NextRequest, NextResponse } from "next/server";

export async function GET(request: NextRequest) {
  try {
    const { user } = await validateRequest();

    if (!user) {
      return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const requestedUserId = searchParams.get("userId");
    const selectedPeriod = searchParams.get("period") || "current";
    const fallbackPeriod = searchParams.get("fallbackPeriod") || undefined;

    if (requestedUserId && requestedUserId !== user.id && user.userRole < USER_ROLE.OPERATION1) {
      return NextResponse.json({ success: false, error: "Forbidden" }, { status: 403 });
    }

    const isAllPeriod = selectedPeriod === "all";
    const cfPeriod = isAllPeriod ? "weekly" : inferStatsPeriodUnit(selectedPeriod);
    let workerStats = await fetchCfStatsFromWorker({
      period: cfPeriod,
      date: isAllPeriod ? "all" : periodDateKey(selectedPeriod, cfPeriod),
      creator: requestedUserId || undefined,
    });
    let workerCountries = Array.isArray(workerStats?.topCountries) ? workerStats.topCountries : null;

    if (requestedUserId && isAllPeriod && (!workerCountries || workerCountries.length === 0) && fallbackPeriod && fallbackPeriod !== "all") {
      const fallbackUnit = inferStatsPeriodUnit(fallbackPeriod);
      const fallbackStats = await fetchCfStatsFromWorker({
        period: fallbackUnit,
        date: periodDateKey(fallbackPeriod, fallbackUnit),
        creator: requestedUserId,
      });
      const fallbackCountries = Array.isArray(fallbackStats?.topCountries) ? fallbackStats.topCountries : null;

      if (fallbackCountries && fallbackCountries.length > 0) {
        workerStats = {
          ...fallbackStats,
          source: `${fallbackStats?.source || "stored_cf_stats"}_fallback_period`,
        };
        workerCountries = fallbackCountries;
      }
    }

    const stored = workerCountries || requestedUserId ? null : await prisma.systemSetting.findFirst({
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
        const code = normalizeCountryCode(item.country || item.countryCode);
        const coords = countryCenters[code];

        if (!coords) return null;

        return {
          country: coords.code,
          countryName: coords.name,
          latitude: coords.latitude,
          longitude: coords.longitude,
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
