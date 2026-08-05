"use client"

import { QuestStore } from "@/types/quest"
import { localDate } from "@/lib/dates"
import { dayEntry, fmtMinutes, sumLastNDays, yearGrid } from "@/lib/stats"

function StatCard({
  title,
  children,
}: {
  title: string
  children: React.ReactNode
}) {
  return (
    <div className="qm-panel p-5">
      <h3 className="text-[0.7rem] tracking-[0.2em] uppercase text-qm-dim mb-4">{title}</h3>
      {children}
    </div>
  )
}

function BigStat({ label, value, tint }: { label: string; value: string; tint: string }) {
  return (
    <div>
      <p className={`text-[1.6rem] font-semibold leading-none tabular-nums ${tint}`}>{value}</p>
      <p className="text-[0.7rem] text-qm-dim mt-1.5 uppercase tracking-wider">{label}</p>
    </div>
  )
}

function heatColor(minutes: number): string {
  if (minutes === 0) return "rgba(255,255,255,0.06)"
  if (minutes < 30) return "rgba(61,220,151,0.25)"
  if (minutes < 60) return "rgba(61,220,151,0.45)"
  if (minutes < 120) return "rgba(61,220,151,0.7)"
  return "rgba(61,220,151,1)"
}

export default function StatsPanel({ store }: { store: QuestStore }) {
  const today = dayEntry(store.dayLog, localDate())
  const week = sumLastNDays(store.dayLog, 7)
  const month = sumLastNDays(store.dayLog, 30)
  const year = new Date().getFullYear()
  const weeks = yearGrid(year)

  return (
    <section className="w-full">
      <div className="flex items-baseline justify-between mb-4 px-1">
        <h2 className="text-[0.8rem] tracking-[0.25em] uppercase text-qm-dim">Statistics</h2>
      </div>

      <div className="grid gap-3 sm:grid-cols-3">
        <StatCard title="Today's Focus">
          <div className="grid grid-cols-2 gap-4">
            <BigStat label="Sessions" value={String(today.sessions)} tint="text-qm-teal" />
            <BigStat label="Duration" value={fmtMinutes(today.minutes)} tint="text-sky-400" />
          </div>
        </StatCard>

        <StatCard title="Total Progress">
          <div className="grid grid-cols-2 gap-4">
            <BigStat
              label="Sessions"
              value={String(store.sessionsCompleted)}
              tint="text-qm-bright"
            />
            <BigStat label="Focused" value={fmtMinutes(store.minutesFocused)} tint="text-fuchsia-400" />
            <BigStat label="Total XP" value={store.xp.toLocaleString()} tint="text-qm-gold" />
            <BigStat
              label="Quests done"
              value={String(store.completedQuestIds.length)}
              tint="text-qm-teal"
            />
          </div>
        </StatCard>

        <StatCard title="Streaks & Insights">
          <div className="grid grid-cols-2 gap-4">
            <BigStat label="Day streak" value={String(store.streakDays)} tint="text-orange-400" />
            <BigStat label="Best streak" value={String(store.bestStreak)} tint="text-qm-gold" />
            <BigStat label="Last 7 days" value={fmtMinutes(week.minutes)} tint="text-qm-teal" />
            <BigStat label="Last 30 days" value={fmtMinutes(month.minutes)} tint="text-rose-400" />
          </div>
        </StatCard>
      </div>

      {/* Activity history heatmap */}
      <div className="qm-panel p-5 mt-3">
        <div className="flex items-baseline justify-between mb-4">
          <h3 className="text-[0.7rem] tracking-[0.2em] uppercase text-qm-dim">
            Activity History
          </h3>
          <span className="text-[0.72rem] text-qm-dim tabular-nums">{year}</span>
        </div>
        <div className="overflow-x-auto pb-1">
          <div className="flex gap-[3px] w-max">
            {weeks.map((wk, i) => (
              <div key={i} className="flex flex-col gap-[3px]">
                {wk.map((date, j) =>
                  date === null ? (
                    <span key={j} className="w-2.5 h-2.5" />
                  ) : (
                    <span
                      key={j}
                      title={`${date} · ${fmtMinutes(dayEntry(store.dayLog, date).minutes)} focused`}
                      className="w-2.5 h-2.5 rounded-[3px]"
                      style={{ backgroundColor: heatColor(dayEntry(store.dayLog, date).minutes) }}
                    />
                  )
                )}
              </div>
            ))}
          </div>
        </div>
        <div className="flex items-center justify-end gap-1.5 mt-3 text-[0.68rem] text-qm-dim">
          Less
          {[0, 20, 45, 90, 150].map((m) => (
            <span key={m} className="w-2.5 h-2.5 rounded-[3px]" style={{ backgroundColor: heatColor(m) }} />
          ))}
          More
        </div>
      </div>
    </section>
  )
}
