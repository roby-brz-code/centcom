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

## Step 4 — Output the feed

Format output exactly like this:

---

# Morning Brief — {today's date, e.g. Monday 2 Jun}
{N} actions · {M} FYIs

---

## Actions

### 1. {Source icon: 📧 or 💬} {Sender name} — {Subject or thread summary}
**{Channel/thread context}** · {time, e.g. 9:30am}
{1-2 sentence summary of what they need}
[→ Open]({link to Gmail thread or Slack permalink})

> **Draft reply:**
> {draft}

---

### 2. ...

(repeat for all action items, ordered by urgency — financial ops and merchant issues first, then team requests, then compliance/admin)

---

## FYIs
- **{Sender}** — {one-line summary} [{time}]
- ...

---

## Notes
- If an item is ambiguous (action vs FYI), include it as an action
- For Slack threads with multiple messages, summarise the whole thread, not just the last message
- For email threads that span multiple days, note if it's been waiting >3 days with no reply from Roby
- Flag any items that are overdue or time-sensitive with ⚠️
