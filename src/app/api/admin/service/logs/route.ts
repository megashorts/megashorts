import { validateRequest } from "@/auth";
import { USER_ROLE } from "@/lib/constants";
import { NextRequest, NextResponse } from "next/server";
import { getAnalyticsTimeZone } from "@/lib/analytics-timezone-server";
import { normalizeAnalyticsTimeZone } from "@/lib/analytics-timezone";

const DEFAULT_LOG_WORKER_URL = "https://megashorts-logs.msdevcm.workers.dev";

function getLogWorkerConfig() {
  return {
    url: process.env.LOGS_WORKER_URL
      || process.env.NEXT_PUBLIC_LOGS_WORKER_URL
      || DEFAULT_LOG_WORKER_URL,
    apiKey: process.env.WORKER_API_KEY || process.env.NEXT_PUBLIC_WORKER_API_KEY,
  };
}

export async function GET(request: NextRequest) {
  const { user } = await validateRequest();
  if (!user || user.userRole < USER_ROLE.OPERATION1) {
    return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
  }

  const { url, apiKey } = getLogWorkerConfig();
  if (!apiKey) {
    return NextResponse.json(
      { success: false, error: "Log worker API key is not configured" },
      { status: 500 },
    );
  }

  const sourceUrl = new URL(request.url);
  const workerUrl = new URL(url);
  const searchParams = new URLSearchParams(sourceUrl.search);
  const requestedTimeZone = searchParams.get('timezone');
  if (requestedTimeZone) {
    searchParams.set('timezone', normalizeAnalyticsTimeZone(requestedTimeZone));
  } else {
    searchParams.set('timezone', await getAnalyticsTimeZone());
  }
  workerUrl.search = searchParams.toString();

  const response = await fetch(workerUrl, {
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "X-API-Key": apiKey,
    },
    cache: "no-store",
  });

  const body = await response.text();
  return new NextResponse(body, {
    status: response.status,
    headers: {
      "Content-Type": response.headers.get("Content-Type") || "application/json",
      "Cache-Control": "no-store",
    },
  });
}
