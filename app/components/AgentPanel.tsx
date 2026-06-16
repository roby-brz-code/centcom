"use client"

import { useState } from "react"
import type { ActionItem, FYIItem } from "@/types/brief"
import type { Agent } from "@/app/lib/office"
import ActionCard from "./ActionCard"
import Portrait from "./Portrait"

function SectionHead({ title, count }: { title: string; count: number }) {
  return (
    <div className="flex items-baseline gap-3 mb-1 mt-7">
      <h3 className="label text-ink">{title}</h3>
      <span className="label text-ink-faint tabular-nums">{count}</span>
      <span className="flex-1 border-t border-rule" />
    </div>
  )
}

// A desk's working surface: who they are, what's in their tray, and the
// processes they can run. Actions are the real brief items, so opening a draft
// or dismissing here is the same action as on the Morning Brief.
export default function AgentPanel({
  agent,
  actions,
  fyis,
  onDismiss,
  onClose,
  onRunStandup,
}: {
  agent: Agent
  actions: ActionItem[]
  fyis: FYIItem[]
  onDismiss: (id: number) => void
  onClose: () => void
  onRunStandup: () => void
}) {
  const [previewLine, setPreviewLine] = useState<string | null>(null)

  const urgent = actions.filter((a) => a.urgent)
  const normal = actions.filter((a) => !a.urgent)
  const greeting = actions.length
    ? `${urgent.length ? `${urgent.length} urgent · ` : ""}${actions.length} in your tray.`
    : fyis.length
      ? `Quiet desk — ${fyis.length} noted.`
      : "All clear — nothing in the tray."

  return (
    <>
      <div className="fixed inset-0 z-30 bg-ink/40" onClick={onClose} aria-hidden />
      <aside
        className="fixed inset-y-0 right-0 z-40 w-full sm:max-w-[460px] bg-paper border-l-2 border-ink flex flex-col"
        role="dialog"
        aria-label={`${agent.name}, ${agent.role}`}
      >
        {/* Header */}
        <header className="flex items-start gap-4 p-5 border-b border-ink bg-paper-raised">
          <Portrait shirt={agent.shirt} scale={4} />
          <div className="min-w-0 flex-1">
            <div className="flex items-baseline gap-2.5">
              <span className="font-display text-ink text-2xl" style={{ fontWeight: 600 }}>
                {agent.name}
              </span>
              <span className="label text-ink-faint">{agent.role}</span>
            </div>
            <p className="font-body italic text-ink-soft text-[0.95rem] leading-snug mt-0.5">
              {agent.blurb}
            </p>
            <p className="label text-ink mt-2">{greeting}</p>
          </div>
          <button
            onClick={onClose}
            aria-label="Close"
            className="label text-ink-faint hover:text-ink transition-colors"
          >
            Esc ✕
          </button>
        </header>

        {/* Tray */}
        <div className="flex-1 overflow-y-auto px-5 pb-8">
          {urgent.length > 0 && (
            <section>
              <SectionHead title="Needs you first" count={urgent.length} />
              {urgent.map((item, i) => (
                <ActionCard key={item.id} item={item} index={i} onDismiss={() => onDismiss(item.id)} />
              ))}
            </section>
          )}

          {normal.length > 0 && (
            <section>
              <SectionHead title="To action" count={normal.length} />
              {normal.map((item, i) => (
                <ActionCard key={item.id} item={item} index={i} onDismiss={() => onDismiss(item.id)} />
              ))}
            </section>
          )}

          {fyis.length > 0 && (
            <section>
              <SectionHead title="Noted" count={fyis.length} />
              <ul>
                {fyis.map((fyi, i) => (
                  <li key={i} className="flex items-baseline gap-3 py-2.5 border-b border-rule-soft">
                    <span className="font-display text-ink text-[0.9rem] flex-shrink-0" style={{ fontWeight: 540 }}>
                      {fyi.sender}
                    </span>
                    {fyi.link ? (
                      <a
                        href={fyi.link}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="font-body italic text-ink-soft text-[0.92rem] leading-snug flex-1 hover:text-ink transition-colors underline decoration-rule decoration-1 underline-offset-2"
                      >
                        {fyi.summary}
                      </a>
                    ) : (
                      <span className="font-body italic text-ink-soft text-[0.92rem] leading-snug flex-1">
                        {fyi.summary}
                      </span>
                    )}
                    <span className="label text-ink-faint flex-shrink-0 tabular-nums">{fyi.time}</span>
                  </li>
                ))}
              </ul>
            </section>
          )}

          {actions.length === 0 && fyis.length === 0 && (
            <p className="font-body italic text-ink-soft mt-10 text-center">
              {agent.idle}
            </p>
          )}

          {/* Processes — placeholders for now, wired up next */}
          <SectionHead title="Run a process" count={agent.processes.length} />
          <div className="flex flex-wrap gap-2 mt-2">
            {agent.processes.map((proc) =>
              proc.action === "brief" ? (
                <a
                  key={proc.label}
                  href="/"
                  className="label border border-rule hover:border-ink hover:bg-paper-raised px-2 py-1 rounded-sm text-ink transition-colors"
                >
                  {proc.label} →
                </a>
              ) : (
                <button
                  key={proc.label}
                  onClick={() =>
                    proc.action === "standup"
                      ? onRunStandup()
                      : setPreviewLine(`▶ ${agent.name} would run “${proc.label}” — wiring up next.`)
                  }
                  className="label border border-rule hover:border-ink hover:bg-paper-raised px-2 py-1 rounded-sm text-ink transition-colors"
                >
                  {proc.label}
                </button>
              ),
            )}
          </div>
          {previewLine && <p className="label text-accent mt-3">{previewLine}</p>}
        </div>
      </aside>
    </>
  )
}
