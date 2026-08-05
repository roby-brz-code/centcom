"use client"

import { useEffect, useRef, useState } from "react"
import Link from "next/link"
import { Quest, Tier } from "@/types/quest"
import { levelFromXp, questXp, sessionXp } from "@/lib/xp"
import { rollLoot } from "@/lib/loot"
import { GearItem, THEMES, themeById } from "@/lib/gear"
import Armory from "@/app/components/quest/Armory"
import { useQuestState } from "@/app/hooks/useQuestState"
import { useLinearQuests } from "@/app/hooks/useLinearQuests"
import { localDate } from "@/lib/dates"
import Hud from "@/app/components/quest/Hud"
import FocusTimer from "@/app/components/quest/FocusTimer"
import QuestLog from "@/app/components/quest/QuestLog"
import StatsPanel from "@/app/components/quest/StatsPanel"
import { HeroState } from "@/app/components/quest/PixelHero"

interface Toast {
  id: number
  text: string
}

type Tab = "quests" | "focus" | "shop" | "stats"

const TABS: { id: Tab; label: string }[] = [
  { id: "quests", label: "⚔️ Quests" },
  { id: "focus", label: "⏳ Focus" },
  { id: "shop", label: "🛡️ Armory" },
  { id: "stats", label: "📊 Stats" },
]

export default function QuestsPage() {
  const {
    store,
    hydrated,
    authEnabled,
    addSessionXp,
    completeQuests,
    buyGear,
    toggleEquip,
    setTheme,
    setTier,
    reset,
  } = useQuestState()
  const board = useLinearQuests()
  const [tab, setTab] = useState<Tab>("quests")
  const [focusing, setFocusing] = useState(false)
  const [celebrating, setCelebrating] = useState(false)
  const [clock, setClock] = useState("")
  const [toasts, setToasts] = useState<Toast[]>([])
  const [levelUp, setLevelUp] = useState<number | null>(null)
  const [rareLoot, setRareLoot] = useState<number | null>(null)
  const toastId = useRef(0)
  const prevLevel = useRef<number | null>(null)

  const withOverrides = (q: Quest): Quest => ({
    ...q,
    tier: store.tierOverrides[q.id] ?? q.tier,
  })
  const quests: Quest[] = [
    ...board.open.map(withOverrides),
    ...board.completed.filter((c) => !board.open.some((o) => o.id === c.id)).map(withOverrides),
  ]
  const openQuests = quests.filter((q) => !store.completedQuestIds.includes(q.id))
  const sessionsToday = store.lastSessionDate === localDate() ? store.sessionsToday : 0
  const heroEquipment = Object.values(store.equippedGear).filter(Boolean) as string[]

  // Level-up detection — armed only after localStorage hydration so a
  // returning Lv 5 hero doesn't get a fake fanfare on page load.
  useEffect(() => {
    if (!hydrated) return
    const lvl = levelFromXp(store.xp)
    if (prevLevel.current !== null && lvl > prevLevel.current) {
      setLevelUp(lvl)
      setTimeout(() => setLevelUp(null), 3200)
      THEMES.filter((t) => t.minLevel > (prevLevel.current ?? 1) && t.minLevel <= lvl).forEach(
        (t) => pushToast(`🎨 Theme unlocked: ${t.name}`)
      )
    }
    prevLevel.current = lvl
  }, [store.xp, hydrated])

  function pushToast(text: string) {
    const id = ++toastId.current
    setToasts((t) => [...t, { id, text }])
    setTimeout(() => setToasts((t) => t.filter((x) => x.id !== id)), 2600)
  }

  function celebrate() {
    setCelebrating(true)
    setTimeout(() => setCelebrating(false), 2200)
  }

  function dropLoot(kind: "session" | "side" | "main", minutes = 0): number {
    const loot = rollLoot(kind, minutes)
    if (loot.rare) {
      setRareLoot(loot.gold)
      setTimeout(() => setRareLoot(null), 3000)
    } else {
      pushToast(`🪙 +${loot.gold} gold`)
    }
    return loot.gold
  }

  function handleSessionComplete(durationMin: number, linkedQuest: Quest | null) {
    const xp = sessionXp(durationMin, linkedQuest !== null)
    const gold = dropLoot("session", durationMin)
    addSessionXp(xp, durationMin, gold)
    pushToast(`+${xp} XP · focus session`)
    celebrate()
  }

  // Demo mode only — with Linear connected, moving the issue to Done pays out
  function handleQuestComplete(quest: Quest) {
    const xp = questXp(quest.tier)
    const gold = dropLoot(quest.tier)
    completeQuests([{ id: quest.id, xp, gold }])
    pushToast(`+${xp} XP · ${quest.identifier} done`)
    celebrate()
  }

  // Pay out issues Linear reports as Done that haven't been paid yet
  useEffect(() => {
    if (!hydrated || !board.loaded) return
    const fresh = board.completed
      .map(withOverrides)
      .filter((q) => !store.completedQuestIds.includes(q.id))
    if (fresh.length === 0) return
    const payouts = fresh.map((q) => {
      const xp = questXp(q.tier)
      const gold = dropLoot(q.tier)
      pushToast(`+${xp} XP · ${q.identifier} done`)
      return { id: q.id, xp, gold }
    })
    completeQuests(payouts)
    celebrate()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [hydrated, board.loaded, board.completed, store.completedQuestIds])

  async function logout() {
    await fetch("/api/quest/login", { method: "DELETE" }).catch(() => {})
    window.location.href = "/quests/login"
  }

  function handleBuyGear(item: GearItem) {
    if (buyGear(item)) {
      pushToast(`${item.emoji} ${item.name} acquired!`)
      celebrate()
    }
  }

  function handleTick(remainingMs: number) {
    const mm = String(Math.floor(remainingMs / 60_000)).padStart(2, "0")
    const ss = String(Math.floor((remainingMs % 60_000) / 1000)).padStart(2, "0")
    setClock(`${mm}:${ss}`)
  }

  const heroState: HeroState = celebrating ? "victory" : focusing ? "focusing" : "idle"

  return (
    <div className={`qm-page min-h-screen ${themeById(store.theme).className}`}>
      <div className="max-w-[52rem] mx-auto px-4 sm:px-8 pb-16">
        <nav className="flex items-baseline justify-between pt-5 pb-1">
          <Link
            href="/"
            className="text-[0.8rem] text-qm-dim hover:text-qm-bright transition-colors"
          >
            ← centcom
          </Link>
          <span className="flex items-center gap-4">
            <button
              onClick={reset}
              className="text-[0.75rem] text-qm-dim/70 hover:text-qm-danger transition-colors cursor-pointer"
              title="Reset progress"
            >
              reset
            </button>
            {authEnabled && (
              <button
                onClick={logout}
                className="text-[0.75rem] text-qm-dim/70 hover:text-qm-bright transition-colors cursor-pointer"
              >
                log out
              </button>
            )}
          </span>
        </nav>

        <div className="mt-3">
          <Hud store={store} heroState={heroState} />
        </div>

        {/* Tabs */}
        <div className="flex items-center justify-center gap-2.5 mt-7 flex-wrap">
          {TABS.map((t) => (
            <button
              key={t.id}
              onClick={() => setTab(t.id)}
              className={`qm-tab ${tab === t.id ? "qm-tab-active" : ""}`}
            >
              {t.label}
              {t.id === "focus" && focusing && (
                <span className="ml-2 text-qm-teal tabular-nums font-semibold">{clock}</span>
              )}
            </button>
          ))}
        </div>

        {/* Panels — all stay mounted so a running timer survives tab switches */}
        <div className={`mt-9 ${tab === "quests" ? "" : "hidden"}`}>
          {board.loaded ? (
            <QuestLog
              quests={quests}
              completedIds={store.completedQuestIds}
              source={board.source}
              onToggleTier={(id: string, tier: Tier) => setTier(id, tier)}
              onComplete={handleQuestComplete}
            />
          ) : (
            <div className="qm-panel p-8 text-center text-[0.85rem] text-qm-dim">
              Summoning quests…
            </div>
          )}
        </div>

        <div className={`mt-9 ${tab === "focus" ? "" : "hidden"}`}>
          <FocusTimer
            quests={openQuests}
            sessionsToday={sessionsToday}
            onRunningChange={setFocusing}
            onComplete={handleSessionComplete}
            onTick={handleTick}
          />
        </div>

        <div className={`mt-9 ${tab === "shop" ? "" : "hidden"}`}>
          <Armory
            store={store}
            level={levelFromXp(store.xp)}
            heroEquipment={heroEquipment}
            onBuy={handleBuyGear}
            onToggleEquip={toggleEquip}
            onSetTheme={setTheme}
          />
        </div>

        <div className={`mt-9 ${tab === "stats" ? "" : "hidden"}`}>
          <StatsPanel store={store} />
        </div>

        <p className="text-[0.7rem] tracking-[0.35em] uppercase text-qm-dim/50 text-center mt-14">
          {board.source === "linear"
            ? "Quest Mode · synced with Linear"
            : board.source === "error"
              ? "Quest Mode · Linear unreachable — retrying"
              : "Quest Mode · demo quests — set LINEAR_API_KEY to go live"}
        </p>
      </div>

      {/* XP toasts */}
      <div className="fixed bottom-6 right-6 space-y-2 z-40 pointer-events-none">
        {toasts.map((t) => (
          <div
            key={t.id}
            className="qm-toast rounded-full px-5 py-2.5 text-[0.85rem] font-medium text-qm-gold"
          >
            {t.text}
          </div>
        ))}
      </div>

      {/* Rare loot moment */}
      {rareLoot !== null && (
        <div className="fixed inset-0 z-50 flex items-center justify-center qm-levelup-bg">
          <div className="qm-levelup qm-panel px-14 py-12 text-center">
            <p className="text-[3.4rem] leading-none">🎁</p>
            <p className="font-display text-[1.9rem] font-bold text-qm-gold mt-3">Rare loot!</p>
            <p className="text-[1rem] text-qm-bright mt-1.5 tabular-nums">
              🪙 +{rareLoot} gold
            </p>
          </div>
        </div>
      )}

      {/* Level-up moment */}
      {levelUp !== null && (
        <div className="fixed inset-0 z-50 flex items-center justify-center qm-levelup-bg">
          <div className="qm-levelup qm-panel px-14 py-12 text-center">
            <p className="font-display text-[2.6rem] sm:text-[3.2rem] font-bold text-qm-gold tracking-tight">
              ✨ Level up!
            </p>
            <p className="text-[1rem] text-qm-bright mt-2">You reached Lv {levelUp}</p>
          </div>
        </div>
      )}
    </div>
  )
}
