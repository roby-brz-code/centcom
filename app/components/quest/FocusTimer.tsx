"use client"

import { useEffect, useRef, useState } from "react"
import { Quest } from "@/types/quest"
import {
  sessionXp,
  LINKED_SESSION_BONUS,
  MAX_SESSION_MIN,
  MIN_SESSION_MIN,
  PAUSE_BUDGET_FRACTION,
} from "@/lib/xp"

const PRESETS = [25, 45, 60, 90]

type Phase = "idle" | "running" | "paused"

export default function FocusTimer({
  quests,
  onRunningChange,
  onComplete,
}: {
  quests: Quest[]
  onRunningChange: (running: boolean) => void
  onComplete: (durationMin: number, linkedQuest: Quest | null) => void
}) {
  const [durationMin, setDurationMin] = useState(25)
  const [phase, setPhase] = useState<Phase>("idle")
  const [linkedId, setLinkedId] = useState<string>("")
  const [remainingMs, setRemainingMs] = useState(25 * 60_000)

  // Timestamps, not tick-counting (PRD §6) — a throttled background tab
  // still resolves correctly against the wall clock.
  const endsAt = useRef(0)
  const pausedMs = useRef(0)
  const pauseStartedAt = useRef(0)

  const linkedQuest = quests.find((q) => q.id === linkedId) ?? null
  const pauseBudgetMs = durationMin * 60_000 * PAUSE_BUDGET_FRACTION

  useEffect(() => {
    if (phase === "idle") setRemainingMs(durationMin * 60_000)
  }, [durationMin, phase])

  useEffect(() => {
    if (phase === "idle") return
    const tick = setInterval(() => {
      const now = Date.now()
      if (phase === "running") {
        const left = endsAt.current - now
        if (left <= 0) {
          setPhase("idle")
          onRunningChange(false)
          onComplete(durationMin, linkedQuest)
        } else {
          setRemainingMs(left)
        }
      } else if (phase === "paused") {
        // Abandon when the pause budget runs out — sessions can't idle forever.
        if (pausedMs.current + (now - pauseStartedAt.current) > pauseBudgetMs) abandon()
      }
    }, 250)
    return () => clearInterval(tick)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [phase, durationMin, linkedId])

  function start() {
    pausedMs.current = 0
    endsAt.current = Date.now() + durationMin * 60_000
    setRemainingMs(durationMin * 60_000)
    setPhase("running")
    onRunningChange(true)
  }

  function pause() {
    pauseStartedAt.current = Date.now()
    setPhase("paused")
    onRunningChange(false)
  }

  function resume() {
    pausedMs.current += Date.now() - pauseStartedAt.current
    endsAt.current = Date.now() + remainingMs
    setPhase("running")
    onRunningChange(true)
  }

  function abandon() {
    setPhase("idle")
    setRemainingMs(durationMin * 60_000)
    onRunningChange(false)
  }

  const mm = String(Math.floor(remainingMs / 60_000)).padStart(2, "0")
  const ss = String(Math.floor((remainingMs % 60_000) / 1000)).padStart(2, "0")
  const reward = sessionXp(durationMin, linkedId !== "")

  return (
    <section className="qm-card p-5 sm:p-7 flex flex-col items-center gap-5">
      <h2 className="font-pixel text-[0.65rem] text-qm-gold tracking-wider self-start">
        ◆ FOCUS TIMER
      </h2>

      <div
        className={`font-pixel tabular-nums text-[3rem] sm:text-[3.75rem] leading-none ${
          phase === "running" ? "text-qm-bright qm-pulse" : "text-qm-dim"
        }`}
      >
        {mm}:{ss}
      </div>

      {phase === "idle" ? (
        <>
          <div className="flex items-center gap-2 flex-wrap justify-center">
            {PRESETS.map((p) => (
              <button
                key={p}
                onClick={() => setDurationMin(p)}
                className={`qm-btn font-pixel text-[0.55rem] px-2.5 py-1.5 ${
                  durationMin === p ? "qm-btn-active" : ""
                }`}
              >
                {p}m
              </button>
            ))}
            <input
              type="number"
              min={MIN_SESSION_MIN}
              max={MAX_SESSION_MIN}
              value={durationMin}
              onChange={(e) =>
                setDurationMin(
                  Math.max(MIN_SESSION_MIN, Math.min(MAX_SESSION_MIN, Number(e.target.value) || MIN_SESSION_MIN))
                )
              }
              className="qm-btn font-pixel text-[0.55rem] w-16 px-2 py-1.5 text-center bg-transparent"
              aria-label="Custom minutes"
            />
          </div>

          <select
            value={linkedId}
            onChange={(e) => setLinkedId(e.target.value)}
            className="qm-btn font-pixel text-[0.55rem] px-2 py-2 max-w-full bg-qm-well"
            aria-label="Link session to a quest"
          >
            <option value="">— no linked quest —</option>
            {quests.map((q) => (
              <option key={q.id} value={q.id}>
                {q.identifier} · {q.title}
              </option>
            ))}
          </select>

          <button onClick={start} className="qm-btn qm-btn-primary font-pixel text-[0.7rem] px-6 py-3">
            ▶ START
          </button>
          <p className="font-pixel text-[0.5rem] text-qm-dim text-center leading-relaxed">
            reward: {reward} XP
            {linkedId !== "" && ` (incl. +${Math.round(LINKED_SESSION_BONUS * 100)}% link bonus)`}
          </p>
        </>
      ) : (
        <>
          {linkedQuest && (
            <p className="font-pixel text-[0.55rem] text-qm-teal text-center leading-relaxed">
              on quest: {linkedQuest.title}
            </p>
          )}
          <div className="flex gap-3">
            {phase === "running" ? (
              <button onClick={pause} className="qm-btn font-pixel text-[0.6rem] px-4 py-2.5">
                ❚❚ PAUSE
              </button>
            ) : (
              <button onClick={resume} className="qm-btn qm-btn-primary font-pixel text-[0.6rem] px-4 py-2.5">
                ▶ RESUME
              </button>
            )}
            <button
              onClick={abandon}
              className="qm-btn qm-btn-danger font-pixel text-[0.6rem] px-4 py-2.5"
            >
              ✕ ABANDON
            </button>
          </div>
          <p className="font-pixel text-[0.5rem] text-qm-dim text-center leading-relaxed">
            {phase === "paused"
              ? `paused — budget ${Math.round(pauseBudgetMs / 60_000)} min, then the run is lost`
              : "abandoning pays nothing"}
          </p>
        </>
      )}
    </section>
  )
}
