import { Reward } from "@/types/quest"

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

// ── Default reward shop ───────────────────────────────────────────
// Real-life treats, priced in gold and gated by level. Seeded once,
// then fully editable in the shop.

export const DEFAULT_REWARDS: Reward[] = [
  { id: "r-coffee", emoji: "☕", name: "Fancy coffee", cost: 50, minLevel: 1 },
  { id: "r-dessert", emoji: "🍰", name: "Dessert night", cost: 120, minLevel: 3 },
  { id: "r-gaming", emoji: "🎮", name: "Guilt-free gaming evening", cost: 250, minLevel: 5 },
  { id: "r-book", emoji: "📚", name: "New book", cost: 300, minLevel: 5 },
  { id: "r-dinner", emoji: "🍣", name: "Nice dinner out", cost: 600, minLevel: 8 },
  { id: "r-gear", emoji: "🎧", name: "Gear upgrade", cost: 1500, minLevel: 10 },
]
