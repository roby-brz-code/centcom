import { Tier } from "@/types/quest"

// ── XP economy config ─────────────────────────────────────────────
// All tuning values live here (PRD §4.3). Change numbers, not logic.

export const XP_PER_MINUTE = 2
export const LINKED_SESSION_BONUS = 0.25
export const TIER_XP: Record<Tier, number> = { side: 100, main: 400 }
export const MAX_SESSION_MIN = 120
export const MIN_SESSION_MIN = 5
export const PAUSE_BUDGET_FRACTION = 0.2

// ── Level curve ───────────────────────────────────────────────────
// Cost to reach level N is 200 × (N − 1) XP, so cumulative XP to be
// level N = 100 × N × (N − 1). Level 2 at 200, 3 at 600, 4 at 1,200…

export function totalXpForLevel(level: number): number {
  return 100 * level * (level - 1)
}

export function levelFromXp(xp: number): number {
  let level = 1
  while (totalXpForLevel(level + 1) <= xp) level++
  return level
}

export function levelProgress(xp: number): {
  level: number
  into: number
  toNext: number
} {
  const level = levelFromXp(xp)
  const floor = totalXpForLevel(level)
  return { level, into: xp - floor, toNext: totalXpForLevel(level + 1) - floor }
}

// ── Ranks ─────────────────────────────────────────────────────────
// Named tiers over the level curve — the "class" shown next to the hero.

const RANKS: [number, string][] = [
  [16, "Legend"],
  [12, "Champion"],
  [8, "Knight"],
  [5, "Adventurer"],
  [3, "Apprentice"],
  [1, "Novice"],
]

export function rankForLevel(level: number): string {
  return RANKS.find(([min]) => level >= min)![1]
}

/** Next rank and the level it unlocks at, or null at the top */
export function nextRank(level: number): { name: string; level: number } | null {
  const above = RANKS.filter(([min]) => min > level).pop()
  return above ? { name: above[1], level: above[0] } : null
}

// ── Payouts ───────────────────────────────────────────────────────

export function sessionXp(durationMin: number, linkedToQuest: boolean): number {
  const base = durationMin * XP_PER_MINUTE
  return Math.round(linkedToQuest ? base * (1 + LINKED_SESSION_BONUS) : base)
}

export function questXp(tier: Tier): number {
  return TIER_XP[tier]
}
