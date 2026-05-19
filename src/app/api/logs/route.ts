import { NextRequest, NextResponse } from "next/server";

const DEFAULT_LOG_WORKER_URL = "https://megashorts-logs.msdevcm.workers.dev";
const MAX_LOG_BODY_BYTES = 512 * 1024;
const ALLOWED_ORIGINS = new Set([
  "https://www.megashorts.com",
  "https://megashorts.com",
  "http://localhost:3000",
]);

function getLogWorkerConfig() {
  return {
    url: process.env.LOGS_WORKER_URL
      || process.env.NEXT_PUBLIC_LOGS_WORKER_URL
      || DEFAULT_LOG_WORKER_URL,
    apiKey: process.env.WORKER_API_KEY || process.env.NEXT_PUBLIC_WORKER_API_KEY,
  };
}

function isAllowedOrigin(origin: string | null) {
  return !origin || ALLOWED_ORIGINS.has(origin);
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

  const { url, apiKey } = getLogWorkerConfig();
  if (!apiKey) {
    return NextResponse.json(
      { success: false, error: "Log worker API key is not configured" },
      { status: 500 },
    );
  }

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
  return new NextResponse(responseBody, {
    status: response.status,
    headers: {
      "Content-Type": response.headers.get("Content-Type") || "application/json",
      "Cache-Control": "no-store",
    },
  });
}
