"use client"

import { levelProgress } from "@/lib/xp"
import { QuestStore } from "@/types/quest"
import { localDate, yesterdayDate } from "@/lib/dates"

function Stat({ icon, label, tint }: { icon: React.ReactNode; label: string; tint: string }) {
  return (
    <span className="flex items-center gap-2 text-[0.95rem] text-qm-bright/90">
      <span className={tint}>{icon}</span>
      {label}
    </span>
  )
}

export default function Hud({ store }: { store: QuestStore }) {
  const { level, into, toNext } = levelProgress(store.xp)
  const pct = Math.min(100, (into / toNext) * 100)

  const streakAlive =
    store.lastSessionDate === localDate() || store.lastSessionDate === yesterdayDate()
  const streak = streakAlive ? store.streakDays : 0

  return (
    <div className="flex flex-col items-center gap-5">
      {/* Stats strip */}
      <div className="flex items-center justify-center gap-8 sm:gap-10 flex-wrap py-4 w-full border-b border-white/[0.06]">
        <Stat
          tint="text-orange-400"
          label={`${streak} day streak`}
          icon={
            <svg width="17" height="17" viewBox="0 0 24 24" fill="currentColor">
              <path d="M12 23c-4.4 0-8-3.4-8-7.7 0-2.6 1.3-4.8 2.7-6.6C8.1 6.9 9.8 5.4 10.5 3c.2-.7 1-1 1.6-.5 1.7 1.3 5.9 5.2 5.9 9.5 0 .6-.1 1.2-.2 1.8.7-.4 1.3-1 1.7-1.7.3-.6 1.2-.7 1.6-.1.6 1 .9 2.2.9 3.3 0 4.3-3.6 7.7-8 7.7z" />
            </svg>
          }
        />
        <Stat
          tint="text-qm-teal"
          label={`${store.sessionsCompleted} sessions`}
          icon={
            <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <circle cx="12" cy="12" r="9" />
              <circle cx="12" cy="12" r="4" />
            </svg>
          }
        />
        <Stat
          tint="text-sky-400"
          label={`${store.minutesFocused}m focused`}
          icon={
            <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <circle cx="12" cy="12" r="9" />
              <path d="M12 7v5l3 2" strokeLinecap="round" />
            </svg>
          }
        />
      </div>

      {/* Level / XP strip */}
      <div className="w-full max-w-sm flex items-center gap-3 px-2">
        <span className="text-[0.8rem] font-semibold text-qm-gold whitespace-nowrap">
          Lv {level}
        </span>
        <div className="flex-1 h-1.5 rounded-full bg-white/[0.08] overflow-hidden">
          <div
            className="h-full rounded-full bg-gradient-to-r from-qm-teal to-qm-gold transition-all duration-700"
            style={{ width: `${pct}%` }}
          />
        </div>
        <span className="text-[0.72rem] text-qm-dim tabular-nums whitespace-nowrap">
          {into.toLocaleString()} / {toNext.toLocaleString()} XP
        </span>
      </div>
    </div>
  )
}
