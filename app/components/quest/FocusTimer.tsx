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
const RING_R = 110
const RING_C = 2 * Math.PI * RING_R

type Phase = "idle" | "running" | "paused"

export default function FocusTimer({
  quests,
  sessionsToday,
  onRunningChange,
  onComplete,
  onTick,
}: {
  quests: Quest[]
  sessionsToday: number
  onRunningChange: (running: boolean) => void
  onComplete: (durationMin: number, linkedQuest: Quest | null) => void
  onTick?: (remainingMs: number) => void
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
          onTick?.(left)
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
  const frac = phase === "idle" ? 1 : remainingMs / (durationMin * 60_000)
  const reward = sessionXp(durationMin, linkedId !== "")

  return (
    <section className="flex flex-col items-center gap-5">
      {/* Linked quest pill */}
      <div className="qm-pill px-1 py-1">
        <select
          value={linkedId}
          onChange={(e) => setLinkedId(e.target.value)}
          disabled={phase !== "idle"}
          className="bg-transparent text-qm-gold text-[0.88rem] font-medium px-3 py-1 outline-none cursor-pointer max-w-[70vw] disabled:cursor-default"
          aria-label="Link session to a quest"
        >
          <option value="">No quest linked</option>
          {quests.map((q) => (
            <option key={q.id} value={q.id}>
              {q.identifier} · {q.title}
            </option>
          ))}
        </select>
      </div>

      {/* Session dots — today's completed sessions */}
      <div className="flex items-center gap-2.5" aria-label={`${sessionsToday} sessions today`}>
        {Array.from({ length: 8 }, (_, i) => (
          <span
            key={i}
            className={`w-2 h-2 rounded-full transition-colors ${
              i < sessionsToday ? "bg-qm-gold" : "bg-white/15"
            }`}
          />
        ))}
      </div>

      {/* Ring */}
      <div className="relative w-[240px] h-[240px]">
        <div className="absolute inset-2 rounded-full bg-[rgba(22,28,62,0.6)] border border-white/10" />
        <svg viewBox="0 0 240 240" className="absolute inset-0 w-full h-full -rotate-90">
          <circle cx="120" cy="120" r={RING_R} fill="none" stroke="rgba(255,255,255,0.1)" strokeWidth="2.5" />
          <circle
            cx="120"
            cy="120"
            r={RING_R}
            fill="none"
            stroke={phase === "paused" ? "rgba(240,194,94,0.75)" : "rgba(61,220,151,0.8)"}
            strokeWidth="3"
            strokeLinecap="round"
            strokeDasharray={RING_C}
            strokeDashoffset={RING_C * (1 - frac)}
            className="transition-[stroke-dashoffset] duration-300 ease-linear"
            style={phase === "running" ? { filter: "drop-shadow(0 0 6px rgba(61,220,151,0.6))" } : undefined}
          />
        </svg>
        <div className="absolute inset-0 flex flex-col items-center justify-center gap-2">
          <span className="font-mono text-[2.6rem] leading-none font-semibold text-qm-bright tabular-nums">
            {mm}:{ss}
          </span>
          <span className="text-[0.62rem] tracking-[0.28em] text-qm-dim uppercase">
            {phase === "paused" ? "Paused" : "Focus Session"}
          </span>
        </div>
      </div>

      {/* Controls */}
      <div className="flex items-center gap-4">
        {phase === "idle" && (
          <button onClick={start} className="qm-btn-gold px-9 py-3 text-[1rem]">
            ▶&nbsp; Start quest timer
          </button>
        )}
        {phase === "running" && (
          <button onClick={pause} className="qm-pill px-8 py-3 text-[0.95rem] font-medium">
            ❚❚ Pause
          </button>
        )}
        {phase === "paused" && (
          <button onClick={resume} className="qm-btn-gold px-8 py-3 text-[0.95rem]">
            ▶&nbsp; Resume
          </button>
        )}
        {phase !== "idle" && (
          <button
            onClick={abandon}
            title="Abandon session (pays nothing)"
            className="qm-round-btn"
            aria-label="Abandon session"
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
              <path d="M3 12a9 9 0 1 0 3-6.7" />
              <path d="M3 4v5h5" />
            </svg>
          </button>
        )}
      </div>

      {/* Duration presets */}
      {phase === "idle" ? (
        <div className="flex items-center gap-2 flex-wrap justify-center">
          {PRESETS.map((p) => (
            <button
              key={p}
              onClick={() => setDurationMin(p)}
              className={`qm-chip ${durationMin === p ? "qm-chip-active" : ""}`}
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
            className="qm-chip w-16 text-center outline-none"
            aria-label="Custom minutes"
          />
        </div>
      ) : (
        <p className="text-[0.78rem] text-qm-dim">
          {phase === "paused"
            ? `Pause budget: ${Math.round(pauseBudgetMs / 60_000)} min, then the run is lost`
            : "Abandoning pays nothing"}
        </p>
      )}

      {phase === "idle" && (
        <p className="text-[0.78rem] text-qm-dim">
          Reward: {reward} XP
          {linkedId !== "" && ` · includes +${Math.round(LINKED_SESSION_BONUS * 100)}% quest bonus`}
        </p>
      )}
    </section>
  )
}
