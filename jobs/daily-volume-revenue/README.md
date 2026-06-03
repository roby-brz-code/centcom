# Daily Revenue & Volume → Slack

A scheduled job that posts a YTD **revenue and volume vs target** chart to Slack
once a day. Runs entirely on GitHub Actions — no server, no VPN, and nobody's
laptop needs to be on.

## How it works

1. GitHub Actions cron (`.github/workflows/daily-volume-revenue.yml`) fires daily.
2. `run.mjs` queries BigQuery (`query.sql`) with a **read-only service account**
   for company-level YTD revenue + volume — aggregate totals only, no merchant
   rows or PII.
3. It builds cumulative actual vs a linear target-pace line, renders a PNG with
   Playwright (Chart.js is inlined from `node_modules`, so nothing is fetched at
   render time), and uploads the image to a Slack channel.

## Security notes

- The only data that leaves BigQuery is daily company-wide totals.
- Credentials live as GitHub Actions **secrets**, written to a temp file at
  runtime and deleted afterward. Never commit keys.
- The SA should be scoped to `SELECT` on
  `beamo-payments-production.product.dma_general_order_financial_metrics_hi`
  only (BigQuery Data Viewer + Job User on that dataset, nothing else).

## Required GitHub secrets

| Secret | What |
| --- | --- |
| `BQ_SA_KEY` | Read-only BigQuery service-account key JSON (full contents) |
| `SLACK_BOT_TOKEN` | Slack bot token (`xoxb-…`) with `files:write` + `chat:write` |
| `SLACK_CHANNEL_ID` | Target channel id, e.g. `C0XXXXXXX` |

## Targets

Edit `targets.json`. Current values are **placeholders**:

- Revenue annual target: `$164,000,000`
- Volume annual target: **placeholder** — supply the real figure. ("50%
  non-stake concentration" doesn't map to a single volume number in the metrics
  layer; confirm what you want plotted.)

## Local test

```bash
npm ci
npx playwright install chromium
# point GOOGLE_APPLICATION_CREDENTIALS at a read-only SA key, then:
DRY_RUN=1 node jobs/daily-volume-revenue/run.mjs   # writes preview.png, skips Slack
```
