"use client"

import { useState } from "react"
import { QuestStore, Reward } from "@/types/quest"

export default function RewardShop({
  store,
  level,
  onBuy,
  onAdd,
  onRemove,
}: {
  store: QuestStore
  level: number
  onBuy: (reward: Reward) => void
  onAdd: (reward: Reward) => void
  onRemove: (id: string) => void
}) {
  const [name, setName] = useState("")
  const [emoji, setEmoji] = useState("🎁")
  const [cost, setCost] = useState(100)
  const [minLevel, setMinLevel] = useState(1)

  function submit() {
    if (!name.trim()) return
    onAdd({
      id: `r-${Date.now()}`,
      emoji: emoji.trim() || "🎁",
      name: name.trim(),
      cost: Math.max(1, cost),
      minLevel: Math.max(1, minLevel),
    })
    setName("")
    setEmoji("🎁")
    setCost(100)
    setMinLevel(1)
  }

  return (
    <section className="w-full">
      <div className="flex items-baseline justify-between mb-5 px-1">
        <h2 className="text-[0.8rem] tracking-[0.25em] uppercase text-qm-dim">Reward Shop</h2>
        <span className="text-[0.85rem] text-qm-gold font-semibold tabular-nums">
          🪙 {store.gold.toLocaleString()} gold
        </span>
      </div>

      <div className="grid gap-3 sm:grid-cols-2">
        {store.rewards.map((r) => {
          const locked = level < r.minLevel
          const broke = store.gold < r.cost
          return (
            <div key={r.id} className="qm-panel p-4 flex items-center gap-4 group">
              <span className="text-[2rem] leading-none">{r.emoji}</span>
              <div className="flex-1 min-w-0">
                <p className="text-[0.95rem] font-medium text-qm-bright leading-snug">{r.name}</p>
                <p className="text-[0.72rem] text-qm-dim mt-0.5 tabular-nums">
                  🪙 {r.cost.toLocaleString()}
                  {r.minLevel > 1 && ` · Lv ${r.minLevel}+`}
                </p>
              </div>
              {locked ? (
                <span className="text-[0.72rem] text-qm-dim border border-white/15 rounded-full px-3 py-1.5 whitespace-nowrap">
                  🔒 Lv {r.minLevel}
                </span>
              ) : (
                <button
                  onClick={() => onBuy(r)}
                  disabled={broke}
                  className="qm-btn-gold px-4 py-1.5 text-[0.82rem] disabled:opacity-40 disabled:cursor-not-allowed whitespace-nowrap"
                >
                  Buy
                </button>
              )}
              <button
                onClick={() => onRemove(r.id)}
                title="Remove reward"
                className="text-qm-dim/40 hover:text-qm-danger transition-colors cursor-pointer opacity-0 group-hover:opacity-100 text-[0.9rem]"
                aria-label={`Remove ${r.name}`}
              >
                ✕
              </button>
            </div>
          )
        })}
      </div>

      {/* Add a custom reward */}
      <div className="qm-panel p-4 mt-3">
        <p className="text-[0.7rem] tracking-[0.2em] uppercase text-qm-dim mb-3">
          Add your own treat
        </p>
        <div className="flex items-center gap-2 flex-wrap">
          <input
            value={emoji}
            onChange={(e) => setEmoji(e.target.value)}
            className="qm-chip w-14 text-center outline-none"
            aria-label="Emoji"
          />
          <input
            value={name}
            onChange={(e) => setName(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && submit()}
            placeholder="Massage, day off, new plant…"
            className="qm-chip flex-1 min-w-[10rem] outline-none placeholder:text-qm-dim/50"
            aria-label="Reward name"
          />
          <label className="flex items-center gap-1.5 text-[0.75rem] text-qm-dim">
            🪙
            <input
              type="number"
              min={1}
              value={cost}
              onChange={(e) => setCost(Number(e.target.value) || 1)}
              className="qm-chip w-20 text-center outline-none"
              aria-label="Cost in gold"
            />
          </label>
          <label className="flex items-center gap-1.5 text-[0.75rem] text-qm-dim">
            Lv
            <input
              type="number"
              min={1}
              value={minLevel}
              onChange={(e) => setMinLevel(Number(e.target.value) || 1)}
              className="qm-chip w-16 text-center outline-none"
              aria-label="Minimum level"
            />
          </label>
          <button onClick={submit} className="qm-btn-gold px-4 py-1.5 text-[0.82rem]">
            Add
          </button>
        </div>
      </div>

      {/* Claimed treats */}
      {store.purchases.length > 0 && (
        <div className="mt-6 px-1">
          <p className="text-[0.7rem] tracking-[0.2em] uppercase text-qm-dim mb-2">Claimed</p>
          <ul className="space-y-1.5">
            {store.purchases.slice(0, 8).map((p, i) => (
              <li key={i} className="text-[0.8rem] text-qm-dim flex items-baseline gap-2">
                <span>{p.emoji}</span>
                <span className="text-qm-bright/80">{p.name}</span>
                <span className="tabular-nums">🪙 {p.cost}</span>
                <span className="ml-auto tabular-nums text-qm-dim/60">{p.date}</span>
              </li>
            ))}
          </ul>
        </div>
      )}
    </section>
  )
}
