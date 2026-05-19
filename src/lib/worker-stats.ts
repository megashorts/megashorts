import { parseStatsPeriod } from "@/lib/stats-period";

const workerApiKey = process.env.WORKER_API_KEY || process.env.CRON_SECRET;
const commissionWorkerUrl = process.env.COMMISSION_WORKER_URL || "https://commission-worker.msdevcm.workers.dev";
const cfStatsWorkerUrl = process.env.CFSTATS_ADMIN_WORKER_URL || "https://cfstats-admin.msdevcm.workers.dev";

function authHeaders() {
  if (!workerApiKey) return null;

  return {
    Authorization: `Bearer ${workerApiKey}`,
  };
}

export function periodDateKey(period: string) {
  const range = parseStatsPeriod(period);

  return range.end ? range.end.toISOString().slice(0, 10) : new Date().toISOString().slice(0, 10);
}

export async function fetchCommissionSummaryFromWorker(options: {
  period?: string;
  scope: "creator" | "agency" | "admin";
  userId?: string;
}) {
  const headers = authHeaders();

  if (!headers) return null;

  const url = new URL("/summary", commissionWorkerUrl);
  url.searchParams.set("date", periodDateKey(options.period || "current"));
  url.searchParams.set("scope", options.scope);
  if (options.userId) url.searchParams.set("userId", options.userId);

  try {
    const response = await fetch(url, {
      headers,
      cache: "no-store",
    });

    if (!response.ok) return null;

    const result = await response.json();
    return result.success ? result.data : null;
  } catch {
    return null;
  }
}

export async function fetchCfStatsFromWorker(options: {
  period?: "daily" | "weekly" | "monthly";
  date?: string;
}) {
  const headers = authHeaders();

  if (!headers) return null;

  const period = options.period || "weekly";
  const date = options.date || periodDateKey("current");
  const url = new URL("/stats", cfStatsWorkerUrl);
  url.searchParams.set("period", period);
  url.searchParams.set("date", date);

  try {
    const response = await fetch(url, {
      headers,
      cache: "no-store",
    });

    if (!response.ok) return null;

    const result = await response.json();
    return result.success ? result.data : null;
  } catch {
    return null;
  }
}
