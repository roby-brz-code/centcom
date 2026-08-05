"use client"

import { Quest, Tier } from "@/types/quest"
import { TIER_XP } from "@/lib/xp"

export default function QuestLog({
  quests,
  completedIds,
  source,
  onToggleTier,
  onComplete,
}: {
  quests: Quest[]
  completedIds: string[]
  source: "linear" | "demo" | "error"
  onToggleTier: (id: string, tier: Tier) => void
  onComplete: (quest: Quest) => void
}) {
  const open = quests.filter((q) => !completedIds.includes(q.id))
  const done = quests.filter((q) => completedIds.includes(q.id))

  return (
    <section className="w-full">
      <div className="flex items-baseline justify-between mb-5 px-1">
        <h2 className="text-[0.8rem] tracking-[0.25em] uppercase text-qm-dim">Quest Log</h2>
        <span className="text-[0.72rem] text-qm-dim/70">
          {source === "linear" ? "⚡ synced from Linear" : "demo quests"}
        </span>
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        {open.map((q) => (
          <div
            key={q.id}
            className={`qm-qcard p-5 flex flex-col gap-3 ${q.tier === "main" ? "qm-qcard-main" : ""}`}
          >
            <div className="flex items-start justify-between gap-2">
              <span className="font-display font-bold text-[1.7rem] leading-none text-qm-ink/90 tabular-nums">
                {TIER_XP[q.tier]}
                <span className="text-[0.65rem] font-semibold tracking-wider align-super ml-1 text-qm-ink/60">
                  XP
                </span>
              </span>
              <button
                onClick={() => onToggleTier(q.id, q.tier === "main" ? "side" : "main")}
                title="Toggle Side ↔ Main"
                className={`text-[0.62rem] font-bold tracking-widest uppercase px-2.5 py-1 rounded-full border cursor-pointer transition-colors ${
                  q.tier === "main"
                    ? "border-[#b98a1e] bg-[#b98a1e] text-[#fdf6e0] hover:bg-[#a67a15]"
                    : "border-[#a58f57] text-[#6f5d31] hover:bg-[#e7dab5]"
                }`}
              >
                {q.tier === "main" ? "★ Main" : "Side"}
              </button>
            </div>

            {q.url ? (
              <a
                href={q.url}
                target="_blank"
                rel="noopener noreferrer"
                className="font-display font-semibold text-[1.1rem] leading-snug text-qm-ink flex-1 hover:underline decoration-qm-ink/40 underline-offset-2"
              >
                {q.title}
              </a>
            ) : (
              <p className="font-display font-semibold text-[1.1rem] leading-snug text-qm-ink flex-1">
                {q.title}
              </p>
            )}

            <div className="flex items-center justify-between">
              <span className="text-[0.7rem] font-semibold tracking-wider uppercase text-qm-ink/50">
                {q.identifier}
              </span>
              {source === "linear" ? (
                <span className="text-[0.66rem] font-semibold tracking-wider uppercase text-qm-ink/40">
                  done in Linear pays out
                </span>
              ) : (
                <button
                  onClick={() => onComplete(q)}
                  title="Mark done (demo — Linear drives this when connected)"
                  className="text-[0.78rem] font-semibold px-3.5 py-1.5 rounded-full bg-[#2b2c4e] text-[#f3ecd8] hover:bg-[#3a3b63] transition-colors cursor-pointer"
                >
                  ✓ Done
                </button>
              )}
            </div>
          </div>
        ))}
        {open.length === 0 && (
          <div className="qm-panel p-6 text-center text-[0.85rem] text-qm-dim sm:col-span-2">
            Quest log clear — go touch grass 🌿
          </div>
        )}
      </div>

      {done.length > 0 && (
        <ul className="mt-6 space-y-1.5 px-1">
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
