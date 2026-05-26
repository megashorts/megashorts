import { spawn } from "node:child_process";

const runId = process.argv[2] || "20260525090317";
const date = process.argv[3] || "2042-06-15";
const bucket = process.env.CLOUDFLARE_POINTS_R2_BUCKET_NAME || "points-system-bucket";
const wrangler = "msworker/node_modules/.bin/wrangler";
const storedAt = new Date().toISOString();

const creators = {
  [`codex_agency_test_${runId}_creator_lv1`]: {
    totalMinutes: 15,
    topCountries: [
      { country: "TH", minutes: 9 },
      { country: "KR", minutes: 6 },
    ],
  },
  [`codex_agency_test_${runId}_creator_lv2`]: {
    totalMinutes: 15,
    topCountries: [
      { country: "US", minutes: 9 },
      { country: "VN", minutes: 6 },
    ],
  },
  [`codex_agency_test_${runId}_creator_lv3`]: {
    totalMinutes: 6,
    topCountries: [{ country: "JP", minutes: 6 }],
  },
};

const platform = {
  totalMinutes: 36,
  topCountries: [
    { country: "US", minutes: 9 },
    { country: "TH", minutes: 9 },
    { country: "KR", minutes: 6 },
    { country: "JP", minutes: 6 },
    { country: "VN", minutes: 6 },
  ],
};

const dailyRequestList = {
  "09": 5,
  "10": 5,
  "11": 4,
  "12": 6,
  "13": 4,
  "14": 5,
  "15": 5,
  "16": 2,
};

function putObject(key, payload) {
  return new Promise((resolve, reject) => {
    const child = spawn(
      wrangler,
      [
        "r2",
        "object",
        "put",
        `${bucket}/${key}`,
        "--pipe",
        "--remote",
        "--content-type",
        "application/json",
      ],
      {
        cwd: process.cwd(),
        env: {
          ...process.env,
          HOME: process.env.HOME || "/private/tmp",
          WRANGLER_SEND_METRICS: "false",
        },
        stdio: ["pipe", "pipe", "pipe"],
      },
    );

    let stdout = "";
    let stderr = "";
    child.stdout.on("data", (chunk) => {
      stdout += chunk.toString();
    });
    child.stderr.on("data", (chunk) => {
      stderr += chunk.toString();
    });
    child.on("error", reject);
    child.on("close", (code) => {
      if (code === 0) {
        resolve({ key, ok: true, stdout: stdout.trim() });
      } else {
        reject(new Error(`wrangler failed for ${key}: ${stderr || stdout}`));
      }
    });
    child.stdin.end(`${JSON.stringify(payload)}\n`);
  });
}

const results = [];

for (const period of ["daily", "weekly", "monthly"]) {
  const requestList = period === "daily" ? dailyRequestList : { [date]: 36 };

  results.push(
    await putObject(`cf-stats/${period}/${date}.json`, {
      source: "cfstats-admin",
      storedAt,
      period,
      date,
      totalMinutes: platform.totalMinutes,
      topCountries: platform.topCountries,
      requestList,
    }),
  );

  for (const [creator, aggregate] of Object.entries(creators)) {
    results.push(
      await putObject(`cf-stats/${period}/${date}/creators/${encodeURIComponent(creator)}.json`, {
        source: "cfstats-admin",
        storedAt,
        period,
        date,
        creator,
        totalMinutes: aggregate.totalMinutes,
        topCountries: aggregate.topCountries,
        requestList: {},
      }),
    );
  }
}

console.log(JSON.stringify({ bucket, written: results.length, results }, null, 2));
