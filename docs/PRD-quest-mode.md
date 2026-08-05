# PRD: Quest Mode — RPG-style work gamification for centcom

**Status:** Draft v1
**Owner:** Roby
**Last updated:** 2026-08-05

---

## 1. Summary

Quest Mode is a single new page in centcom (`/quests`) that turns real work into a
lightweight 2D RPG. Linear issues become **quests**, focused time becomes **XP**, and a
persistent character levels up as work gets done. There is no movement, combat, or map —
the "game" is a character HUD, a focus timer, and a quest log, rendered in a pixel-art
style.

The guiding principle is: **the game never creates work, it only decorates work that
already exists.** Tasks live in Linear; centcom reads them, tags them with one of two
difficulty tiers, and pays out XP when they're completed or when focus sessions finish.

## 2. Goals

- Make starting a focus session feel like starting a quest, not opening a timer app.
- Reward two things, and only two things:
  1. **Finishing tasks** (Linear issues moved to Done).
  2. **Focused time** (completed timer sessions).
- Keep the whole loop visible on one screen: character, timer, quest log.
- Ship something usable in days, not weeks — v1 is deliberately small.

## 3. Non-goals (v1)

- No character movement, map, combat, or NPCs. The 2D element is a stationary
  animated sprite + HUD.
- No multiplayer, leaderboards, or sharing.
- No multiplayer economies — gold and rewards are private and self-defined.
- No more than two difficulty tiers.
- No writing back to Linear beyond an optional tier label. Linear stays the source of
  truth for tasks; Quest Mode never creates or closes issues.

## 4. Core concepts

### 4.1 Quests = Linear issues

- The quest log shows issues **assigned to me** that are not Done/Canceled, pulled from
  Linear.
- Each quest has a **tier**:

  | Tier | Meaning | How it's set |
  |---|---|---|
  | **Side Quest** | Small task — under ~half a day | Default for every issue |
  | **Main Quest** | Big task — half a day or more | Linear label `quest:main` (or a one-click toggle in the quest log that applies the label) |

- Two tiers only. If a task feels bigger than a Main Quest, it should be split in
  Linear — the game deliberately doesn't accommodate epics.

### 4.2 Focus timer

- A Pomodoro-style countdown with a **user-editable duration** (free input, with
  presets: 25 / 45 / 60 / 90 min).
- A session can optionally be **linked to a quest** (pick from the quest log before
  starting). Unlinked sessions are allowed — not all focus maps to a ticket.
- A session **completes** only if the timer runs out. Abandoning a session early pays
  nothing (this is the anti-cheese rule that makes the timer mean something).
- Pausing is allowed but capped (e.g., total pause time ≤ 20% of session length);
  beyond that the session is abandoned.

### 4.3 XP economy

Deliberately simple — all values are config constants in one file so they can be tuned
without touching logic:

| Event | XP |
|---|---|
| Completed focus session | **2 XP per minute** of the configured duration (a full 25-min session = 50 XP) |
| Session linked to a quest | **+25% bonus** on that session |
| Side Quest completed in Linear | **100 XP** |
| Main Quest completed in Linear | **400 XP** |

- Quest completion XP pays out when centcom observes the issue transition to Done
  (detected on page load / periodic refresh — no webhooks in v1).
- Longer timer = more XP per session, linearly. No multiplier for marathon sessions in
  v1; if 3-hour sessions start being farmed for XP, cap session length at 120 min.

### 4.4 Levels and character

- Level curve: **cost to reach level N = 200 × (N − 1) XP**, cumulative (level 2 at
  200 XP, level 3 at 600 XP, level 4 at 1,200 XP…). Early levels come fast, later ones
  slow down naturally.
- Progress is embodied by the HUD rather than a character sprite: a level badge,
  an XP bar, a day-streak counter, and per-day session dots. The timer ring glows
  while a session runs.
- Level-ups trigger a full-screen-ish moment (flash + fanfare text). This is the
  dopamine hit the whole product exists for; it should feel disproportionate.

### 4.5 Loot & the reward shop

- **Gold** is a second currency: XP is progression (levels, ranks — never spent),
  gold is spendable loot. Every completed session or quest rolls a drop: sessions
  scale with length, Side ≈ 15, Main ≈ 60, ±20% jitter. 10% of drops are **rare
  chests** worth 3× and get a full-screen reveal.
- **The Armory turns gold into gear the hero visibly wears.** Cosmetic items render
  as pixel layers on the sprite (sword 150g, shield 250g, wizard hat 300g, cape
  400g, pet slime 600g, crown 900g, halo 1,500g). One item per slot (head / hand /
  offhand / back / pet); owning is permanent, equipping is free, and fresh loot
  auto-equips. Loot must be visible on the character — invisible loot isn't loot.
- **Themes are level milestones, never bought.** Alternate table skins (Deep Forest
  Lv 3, Dawn Lv 5, Ember Lv 8, Aurora Lv 12) unlock automatically as ranks climb,
  so levelling has a payoff beyond the badge while gold stays a pure gear economy.

## 5. UX — one screen

```
┌─────────────────────────────────────────────────────┐
│  [sprite]   Roby · Lv 7        ████████░░  1,420 XP  │  ← HUD
├───────────────────────────┬─────────────────────────┤
│                           │  QUEST LOG               │
│      FOCUS TIMER          │  ⚔ Main · Ship refund   │
│        41:23              │      flow rework         │
│   linked to: "Ship        │  ○ Side · Fix flash     │
│   refund flow rework"     │      report typo         │
│   [pause] [abandon]       │  ○ Side · Review PR #82  │
│                           │  ⚔ Main · Q3 close prep │
└───────────────────────────┴─────────────────────────┘
```

- **HUD (top):** sprite, name, level, XP progress bar to next level.
- **Timer (left):** duration input + presets, linked-quest picker, big countdown.
- **Quest log (right):** open Linear issues with tier icon; a toggle per row to
  promote/demote Side ↔ Main; completed quests briefly show with a strikethrough +
  "+400 XP" toast before leaving the log.

Visual style: ambient glass over a dark, blurred-forest backdrop — clean sans-serif
type, mono digits for the countdown, a circular progress ring around the timer, and
frosted-glass pills and cards. Quests render as rectangular glass cards in a grid.
Built on the existing centcom Tailwind base — a themed page, not a game engine; the
backdrop is painted with CSS gradients so no image assets are needed.

## 6. Technical approach

- **Where:** new route `app/quests/page.tsx` in centcom, plus components under
  `app/components/quest/`. Follows existing repo conventions (Next.js 16, React 19,
  Tailwind 4 — check `node_modules/next/dist/docs/` per AGENTS.md before building).
- **Linear integration:** `app/api/quest/linear` calls the Linear GraphQL API with a
  personal API key from `LINEAR_API_KEY`. Reads my assigned open issues plus issues
  completed in the last 30 days (for payout detection). Tier comes from the
  `quest:main` label, overridable locally. With no key set, demo quests keep the app
  fully usable. (The Linear MCP connector is great for chat-driven workflows, but the
  app needs its own key so the page works standalone in the browser.)
- **Auth:** passphrase login (`QUEST_PASSWORD` env var — never in code) with signed
  httpOnly session cookies (HMAC, 30-day expiry, constant-time comparisons). No
  password configured = open dev mode. Single user, no accounts framework.
- **State:** server-side JSON (`data/quest-store.json`, gitignored) behind
  authenticated routes; the browser keeps a localStorage cache for instant load and
  offline fallback, and pre-server state migrates up automatically. Holds XP, gold,
  gear, theme, streaks, the day log, and the set of issue IDs already paid out (so a
  Done issue can't pay twice). Single-user, no database — note: file storage assumes
  a persistent server, not serverless.
- **Completion detection:** on load and every 5 min while the page is open, diff
  Linear's recently-completed issues against the paid-out set; pay XP + loot for
  newly Done quests.
- **Timer integrity:** timestamps, not tick-counting — store session start/end so a
  backgrounded tab still resolves correctly. All XP math lives in one pure module with
  unit tests (`lib/xp.ts`).

## 7. Milestones

1. **M1 — Playable core (no Linear):** timer with configurable duration, XP payout,
   level curve, HUD with sprite states, local persistence. *This alone is usable.*
2. **M2 — Linear quests:** quest log from Linear, tier toggle via label, XP on Done,
   session↔quest linking with bonus.
3. **M3 — Juice:** level-up moment, sounds (off by default), victory animation, small
   polish pass.

## 8. Risks / open questions

- **Self-gaming:** the only real exploit is running timers without working. Accepted —
  this is a single-player motivation tool; cheating only cheats yourself.
- **XP tuning:** the 100/400 and 2 XP/min numbers are first guesses. Keep them in one
  config file and tune after a week of real use.
- **Linear label vs. estimate field:** v1 uses a label (`quest:main`) because it's
  visible and one-click. If Breeze's Linear workflow later adopts estimates
  consistently, tier could derive from estimate instead (e.g., ≥3 points = Main).
- **Sprite art:** one character, three animation states. Source from an open pixel-art
  pack (e.g., itch.io CC0 assets) rather than commissioning art for v1.

## 9. Success criteria

- Used on 4+ of 5 workdays in the second week after M2 (novelty week doesn't count).
- Median of ≥2 completed focus sessions per workday.
- Zero maintenance burden: no database, no deploy dependencies beyond one env var.
