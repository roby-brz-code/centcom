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
- **The reward shop turns gold into real-life treats.** Rewards are self-defined
  (name, emoji, gold price, minimum level) with sensible seeded defaults (fancy
  coffee 50g … gear upgrade 1,500g at Lv 10+). Buying deducts gold and logs the
  claim; rewards above your level show locked. The game never verifies the treat —
  the contract with yourself is the point.

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
- **Linear integration:** a small server-side route (`app/quests/api` or a server
  component) calling the Linear GraphQL API with a personal API key from
  `LINEAR_API_KEY` env var. Reads: my assigned open issues (id, title, state, labels,
  url). Optional write: apply/remove the `quest:main` label. (The Linear MCP connector
  is great for chat-driven workflows, but the app needs its own key so the page works
  standalone in the browser.)
- **State:** a local JSON store (`data/quest-state.json`, matching the existing
  `data/brief.json` pattern) read/written via a route handler. Holds: total XP, session
  history, and the set of issue IDs already paid out (so a Done issue can't pay twice).
  Single-user, no auth, no database.
- **Completion detection:** on load and every ~5 min while the page is open, diff
  Linear issue states against the paid-out set; pay XP for newly Done quests.
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
