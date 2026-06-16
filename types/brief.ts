export type Source = "email" | "slack"

// Which desk in The Office owns this item. Set by the morning-brief skill;
// falls back to keyword routing in app/lib/office.ts when absent.
export type AgentId = "fpa" | "treasury" | "accounting" | "settlement" | "chief"

export interface ActionItem {
  id: number
  source: Source
  owner?: AgentId
  sender: string
  subject: string
  preview: string
  summary: string
  draft: string
  link: string
  time: string
  urgent: boolean
  overduedays?: number
  // Link to the ready-made draft the morning-brief skill created in
  // Gmail / Slack. Present once a draft exists; the card links straight to it.
  draftUrl?: string
}

export interface FYIItem {
  sender: string
  owner?: AgentId
  summary: string
  time: string
  source?: Source
  link?: string
}

export interface Brief {
  date: string
  generatedAt: string
  actions: ActionItem[]
  fyis: FYIItem[]
}
