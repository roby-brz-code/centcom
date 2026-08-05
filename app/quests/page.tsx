"use client"

import { useEffect, useRef, useState } from "react"
import Link from "next/link"
import demoData from "@/data/quests-demo.json"
import { Quest, Tier } from "@/types/quest"
import { levelFromXp, questXp, sessionXp } from "@/lib/xp"
import { useQuestState } from "@/app/hooks/useQuestState"
import Hud from "@/app/components/quest/Hud"
import FocusTimer from "@/app/components/quest/FocusTimer"
import QuestLog from "@/app/components/quest/QuestLog"
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
      <div className="max-w-[64rem] mx-auto px-4 sm:px-8 py-8 sm:py-12">
        <nav className="flex items-baseline justify-between mb-6">
          <Link href="/" className="font-pixel text-[0.55rem] text-qm-dim hover:text-qm-bright transition-colors">
            ← centcom
          </Link>
          <button
            onClick={reset}
            className="font-pixel text-[0.5rem] text-qm-dim hover:text-qm-danger transition-colors"
            title="Reset demo progress"
          >
            reset demo
          </button>
        </nav>

        <h1 className="font-pixel text-qm-bright text-[1.1rem] sm:text-[1.5rem] mb-6 qm-title-glow">
          QUEST MODE
        </h1>

        <Hud
          xp={store.xp}
          heroState={heroState}
          sessionsCompleted={store.sessionsCompleted}
          minutesFocused={store.minutesFocused}
        />

        <div className="mt-6 grid gap-6 lg:grid-cols-[5fr_6fr] items-start">
          <FocusTimer
            quests={openQuests}
            onRunningChange={setFocusing}
            onComplete={handleSessionComplete}
          />
          <QuestLog
            quests={quests}
            completedIds={store.completedQuestIds}
            onToggleTier={(id: string, tier: Tier) => setTier(id, tier)}
            onComplete={handleQuestComplete}
          />
        </div>

        <p className="font-pixel text-[0.5rem] text-qm-dim text-center mt-10 leading-loose">
          demo build · quests are mock data — Linear integration lands in M2 (PRD-quest-mode)
        </p>
      </div>

      {/* XP toasts */}
      <div className="fixed bottom-6 right-6 space-y-2 z-40 pointer-events-none">
        {toasts.map((t) => (
          <div key={t.id} className="qm-toast font-pixel text-[0.6rem] text-qm-gold px-4 py-3">
            {t.text}
          </div>
        ))}
      </div>

      {/* Level-up moment */}
      {levelUp !== null && (
        <div className="fixed inset-0 z-50 flex items-center justify-center qm-levelup-bg">
          <div className="qm-levelup text-center">
            <p className="font-pixel text-qm-gold text-[1.6rem] sm:text-[2.2rem]">LEVEL UP!</p>
            <p className="font-pixel text-qm-bright text-[0.9rem] mt-4">
              You reached Lv {levelUp}
            </p>
          </div>
        </div>
      )}
    </div>
  )
}
