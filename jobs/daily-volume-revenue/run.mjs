#!/usr/bin/env node
/**
 * Daily YTD revenue & volume → Slack.
 *
 * Flow: query BigQuery (read-only SA) → build cumulative actuals → render a
 * chart to PNG with Playwright (fully offline, Chart.js inlined from
 * node_modules) → post the image to a Slack channel.
 *
 * Only aggregate, company-level totals leave BigQuery. No merchant rows, no PII.
 *
 * Required env:
 *   GOOGLE_APPLICATION_CREDENTIALS  path to read-only BigQuery SA key JSON
 *   BQ_PROJECT                      billing/project id (default: beamo-payments-production)
 *   SLACK_BOT_TOKEN                 xoxb- token with files:write + chat:write
 *   SLACK_CHANNEL_ID                target channel id (e.g. C0XXXXXXX)
 *   DRY_RUN                         "1" to render the PNG locally and skip Slack
 */
import { readFile, writeFile } from "node:fs/promises";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";
import { createRequire } from "node:module";

const require = createRequire(import.meta.url);
const __dirname = dirname(fileURLToPath(import.meta.url));

const PROJECT = process.env.BQ_PROJECT || "beamo-payments-production";
const DRY_RUN = process.env.DRY_RUN === "1";

function requireEnv(name) {
  const v = process.env[name];
  if (!v) throw new Error(`Missing required env var: ${name}`);
  return v;
}

/** Pull YTD daily revenue + volume from BigQuery. */
async function fetchDaily() {
  const { BigQuery } = require("@google-cloud/bigquery");
  // SA credentials come from GOOGLE_APPLICATION_CREDENTIALS — never inline keys.
  const bq = new BigQuery({ projectId: PROJECT });
  const sql = await readFile(join(__dirname, "query.sql"), "utf8");
  const [rows] = await bq.query({ query: sql });
  return rows.map((r) => ({
    date: typeof r.date === "object" && r.date?.value ? r.date.value : String(r.date),
    revenue: Number(r.revenue) || 0,
    volume: Number(r.volume) || 0,
  }));
}

/** Cumulative actuals. */
function buildSeries(daily) {
  const labels = [];
  const revActual = [];
  const volActual = [];
  let revCum = 0;
  let volCum = 0;
  for (const row of daily) {
    revCum += row.revenue;
    volCum += row.volume;
    labels.push(row.date);
    revActual.push(Math.round(revCum));
    volActual.push(Math.round(volCum));
  }
  return {
    labels,
    revActual,
    volActual,
    summary: {
      asOf: labels[labels.length - 1],
      revenue: { ytd: revActual.at(-1) },
      volume: { ytd: volActual.at(-1) },
    },
  };
}

function fmtUsd(n) {
  if (n >= 1e9) return `$${(n / 1e9).toFixed(2)}B`;
  if (n >= 1e6) return `$${(n / 1e6).toFixed(1)}M`;
  if (n >= 1e3) return `$${(n / 1e3).toFixed(0)}K`;
  return `$${n}`;
}

/** Self-contained HTML page; Chart.js is inlined so nothing is fetched at render time. */
async function buildHtml(series) {
  // chart.js' exports map exposes only "." — resolve the main entry (dist/chart.cjs)
  // and grab the sibling UMD build from the same dist dir.
  const chartJsPath = join(dirname(require.resolve("chart.js")), "chart.umd.js");
  const chartJs = await readFile(chartJsPath, "utf8");
  const { summary } = series;

  return `<!doctype html><html><head><meta charset="utf-8"><style>
    body{margin:0;background:#0b0f17;color:#e6edf3;font:14px/1.4 -apple-system,Segoe UI,Roboto,sans-serif;width:1000px}
    .wrap{padding:28px}
    h1{font-size:20px;margin:0 0 2px}
    .as-of{color:#8b98a9;font-size:13px;margin-bottom:18px}
    .cards{display:flex;gap:16px;margin-bottom:18px}
    .card{flex:1;background:#131a26;border:1px solid #1f2a3a;border-radius:10px;padding:16px}
    .card .k{color:#8b98a9;font-size:12px;text-transform:uppercase;letter-spacing:.04em}
    .card .v{font-size:28px;font-weight:600;margin:4px 0}
    .charts{display:flex;gap:16px}
    .charts>div{flex:1;background:#131a26;border:1px solid #1f2a3a;border-radius:10px;padding:12px}
    canvas{width:100%!important;height:240px!important}
  </style><script>${chartJs}</script></head><body>
  <div class="wrap">
    <h1>YTD Revenue &amp; Volume — 2026</h1>
    <div class="as-of">As of ${summary.asOf} · cumulative actuals</div>
    <div class="cards">
      <div class="card"><div class="k">Revenue YTD</div><div class="v">${fmtUsd(summary.revenue.ytd)}</div></div>
      <div class="card"><div class="k">Volume YTD</div><div class="v">${fmtUsd(summary.volume.ytd)}</div></div>
    </div>
    <div class="charts">
      <div><canvas id="rev"></canvas></div>
      <div><canvas id="vol"></canvas></div>
    </div>
  </div>
  <script>
    const labels = ${JSON.stringify(series.labels)};
    const opts = (title) => ({
      type:'line',
      options:{responsive:false,animation:false,plugins:{legend:{display:false},title:{display:true,text:title,color:'#e6edf3'}},
        scales:{x:{ticks:{color:'#566',maxTicksLimit:8},grid:{color:'#1f2a3a'}},y:{ticks:{color:'#566',callback:v=>'$'+(v/1e6).toFixed(0)+'M'},grid:{color:'#1f2a3a'}}}}
    });
    new Chart(document.getElementById('rev'),{...opts('Revenue (cumulative)'),data:{labels,datasets:[
      {data:${JSON.stringify(series.revActual)},borderColor:'#4f9dff',backgroundColor:'transparent',pointRadius:0,borderWidth:2}]}});
    new Chart(document.getElementById('vol'),{...opts('Volume (cumulative)'),data:{labels,datasets:[
      {data:${JSON.stringify(series.volActual)},borderColor:'#34d399',backgroundColor:'transparent',pointRadius:0,borderWidth:2}]}});
  </script></body></html>`;
}

async function renderPng(html) {
  const { chromium } = require("playwright");
  const browser = await chromium.launch();
  try {
    const page = await browser.newPage({ viewport: { width: 1000, height: 620 }, deviceScaleFactor: 2 });
    await page.setContent(html, { waitUntil: "networkidle" });
    await page.waitForTimeout(300); // let Chart.js paint
    return await page.locator(".wrap").screenshot();
  } finally {
    await browser.close();
  }
}

async function postToSlack(png, series) {
  const { WebClient } = require("@slack/web-api");
  const slack = new WebClient(requireEnv("SLACK_BOT_TOKEN"));
  const channel = requireEnv("SLACK_CHANNEL_ID");
  const { summary } = series;
  await slack.files.uploadV2({
    channel_id: channel,
    file: png,
    filename: `ytd-revenue-volume-${summary.asOf}.png`,
    title: `YTD Revenue & Volume — as of ${summary.asOf}`,
    initial_comment:
      `*YTD actuals* (as of ${summary.asOf})\n` +
      `• Revenue: ${fmtUsd(summary.revenue.ytd)}\n` +
      `• Volume: ${fmtUsd(summary.volume.ytd)}`,
  });
}

async function main() {
  const daily = await fetchDaily();
  if (!daily.length) throw new Error("Query returned no rows");
  const series = buildSeries(daily);
  const html = await buildHtml(series);
  const png = await renderPng(html);

  if (DRY_RUN) {
    const out = join(__dirname, "preview.png");
    await writeFile(out, png);
    console.log(`DRY_RUN: wrote ${out} (${png.length} bytes). Skipped Slack.`);
    console.log(JSON.stringify(series.summary, null, 2));
    return;
  }
  await postToSlack(png, series);
  console.log(`Posted to Slack. As of ${series.summary.asOf}.`);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
