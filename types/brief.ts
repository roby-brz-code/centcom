export type Source = "email" | "slack"

export interface ActionItem {
  id: number
  source: Source
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
