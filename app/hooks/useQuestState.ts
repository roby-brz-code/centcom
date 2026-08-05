"use client"

import { useEffect, useState } from "react"
import { Tier, QuestStore, DayEntry } from "@/types/quest"
import { localDate, yesterdayDate } from "@/lib/dates"
import { GearItem } from "@/lib/gear"

const KEY = "quest-state-v1"

const EMPTY: QuestStore = {
  xp: 0,
  completedQuestIds: [],
  tierOverrides: {},
  sessionsCompleted: 0,
  minutesFocused: 0,
  streakDays: 0,
  bestStreak: 0,
  sessionsToday: 0,
  lastSessionDate: null,
  dayLog: {},
  gold: 0,
  goldEarned: 0,
  ownedGear: [],
  equippedGear: {},
  theme: "midnight",
}

const EMPTY_DAY: DayEntry = { sessions: 0, minutes: 0, xp: 0, quests: 0 }

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
    addSessionXp: (xp: number, minutes: number, gold: number) => {
      const today = localDate()
      const sameDay = store.lastSessionDate === today
      const continues = store.lastSessionDate === yesterdayDate()
      const streakDays = sameDay ? store.streakDays : continues ? store.streakDays + 1 : 1
      const day = store.dayLog[today] ?? EMPTY_DAY
      persist({
        ...store,
        xp: store.xp + xp,
        gold: store.gold + gold,
        goldEarned: store.goldEarned + gold,
        sessionsCompleted: store.sessionsCompleted + 1,
        minutesFocused: store.minutesFocused + minutes,
        sessionsToday: sameDay ? store.sessionsToday + 1 : 1,
        streakDays,
        bestStreak: Math.max(store.bestStreak, streakDays),
        lastSessionDate: today,
        dayLog: {
          ...store.dayLog,
          [today]: {
            ...day,
            sessions: day.sessions + 1,
            minutes: day.minutes + minutes,
            xp: day.xp + xp,
          },
        },
      })
    },
    completeQuest: (id: string, xp: number, gold: number) => {
      if (store.completedQuestIds.includes(id)) return
      const today = localDate()
      const day = store.dayLog[today] ?? EMPTY_DAY
      persist({
        ...store,
        xp: store.xp + xp,
        gold: store.gold + gold,
        goldEarned: store.goldEarned + gold,
        completedQuestIds: [...store.completedQuestIds, id],
        dayLog: {
          ...store.dayLog,
          [today]: { ...day, xp: day.xp + xp, quests: day.quests + 1 },
        },
      })
    },
    buyGear: (item: GearItem): boolean => {
      if (store.gold < item.price || store.ownedGear.includes(item.id)) return false
      persist({
        ...store,
        gold: store.gold - item.price,
        ownedGear: [...store.ownedGear, item.id],
        // Fresh loot goes straight on
        equippedGear: { ...store.equippedGear, [item.slot]: item.id },
      })
      return true
    },
    toggleEquip: (item: GearItem) =>
      persist({
        ...store,
        equippedGear: {
          ...store.equippedGear,
          [item.slot]: store.equippedGear[item.slot] === item.id ? null : item.id,
        },
      }),
    setTheme: (theme: string) => persist({ ...store, theme }),
    setTier: (id: string, tier: Tier) =>
      persist({ ...store, tierOverrides: { ...store.tierOverrides, [id]: tier } }),
    reset: () => persist(EMPTY),
  }
}
