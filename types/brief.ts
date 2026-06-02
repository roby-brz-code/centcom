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
}

export interface FYIItem {
  sender: string
  summary: string
  time: string
  source?: Source
}

export interface Brief {
  date: string
  generatedAt: string
  actions: ActionItem[]
  fyis: FYIItem[]
}
