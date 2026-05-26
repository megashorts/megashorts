import {
  inferStatsPeriodUnit,
  periodDateKey,
  type StatsPeriodUnit,
} from "@/lib/stats-period";
import { createHash, createHmac } from "crypto";

const workerApiKey = process.env.WORKER_API_KEY || process.env.CRON_SECRET;
const commissionWorkerUrl = process.env.COMMISSION_WORKER_URL || "https://commission-worker.msdevcm.workers.dev";
const cfStatsWorkerUrl = process.env.CFSTATS_ADMIN_WORKER_URL || "https://cfstats-admin.msdevcm.workers.dev";
const cloudflareAccountId = process.env.CLOUDFLARE_ACCOUNT_ID;
const cloudflareApiToken = process.env.CLOUDFLARE_API_TOKEN;
const cloudflareD1DatabaseId = process.env.CLOUDFLARE_D1_DATABASE_ID || "52d25396-2a61-42a8-904f-2d7956cede44";
const enableWorkerStatsHttp = process.env.ENABLE_WORKER_STATS_HTTP === "1";
const r2Bucket =
  process.env.CLOUDFLARE_POINTS_SYSTEM_BUCKET_NAME ||
  process.env.CLOUDFLARE_POINTS_R2_BUCKET_NAME ||
  "points-system-bucket";
const r2AccessKeyId = process.env.CLOUDFLARE_R2_ACCESS_KEY_ID;
const r2SecretAccessKey = process.env.CLOUDFLARE_R2_SECRET_ACCESS_KEY;

function authHeaders() {
  if (!workerApiKey) return null;

  return {
    Authorization: `Bearer ${workerApiKey}`,
  };
}

export async function fetchCommissionSummaryFromWorker(options: {
  period?: string;
  unit?: StatsPeriodUnit;
  scope: "creator" | "agency" | "admin";
  userId?: string;
}) {
  if (cloudflareAccountId && cloudflareApiToken && cloudflareD1DatabaseId) {
    return fetchCommissionSummaryFromD1(options);
  }
  if (!enableWorkerStatsHttp) return null;

  const headers = authHeaders();

  if (!headers) return fetchCommissionSummaryFromD1(options);

  const unit = options.unit || inferStatsPeriodUnit(options.period || "current");
  const date = periodDateKey(options.period || "current", unit);
  const url = new URL("/summary", commissionWorkerUrl);
  url.searchParams.set("period", unit);
  url.searchParams.set("date", date);
  url.searchParams.set("scope", options.scope);
  if (options.userId) url.searchParams.set("userId", options.userId);

  try {
    const response = await fetch(url, {
      headers,
      cache: "no-store",
    });

    if (!response.ok) return null;

    const result = await response.json();
    if (result.success && result.data) return result.data;

    return fetchCommissionSummaryFromD1(options, unit, date);
  } catch {
    return fetchCommissionSummaryFromD1(options, unit, date);
  }
}

export async function fetchAgencyTeamSummaryFromWorker(options: {
  period?: string;
  unit?: StatsPeriodUnit;
  masterId: string;
}) {
  if (cloudflareAccountId && cloudflareApiToken && cloudflareD1DatabaseId) {
    return fetchAgencyTeamSummaryFromD1(options);
  }

  return null;
}

export async function fetchPayoutPointBreakdownFromD1(options: {
  period?: string;
  unit?: StatsPeriodUnit;
}) {
  if (!cloudflareAccountId || !cloudflareApiToken || !cloudflareD1DatabaseId) return null;

  const period = options.period || "current";
  const isAll = period === "all";
  const unit = options.unit || inferStatsPeriodUnit(period);
  const date = isAll ? null : periodDateKey(period, unit);
  const range = isAll ? { start: null, end: null } : summaryRangeForDate(unit, date!);
  const dateSql = range.start && range.end ? "AND date >= ? AND date <= ?" : "";
  const rows = await d1Query<any>(
    `
      SELECT
        date,
        commission_type,
        SUM(COALESCE(point_by_coin, 0)) AS point_by_coin,
        SUM(COALESCE(point_by_subscription, 0)) AS point_by_subscription,
        SUM(COALESCE(view_count_coin, 0)) AS view_count_coin,
        SUM(COALESCE(view_count_subscription, 0)) AS view_count_subscription
      FROM commission_batch
      WHERE processed = 1
        ${dateSql}
      GROUP BY date, commission_type
    `,
    range.start && range.end ? [range.start, range.end] : [],
  );
  const settingsRows = await d1Query<{ date: string; commission_data: string | null }>(
    `
      SELECT date, commission_data
      FROM cf_stats
      WHERE period = 'weekly' AND commission_data IS NOT NULL
        ${range.start && range.end ? "AND date >= ? AND date <= ?" : ""}
    `,
    range.start && range.end ? [range.start, range.end] : [],
  );
  const settingsByDate = new Map(settingsRows.map((row) => [row.date, parseJsonObject(row.commission_data || null).pointSettings || null]));
  const latestSettings = Array.from(settingsByDate.values()).filter(Boolean).at(-1) || null;

  let revenuePoints = 0;
  let creatorPaidPoints = 0;
  let agencyPaidPoints = 0;

  rows.forEach((row) => {
    const points = Number(row.point_by_coin || 0) + Number(row.point_by_subscription || 0);
    if (row.commission_type === "CREATOR") {
      creatorPaidPoints += points;
      const settings = settingsByDate.get(row.date) || latestSettings;
      const coinPerPoint = Number(settings?.coinPerPoint || 120);
      const viewCoinAmount = Number(settings?.viewCoinAmount || 2);
      const subscriptionPerPoint = Number(settings?.subscriptionPerPoint || 0);
      revenuePoints += Number(row.view_count_coin || 0) * viewCoinAmount * coinPerPoint;
      revenuePoints += Number(row.view_count_subscription || 0) * subscriptionPerPoint;
    } else {
      agencyPaidPoints += points;
    }
  });

  return {
    revenuePoints,
    creatorPaidPoints,
    agencyPaidPoints,
    paidPoints: creatorPaidPoints + agencyPaidPoints,
  };
}

export async function fetchPayoutDetailRowsFromD1(options: {
  period?: string;
  unit?: StatsPeriodUnit;
  filterColumn?: "user_id" | "master_id";
  filterValue?: string;
}) {
  if (!cloudflareAccountId || !cloudflareApiToken || !cloudflareD1DatabaseId) return [];

  const period = options.period || "current";
  const isAll = period === "all";
  const unit = options.unit || inferStatsPeriodUnit(period);
  const date = isAll ? null : periodDateKey(period, unit);
  const range = isAll ? { start: null, end: null } : summaryRangeForDate(unit, date!);

  return fetchCommissionRowsFromD1(
    range.start,
    range.end,
    options.filterColumn || null,
    options.filterValue,
  );
}

export async function fetchViewDetailRowsFromD1(options: {
  period?: string;
  unit?: StatsPeriodUnit;
  uploaderId?: string;
  masterId?: string;
}) {
  if (!cloudflareAccountId || !cloudflareApiToken || !cloudflareD1DatabaseId) return [];

  const period = options.period || "current";
  const isAll = period === "all";
  const unit = options.unit || inferStatsPeriodUnit(period);
  const date = isAll ? null : periodDateKey(period, unit);
  const range = isAll ? { start: null, end: null } : summaryRangeForDate(unit, date!);
  const dateSql = range.start && range.end ? "AND date >= ? AND date <= ?" : "";
  const uploaderSql = options.uploaderId ? "AND uploader_id = ?" : "";
  const masterSql = options.masterId ? "AND master_id = ?" : "";
  const params = [
    ...(range.start && range.end ? [range.start, range.end] : []),
    ...(options.uploaderId ? [options.uploaderId] : []),
    ...(options.masterId ? [options.masterId] : []),
  ];

  try {
    return await d1Query<any>(
      `
        SELECT
          post_id,
          video_id,
          uploader_id,
          master_id,
          referrer_id,
          access_method,
          COUNT(DISTINCT viewer_id) AS viewers,
          SUM(COALESCE(view_count, 1)) AS views
        FROM grouped_view_details
        WHERE 1 = 1
          ${dateSql}
          ${uploaderSql}
          ${masterSql}
        GROUP BY post_id, video_id, uploader_id, master_id, referrer_id, access_method
      `,
      params,
    );
  } catch {
    return [];
  }
}

async function fetchCommissionSummaryFromD1(
  options: {
    period?: string;
    unit?: StatsPeriodUnit;
    scope: "creator" | "agency" | "admin";
    userId?: string;
  },
  resolvedUnit?: StatsPeriodUnit,
  resolvedDate?: string,
) {
  if (!cloudflareAccountId || !cloudflareApiToken || !cloudflareD1DatabaseId) return null;

  if (options.period === "all") {
    const rows = await fetchCommissionRowsFromD1(null, null, options.userId ? "user_id" : null, options.userId);

    return {
      source: "cloudflare-d1-commission_batch",
      period: { start: null, end: null, targetDate: "all" },
      date: "all",
      scope: options.scope,
      userId: options.userId,
      rows,
      totalPoints: rows.reduce((sum, row) => sum + Number(row.point_by_coin || 0) + Number(row.point_by_subscription || 0), 0),
      totalViews: rows.reduce((sum, row) => sum + Number(row.view_count_coin || 0) + Number(row.view_count_subscription || 0), 0),
    };
  }

  const unit = resolvedUnit || options.unit || inferStatsPeriodUnit(options.period || "current");
  const date = resolvedDate || periodDateKey(options.period || "current", unit);
  if (options.scope === "admin") {
    const cfRows = await d1Query<{ commission_data: string | null }>(
      "SELECT commission_data FROM cf_stats WHERE period = ? AND date = ? LIMIT 1",
      [unit, date],
    );
    const commissionData = cfRows[0]?.commission_data;

    if (commissionData) {
      try {
        const parsed = JSON.parse(commissionData);
        if (parsed?.grandTotal || parsed?.teamSummaries || parsed?.postAnalytics || Array.isArray(parsed?.individualCreators)) {
          return filterStoredCommissionSummary(parsed, options.scope, options.userId, "cloudflare-d1-cf_stats");
        }
      } catch {}
    }
  }

  const range = summaryRangeForDate(unit, date);
  const [rows, pointSettings] = await Promise.all([
    fetchCommissionRowsFromD1(range.start, range.end, options.userId ? "user_id" : null, options.userId),
    fetchPointSettingsFromD1(unit, date),
  ]);

  return {
    source: "cloudflare-d1-commission_batch",
    period: { ...range, targetDate: date },
    date,
    scope: options.scope,
    userId: options.userId,
    pointSettings,
    rows,
    totalPoints: rows.reduce((sum, row) => sum + Number(row.point_by_coin || 0) + Number(row.point_by_subscription || 0), 0),
    totalViews: rows.reduce((sum, row) => sum + Number(row.view_count_coin || 0) + Number(row.view_count_subscription || 0), 0),
  };
}

async function fetchAgencyTeamSummaryFromD1(options: {
  period?: string;
  unit?: StatsPeriodUnit;
  masterId: string;
}) {
  if (!cloudflareAccountId || !cloudflareApiToken || !cloudflareD1DatabaseId) return null;

  if (options.period === "all") {
    const rows = await fetchCommissionRowsFromD1(null, null, "master_id", options.masterId);

    return {
      source: "cloudflare-d1-commission_batch",
      period: { start: null, end: null, targetDate: "all" },
      date: "all",
      scope: "agency-team",
      masterId: options.masterId,
      rows,
      totalPoints: rows.reduce((sum, row) => sum + Number(row.point_by_coin || 0) + Number(row.point_by_subscription || 0), 0),
      totalViews: rows.reduce((sum, row) => sum + Number(row.view_count_coin || 0) + Number(row.view_count_subscription || 0), 0),
    };
  }

  const unit = options.unit || inferStatsPeriodUnit(options.period || "current");
  const date = periodDateKey(options.period || "current", unit);
  const range = summaryRangeForDate(unit, date);
  const [rows, pointSettings] = await Promise.all([
    fetchCommissionRowsFromD1(range.start, range.end, "master_id", options.masterId),
    fetchPointSettingsFromD1(unit, date),
  ]);

  return {
    source: "cloudflare-d1-commission_batch",
    period: { ...range, targetDate: date },
    date,
    scope: "agency-team",
    masterId: options.masterId,
    pointSettings,
    rows,
    totalPoints: rows.reduce((sum, row) => sum + Number(row.point_by_coin || 0) + Number(row.point_by_subscription || 0), 0),
    totalViews: rows.reduce((sum, row) => sum + Number(row.view_count_coin || 0) + Number(row.view_count_subscription || 0), 0),
  };
}

async function fetchPointSettingsFromD1(period: StatsPeriodUnit, date: string) {
  const rows = await d1Query<{ commission_data: string | null }>(
    "SELECT commission_data FROM cf_stats WHERE period = ? AND date = ? AND commission_data IS NOT NULL LIMIT 1",
    [period, date],
  );
  const data = parseJsonObject(rows[0]?.commission_data || null);
  return data.pointSettings || null;
}

async function fetchCommissionRowsFromD1(
  start: string | null,
  end: string | null,
  filterColumn: "user_id" | "master_id" | null,
  filterValue?: string,
) {
  const filterSql = filterColumn && filterValue ? `AND ${filterColumn} = ?` : "";
  const dateSql = start && end ? "AND date >= ? AND date <= ?" : "";
  const params = [
    ...(start && end ? [start, end] : []),
    ...(filterColumn && filterValue ? [filterValue] : []),
  ];

  return d1Query<any>(
    `
      SELECT
        user_id,
        master_id,
        commission_type,
        post_id,
        SUM(COALESCE(point_by_coin, 0)) AS point_by_coin,
        SUM(COALESCE(point_by_subscription, 0)) AS point_by_subscription,
        SUM(COALESCE(view_count_coin, 0)) AS view_count_coin,
        SUM(COALESCE(view_count_subscription, 0)) AS view_count_subscription,
        COUNT(*) AS row_count
      FROM commission_batch
      WHERE processed = 1
        ${dateSql}
        ${filterSql}
      GROUP BY user_id, master_id, commission_type, post_id
    `,
    params,
  );
}

async function d1Query<T>(sql: string, params: unknown[]): Promise<T[]> {
  const response = await fetch(
    `https://api.cloudflare.com/client/v4/accounts/${cloudflareAccountId}/d1/database/${cloudflareD1DatabaseId}/query`,
    {
      method: "POST",
      headers: {
        Authorization: `Bearer ${cloudflareApiToken}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ sql, params }),
      cache: "no-store",
    },
  );

  if (!response.ok) return [];

  const payload = await response.json();
  const firstResult = Array.isArray(payload?.result) ? payload.result[0] : null;
  return Array.isArray(firstResult?.results) ? firstResult.results : [];
}

function summaryRangeForDate(period: StatsPeriodUnit, date: string) {
  if (period === "daily") return { start: date, end: date };

  const [year, month, day] = date.split("-").map(Number);
  const target = new Date(Date.UTC(year, month - 1, day));

  if (period === "monthly") {
    const start = new Date(Date.UTC(year, month - 1, 1));
    return {
      start: start.toISOString().slice(0, 10),
      end: date,
    };
  }

  const start = new Date(target);
  start.setUTCDate(target.getUTCDate() - 6);
  return {
    start: start.toISOString().slice(0, 10),
    end: date,
  };
}

function filterStoredCommissionSummary(summary: any, scope: string, userId: string | undefined, source: string) {
  if (!userId || scope === "admin") {
    return { source, ...summary };
  }

  if (scope === "agency") {
    return {
      source,
      period: summary.period,
      pointSettings: summary.pointSettings,
      teamSummary: summary.teamSummaries?.[userId] || null,
      grandTotal: summary.teamSummaries?.[userId]?.teamTotal || 0,
    };
  }

  const uploader = summary.postAnalytics?.topUploaders?.find((item: any) => item.uploaderId === userId);

  return {
    source,
    period: summary.period,
    creator: uploader || null,
    individualCreators: summary.individualCreators,
    postAnalytics: {
      totalPosts: summary.postAnalytics?.totalPosts || 0,
      totalPostPoints: summary.postAnalytics?.totalPostPoints || 0,
      totalPostViews: summary.postAnalytics?.totalPostViews || 0,
      topPerformingPosts: (summary.postAnalytics?.topPerformingPosts || []).filter((post: any) => post.uploaderId === userId),
    },
  };
}

export async function fetchCfStatsFromWorker(options: {
  period?: StatsPeriodUnit;
  date?: string;
  creator?: string;
}) {
  const r2Stats = await fetchCfStatsFromR2(options);
  if (r2Stats) return r2Stats;

  if (!options.creator && cloudflareAccountId && cloudflareApiToken && cloudflareD1DatabaseId) {
    return fetchCfStatsFromD1(options);
  }
  if (!enableWorkerStatsHttp && !options.creator) return null;

  const headers = authHeaders();

  if (!headers) return fetchCfStatsFromD1(options);

  const period = options.period || "weekly";
  const date = options.date || periodDateKey("current", period);
  const url = new URL("/stats", cfStatsWorkerUrl);
  url.searchParams.set("period", period);
  url.searchParams.set("date", date);
  if (options.creator) url.searchParams.set("creator", options.creator);

  try {
    const response = await fetch(url, {
      headers,
      cache: "no-store",
    });

    if (!response.ok) return null;

    const result = await response.json();
    if (result.success && result.data) return result.data;

    return fetchCfStatsFromD1({ ...options, period, date });
  } catch {
    return fetchCfStatsFromD1({ ...options, period, date });
  }
}

async function fetchCfStatsFromR2(options: {
  period?: StatsPeriodUnit;
  date?: string;
  creator?: string;
}) {
  if (!cloudflareAccountId || !r2AccessKeyId || !r2SecretAccessKey || !r2Bucket) return null;

  const period = options.period || "weekly";
  const date = options.date || periodDateKey("current", period);
  const creatorPath = options.creator ? `/creators/${encodeURIComponent(options.creator)}.json` : ".json";

  if (date !== "all") {
    const key = options.creator
      ? `cf-stats/${period}/${date}${creatorPath}`
      : `cf-stats/${period}/${date}.json`;
    return readR2Json(key);
  }

  const prefix = `cf-stats/${period}/`;
  const keys = await listR2Keys(prefix);
  const encodedCreator = options.creator ? encodeURIComponent(options.creator) : null;
  const matcher = encodedCreator
    ? (key: string) => key.endsWith(`/creators/${encodedCreator}.json`)
    : (key: string) => /^cf-stats\/[^/]+\/[^/]+\.json$/.test(key);
  const countryMap = new Map<string, { country: string; count: number; minutes: number }>();
  let totalMinutes = 0;
  let found = false;

  for (const key of keys.filter(matcher)) {
    const stored = await readR2Json(key);
    if (!stored) continue;
    found = true;
    totalMinutes += Number(stored.totalMinutes || 0);

    for (const item of stored.topCountries || []) {
      const country = String(item.country || item.countryCode || "").toUpperCase();
      if (!country) continue;
      const minutes = Number(item.minutes || item.count || 0);
      const current = countryMap.get(country) || { country, count: 0, minutes: 0 };
      current.minutes += minutes;
      current.count += Number(item.count || minutes);
      countryMap.set(country, current);
    }
  }

  if (!found) return null;

  return {
    source: "r2_cf_stats",
    period,
    date: "all",
    creator: options.creator,
    totalMinutes,
    topCountries: Array.from(countryMap.values()).sort((a, b) => b.count - a.count).slice(0, 20),
    requestList: {},
  };
}

async function fetchCfStatsFromD1(options: {
  period?: StatsPeriodUnit;
  date?: string;
  creator?: string;
}) {
  if (!cloudflareAccountId || !cloudflareApiToken || !cloudflareD1DatabaseId) return null;
  if (options.creator) return null;

  const period = options.period || "weekly";
  const date = options.date || periodDateKey("current", period);
  if (date === "all") {
    const rows = await d1Query<{
      total_minutes: number | null;
      total_requests: number | null;
      top_countries: string | null;
      request_list: string | null;
    }>(
      `
        SELECT total_minutes, total_requests, top_countries, request_list
        FROM cf_stats
        WHERE top_countries IS NOT NULL AND top_countries != '[]'
      `,
      [],
    );
    const countryMap = new Map<string, { country: string; count: number; minutes: number }>();

    rows.forEach((row) => {
      parseJsonArray(row.top_countries).forEach((item: any) => {
        const country = String(item.country || item.countryCode || "").toUpperCase();
        if (!country) return;
        const current = countryMap.get(country) || { country, count: 0, minutes: 0 };
        current.count += Number(item.count || item.requests || item.minutes || 0);
        current.minutes += Number(item.minutes || 0);
        countryMap.set(country, current);
      });
    });

    return {
      source: "cloudflare-d1-cf_stats",
      period: "all",
      date: "all",
      totalMinutes: rows.reduce((sum, row) => sum + Number(row.total_minutes || 0), 0),
      totalRequests: rows.reduce((sum, row) => sum + Number(row.total_requests || 0), 0),
      topCountries: Array.from(countryMap.values()).sort((a, b) => b.count - a.count).slice(0, 20),
      requestList: {},
    };
  }
  const rows = await d1Query<{
    total_minutes: number | null;
    total_requests: number | null;
    top_countries: string | null;
    request_list: string | null;
  }>(
    `
      SELECT total_minutes, total_requests, top_countries, request_list
      FROM cf_stats
      WHERE period = ? AND date = ?
      ORDER BY CASE WHEN top_countries IS NOT NULL AND top_countries != '[]' THEN 0 ELSE 1 END, rowid DESC
      LIMIT 1
    `,
    [period, date],
  );
  const row = rows[0];
  if (!row) return null;

  return {
    source: "cloudflare-d1-cf_stats",
    period,
    date,
    totalMinutes: Number(row.total_minutes || 0),
    totalRequests: Number(row.total_requests || 0),
    topCountries: parseJsonArray(row.top_countries),
    requestList: parseJsonObject(row.request_list),
  };
}

function parseJsonArray(value: string | null) {
  try {
    const parsed = JSON.parse(value || "[]");
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

function parseJsonObject(value: string | null) {
  try {
    const parsed = JSON.parse(value || "{}");
    return parsed && typeof parsed === "object" && !Array.isArray(parsed) ? parsed : {};
  } catch {
    return {};
  }
}

async function readR2Json(key: string) {
  const response = await signedR2Request("GET", key);
  if (!response?.ok) return readR2JsonFromCloudflareApi(key);

  try {
    const body = await response.json();
    if (body?.success && body.result) return body.result;
    return body;
  } catch {
    return readR2JsonFromCloudflareApi(key);
  }
}

async function listR2Keys(prefix: string) {
  const keys: string[] = [];
  let continuationToken: string | undefined;
  let signedListFailed = false;

  do {
    const query = canonicalQuery({
      ...(continuationToken ? { "continuation-token": continuationToken } : {}),
      "list-type": "2",
      prefix,
    });
    const response = await signedR2Request("GET", "", query);
    if (!response?.ok) {
      signedListFailed = true;
      break;
    }
    const xml = await response.text();
    keys.push(...Array.from(xml.matchAll(/<Key>(.*?)<\/Key>/g)).map((match) => decodeXml(match[1])));
    const nextToken = xml.match(/<NextContinuationToken>(.*?)<\/NextContinuationToken>/)?.[1];
    continuationToken = nextToken ? decodeXml(nextToken) : undefined;
  } while (continuationToken);

  if (signedListFailed || keys.length === 0) {
    const apiKeys = await listR2KeysFromCloudflareApi(prefix);
    if (apiKeys.length > 0) return apiKeys;
  }

  return keys;
}

async function readR2JsonFromCloudflareApi(key: string) {
  if (!cloudflareAccountId || !cloudflareApiToken || !r2Bucket) return null;

  const objectKey = encodeURIComponent(key);
  const url = `https://api.cloudflare.com/client/v4/accounts/${cloudflareAccountId}/r2/buckets/${encodeURIComponent(r2Bucket)}/objects/${objectKey}`;

  try {
    const response = await fetch(url, {
      headers: {
        Authorization: `Bearer ${cloudflareApiToken}`,
      },
      cache: "no-store",
    });
    if (!response.ok) return null;

    return await response.json();
  } catch {
    return null;
  }
}

async function listR2KeysFromCloudflareApi(prefix: string) {
  if (!cloudflareAccountId || !cloudflareApiToken || !r2Bucket) return [];

  const keys: string[] = [];
  let cursor: string | undefined;

  do {
    const url = new URL(`https://api.cloudflare.com/client/v4/accounts/${cloudflareAccountId}/r2/buckets/${encodeURIComponent(r2Bucket)}/objects`);
    url.searchParams.set("prefix", prefix);
    url.searchParams.set("per_page", "1000");
    if (cursor) url.searchParams.set("cursor", cursor);

    try {
      const response = await fetch(url, {
        headers: {
          Authorization: `Bearer ${cloudflareApiToken}`,
        },
        cache: "no-store",
      });
      if (!response.ok) break;
      const body = await response.json();
      const objects = Array.isArray(body?.result)
        ? body.result
        : Array.isArray(body?.result?.objects)
          ? body.result.objects
          : [];
      keys.push(...objects.map((object: any) => object.key || object.name).filter(Boolean));
      cursor = body?.result_info?.cursor || body?.result?.cursor;
    } catch {
      break;
    }
  } while (cursor);

  return keys;
}

async function signedR2Request(method: "GET", key: string, query = "") {
  if (!cloudflareAccountId || !r2AccessKeyId || !r2SecretAccessKey || !r2Bucket) return null;

  const host = `${cloudflareAccountId}.r2.cloudflarestorage.com`;
  const encodedKey = key ? key.split("/").map(encodeURIComponent).join("/") : "";
  const canonicalUri = `/${r2Bucket}${encodedKey ? `/${encodedKey}` : ""}`;
  const url = `https://${host}${canonicalUri}${query ? `?${query}` : ""}`;
  const now = new Date();
  const amzDate = now.toISOString().replace(/[:-]|\.\d{3}/g, "");
  const dateStamp = amzDate.slice(0, 8);
  const payloadHash = sha256("");
  const credentialScope = `${dateStamp}/auto/s3/aws4_request`;
  const canonicalHeaders = [
    `host:${host}`,
    `x-amz-content-sha256:${payloadHash}`,
    `x-amz-date:${amzDate}`,
  ].join("\n") + "\n";
  const signedHeaders = "host;x-amz-content-sha256;x-amz-date";
  const canonicalRequest = [
    method,
    canonicalUri,
    query,
    canonicalHeaders,
    signedHeaders,
    payloadHash,
  ].join("\n");
  const stringToSign = [
    "AWS4-HMAC-SHA256",
    amzDate,
    credentialScope,
    sha256(canonicalRequest),
  ].join("\n");
  const kDate = hmac(`AWS4${r2SecretAccessKey}`, dateStamp);
  const kRegion = hmac(kDate, "auto");
  const kService = hmac(kRegion, "s3");
  const kSigning = hmac(kService, "aws4_request");
  const signature = hmac(kSigning, stringToSign, "hex");
  const authorization = [
    `AWS4-HMAC-SHA256 Credential=${r2AccessKeyId}/${credentialScope}`,
    `SignedHeaders=${signedHeaders}`,
    `Signature=${signature}`,
  ].join(", ");

  return fetch(url, {
    method,
    headers: {
      Authorization: authorization,
      "X-Amz-Content-Sha256": payloadHash,
      "X-Amz-Date": amzDate,
    },
    cache: "no-store",
  });
}

function hmac(key: string | Buffer, value: string, encoding?: "hex") {
  const digest = createHmac("sha256", key).update(value);
  return encoding ? digest.digest(encoding) : digest.digest();
}

function sha256(value: string) {
  return createHash("sha256").update(value).digest("hex");
}

function decodeXml(value: string) {
  return value
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&quot;/g, '"')
    .replace(/&apos;/g, "'");
}

function canonicalQuery(params: Record<string, string>) {
  return Object.entries(params)
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([key, value]) => `${encodeURIComponent(key)}=${encodeURIComponent(value)}`)
    .join("&");
}
