"use client"

import { levelProgress } from "@/lib/xp"
import PixelHero, { HeroState } from "./PixelHero"

export default function Hud({
  xp,
  heroState,
  sessionsCompleted,
  minutesFocused,
}: {
  xp: number
  heroState: HeroState
  sessionsCompleted: number
  minutesFocused: number
}) {
  const { level, into, toNext } = levelProgress(xp)
  const pct = Math.min(100, (into / toNext) * 100)

  return (
    <header className="qm-card flex items-center gap-5 sm:gap-7 px-5 sm:px-7 py-4">
      <PixelHero state={heroState} size={64} />
      <div className="flex-1 min-w-0">
        <div className="flex items-baseline justify-between gap-3 flex-wrap">
          <span className="font-pixel text-[0.8rem] text-qm-bright">
            Roby <span className="text-qm-gold">· Lv {level}</span>
          </span>
          <span className="font-pixel text-[0.55rem] text-qm-dim tabular-nums">
            {xp.toLocaleString()} XP
          </span>
        </div>
        {/* XP bar */}
        <div className="mt-3 h-4 border-2 border-qm-line bg-qm-well relative">
          <div
            className="h-full bg-gradient-to-r from-qm-teal to-qm-gold transition-all duration-700"
            style={{ width: `${pct}%` }}
          />
        </div>
        <div className="mt-1.5 flex justify-between font-pixel text-[0.5rem] text-qm-dim tabular-nums">
          <span>
            {into.toLocaleString()} / {toNext.toLocaleString()} to Lv {level + 1}
          </span>
          <span className="hidden sm:inline">
            {sessionsCompleted} sessions · {minutesFocused} min focused
          </span>
        </div>
      </div>
    </header>
  )
}
