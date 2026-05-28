import { validateRequest } from "@/auth";
import { USER_ROLE } from "@/lib/constants";
import { NextRequest, NextResponse } from "next/server";
import { getAnalyticsTimeZone } from "@/lib/analytics-timezone-server";
import { normalizeAnalyticsTimeZone } from "@/lib/analytics-timezone";

const DEFAULT_LOG_WORKER_URL = "https://megashorts-logs.msdevcm.workers.dev";

function getLogWorkerConfig() {
  const candidateKeys = [
    process.env.WORKER_API_KEY,
    process.env.CRON_SECRET,
    process.env.NEXT_PUBLIC_WORKER_API_KEY,
  ].filter((value): value is string => Boolean(value && value.trim()));

  return {
    url: process.env.LOGS_WORKER_URL
      || process.env.NEXT_PUBLIC_LOGS_WORKER_URL
      || DEFAULT_LOG_WORKER_URL,
    apiKeys: Array.from(new Set(candidateKeys)),
  };
}

export async function GET(request: NextRequest) {
  const { user } = await validateRequest();
  if (!user) {
    return NextResponse.json(
      { success: false, error: "Unauthorized", code: "AUTH_USER_MISSING" },
      { status: 401 },
    );
  }
  if (user.userRole < USER_ROLE.OPERATION1) {
    return NextResponse.json(
      { success: false, error: "Unauthorized", code: "AUTH_ROLE_INSUFFICIENT", userRole: user.userRole },
      { status: 401 },
    );
  }

  const { url, apiKeys } = getLogWorkerConfig();
  if (apiKeys.length === 0) {
    return NextResponse.json(
      { success: false, error: "Log worker API key is not configured", code: "WORKER_API_KEY_MISSING" },
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

  let lastUnauthorizedBody = "";
  for (const [index, apiKey] of apiKeys.entries()) {
    const response = await fetch(workerUrl, {
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "X-API-Key": apiKey,
      },
      cache: "no-store",
    });

    const body = await response.text();
    if (response.status !== 401) {
      return new NextResponse(body, {
        status: response.status,
        headers: {
          "Content-Type": response.headers.get("Content-Type") || "application/json",
          "Cache-Control": "no-store",
          "X-Log-Worker-Key-Index": String(index),
        },
      });
    }

    lastUnauthorizedBody = body;
    console.warn(
      `[api/admin/service/logs] worker returned 401 with key index=${index + 1}/${apiKeys.length}`,
    );
  }

  return new NextResponse(lastUnauthorizedBody || JSON.stringify({
    success: false,
    error: "Worker authorization failed",
    code: "WORKER_AUTH_FAILED",
  }), {
    status: 401,
    headers: {
      "Content-Type": "application/json",
      "Cache-Control": "no-store",
      "X-Log-Worker-Key-Index": "all-failed",
    },
  });
}
