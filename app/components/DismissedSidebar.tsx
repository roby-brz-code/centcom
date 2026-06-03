"use client"

import { ActionItem } from "@/types/brief"

export default function DismissedSidebar({
  items,
  onRestore,
}: {
  items: ActionItem[]
  onRestore: (id: number) => void
}) {
  if (items.length === 0) return null

  return (
    <aside className="w-56 flex-shrink-0 pt-[7.25rem]">
      <div className="sticky top-10">
        <div className="border-t-2 border-ink mb-1" />
        <div className="border-t border-ink mb-4" />
        <p className="label text-ink-faint mb-3">Dismissed</p>
        <ul className="space-y-3">
          {items.map((item) => {
            const isSlack = item.source === "slack"
            return (
              <li key={item.id} className="group">
                <p
                  className="font-display text-ink-soft text-[0.8125rem] leading-snug"
                  style={{ fontWeight: 520 }}
                >
                  {item.sender}
                </p>
                <p className="font-body italic text-ink-faint text-[0.8rem] leading-snug line-clamp-2 mb-1">
                  {item.subject}
                </p>
                <button
                  onClick={() => onRestore(item.id)}
                  className={`label text-[0.6rem] underline underline-offset-2 decoration-1 transition-colors ${
                    isSlack
                      ? "text-slack/60 decoration-slack/30 hover:text-slack hover:decoration-slack/60"
                      : "text-email/60 decoration-email/30 hover:text-email hover:decoration-email/60"
                  }`}
                >
                  Restore
                </button>
              </li>
            )
          })}
        </ul>
      </div>
    </aside>
  )
}
