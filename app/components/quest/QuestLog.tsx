"use client"

import { Quest, Tier } from "@/types/quest"
import { TIER_XP } from "@/lib/xp"

export default function QuestLog({
  quests,
  completedIds,
  onToggleTier,
  onComplete,
}: {
  quests: Quest[]
  completedIds: string[]
  onToggleTier: (id: string, tier: Tier) => void
  onComplete: (quest: Quest) => void
}) {
  const open = quests.filter((q) => !completedIds.includes(q.id))
  const done = quests.filter((q) => completedIds.includes(q.id))

  return (
    <section className="w-full">
      <div className="flex items-baseline justify-between mb-4 px-1">
        <h2 className="text-[0.8rem] tracking-[0.25em] uppercase text-qm-dim">Quest Log</h2>
        <span className="text-[0.72rem] text-qm-dim/70">demo · Linear soon</span>
      </div>

      <div className="grid gap-3 sm:grid-cols-2">
        {open.map((q) => (
          <div key={q.id} className="qm-glass rounded-2xl p-4 flex flex-col gap-3">
            <div className="flex items-center justify-between gap-2">
              <button
                onClick={() => onToggleTier(q.id, q.tier === "main" ? "side" : "main")}
                title="Toggle Side ↔ Main"
                className={`text-[0.66rem] font-semibold tracking-wide uppercase px-2.5 py-1 rounded-full border transition-colors cursor-pointer ${
                  q.tier === "main"
                    ? "border-qm-gold/50 text-qm-gold bg-qm-gold/10 hover:bg-qm-gold/20"
                    : "border-white/15 text-qm-dim hover:border-white/30"
                }`}
              >
                {q.tier === "main" ? "★ Main" : "Side"}
              </button>
              <span className="text-[0.72rem] text-qm-dim tabular-nums">{TIER_XP[q.tier]} XP</span>
            </div>
            <p className="text-[0.95rem] font-medium text-qm-bright leading-snug flex-1">
              {q.title}
            </p>
            <div className="flex items-center justify-between">
              <span className="text-[0.72rem] text-qm-dim">{q.identifier}</span>
              <button
                onClick={() => onComplete(q)}
                title="Mark done (demo — Linear will drive this)"
                className="qm-pill px-3.5 py-1.5 text-[0.78rem] font-medium text-qm-teal"
              >
                ✓ Done
              </button>
            </div>
          </div>
        ))}
        {open.length === 0 && (
          <div className="qm-glass rounded-2xl p-6 text-center text-[0.85rem] text-qm-dim sm:col-span-2">
            Quest log clear — go touch grass 🌿
          </div>
        )}
      </div>

      {done.length > 0 && (
        <ul className="mt-5 space-y-1.5 px-1">
          {done.map((q) => (
            <li key={q.id} className="text-[0.78rem] text-qm-dim/70 line-through">
              {q.identifier} · {q.title}
            </li>
          ))}
        </ul>
      )}
    </section>
  )
}
