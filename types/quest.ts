export type Tier = "side" | "main"

export interface Quest {
  id: string
  /** Linear-style identifier, e.g. "CC-42" */
  identifier: string
  title: string
  tier: Tier
  url?: string
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
  sessionsToday: number
  /** Local date (YYYY-MM-DD) of the last completed session */
  lastSessionDate: string | null
}
