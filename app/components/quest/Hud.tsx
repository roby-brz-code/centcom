"use client"

import { levelProgress, rankForLevel, nextRank } from "@/lib/xp"
import { QuestStore } from "@/types/quest"
import { localDate, yesterdayDate } from "@/lib/dates"
import PixelHero, { HeroState, PetSprite } from "./PixelHero"

export default function Hud({ store, heroState }: { store: QuestStore; heroState: HeroState }) {
  const equipment = Object.values(store.equippedGear).filter(Boolean) as string[]
  const pet = store.equippedGear["pet"]
  const { level, into, toNext } = levelProgress(store.xp)
  const pct = Math.min(100, (into / toNext) * 100)
  const rank = rankForLevel(level)
  const next = nextRank(level)

  const streakAlive =
    store.lastSessionDate === localDate() || store.lastSessionDate === yesterdayDate()
  const streak = streakAlive ? store.streakDays : 0

  return (
    <header className="qm-panel px-6 sm:px-8 py-5 flex items-center gap-6 sm:gap-8">
      <div className="flex items-end gap-1.5">
        <PixelHero state={heroState} size={72} equipment={equipment} />
        {pet && <PetSprite itemId={pet} size={28} />}
      </div>
      <div className="flex-1 min-w-0">
        <div className="flex items-baseline justify-between gap-3 flex-wrap">
          <span className="font-display text-[1.15rem] font-semibold text-qm-bright">
            Roby
            <span className="ml-2.5 text-[0.72rem] font-semibold tracking-wide uppercase text-qm-gold bg-qm-gold/10 border border-qm-gold/30 rounded-full px-2.5 py-0.5 align-middle">
              {rank} · Lv {level}
            </span>
          </span>
          <span className="flex items-center gap-4">
            <span className="text-[0.85rem] text-qm-gold font-semibold tabular-nums">
              🪙 {store.gold.toLocaleString()}
            </span>
            <span className="flex items-center gap-1.5 text-[0.85rem] text-orange-400 font-medium">
              <svg width="15" height="15" viewBox="0 0 24 24" fill="currentColor">
                <path d="M12 23c-4.4 0-8-3.4-8-7.7 0-2.6 1.3-4.8 2.7-6.6C8.1 6.9 9.8 5.4 10.5 3c.2-.7 1-1 1.6-.5 1.7 1.3 5.9 5.2 5.9 9.5 0 .6-.1 1.2-.2 1.8.7-.4 1.3-1 1.7-1.7.3-.6 1.2-.7 1.6-.1.6 1 .9 2.2.9 3.3 0 4.3-3.6 7.7-8 7.7z" />
              </svg>
              {streak} day streak
            </span>
          </span>
        </div>
        <div className="mt-3 h-2 rounded-full bg-white/[0.08] overflow-hidden">
          <div
            className="h-full rounded-full bg-gradient-to-r from-qm-teal to-qm-gold transition-all duration-700"
            style={{ width: `${pct}%` }}
          />
        </div>
        <div className="mt-1.5 flex justify-between text-[0.72rem] text-qm-dim tabular-nums">
          <span>
            {into.toLocaleString()} / {toNext.toLocaleString()} XP to Lv {level + 1}
          </span>
          {next && (
            <span className="hidden sm:inline">
              {next.name} at Lv {next.level}
            </span>
          )}
        </div>
      </div>
    </header>
  )
}
