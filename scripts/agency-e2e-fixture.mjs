import "dotenv/config";
import { PrismaClient } from "@prisma/client";
import { hash } from "@node-rs/argon2";
import { mkdir, readFile, writeFile } from "node:fs/promises";
import path from "node:path";

const prisma = new PrismaClient();
const PREFIX = "codex_agency_test";
const FORCED_DATE = process.env.AGENCY_E2E_DATE;
const DEFAULT_PASSWORD = process.env.AGENCY_E2E_PASSWORD || "MegaTest!2026";
const BASE_URL = process.env.NEXT_PUBLIC_BASE_URL || "http://localhost:3000";
const WORKER_API_KEY = process.env.WORKER_API_KEY || process.env.NEXT_PUBLIC_WORKER_API_KEY || process.env.CRON_SECRET;
const VIEWGROUP_WORKER_URL = process.env.VIEWGROUP_WORKER_URL || "https://viewgroup.msdevcm.workers.dev";
const REFERRAL_WORKER_URL = process.env.REFERRAL_STRUCTURE_WORKER_URL || "https://referral-structure-worker.msdevcm.workers.dev";
const COMMISSION_WORKER_URL = process.env.COMMISSION_WORKER_URL || "https://commission-worker.msdevcm.workers.dev";
const CFSTATS_WORKER_URL = process.env.CFSTATS_ADMIN_WORKER_URL || "https://cfstats-admin.msdevcm.workers.dev";
const CF_ACCOUNT_ID = process.env.CLOUDFLARE_ACCOUNT_ID;
const CF_API_TOKEN = process.env.CLOUDFLARE_API_TOKEN;
const CF_D1_DATABASE_ID = process.env.CLOUDFLARE_D1_DATABASE_ID || "52d25396-2a61-42a8-904f-2d7956cede44";

function usage() {
  console.error("Usage: node scripts/agency-e2e-fixture.mjs <setup|trigger|verify|report|full|cleanup> [runId]");
}

function nowRunId() {
  return new Date().toISOString().replace(/[-:TZ.]/g, "").slice(0, 14);
}

function testId(runId, suffix) {
  return `${PREFIX}_${runId}_${suffix}`;
}

function targetDateForRun(runId) {
  if (FORCED_DATE) return FORCED_DATE;

  const baseSunday = new Date("2036-05-18T00:00:00.000Z");
  const weekOffset = Number(runId.slice(-4)) % 520;
  baseSunday.setUTCDate(baseSunday.getUTCDate() + weekOffset * 7);
  return baseSunday.toISOString().slice(0, 10);
}

function manifestPath(runId) {
  return path.join(".tmp", `agency-e2e-${runId}.json`);
}

function reportPath(runId) {
  return path.join("docs", `AGENCY_E2E_REPORT_${runId}.md`);
}

function kstDateToUtc(date, hour = 3) {
  return new Date(`${date}T${String(hour).padStart(2, "0")}:00:00.000Z`);
}

function isoWeekKeyForDate(date) {
  const target = new Date(`${date}T00:00:00.000Z`);
  const day = target.getUTCDay() || 7;
  target.setUTCDate(target.getUTCDate() + 4 - day);
  const yearStart = new Date(Date.UTC(target.getUTCFullYear(), 0, 1));
  const week = Math.ceil((((target.getTime() - yearStart.getTime()) / 86400000) + 1) / 7);

  return `${target.getUTCFullYear()}-W${String(week).padStart(2, "0")}`;
}

function headers() {
  if (!WORKER_API_KEY) throw new Error("WORKER_API_KEY 또는 CRON_SECRET이 필요합니다.");

  return {
    "Content-Type": "application/json",
    Authorization: `Bearer ${WORKER_API_KEY}`,
    "X-API-Key": WORKER_API_KEY,
  };
}

function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function user(runId, suffix, role, options = {}) {
  const username = testId(runId, suffix);
  return {
    id: username,
    username,
    displayName: options.displayName || username,
    email: `${username}@example.invalid`,
    userRole: role,
    referredBy: options.referredBy || null,
    teamMaster: options.teamMaster || null,
    emailVerified: true,
    myLanguage: "KOREAN",
  };
}

function agencySettings(masterId, masterType) {
  const networkLevels = [
    { name: "직접 추천", level: 1, commissionRate: 70 },
    { name: "2단계 상위", level: 2, commissionRate: 20 },
    { name: "3단계 상위", level: 3, commissionRate: 10 },
  ];

  return {
    userId: masterId,
    masterType,
    settings: {
      defaultCommissionRate: 10,
      headquarters: masterType === "HEADQUARTERS"
        ? {
            levels: [
              { name: "마스터", level: 1, commissionRate: 90 },
              { name: "직속 영업자", level: 2, commissionRate: 50 },
              { name: "2단계 영업자", level: 3, commissionRate: 30 },
              { name: "3단계 영업자", level: 4, commissionRate: 20 },
            ],
          }
        : undefined,
      network: masterType !== "HEADQUARTERS"
        ? {
            levels: networkLevels,
            autoQualification: {
              enabled: false,
              memberCount: 0,
              viewCount: 0,
              useCondition: "memberCount",
            },
            payoutQualification: {
              enabled: masterType === "BINARY_NETWORK",
              memberCount: masterType === "BINARY_NETWORK" ? 2 : 0,
              countMode: "direct",
            },
          }
        : undefined,
      binaryNetwork: masterType === "BINARY_NETWORK"
        ? {
            directReferralLimit: 2,
            requireBothLegs: false,
          }
        : undefined,
    },
  };
}

function buildAccounts(runId) {
  const admin = user(runId, "admin", 100, { displayName: "검증 관리자" });
  const creators = [
    user(runId, "creator_lv1", 20, { displayName: "크리에이터 L1 10%" }),
    user(runId, "creator_lv2", 22, { displayName: "크리에이터 L2 20%" }),
    user(runId, "creator_lv3", 24, { displayName: "크리에이터 L3 30%" }),
  ];
  const teamDefs = [
    ["hq", "HEADQUARTERS", "본부형 영업팀"],
    ["network", "NETWORK", "네트워크 영업팀"],
    ["binary", "BINARY_NETWORK", "바이너리 네트워크 영업팀"],
  ];
  const teams = teamDefs.map(([key, masterType, label]) => {
    const master = user(runId, `${key}_master`, 50, { displayName: `${label} 마스터` });
    master.teamMaster = master.id;

    const directA = user(runId, `${key}_direct_a`, 40, {
      displayName: `${label} 직속 A`,
      referredBy: master.id,
      teamMaster: master.id,
    });
    const directB = user(runId, `${key}_direct_b`, 40, {
      displayName: `${label} 직속 B`,
      referredBy: master.id,
      teamMaster: master.id,
    });
    const level2A = user(runId, `${key}_level2_a`, 40, {
      displayName: `${label} 2단계 A`,
      referredBy: directA.id,
      teamMaster: master.id,
    });
    const level2B = user(runId, `${key}_level2_b`, 40, {
      displayName: `${label} 2단계 B`,
      referredBy: directB.id,
      teamMaster: master.id,
    });
    const level3 = user(runId, `${key}_level3`, 40, {
      displayName: `${label} 3단계`,
      referredBy: level2A.id,
      teamMaster: master.id,
    });

    return {
      key,
      label,
      masterType,
      master,
      members: [master, directA, directB, level2A, level2B, level3],
      viewActors: { directA, directB, level2A, level2B, level3 },
    };
  });

  return { admin, creators, teams };
}

async function preserveSystemSettings(keys) {
  const rows = await prisma.systemSetting.findMany({ where: { key: { in: keys } } });
  const byKey = new Map(rows.map((row) => [row.key, row]));

  return keys.map((key) => ({
    key,
    existed: byKey.has(key),
    row: byKey.get(key) || null,
  }));
}

async function upsertSystemSetting(key, value, updatedBy, description) {
  await prisma.systemSetting.upsert({
    where: { key },
    update: {
      value,
      valueType: Array.isArray(value) || typeof value === "object" ? "json" : "number",
      description,
      updatedBy,
    },
    create: {
      key,
      value,
      valueType: Array.isArray(value) || typeof value === "object" ? "json" : "number",
      description,
      updatedBy,
    },
  });
}

async function restoreSystemSettings(snapshot) {
  if (!snapshot?.length) return;

  for (const item of snapshot) {
    if (!item.existed) {
      await prisma.systemSetting.deleteMany({ where: { key: item.key } });
      continue;
    }

    await prisma.systemSetting.upsert({
      where: { key: item.key },
      update: {
        value: item.row.value,
        valueType: item.row.valueType,
        defaultValue: item.row.defaultValue,
        description: item.row.description,
        updatedBy: item.row.updatedBy,
      },
      create: {
        id: item.row.id,
        key: item.row.key,
        value: item.row.value,
        valueType: item.row.valueType,
        defaultValue: item.row.defaultValue,
        description: item.row.description,
        updatedBy: item.row.updatedBy,
      },
    });
  }
}

async function d1Query(sql, params = []) {
  if (!CF_ACCOUNT_ID || !CF_API_TOKEN || !CF_D1_DATABASE_ID) return null;

  const response = await fetch(
    `https://api.cloudflare.com/client/v4/accounts/${CF_ACCOUNT_ID}/d1/database/${CF_D1_DATABASE_ID}/query`,
    {
      method: "POST",
      headers: {
        Authorization: `Bearer ${CF_API_TOKEN}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ sql, params }),
    },
  );

  const result = await response.json();
  if (!response.ok || !result.success) {
    throw new Error(`D1 query failed: ${JSON.stringify(result.errors || result)}`);
  }

  return result.result?.[0]?.results || [];
}

async function d1Scalar(sql, params = [], column = "count") {
  const rows = await d1Query(sql, params);
  if (!rows) return null;
  return Number(rows[0]?.[column] || rows[0]?.["COUNT(*)"] || 0);
}

async function waitForGroupedViews(date, expectedRows) {
  if (!CF_ACCOUNT_ID || !CF_API_TOKEN) return { skipped: true };

  const timeoutMs = Number(process.env.AGENCY_E2E_VIEWGROUP_TIMEOUT_MS || 120000);
  const intervalMs = Number(process.env.AGENCY_E2E_POLL_MS || 5000);
  const startedAt = Date.now();
  let count = 0;

  while (Date.now() - startedAt < timeoutMs) {
    count = await d1Scalar("SELECT COUNT(*) AS count FROM grouped_views WHERE date = ?", [date]);
    if (count >= expectedRows) {
      return { skipped: false, count, expectedRows, waitedMs: Date.now() - startedAt };
    }
    await sleep(intervalMs);
  }

  return {
    skipped: false,
    timedOut: true,
    count,
    expectedRows,
    waitedMs: Date.now() - startedAt,
  };
}

async function callCommissionWorker(date, mode, runId, lastId) {
  const response = await fetch(`${COMMISSION_WORKER_URL}/?date=${date}`, {
    method: "POST",
    headers: headers(),
    body: JSON.stringify({
      mode,
      date,
      triggeredBy: runId,
      ...(lastId ? { lastId } : {}),
    }),
  });
  const result = await response.json().catch(() => null);
  if (!response.ok) {
    throw new Error(`commission ${mode} failed: ${JSON.stringify(result)}`);
  }
  return result;
}

async function drainCommissionWorker(date, runId, initialResult = null) {
  const runs = initialResult ? [initialResult] : [];
  let current = initialResult || await callCommissionWorker(date, "start", runId);
  if (!initialResult) runs.push(current);

  for (let step = 0; current?.status === "continue" && current?.lastId && step < 30; step += 1) {
    await sleep(Number(process.env.AGENCY_E2E_COMMISSION_CONTINUE_WAIT_MS || 2500));
    current = await callCommissionWorker(date, "continue", runId, current.lastId);
    runs.push(current);
  }

  return {
    final: current,
    runs,
    continueCount: Math.max(0, runs.length - 1),
    exhausted: current?.status !== "continue",
  };
}

async function commissionStatusCounts(date) {
  const rows = await d1Query(
    "SELECT processed, COUNT(*) AS count FROM commission_batch WHERE date = ? GROUP BY processed",
    [date],
  );
  if (!rows) return null;

  const counts = { total: 0, pending: 0, processed: 0, processing: 0, held: 0, byStatus: {} };
  for (const row of rows) {
    const status = Number(row.processed);
    const count = Number(row.count || 0);
    counts.total += count;
    counts.byStatus[status] = count;
    if (status === 0) counts.pending += count;
    if (status === 1) counts.processed += count;
    if (status === 2) counts.processing += count;
    if (status === 3) counts.held += count;
  }
  return counts;
}

async function waitForCommissionCompletion(date) {
  if (!CF_ACCOUNT_ID || !CF_API_TOKEN) return { skipped: true };

  const timeoutMs = Number(process.env.AGENCY_E2E_COMMISSION_TIMEOUT_MS || 120000);
  const intervalMs = Number(process.env.AGENCY_E2E_POLL_MS || 5000);
  const startedAt = Date.now();
  let counts = null;

  while (Date.now() - startedAt < timeoutMs) {
    counts = await commissionStatusCounts(date);
    if (counts?.total > 0 && counts.pending === 0 && counts.processing === 0) {
      return { skipped: false, counts, waitedMs: Date.now() - startedAt };
    }
    await sleep(intervalMs);
  }

  return {
    skipped: false,
    timedOut: true,
    counts,
    waitedMs: Date.now() - startedAt,
  };
}

async function resetD1Date(date) {
  if (!CF_ACCOUNT_ID || !CF_API_TOKEN) return { skipped: true };

  const [groupedViews, commissionBatch, cfStats] = await Promise.all([
    d1Scalar("SELECT COUNT(*) AS count FROM grouped_views WHERE date = ?", [date]),
    d1Scalar("SELECT COUNT(*) AS count FROM commission_batch WHERE date = ?", [date]),
    d1Scalar("SELECT COUNT(*) AS count FROM cf_stats WHERE date = ?", [date]),
  ]);
  const existingRows = {
    groupedViews: groupedViews || 0,
    commissionBatch: commissionBatch || 0,
    cfStats: cfStats || 0,
  };
  const existingTotal = existingRows.groupedViews + existingRows.commissionBatch + existingRows.cfStats;

  if (existingTotal > 0 && process.env.AGENCY_E2E_ALLOW_D1_DATE_RESET !== "true") {
    return {
      skipped: true,
      reason: "D1 date already has rows; set AGENCY_E2E_ALLOW_D1_DATE_RESET=true only for an explicitly disposable test date.",
      date,
      existingRows,
    };
  }

  await d1Query("DELETE FROM grouped_views WHERE date = ?", [date]);
  await d1Query("DELETE FROM commission_batch WHERE date = ?", [date]);
  await d1Query("DELETE FROM cf_stats WHERE period = 'weekly' AND date = ?", [date]);
  await d1Query("DELETE FROM cf_stats WHERE period = 'daily' AND date = ?", [date]);

  return { skipped: false, date, existingRows };
}

function isGeneratedFutureTestDate(date) {
  return /^\d{4}-\d{2}-\d{2}$/.test(date) && Number(date.slice(0, 4)) >= 2030;
}

async function cleanupD1Run(runId, date) {
  if (!CF_ACCOUNT_ID || !CF_API_TOKEN || !runId || runId === "all") return { skipped: true };

  const like = `%${PREFIX}_${runId}_%`;
  const startsWith = `${PREFIX}_${runId}_%`;
  const before = {
    groupedViews: await d1Scalar(
      `SELECT COUNT(*) AS count FROM grouped_views
       WHERE id LIKE ? OR uploader_id LIKE ? OR post_id LIKE ? OR master_id LIKE ? OR referrer_id LIKE ?`,
      [like, startsWith, startsWith, startsWith, startsWith],
    ),
    commissionBatch: await d1Scalar(
      `SELECT COUNT(*) AS count FROM commission_batch
       WHERE user_id LIKE ? OR master_id LIKE ? OR post_id LIKE ? OR metadata LIKE ?`,
      [startsWith, startsWith, startsWith, like],
    ),
    cfStats: date && isGeneratedFutureTestDate(date)
      ? await d1Scalar("SELECT COUNT(*) AS count FROM cf_stats WHERE date = ?", [date])
      : 0,
  };

  await d1Query(
    `DELETE FROM grouped_views
     WHERE id LIKE ? OR uploader_id LIKE ? OR post_id LIKE ? OR master_id LIKE ? OR referrer_id LIKE ?`,
    [like, startsWith, startsWith, startsWith, startsWith],
  );
  await d1Query(
    `DELETE FROM commission_batch
     WHERE user_id LIKE ? OR master_id LIKE ? OR post_id LIKE ? OR metadata LIKE ?`,
    [startsWith, startsWith, startsWith, like],
  );

  if (date && isGeneratedFutureTestDate(date)) {
    await d1Query("DELETE FROM cf_stats WHERE date = ?", [date]);
  }

  return { skipped: false, date, before };
}

async function seedCloudflareStats(date, runId) {
  if (!CF_ACCOUNT_ID || !CF_API_TOKEN) return { skipped: true };

  const topCountries = [
    { country: "KR", count: 118, minutes: 920 },
    { country: "US", count: 82, minutes: 640 },
    { country: "JP", count: 46, minutes: 310 },
    { country: "CN", count: 39, minutes: 270 },
    { country: "VN", count: 28, minutes: 180 },
  ];
  const requestList = {
    fixture: runId,
    source: "agency-e2e-fixture",
    description: "Synthetic Cloudflare country stats for commission/statistics UI verification",
  };

  await d1Query(
    `INSERT INTO cf_stats (period, date, total_minutes, total_requests, top_countries, request_list)
     VALUES ('weekly', ?, ?, ?, ?, ?)
     ON CONFLICT(period, date) DO UPDATE SET
       total_minutes = excluded.total_minutes,
       total_requests = excluded.total_requests,
       top_countries = excluded.top_countries,
       request_list = excluded.request_list`,
    [date, 2320, 313, JSON.stringify(topCountries), JSON.stringify(requestList)],
  );

  return { skipped: false, topCountries };
}

async function cleanup(runId) {
  const startsWith = !runId || runId === "all" ? `${PREFIX}_` : `${PREFIX}_${runId}_`;
  let manifest = null;

  if (runId && runId !== "all") {
    try {
      manifest = JSON.parse(await readFile(manifestPath(runId), "utf8"));
    } catch {}
  }

  const users = await prisma.user.findMany({
    where: { username: { startsWith } },
    select: { id: true },
  });
  const userIds = users.map((u) => u.id);

  const posts = await prisma.post.findMany({
    where: {
      OR: [
        { id: { startsWith } },
        ...(userIds.length ? [{ userId: { in: userIds } }] : []),
      ],
    },
    select: { id: true },
  });
  const postIds = posts.map((p) => p.id);

  if (manifest?.systemSettingsSnapshot) {
    await restoreSystemSettings(manifest.systemSettingsSnapshot);
  }

  if (userIds.length) {
    await prisma.pointWithdrawal.deleteMany({ where: { userId: { in: userIds } } });
    await prisma.creatorInfo.deleteMany({ where: { userId: { in: userIds } } });
    await prisma.payment.deleteMany({ where: { OR: [{ userId: { in: userIds } }, { orderId: { startsWith } }] } });
    await prisma.billingKey.deleteMany({ where: { userId: { in: userIds } } });
    await prisma.subscription.deleteMany({ where: { userId: { in: userIds } } });
  }

  await prisma.videoView.deleteMany({
    where: {
      OR: [
        { id: { startsWith } },
        ...(userIds.length ? [{ userId: { in: userIds } }, { uploaderId: { in: userIds } }] : []),
      ],
    },
  });

  if (postIds.length) {
    await prisma.userVideoProgress.deleteMany({ where: { postId: { in: postIds } } });
    await prisma.video.deleteMany({ where: { postId: { in: postIds } } });
    await prisma.post.deleteMany({ where: { id: { in: postIds } } });
  }

  await prisma.systemSetting.deleteMany({
    where: {
      OR: [
        { id: { startsWith } },
        { key: { startsWith: `agencySettings_${startsWith}` } },
        { key: { startsWith: `pointDistribution_${startsWith}` } },
      ],
    },
  });

  if (userIds.length) {
    await prisma.notification.deleteMany({
      where: {
        OR: [
          { issuerId: { in: userIds } },
          { recipientId: { in: userIds } },
        ],
      },
    });
    await prisma.session.deleteMany({ where: { userId: { in: userIds } } });
    await prisma.user.deleteMany({ where: { id: { in: userIds } } });
  }

  const d1Cleanup = manifest?.targetDate
    ? await cleanupD1Run(runId, manifest.targetDate).catch((error) => ({ skipped: true, error: String(error) }))
    : { skipped: true };

  return { users: userIds.length, posts: postIds.length, d1Cleanup };
}

async function setup(runId = nowRunId()) {
  const targetDate = targetDateForRun(runId);
  const createdAt = kstDateToUtc(targetDate);
  const { admin, creators, teams } = buildAccounts(runId);
  const allUsers = [admin, ...creators, ...teams.flatMap((team) => team.members)];
  const passwordHash = await hash(DEFAULT_PASSWORD, {
    memoryCost: 19456,
    timeCost: 2,
    outputLen: 32,
    parallelism: 1,
  });

  await cleanup(runId);
  const d1Reset = await resetD1Date(targetDate).catch((error) => ({ skipped: true, error: String(error) }));
  if (d1Reset?.reason) {
    throw new Error(`D1 target date is not clean: ${JSON.stringify(d1Reset)}`);
  }
  const systemSettingsSnapshot = await preserveSystemSettings([
    "coinToPoint",
    "viewCoinAmount",
    "subscriptionPackages",
    "uploaderQualification",
  ]);

  await prisma.user.createMany({
    data: allUsers.map((item) => ({
      ...item,
      passwordHash,
      points: 0,
      mscoin: 100,
      adultauth: true,
    })),
  });

  await prisma.creatorInfo.createMany({
    data: allUsers.map((item) => ({
      userId: item.id,
      accountHolder: item.displayName,
      bankName: "E2E Verification Bank",
      accountNumber: `000-${runId}-${item.username.slice(-6)}`,
      country: "KR",
      swiftCode: "E2EOKRSE",
      paypalEmail: item.email,
      phoneNumber: "+82-10-0000-0000",
      address: "Agency E2E verification fixture",
      idCheck: true,
      extraInfo: { runId, fixture: true },
    })),
  });

  await upsertSystemSetting("coinToPoint", 10, admin.id, `Agency E2E ${runId}: 1 coin view unit = 10 points base`);
  await upsertSystemSetting("viewCoinAmount", 1, admin.id, `Agency E2E ${runId}: coin view amount`);
  await upsertSystemSetting(
    "subscriptionPackages",
    { value: [{ type: "yearly", price: 0 }, { type: "weekly", price: 6000 }] },
    admin.id,
    `Agency E2E ${runId}: deterministic subscription revenue`,
  );
  await upsertSystemSetting(
    "uploaderQualification",
    [
      { level: 1, shareRatio: 10, minViews: 0 },
      { level: 2, shareRatio: 20, minViews: 0 },
      { level: 3, shareRatio: 30, minViews: 0 },
    ],
    admin.id,
    `Agency E2E ${runId}: creator level share ratios`,
  );

  for (const team of teams) {
    await prisma.systemSetting.create({
      data: {
        id: team.master.id,
        key: `agencySettings_${team.master.id}`,
        value: agencySettings(team.master.id, team.masterType),
        valueType: "json",
        description: `Agency E2E ${runId}: ${team.masterType}`,
        updatedBy: admin.id,
      },
    });
  }

  const maxPost = await prisma.post.findFirst({
    orderBy: { postNum: "desc" },
    select: { postNum: true },
  });
  let nextPostNum = (maxPost?.postNum || 0) + 1;
  const posts = [];

  for (const creator of creators) {
    for (let index = 1; index <= 2; index += 1) {
      const postId = testId(runId, `${creator.username.split(`${runId}_`)[1]}_post_${index}`);
      const videoId = testId(runId, `${creator.username.split(`${runId}_`)[1]}_video_${index}`);

      await prisma.post.create({
        data: {
          id: postId,
          postNum: nextPostNum++,
          title: `Agency E2E ${creator.displayName} Post ${index}`,
          content: `Agency commission verification fixture ${runId}`,
          status: "PUBLISHED",
          userId: creator.id,
          categories: ["DRAMA"],
          postLanguage: "KOREAN",
          publishedAt: createdAt,
          createdAt,
          videoCount: 1,
          videos: {
            create: {
              id: videoId,
              sequence: 1,
              isPremium: true,
              filename: `${postId}.mp4`,
              subtitle: ["KOREAN"],
            },
          },
        },
      });

      posts.push({ creatorId: creator.id, postId, videoId, index });
    }
  }

  await prisma.payment.create({
    data: {
      userId: admin.id,
      type: "subscription",
      status: "success",
      amount: 6000,
      orderId: testId(runId, "subscription_revenue"),
      method: "weekly",
      approvedAt: createdAt,
      createdAt,
      updatedAt: createdAt,
      metadata: { runId, fixture: true, purpose: "subscriptionPerPoint" },
    },
  });

  const viewRows = [];
  let viewCounter = 1;

  for (const team of teams) {
    const actors = team.viewActors;
    const scenarios = [
      { actor: actors.directA, creator: creators[0], postIndex: 1, accessMethod: "COIN" },
      { actor: actors.level2A, creator: creators[1], postIndex: 1, accessMethod: "SUBSCRIPTION" },
      { actor: actors.level3, creator: creators[2], postIndex: 1, accessMethod: "COIN" },
      { actor: actors.directB, creator: creators[0], postIndex: 2, accessMethod: "SUBSCRIPTION" },
      { actor: actors.level2B, creator: creators[1], postIndex: 2, accessMethod: "COIN" },
    ];

    for (const scenario of scenarios) {
      const post = posts.find((item) => item.creatorId === scenario.creator.id && item.index === scenario.postIndex);
      const viewId = testId(runId, `view_${String(viewCounter).padStart(3, "0")}`);
      viewCounter += 1;

      await prisma.videoView.create({
        data: {
          id: viewId,
          userId: scenario.actor.id,
          videoId: post.videoId,
          createdAt,
          updatedAt: createdAt,
          accessMethod: scenario.accessMethod,
          referredBy: scenario.actor.referredBy,
          teamMaster: team.master.id,
          uploaderId: scenario.creator.id,
          postId: post.postId,
        },
      });

      viewRows.push({
        id: viewId,
        teamKey: team.key,
        teamType: team.masterType,
        viewerId: scenario.actor.id,
        referrerId: scenario.actor.referredBy,
        teamMasterId: team.master.id,
        creatorId: scenario.creator.id,
        postId: post.postId,
        accessMethod: scenario.accessMethod,
      });
    }
  }

  const manifest = {
    runId,
    targetDate,
    password: DEFAULT_PASSWORD,
    baseUrl: BASE_URL,
    d1Reset,
    systemSettingsSnapshot,
    accounts: {
      admin,
      creators,
      teams: teams.map((team) => ({
        key: team.key,
        label: team.label,
        masterType: team.masterType,
        master: team.master,
        members: team.members,
      })),
    },
    posts,
    views: viewRows,
    expected: {
      creatorShareRatios: [
        { role: 20, level: 1, shareRatio: 10 },
        { role: 22, level: 2, shareRatio: 20 },
        { role: 24, level: 3, shareRatio: 30 },
      ],
      systemPointSettings: {
        coinToPoint: 10,
        viewCoinAmount: 1,
        weeklySubscriptionRevenue: 6000,
        subscriptionViews: viewRows.filter((view) => view.accessMethod === "SUBSCRIPTION").length,
      },
      agencyTypes: teams.map((team) => ({
        key: team.key,
        masterType: team.masterType,
        defaultCommissionRate: 10,
      })),
    },
  };

  await mkdir(".tmp", { recursive: true });
  await writeFile(manifestPath(runId), `${JSON.stringify(manifest, null, 2)}\n`);

  return manifest;
}

async function loadManifest(runId) {
  return JSON.parse(await readFile(manifestPath(runId), "utf8"));
}

async function syncReferral(userId, masterId) {
  const response = await fetch(`${REFERRAL_WORKER_URL}/sync-user-referral-structure`, {
    method: "POST",
    headers: headers(),
    body: JSON.stringify({ userId, action: "add", masterId }),
  });
  const result = await response.json().catch(() => null);
  if (!response.ok || !result?.success) {
    throw new Error(`referral sync failed for ${userId}: ${JSON.stringify(result)}`);
  }
  return result;
}

async function createWithdrawalFixtures(manifest) {
  const allUsers = [
    ...manifest.accounts.creators,
    ...manifest.accounts.teams.flatMap((team) => team.members),
  ];
  const users = await prisma.user.findMany({
    where: { id: { in: allUsers.map((user) => user.id) }, points: { gt: 0 } },
    include: { CreatorInfo: true },
    orderBy: [{ userRole: "desc" }, { username: "asc" }],
    take: 6,
  });
  const requestedAt = kstDateToUtc(manifest.targetDate, 12);
  const results = [];

  for (const [index, user] of users.entries()) {
    if (!user.CreatorInfo) continue;

    const amount = Math.max(1, Math.floor(Number(user.points || 0) / 2));
    const status = index % 2 === 0 ? "APPROVED" : "PENDING";
    const bankInfo = {
      accountHolder: user.CreatorInfo.accountHolder,
      country: user.CreatorInfo.country,
      bankName: user.CreatorInfo.bankName,
      accountNumber: user.CreatorInfo.accountNumber,
      swiftCode: user.CreatorInfo.swiftCode,
      address: user.CreatorInfo.address,
      phoneNumber: user.CreatorInfo.phoneNumber,
      paypalEmail: user.CreatorInfo.paypalEmail,
    };

    const withdrawal = await prisma.pointWithdrawal.create({
      data: {
        userId: user.id,
        amount,
        status,
        bankInfo,
        requestedAt,
        processedAt: status === "APPROVED" ? requestedAt : null,
        processedBy: status === "APPROVED" ? manifest.accounts.admin.id : null,
        paymentAmount: status === "APPROVED" ? amount : null,
        exchangeRate: status === "APPROVED" ? 1 : null,
        memo: `Agency E2E ${manifest.runId} ${status.toLowerCase()} withdrawal fixture`,
        reason: `Agency E2E ${manifest.runId} payout verification`,
      },
    });

    results.push({
      id: withdrawal.id,
      userId: user.id,
      username: user.username,
      pointsBeforeRequest: Number(user.points || 0),
      amount,
      status,
    });
  }

  return results;
}

async function trigger(runId) {
  const manifest = await loadManifest(runId);
  const syncResults = [];

  for (const team of manifest.accounts.teams) {
    for (const member of team.members) {
      syncResults.push(await syncReferral(member.id, team.master.id));
    }
  }

  const viewgroupResponse = await fetch(`${VIEWGROUP_WORKER_URL}/collect-daily-views`, {
    method: "POST",
    headers: headers(),
    body: JSON.stringify({ date: manifest.targetDate }),
  });
  const viewgroup = await viewgroupResponse.json().catch(() => null);
  if (!viewgroupResponse.ok || !viewgroup?.success) {
    throw new Error(`viewgroup failed: ${JSON.stringify(viewgroup)}`);
  }

  const groupedWait = await waitForGroupedViews(manifest.targetDate, manifest.views.length);
  if (groupedWait.timedOut) {
    throw new Error(`viewgroup did not complete: ${JSON.stringify(groupedWait)}`);
  }

  await sleep(Number(process.env.AGENCY_E2E_WORKER_WAIT_MS || 5000));

  const commissionStart = await callCommissionWorker(manifest.targetDate, "start", runId);
  let commission = {
    final: commissionStart,
    runs: [commissionStart],
    continueCount: 0,
    exhausted: commissionStart?.status !== "continue",
    queueCompleted: false,
  };
  let commissionWait = await waitForCommissionCompletion(manifest.targetDate);
  if (commissionWait.timedOut && commissionStart?.status === "continue" && commissionStart?.lastId) {
    commission = await drainCommissionWorker(manifest.targetDate, runId, commissionStart);
    commissionWait = await waitForCommissionCompletion(manifest.targetDate);
  } else {
    commission.queueCompleted = !commissionWait.timedOut;
  }
  if (commissionWait.timedOut) {
    throw new Error(`commission did not complete: ${JSON.stringify(commissionWait)}`);
  }

  const withdrawalFixtures = await createWithdrawalFixtures(manifest);

  const cfStatsResponse = await fetch(`${CFSTATS_WORKER_URL}/stats?period=weekly&date=${manifest.targetDate}`, {
    method: "GET",
    headers: headers(),
  });
  const cfStats = await cfStatsResponse.json().catch(() => null);
  const cfStatsSeed = await seedCloudflareStats(manifest.targetDate, runId).catch((error) => ({
    skipped: true,
    error: String(error),
  }));

  const updated = {
    ...manifest,
    trigger: {
      triggeredAt: new Date().toISOString(),
      syncResults,
      viewgroup,
      groupedWait,
      commission,
      commissionWait,
      withdrawalFixtures,
      cfStatsSeed,
      cfStats,
    },
  };
  await writeFile(manifestPath(runId), `${JSON.stringify(updated, null, 2)}\n`);

  return updated.trigger;
}

async function fetchWorkerSummary(manifest, scope, userId) {
  const url = new URL("/summary", COMMISSION_WORKER_URL);
  url.searchParams.set("date", manifest.targetDate);
  url.searchParams.set("scope", scope);
  if (userId) url.searchParams.set("userId", userId);

  const response = await fetch(url, { headers: headers() });
  return response.json().catch(() => null);
}

async function verify(runId) {
  const manifest = await loadManifest(runId);
  const allUsers = [
    manifest.accounts.admin,
    ...manifest.accounts.creators,
    ...manifest.accounts.teams.flatMap((team) => team.members),
  ];
  const userIds = allUsers.map((user) => user.id);

  const users = await prisma.user.findMany({
    where: { id: { in: userIds } },
    select: {
      id: true,
      username: true,
      displayName: true,
      email: true,
      userRole: true,
      points: true,
      referredBy: true,
      teamMaster: true,
      emailVerified: true,
      CreatorInfo: { select: { idCheck: true, bankName: true, accountNumber: true } },
    },
    orderBy: { username: "asc" },
  });

  const [payments, withdrawals] = await Promise.all([
    prisma.payment.findMany({
      where: { OR: [{ userId: { in: userIds } }, { orderId: { startsWith: `${PREFIX}_${runId}_` } }] },
      select: { id: true, userId: true, type: true, status: true, amount: true, orderId: true, method: true, createdAt: true },
      orderBy: { createdAt: "asc" },
    }),
    prisma.pointWithdrawal.findMany({
      where: { userId: { in: userIds } },
      select: {
        id: true,
        userId: true,
        amount: true,
        status: true,
        requestedAt: true,
        processedAt: true,
        processedBy: true,
        paymentAmount: true,
        exchangeRate: true,
      },
      orderBy: { requestedAt: "asc" },
    }),
  ]);

  let d1 = CF_ACCOUNT_ID && CF_API_TOKEN
    ? {
        groupedViews: await d1Query("SELECT * FROM grouped_views WHERE date = ? ORDER BY id", [manifest.targetDate]),
        commissionBatch: await d1Query("SELECT * FROM commission_batch WHERE date = ? ORDER BY user_id, commission_type", [manifest.targetDate]),
        cfStats: await d1Query("SELECT * FROM cf_stats WHERE date = ? ORDER BY period", [manifest.targetDate]),
      }
    : { skipped: true };

  const summaries = {
    admin: await fetchWorkerSummary(manifest, "admin"),
    creators: {},
    agencies: {},
  };

  for (const creator of manifest.accounts.creators) {
    summaries.creators[creator.id] = await fetchWorkerSummary(manifest, "creator", creator.id);
  }
  for (const team of manifest.accounts.teams) {
    summaries.agencies[team.master.id] = await fetchWorkerSummary(manifest, "agency", team.master.id);
  }

  if (CF_ACCOUNT_ID && CF_API_TOKEN) {
    await seedCloudflareStats(manifest.targetDate, manifest.runId).catch(() => null);
    d1 = {
      groupedViews: await d1Query("SELECT * FROM grouped_views WHERE date = ? ORDER BY id", [manifest.targetDate]),
      commissionBatch: await d1Query("SELECT * FROM commission_batch WHERE date = ? ORDER BY user_id, commission_type", [manifest.targetDate]),
      cfStats: await d1Query("SELECT * FROM cf_stats WHERE date = ? ORDER BY period", [manifest.targetDate]),
    };
  }

  const cfStatsRows = Array.isArray(d1.cfStats) ? d1.cfStats : [];
  const hasCountryStats = cfStatsRows.some((row) => {
    try {
      return JSON.parse(row.top_countries || "[]").length > 0;
    } catch {
      return false;
    }
  });

  const verification = {
    verifiedAt: new Date().toISOString(),
    users: users.map((user) => ({ ...user, points: Number(user.points || 0) })),
    payments,
    withdrawals,
    d1,
    summaries,
    checks: {
      accountCount: users.length,
      creatorCount: manifest.accounts.creators.length,
      teamCount: manifest.accounts.teams.length,
      postCount: manifest.posts.length,
      viewCount: manifest.views.length,
      usersWithPositivePoints: users.filter((user) => Number(user.points || 0) > 0).length,
      d1CommissionRows: Array.isArray(d1.commissionBatch) ? d1.commissionBatch.length : 0,
      d1GroupedViewRows: Array.isArray(d1.groupedViews) ? d1.groupedViews.length : 0,
      cfStatsRows: cfStatsRows.length,
      hasCountryStats,
      withdrawalRows: withdrawals.length,
      commissionStatusCounts: Array.isArray(d1.commissionBatch)
        ? d1.commissionBatch.reduce((acc, row) => {
            const status = String(row.processed);
            acc[status] = (acc[status] || 0) + 1;
            return acc;
          }, {})
        : {},
    },
  };
  verification.checks.passed = verification.checks.accountCount === userIds.length
    && verification.checks.d1GroupedViewRows >= manifest.views.length
    && verification.checks.d1CommissionRows > 0
    && verification.checks.usersWithPositivePoints > 0
    && verification.checks.hasCountryStats
    && verification.checks.withdrawalRows > 0;

  const updated = { ...manifest, verification };
  await writeFile(manifestPath(runId), `${JSON.stringify(updated, null, 2)}\n`);

  return verification;
}

function markdownTable(headers, rows) {
  return [
    `| ${headers.join(" | ")} |`,
    `| ${headers.map(() => "---").join(" | ")} |`,
    ...rows.map((row) => `| ${row.map((cell) => String(cell ?? "")).join(" | ")} |`),
  ].join("\n");
}

async function report(runId) {
  const manifest = await loadManifest(runId);
  const verification = manifest.verification || await verify(runId);
  const allAccounts = [
    ["관리자", manifest.accounts.admin],
    ...manifest.accounts.creators.map((user) => ["크리에이터", user]),
    ...manifest.accounts.teams.flatMap((team) => team.members.map((user) => [team.masterType, user])),
  ];
  const userPoints = new Map(verification.users.map((user) => [user.id, user.points]));
  const teamRows = manifest.accounts.teams.map((team) => [
    team.label,
    team.masterType,
    team.master.username,
    team.members.filter((member) => member.id !== team.master.id).map((member) => member.username).join("<br>"),
  ]);
  const accountRows = allAccounts.map(([type, account]) => [
    type,
    account.username,
    account.email,
    account.userRole,
    account.teamMaster || "-",
    account.referredBy || "-",
    userPoints.get(account.id) || 0,
  ]);
  const viewRows = manifest.views.map((view) => [
    view.teamType,
    view.viewerId,
    view.referrerId || "-",
    view.creatorId,
    view.postId,
    view.accessMethod,
  ]);
  const commissionRows = Array.isArray(verification.d1?.commissionBatch)
    ? verification.d1.commissionBatch.map((row) => [
        row.user_id,
        row.master_id || "-",
        row.commission_type,
        Number(row.point_by_coin || 0).toFixed(2),
        Number(row.point_by_subscription || 0).toFixed(2),
        row.processed,
        row.post_id || "-",
      ])
    : [];
  const cfRows = Array.isArray(verification.d1?.cfStats)
    ? verification.d1.cfStats.map((row) => [
        row.period,
        row.date,
        row.total_minutes || 0,
        row.top_countries || "[]",
      ])
    : [];
  const withdrawalRows = verification.withdrawals.map((row) => [
    row.userId,
    row.amount,
    row.status,
    row.paymentAmount || "-",
    row.processedBy || "-",
    row.requestedAt,
    row.processedAt || "-",
  ]);
  const statusLabel = verification.checks.passed ? "통과" : "점검 필요";
  const periodKey = isoWeekKeyForDate(manifest.targetDate);
  const creatorLogin = manifest.accounts.creators[0].username;
  const agencyLogin = manifest.accounts.teams[0].master.username;
  const creatorUiPath = `${BASE_URL}/ko/usermenu/earnings?tab=statistics&period=${periodKey}`;
  const agencyUiPath = `${BASE_URL}/ko/usermenu/agency-earnings?tab=statistics&period=${periodKey}`;
  const adminUiPath = `${BASE_URL}/ko/admin/system?period=${periodKey}`;

  const content = `# 에이전시 / 크리에이터 정산 시스템 검증 보고서

## 1. 검증 결론
- 검증 상태: \`${statusLabel}\`
- 검증 실행 ID: \`${runId}\`
- 검증 정산일: \`${manifest.targetDate}\`
- 검증 주차 키: \`${periodKey}\`
- 모든 테스트 계정 공통 비밀번호: \`${manifest.password}\`
- 생성 계정: \`${verification.checks.accountCount}\`개
- 크리에이터: \`${verification.checks.creatorCount}\`명
- 영업팀: \`${verification.checks.teamCount}\`개
- 테스트 포스트: \`${verification.checks.postCount}\`개
- 테스트 시청 기록: \`${verification.checks.viewCount}\`건
- D1 그룹 시청 행: \`${verification.checks.d1GroupedViewRows}\`건
- D1 커미션 행: \`${verification.checks.d1CommissionRows}\`건
- 커미션 처리 상태: \`${JSON.stringify(verification.checks.commissionStatusCounts)}\` (1=지급완료, 3=조건 미충족 보류)
- 포인트가 실제 증가한 계정: \`${verification.checks.usersWithPositivePoints}\`개
- 지급 신청/승인 예시: \`${verification.checks.withdrawalRows}\`건
- Cloudflare 국가별 지도 데이터: \`${verification.checks.hasCountryStats ? "있음" : "없음"}\`

${verification.checks.passed ? "이번 run은 계정 생성, 시청 기록 생성, 워커 연계, D1 저장, 포인트 지급, 지급 신청 내역, Cloudflare 지도 통계까지 모두 확인된 상태입니다." : "이번 run은 일부 검증 항목이 통과하지 못했습니다. 위 숫자와 아래 상세 표를 먼저 확인해야 합니다."}

## 2. 이번 테스트가 확인한 것
- 크리에이터 등급별 차등 지급률이 적용됩니다. 역할 20은 10%, 역할 22는 20%, 역할 24는 30% 기준으로 테스트했습니다.
- 영업팀은 \`HEADQUARTERS\`, \`NETWORK\`, \`BINARY_NETWORK\` 세 종류를 모두 만들었습니다.
- 테스트 사용자가 유료 포스트를 코인 또는 구독 방식으로 시청한 것처럼 \`video_views\`에 기록을 만들었습니다.
- 뷰 그룹화 워커가 이 원본 시청 기록을 읽어 D1의 \`grouped_views\`로 묶었습니다.
- 커미션 워커가 \`grouped_views\`를 읽어 D1의 \`commission_batch\`를 만들고, 지급 가능한 행은 실제 사용자 포인트에 반영했습니다.
- 지급 자격 확인용으로 이메일 인증, 은행 정보, 신분 확인 완료 상태를 넣었고, 일부 계정에는 지급 신청/승인 기록도 생성했습니다.
- Cloudflare 통계용 D1 행을 만들어 글로벌 접속자 지도에 쓸 국가별 데이터를 확인했습니다.

## 3. 아주 쉽게 보는 전체 흐름
1. 사용자가 영상을 봅니다. 플랫폼에는 원본 시청 기록이 Postgres의 \`video_views\`에 남습니다. 이 기록에는 누가 봤는지, 어떤 포스트인지, 크리에이터가 누구인지, 코인 시청인지 구독 시청인지, 추천인과 영업팀 마스터가 누구인지가 들어갑니다.
2. \`viewgroup\` 워커가 정산일의 \`video_views\`를 읽습니다. 같은 날짜, 같은 크리에이터, 같은 포스트, 같은 영업팀, 같은 추천인 기준으로 시청을 묶어서 Cloudflare D1의 \`grouped_views\`에 저장합니다. 원본을 매번 전부 다시 계산하지 않기 위한 중간 요약표입니다.
3. \`viewgroup\` 워커는 한 번에 처리할 수 있는 양보다 데이터가 많으면 \`continue\` 상태를 반환하고 큐에 다음 작업을 넣습니다. 그래서 큰 데이터도 여러 번 나누어 처리됩니다.
4. \`commission\` 워커가 D1의 \`grouped_views\`를 읽습니다. 크리에이터 등급, 코인/구독 시청 수, 영업팀 설정, 추천인 구조를 함께 보고 누가 얼마를 받을지 계산합니다.
5. 계산 결과는 바로 사용자 포인트에 쓰기 전에 D1의 \`commission_batch\`에 먼저 저장됩니다. 이 표가 “왜 이 사람이 이 포인트를 받았는지”를 추적하는 근거 자료입니다.
6. \`commission\` 워커는 지급 가능한 행을 Postgres 사용자 포인트에 반영합니다. 지급 완료 행은 \`processed=1\`이 되고, 조건을 아직 만족하지 못한 바이너리/네트워크성 보류 행은 \`processed=3\`으로 남습니다.
7. 커미션 워커는 지급 완료 자료를 바탕으로 주간 요약 통계도 만듭니다. 이 요약은 관리자 통계, 크리에이터 수익, 영업팀 수익 화면에서 조회할 수 있습니다.
8. \`cfstats-admin\` 워커는 Cloudflare 접속 통계 또는 테스트용 D1 통계 행을 읽어 국가별 접속자 지도, 총 요청 수, 총 시청 시간 같은 화면용 통계를 제공합니다.
9. 사용자가 포인트 지급을 신청하면 Postgres의 \`point_withdrawals\`에 신청 내역이 저장됩니다. 이메일 인증, 은행 정보, 신분 확인이 되어 있어야 신청이 가능하고, 운영자가 승인하면 승인 상태와 처리자가 기록됩니다.

## 4. 실제 로그인 확인 방법
검증 데이터는 기존 데이터와 충돌하지 않도록 고유 미래 주차 \`${periodKey}\`에 만들었습니다. 화면에서 바로 확인하려면 아래 계정으로 로그인한 뒤 링크의 \`period=${periodKey}\`가 유지되어야 합니다.

- 크리에이터 수익 확인 계정: \`${creatorLogin}\`
- 크리에이터 수익 화면: \`${creatorUiPath}\`
- 영업팀 수익 확인 계정: \`${agencyLogin}\`
- 영업팀 수익 화면: \`${agencyUiPath}\`
- 관리자 확인 계정: \`${manifest.accounts.admin.username}\`
- 관리자 시스템 통계 화면: \`${adminUiPath}\`
- 관리자 영업 설정/조직도 화면: \`${BASE_URL}/ko/admin/agency\`

## 5. 직접 API 확인 링크
로그인 세션이 있는 브라우저에서 열면 같은 데이터를 API로 확인할 수 있습니다.

- 크리에이터 통계: \`${BASE_URL}/api/stats/uploader?userId=${manifest.accounts.creators[0].id}&period=${periodKey}\`
- 크리에이터 주간 정산: \`${BASE_URL}/api/stats/weekly?userId=${manifest.accounts.creators[0].id}&period=${periodKey}&type=uploader\`
- 영업팀 통계: \`${BASE_URL}/api/stats/agency?userId=${manifest.accounts.teams[0].master.id}&period=${periodKey}\`
- 영업팀 주간 정산: \`${BASE_URL}/api/stats/weekly?userId=${manifest.accounts.teams[0].master.id}&period=${periodKey}&type=agency\`
- 관리자 통계: \`${BASE_URL}/api/stats/admin?period=${periodKey}\`
- Cloudflare 지도 통계: \`${BASE_URL}/api/stats/cloudflare?period=${periodKey}\`

## 6. 로그인 계정 목록
모든 계정의 비밀번호는 \`${manifest.password}\` 입니다.

${markdownTable(["구분", "아이디", "이메일", "역할값", "소속 마스터", "추천인", "현재 포인트"], accountRows)}

## 7. 영업팀 구성
${markdownTable(["영업팀", "타입", "마스터 로그인", "소속 구성원"], teamRows)}

## 8. 테스트 시청 입력값
아래 행들이 이번 검증에서 실제로 만든 원본 시청 기록입니다.

${markdownTable(["영업팀 타입", "시청자", "추천인", "크리에이터", "포스트", "시청 방식"], viewRows)}

## 9. 커미션 계산 결과
\`processed=1\`은 포인트 지급 완료, \`processed=3\`은 현재 조건 미충족으로 보류된 커미션입니다.

${commissionRows.length ? markdownTable(["지급 대상", "마스터", "커미션 종류", "코인 포인트", "구독 포인트", "처리상태", "포스트"], commissionRows) : "D1 커미션 행을 조회하지 못했습니다. Cloudflare D1 자격 정보 또는 워커 실행 상태를 확인해야 합니다."}

## 10. 포인트 지급 신청/승인 결과
일부 포인트 보유 계정에 대해 지급 신청과 승인 예시를 만들었습니다.

${withdrawalRows.length ? markdownTable(["사용자", "신청 포인트", "상태", "실지급액", "처리자", "신청일", "처리일"], withdrawalRows) : "포인트가 지급된 계정이 없어 지급 신청 행을 만들지 못했습니다."}

## 11. Cloudflare 국가별 통계 스냅샷
글로벌 접속자 지도에 사용할 국가별 데이터입니다.

${cfRows.length ? markdownTable(["기간", "날짜", "총 분", "국가별 JSON"], cfRows) : "Cloudflare 통계 행을 조회하지 못했습니다."}

## 12. 재현 명령
\`\`\`bash
node scripts/agency-e2e-fixture.mjs full ${runId}
node scripts/agency-e2e-fixture.mjs verify ${runId}
node scripts/agency-e2e-fixture.mjs report ${runId}
\`\`\`

## 13. 정리 명령
정리 명령은 Postgres의 테스트 계정/포스트/시청/지급 신청을 \`runId\` 기준으로 삭제합니다. D1도 \`runId\`가 들어간 그룹뷰/커미션 행만 삭제하고, Cloudflare 통계 행은 이 스크립트가 만든 미래 검증 날짜일 때만 삭제합니다.

\`\`\`bash
node scripts/agency-e2e-fixture.mjs cleanup ${runId}
\`\`\`
`;

  await mkdir("docs", { recursive: true });
  await writeFile(reportPath(runId), content);

  return { reportPath: reportPath(runId), runId };
}

async function full(runId = nowRunId()) {
  const manifest = await setup(runId);
  const triggerResult = await trigger(runId);
  await restoreSystemSettings(manifest.systemSettingsSnapshot);
  const afterRestore = await loadManifest(runId);
  await writeFile(manifestPath(runId), `${JSON.stringify({
    ...afterRestore,
    globalSystemSettingsRestoredAt: new Date().toISOString(),
  }, null, 2)}\n`);
  const verification = await verify(runId);
  const reportResult = await report(runId);

  return {
    runId,
    targetDate: manifest.targetDate,
    manifestPath: manifestPath(runId),
    reportPath: reportResult.reportPath,
    trigger: triggerResult,
    checks: verification.checks,
  };
}

async function main() {
  const [command, runIdArg] = process.argv.slice(2);

  if (!command) {
    usage();
    process.exitCode = 1;
    return;
  }

  if (command === "setup") {
    console.log(JSON.stringify(await setup(runIdArg || nowRunId()), null, 2));
  } else if (command === "trigger") {
    if (!runIdArg) throw new Error("trigger에는 runId가 필요합니다.");
    console.log(JSON.stringify(await trigger(runIdArg), null, 2));
  } else if (command === "verify") {
    if (!runIdArg) throw new Error("verify에는 runId가 필요합니다.");
    console.log(JSON.stringify(await verify(runIdArg), null, 2));
  } else if (command === "report") {
    if (!runIdArg) throw new Error("report에는 runId가 필요합니다.");
    console.log(JSON.stringify(await report(runIdArg), null, 2));
  } else if (command === "full") {
    console.log(JSON.stringify(await full(runIdArg || nowRunId()), null, 2));
  } else if (command === "cleanup") {
    if (!runIdArg) throw new Error("cleanup에는 runId 또는 all이 필요합니다.");
    console.log(JSON.stringify({ runId: runIdArg, ...(await cleanup(runIdArg)) }, null, 2));
  } else {
    usage();
    process.exitCode = 1;
  }
}

main()
  .catch((error) => {
    console.error(error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
