"use client"

import { useEffect, useRef, useState } from "react"
import Link from "next/link"
import demoData from "@/data/quests-demo.json"
import { Quest, Tier } from "@/types/quest"
import { levelFromXp, questXp, sessionXp } from "@/lib/xp"
import { useQuestState } from "@/app/hooks/useQuestState"
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

export default function QuestsPage() {
  const { store, hydrated, addSessionXp, completeQuest, setTier, reset } = useQuestState()
  const [focusing, setFocusing] = useState(false)
  const [celebrating, setCelebrating] = useState(false)
  const [toasts, setToasts] = useState<Toast[]>([])
  const [levelUp, setLevelUp] = useState<number | null>(null)
  const toastId = useRef(0)
  const prevLevel = useRef<number | null>(null)

  const quests: Quest[] = (demoData.quests as Quest[]).map((q) => ({
    ...q,
    tier: store.tierOverrides[q.id] ?? q.tier,
  }))
  const openQuests = quests.filter((q) => !store.completedQuestIds.includes(q.id))
  const sessionsToday = store.lastSessionDate === localDate() ? store.sessionsToday : 0

  // Level-up detection — armed only after localStorage hydration so a
  // returning Lv 5 hero doesn't get a fake fanfare on page load.
  useEffect(() => {
    if (!hydrated) return
    const lvl = levelFromXp(store.xp)
    if (prevLevel.current !== null && lvl > prevLevel.current) {
      setLevelUp(lvl)
      setTimeout(() => setLevelUp(null), 3200)
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

  function handleSessionComplete(durationMin: number, linkedQuest: Quest | null) {
    const xp = sessionXp(durationMin, linkedQuest !== null)
    addSessionXp(xp, durationMin)
    pushToast(`+${xp} XP · focus session`)
    celebrate()
  }

  function handleQuestComplete(quest: Quest) {
    const xp = questXp(quest.tier)
    completeQuest(quest.id, xp)
    pushToast(`+${xp} XP · ${quest.identifier} done`)
    celebrate()
  }

  const heroState: HeroState = celebrating ? "victory" : focusing ? "focusing" : "idle"

  return (
    <div className="qm-page min-h-screen">
      <div className="max-w-[52rem] mx-auto px-4 sm:px-8 pb-16">
        <nav className="flex items-baseline justify-between pt-5 pb-1">
          <Link
            href="/"
            className="text-[0.8rem] text-qm-dim hover:text-qm-bright transition-colors"
          >
            ← centcom
          </Link>
          <button
            onClick={reset}
            className="text-[0.75rem] text-qm-dim/70 hover:text-qm-danger transition-colors cursor-pointer"
            title="Reset demo progress"
          >
            reset demo
          </button>
        </nav>

        <div className="mt-3">
          <Hud store={store} heroState={heroState} />
        </div>

        <div className="mt-10 sm:mt-14">
          <FocusTimer
            quests={openQuests}
            sessionsToday={sessionsToday}
            onRunningChange={setFocusing}
            onComplete={handleSessionComplete}
          />
        </div>

        <p className="text-[0.72rem] tracking-[0.35em] uppercase text-qm-dim/60 text-center mt-8 mb-12">
          Quest Mode
        </p>

        <QuestLog
          quests={quests}
          completedIds={store.completedQuestIds}
          onToggleTier={(id: string, tier: Tier) => setTier(id, tier)}
          onComplete={handleQuestComplete}
        />

        <div className="mt-12">
          <StatsPanel store={store} />
        </div>
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

      {/* Level-up moment */}
      {levelUp !== null && (
        <div className="fixed inset-0 z-50 flex items-center justify-center qm-levelup-bg">
          <div className="qm-levelup qm-glass rounded-3xl px-14 py-12 text-center">
            <p className="text-[2.4rem] sm:text-[3rem] font-bold text-qm-gold tracking-tight">
              Level up!
            </p>
            <p className="text-[1rem] text-qm-bright mt-2">You reached Lv {levelUp}</p>
          </div>
        </div>
      )}
    </div>
  )
}
