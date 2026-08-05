"use client"

import { useEffect, useState } from "react"
import { Quest } from "@/types/quest"

// Quest board data: real Linear issues when the server has a key,
// demo quests otherwise. Refreshes on load and every 5 minutes
// (PRD §6 — completion detection is poll-based, no webhooks).

const POLL_MS = 5 * 60_000

export type QuestSource = "linear" | "demo" | "error"

export interface QuestBoard {
  source: QuestSource
  open: Quest[]
  completed: Quest[]
  loaded: boolean
}

export function useLinearQuests(): QuestBoard {
  const [board, setBoard] = useState<QuestBoard>({
    source: "demo",
    open: [],
    completed: [],
    loaded: false,
  })

  useEffect(() => {
    let cancelled = false
    async function load() {
      try {
        const res = await fetch("/api/quest/linear")
        if (res.status === 401) {
          window.location.href = "/quests/login"
          return
        }
        const data = await res.json()
        if (!cancelled) {
          setBoard({
            source: data.source ?? "error",
            open: data.open ?? [],
            completed: data.completed ?? [],
            loaded: true,
          })
        }
      } catch {
        if (!cancelled) setBoard((b) => ({ ...b, source: b.loaded ? b.source : "error", loaded: true }))
      }
    }
    load()
    const poll = setInterval(load, POLL_MS)
    return () => {
      cancelled = true
      clearInterval(poll)
    }
  }, [])

  return board
}
