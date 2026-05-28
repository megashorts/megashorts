import { NextRequest, NextResponse } from "next/server";

const DEFAULT_LOG_WORKER_URL = "https://megashorts-logs.msdevcm.workers.dev";
const MAX_LOG_BODY_BYTES = 512 * 1024;

function isMegashortsDomainHost(hostname: string): boolean {
  return hostname === "megashorts.com" || hostname.endsWith(".megashorts.com");
}

function getLogWorkerConfig() {
  const candidateKeys = [
    process.env.WORKER_API_KEY,
    process.env.CRON_SECRET,
    process.env.NEXT_PUBLIC_WORKER_API_KEY,
    process.env.NEXT_PUBLIC_LOG_WRITE_KEY,
  ].filter((value): value is string => Boolean(value && value.trim()));

  return {
    url: process.env.LOGS_WORKER_URL
      || process.env.NEXT_PUBLIC_LOGS_WORKER_URL
      || DEFAULT_LOG_WORKER_URL,
    apiKeys: Array.from(new Set(candidateKeys)),
  };
}

function isAllowedOrigin(origin: string | null) {
  if (!origin) return true;

  try {
    const url = new URL(origin);
    if (url.protocol === "http:" && url.hostname === "localhost" && url.port === "3000") {
      return true;
    }
    if (url.protocol !== "https:") {
      return false;
    }
    return isMegashortsDomainHost(url.hostname);
  } catch {
    return false;
  }
}

export async function POST(request: NextRequest) {
  if (!isAllowedOrigin(request.headers.get("origin"))) {
    return NextResponse.json({ success: false, error: "Origin not allowed" }, { status: 403 });
  }

  const body = await request.text();
  if (new TextEncoder().encode(body).byteLength > MAX_LOG_BODY_BYTES) {
    return NextResponse.json({ success: false, error: "Log payload is too large" }, { status: 413 });
  }

  try {
    JSON.parse(body);
  } catch {
    return NextResponse.json({ success: false, error: "Invalid JSON body" }, { status: 400 });
  }

  const { url, apiKeys } = getLogWorkerConfig();
  if (apiKeys.length === 0) {
    return NextResponse.json(
      { success: false, error: "Log worker API key is not configured" },
      { status: 500 },
    );
  }

  let lastUnauthorizedBody = "";
  for (const apiKey of apiKeys) {
    const response = await fetch(url, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${apiKey}`,
        "X-API-Key": apiKey,
      },
      body,
      cache: "no-store",
    });

    const responseBody = await response.text();
    if (response.status !== 401) {
      return new NextResponse(responseBody, {
        status: response.status,
        headers: {
          "Content-Type": response.headers.get("Content-Type") || "application/json",
          "Cache-Control": "no-store",
        },
      });
    }

    lastUnauthorizedBody = responseBody;
  }

  return new NextResponse(lastUnauthorizedBody || JSON.stringify({
    success: false,
    error: "Worker authorization failed",
  }), {
    status: 401,
    headers: {
      "Content-Type": "application/json",
      "Cache-Control": "no-store",
    },
  });
}
