"use client"

import { useEffect, useState } from "react"
import { Tier, QuestStore } from "@/types/quest"
import { localDate, yesterdayDate } from "@/lib/dates"

const KEY = "quest-state-v1"

const EMPTY: QuestStore = {
  xp: 0,
  completedQuestIds: [],
  tierOverrides: {},
  sessionsCompleted: 0,
  minutesFocused: 0,
  streakDays: 0,
  sessionsToday: 0,
  lastSessionDate: null,
}

export function useQuestState() {
  const [store, setStore] = useState<QuestStore>(EMPTY)
  const [hydrated, setHydrated] = useState(false)

  useEffect(() => {
    try {
      const raw = localStorage.getItem(KEY)
      if (raw) setStore({ ...EMPTY, ...JSON.parse(raw) })
    } catch {}
    setHydrated(true)
  }, [])

  function persist(next: QuestStore) {
    try {
      localStorage.setItem(KEY, JSON.stringify(next))
    } catch {}
    setStore(next)
  }

  return {
    store,
    hydrated,
    addSessionXp: (xp: number, minutes: number) => {
      const today = localDate()
      const sameDay = store.lastSessionDate === today
      const continues = store.lastSessionDate === yesterdayDate()
      persist({
        ...store,
        xp: store.xp + xp,
        sessionsCompleted: store.sessionsCompleted + 1,
        minutesFocused: store.minutesFocused + minutes,
        sessionsToday: sameDay ? store.sessionsToday + 1 : 1,
        streakDays: sameDay ? store.streakDays : continues ? store.streakDays + 1 : 1,
        lastSessionDate: today,
      })
    },
    completeQuest: (id: string, xp: number) => {
      if (store.completedQuestIds.includes(id)) return
      persist({
        ...store,
        xp: store.xp + xp,
        completedQuestIds: [...store.completedQuestIds, id],
      })
    },
    setTier: (id: string, tier: Tier) =>
      persist({ ...store, tierOverrides: { ...store.tierOverrides, [id]: tier } }),
    reset: () => persist(EMPTY),
  }
}
