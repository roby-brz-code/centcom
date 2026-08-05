"use client"

import { useEffect, useRef, useState } from "react"
import { Tier, QuestStore, DayEntry } from "@/types/quest"
import { localDate, yesterdayDate } from "@/lib/dates"
import { GearItem } from "@/lib/gear"

// Server-persisted quest state: the API (data/quest-store.json behind
// passphrase auth) is the source of truth; localStorage is kept as a
// cache and offline fallback, and pre-server state migrates up once.

const KEY = "quest-state-v1"
const SAVE_DEBOUNCE_MS = 600

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

export interface QuestPayout {
  id: string
  xp: number
  gold: number
}

function readLocal(): QuestStore | null {
  try {
    const raw = localStorage.getItem(KEY)
    return raw ? { ...EMPTY, ...JSON.parse(raw) } : null
  } catch {
    return null
  }
}

export function useQuestState() {
  const [store, setStore] = useState<QuestStore>(EMPTY)
  const [hydrated, setHydrated] = useState(false)
  const [authEnabled, setAuthEnabled] = useState(false)
  const saveTimer = useRef<ReturnType<typeof setTimeout> | null>(null)

  useEffect(() => {
    let cancelled = false
    ;(async () => {
      try {
        const res = await fetch("/api/quest/state")
        if (res.status === 401) {
          window.location.href = "/quests/login"
          return
        }
        const data = await res.json()
        if (cancelled) return
        setAuthEnabled(Boolean(data.auth))
        if (data.store) {
          setStore({ ...EMPTY, ...data.store })
        } else {
          // First run against the server — adopt any pre-server local state
          const local = readLocal()
          if (local) {
            setStore(local)
            void fetch("/api/quest/state", {
              method: "PUT",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify(local),
            }).catch(() => {})
          }
        }
      } catch {
        // Server unreachable — run on the local cache
        const local = readLocal()
        if (local && !cancelled) setStore(local)
      }
      if (!cancelled) setHydrated(true)
    })()
    return () => {
      cancelled = true
    }
  }, [])

  function persist(next: QuestStore) {
    setStore(next)
    try {
      localStorage.setItem(KEY, JSON.stringify(next))
    } catch {}
    if (saveTimer.current) clearTimeout(saveTimer.current)
    saveTimer.current = setTimeout(() => {
      fetch("/api/quest/state", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(next),
      }).catch(() => {})
    }, SAVE_DEBOUNCE_MS)
  }

  return {
    store,
    hydrated,
    authEnabled,
    addSessionXp: (xp: number, minutes: number, gold: number) => {
      const today = localDate()
      const sameDay = store.lastSessionDate === today
      const continues = store.lastSessionDate === yesterdayDate()
      const streakDays = sameDay ? store.streakDays : continues ? store.streakDays + 1 : 1
      const day = store.dayLog[today] ?? { sessions: 0, minutes: 0, xp: 0, quests: 0 }
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
    /** Pay out one or more completed quests in a single store update */
    completeQuests: (payouts: QuestPayout[]) => {
      const fresh = payouts.filter((p) => !store.completedQuestIds.includes(p.id))
      if (fresh.length === 0) return
      const today = localDate()
      const day: DayEntry = store.dayLog[today] ?? { sessions: 0, minutes: 0, xp: 0, quests: 0 }
      const xp = fresh.reduce((s, p) => s + p.xp, 0)
      const gold = fresh.reduce((s, p) => s + p.gold, 0)
      persist({
        ...store,
        xp: store.xp + xp,
        gold: store.gold + gold,
        goldEarned: store.goldEarned + gold,
        completedQuestIds: [...store.completedQuestIds, ...fresh.map((p) => p.id)],
        dayLog: {
          ...store.dayLog,
          [today]: { ...day, xp: day.xp + xp, quests: day.quests + fresh.length },
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
