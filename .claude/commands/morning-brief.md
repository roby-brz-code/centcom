You are running Roby's morning brief. Pull everything from the last 24 hours, triage it, and present a clean action feed with drafts ready to send.

## Step 1 — Fetch in parallel

Call these two tools simultaneously:
- `search_threads` (Gmail): query `newer_than:1d in:inbox`, pageSize 50
- `slack_search_public_and_private` (Slack): query `to:me after:<yesterday's date YYYY-MM-DD>`, sort by timestamp, limit 20, exclude bots

## Step 2 — Triage

Classify every item into one of:
- **ACTION** — needs a reply or decision from Roby (direct questions, merchant issues, team asks, financial ops, compliance, hiring)
- **FYI** — automated notifications, statements, newsletters, marketing (no reply needed)

Discard pure noise (Uber promo, WeWork newsletter, etc.).

## Step 3 — For each ACTION item, generate a draft

Write a short, direct draft reply Roby can use as-is or lightly edit. Match Roby's voice: brief, professional, plain. Sign off as "Rob" or "Roby" depending on context (external = Rob, internal = Roby). No fluff.

## Step 4 — Write data/brief.json

Write the results to `data/brief.json` in the repo using this exact schema:

```json
{
  "date": "Tuesday 2 Jun",
  "generatedAt": "<ISO timestamp>",
  "actions": [
    {
      "id": 1,
      "source": "email" | "slack",
      "sender": "Sender Name",
      "subject": "Subject line or thread summary",
      "preview": "First line of the message, verbatim",
      "summary": "1-2 sentence summary of what they need and context",
      "draft": "Full draft reply text, ready to send",
      "link": "https://... (Gmail thread link or Slack permalink)",
      "time": "9:30am",
      "urgent": true | false,
      "overduedays": 4
    }
  ],
  "fyis": [
    {
      "sender": "Sender Name",
      "summary": "One-line summary",
      "time": "9:30am",
      "source": "email" | "slack"
    }
  ]
}
```

Rules:
- `urgent: true` for merchant issues, financial ops, compliance, anything time-sensitive or overdue >2 days
- `overduedays` only if Roby hasn't replied in >3 days
- Order actions: urgent first, then by recency within each group
- Draft replies: plain text, no markdown. Sign off "Rob" (external) or "Roby" (internal Slack/email)
- Gmail link format: `https://mail.google.com/mail/u/0/#inbox/{threadId}`
- Slack link: use the permalink from the search result

## Step 5 — Commit and push (triggers Vercel redeploy)

After writing the JSON, commit and push it so the hosted Vercel app updates:

```bash
git add data/brief.json
git commit -m "Brief for {date}"
git push
```

Vercel auto-deploys on push; the live page reflects the new brief in ~30s.

## Step 6 — Print a summary

```
✓ Brief filed for {date}
  {N} urgent · {M} actions · {K} FYIs
  Pushed — live in ~30s at {your-vercel-url}
  Or locally: http://localhost:3000
```

## Notes
- If an item is ambiguous (action vs FYI), include it as an action
- For Slack threads with multiple messages, summarise the whole thread, not just the last message
- For email threads that span multiple days, note if it's been waiting >3 days with no reply from Roby
