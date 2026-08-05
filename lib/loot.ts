// ── Loot economy ──────────────────────────────────────────────────
// Gold is the spendable currency; XP is progression and is never spent.

export interface LootDrop {
  gold: number
  rare: boolean
}

export const RARE_CHANCE = 0.1
export const RARE_MULTIPLIER = 3

/** Roll a loot drop. Sessions scale with length; quests by tier. */
export function rollLoot(kind: "session" | "side" | "main", minutes = 0): LootDrop {
  const base = kind === "session" ? 8 + Math.round(minutes / 5) : kind === "side" ? 15 : 60
  const jitter = Math.round(base * (Math.random() * 0.4 - 0.2))
  let gold = Math.max(1, base + jitter)
  const rare = Math.random() < RARE_CHANCE
  if (rare) gold *= RARE_MULTIPLIER
  return { gold, rare }
}
