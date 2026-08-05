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
}
