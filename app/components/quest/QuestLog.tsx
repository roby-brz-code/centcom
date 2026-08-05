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
    <section className="qm-card p-5 sm:p-7">
      <div className="flex items-baseline justify-between">
        <h2 className="font-pixel text-[0.65rem] text-qm-gold tracking-wider">⚔ QUEST LOG</h2>
        <span className="font-pixel text-[0.5rem] text-qm-dim">demo · linear soon</span>
      </div>

      <ul className="mt-4 space-y-2.5">
        {open.map((q) => (
          <li key={q.id} className="border-2 border-qm-line bg-qm-well px-3 py-2.5">
            <div className="flex items-center gap-2.5">
              <button
                onClick={() => onToggleTier(q.id, q.tier === "main" ? "side" : "main")}
                title="Toggle Side ↔ Main"
                className={`font-pixel text-[0.45rem] px-1.5 py-1 border-2 shrink-0 cursor-pointer transition-colors ${
                  q.tier === "main"
                    ? "border-qm-gold text-qm-gold hover:bg-qm-gold/10"
                    : "border-qm-line text-qm-dim hover:border-qm-dim"
                }`}
              >
                {q.tier === "main" ? "★ MAIN" : "· SIDE"}
              </button>
              <div className="flex-1 min-w-0">
                <p className="font-pixel text-[0.55rem] text-qm-bright leading-relaxed truncate">
                  {q.title}
                </p>
                <p className="font-pixel text-[0.45rem] text-qm-dim mt-0.5">
                  {q.identifier} · {TIER_XP[q.tier]} XP
                </p>
              </div>
              <button
                onClick={() => onComplete(q)}
                title="Mark done (demo — Linear will drive this)"
                className="qm-btn font-pixel text-[0.5rem] px-2 py-1.5 shrink-0"
              >
                ✓
              </button>
            </div>
          </li>
        ))}
        {open.length === 0 && (
          <li className="font-pixel text-[0.55rem] text-qm-dim text-center py-6">
            quest log clear — go touch grass
          </li>
        )}
      </ul>

      {done.length > 0 && (
        <ul className="mt-4 pt-3 border-t-2 border-qm-line space-y-1.5">
          {done.map((q) => (
            <li key={q.id} className="font-pixel text-[0.5rem] text-qm-dim line-through px-1">
              {q.identifier} · {q.title}
            </li>
          ))}
        </ul>
      )}
    </section>
  )
}
