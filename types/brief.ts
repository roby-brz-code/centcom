export type Source = "email" | "slack"

// Everything the server needs to route a reply back to the original message.
// Captured by the morning-brief skill; never trusted from the client.
export interface ReplyTarget {
  // Email (Gmail)
  to?: string // recipient address
  emailSubject?: string // original subject, so we can prefix "Re:"
  threadId?: string // Gmail thread id, keeps the reply in-thread
  messageId?: string // RFC822 Message-ID of the original, for In-Reply-To/References
  // Slack
  channel?: string // channel or DM id
  threadTs?: string // parent ts, so the reply lands in the right thread
}

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
  reply?: ReplyTarget
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
