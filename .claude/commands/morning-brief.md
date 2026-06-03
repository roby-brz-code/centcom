You are running Roby's morning brief. Pull everything from the last 48 hours, triage it, and present a clean action feed with drafts ready to send.

## Step 1 — Fetch in parallel

Today's date is available as context. Calculate:
- `<yesterday>` = today minus 1 day, formatted YYYY-MM-DD
- `<2daysago>` = today minus 2 days, formatted YYYY-MM-DD

Call these **five** tools simultaneously:

**Gmail:**
- `search_threads`: query `newer_than:2d in:inbox`, pageSize 50

**Slack — broad sweeps (use `<2daysago>` for 48hr coverage):**
- `slack_search_public_and_private`: query `to:me after:<2daysago>`, sort by timestamp, limit 30, exclude bots — catches explicit @mentions and DMs directed to you
- `slack_search_public_and_private`: query `after:<2daysago>`, channel_types `im,mpim`, sort by timestamp, limit 30, exclude bots — catches all DM and group DM activity regardless of @mention

**Slack — explicit DM channel reads for known active contacts (use `slack_read_channel` with the user_id as channel_id, limit 10 each):**
- Read DMs from Roby's most active contacts. Look up user IDs for: Nic Tan, Bryan Hagen, Marty Wasserman, Dom, Meredith Grife, Steph Dang. Use `slack_search_users` first if you don't have IDs, then call `slack_read_channel` for each. This catches messages where Roby was the last sender — those won't appear in `to:me` or `im,mpim` searches because Slack doesn't surface them as "received."

Merge and deduplicate ALL Slack results by message_ts before triaging. For DM channel reads, only include messages where the last message is from someone other than Roby (i.e. waiting on a reply), OR where there's a thread Roby hasn't responded to.

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
      "overduedays": 4,
      "draftUrl": "link to the draft created in Gmail/Slack (added in Step 4b)"
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

## Step 4b — Create a draft reply for each action

For every ACTION item, create the draft directly in Gmail/Slack so Roby can
review and send it natively. Nothing is sent automatically — these are drafts only.

- Email: call `create_draft` with `to` = sender's address, `subject` = `Re: <original subject>`, `body` = the draft text, and `replyToMessageId` = the original message id (so it threads correctly).
- Slack: call `slack_send_message_draft` with `channel_id` = the channel/DM id, `message` = the draft text, and `thread_ts` = the parent ts if it's a threaded message.

Record the resulting draft link in each action's `draftUrl` field (Gmail draft URL,
or the `channel_link` Slack returns). If a draft can't be created for an item,
leave `draftUrl` unset — the page shows a graceful fallback for that card.

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
