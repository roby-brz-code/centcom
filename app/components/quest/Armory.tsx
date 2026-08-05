"use client"

import { QuestStore } from "@/types/quest"
import { GEAR, GearItem, THEMES } from "@/lib/gear"
import PixelHero from "./PixelHero"

export default function Armory({
  store,
  level,
  heroEquipment,
  onBuy,
  onToggleEquip,
  onSetTheme,
}: {
  store: QuestStore
  level: number
  heroEquipment: string[]
  onBuy: (item: GearItem) => void
  onToggleEquip: (item: GearItem) => void
  onSetTheme: (id: string) => void
}) {
  return (
    <section className="w-full">
      <div className="flex items-baseline justify-between mb-5 px-1">
        <h2 className="text-[0.8rem] tracking-[0.25em] uppercase text-qm-dim">Armory</h2>
        <span className="text-[0.85rem] text-qm-gold font-semibold tabular-nums">
          🪙 {store.gold.toLocaleString()} gold
        </span>
      </div>

      {/* Fitting room — live preview of the equipped hero */}
      <div className="qm-panel p-5 mb-3 flex items-center justify-center">
        <PixelHero state="idle" size={88} equipment={heroEquipment} />
      </div>

      <div className="grid gap-3 sm:grid-cols-2">
        {GEAR.map((item) => {
          const owned = store.ownedGear.includes(item.id)
          const equipped = store.equippedGear[item.slot] === item.id
          const broke = store.gold < item.price
          return (
            <div key={item.id} className="qm-panel p-4 flex items-center gap-4">
              <span className="text-[1.9rem] leading-none">{item.emoji}</span>
              <div className="flex-1 min-w-0">
                <p className="text-[0.95rem] font-medium text-qm-bright leading-snug">
                  {item.name}
                </p>
                <p className="text-[0.72rem] text-qm-dim mt-0.5 tabular-nums capitalize">
                  {item.slot}
                  {!owned && ` · 🪙 ${item.price.toLocaleString()}`}
                </p>
              </div>
              {!owned ? (
                <button
                  onClick={() => onBuy(item)}
                  disabled={broke}
                  className="qm-btn-gold px-4 py-1.5 text-[0.82rem] disabled:opacity-40 disabled:cursor-not-allowed whitespace-nowrap"
                >
                  Buy
                </button>
              ) : (
                <button
                  onClick={() => onToggleEquip(item)}
                  className={`px-4 py-1.5 text-[0.82rem] rounded-full border transition-colors cursor-pointer whitespace-nowrap ${
                    equipped
                      ? "border-qm-teal/60 text-qm-teal bg-qm-teal/10"
                      : "border-white/20 text-qm-bright hover:border-white/40"
                  }`}
                >
                  {equipped ? "✓ Equipped" : "Equip"}
                </button>
              )}
            </div>
          )
        })}
      </div>

      {/* Themes — level milestones, never bought */}
      <div className="flex items-baseline justify-between mt-10 mb-4 px-1">
        <h2 className="text-[0.8rem] tracking-[0.25em] uppercase text-qm-dim">Themes</h2>
        <span className="text-[0.72rem] text-qm-dim/70">unlocked by levelling up</span>
      </div>

      <div className="grid gap-3 sm:grid-cols-2">
        {THEMES.map((t) => {
          const locked = level < t.minLevel
          const active = store.theme === t.id
          return (
            <div key={t.id} className="qm-panel p-4 flex items-center gap-4">
              <span
                className="w-10 h-10 rounded-lg border border-white/15 shrink-0"
                style={{ background: t.preview }}
              />
              <div className="flex-1 min-w-0">
                <p className="text-[0.95rem] font-medium text-qm-bright leading-snug">
                  {t.emoji} {t.name}
                </p>
                <p className="text-[0.72rem] text-qm-dim mt-0.5">
                  {t.minLevel > 1 ? `Unlocks at Lv ${t.minLevel}` : "Default"}
                </p>
              </div>
              {locked ? (
                <span className="text-[0.72rem] text-qm-dim border border-white/15 rounded-full px-3 py-1.5 whitespace-nowrap">
                  🔒 Lv {t.minLevel}
                </span>
              ) : (
                <button
                  onClick={() => onSetTheme(t.id)}
                  disabled={active}
                  className={`px-4 py-1.5 text-[0.82rem] rounded-full border transition-colors whitespace-nowrap ${
                    active
                      ? "border-qm-teal/60 text-qm-teal bg-qm-teal/10 cursor-default"
                      : "border-white/20 text-qm-bright hover:border-white/40 cursor-pointer"
                  }`}
                >
                  {active ? "✓ Active" : "Apply"}
                </button>
              )}
            </div>
          )
        })}
      </div>
    </section>
  )
}
