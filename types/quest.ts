export type Tier = "side" | "main"

export interface Quest {
  id: string
  /** Linear-style identifier, e.g. "CC-42" */
  identifier: string
  title: string
  tier: Tier
  url?: string
}

export interface DayEntry {
  sessions: number
  minutes: number
  xp: number
  quests: number
}

export interface QuestStore {
  xp: number
  /** Quest ids already paid out — a Done quest can never pay twice */
  completedQuestIds: string[]
  /** Side ↔ Main promotions made from the quest log */
  tierOverrides: Record<string, Tier>
  sessionsCompleted: number
  minutesFocused: number
  /** Consecutive days with at least one completed session */
  streakDays: number
  bestStreak: number
  sessionsToday: number
  /** Local date (YYYY-MM-DD) of the last completed session */
  lastSessionDate: string | null
  /** Per-day activity, keyed by local date (YYYY-MM-DD) — feeds statistics */
  dayLog: Record<string, DayEntry>
  /** Spendable loot currency (XP is progression and is never spent) */
  gold: number
  goldEarned: number
  /** Gear item ids owned (permanent) */
  ownedGear: string[]
  /** Equipped item id per gear slot */
  equippedGear: Record<string, string | null>
  /** Active theme id — themes unlock by level */
  theme: string
}
