"use client"

import { useState } from "react"
import type { ActionItem, AgentId } from "@/types/brief"
import { AGENTS, AGENT_BY_ID, isLinearOverdue, isLinearUrgent, type LinearIssue } from "@/app/lib/office"

function priorityColor(priority: number): string {
  if (priority === 1) return "var(--danger)"
  if (priority === 2) return "#d97706" // high — amber
  if (priority === 3) return "var(--accent)" // medium — blue
  return "var(--ink-faint)"
}

// A single Linear issue row — shared by the rail and the desk panels.
export function LinearRow({ issue }: { issue: LinearIssue }) {
  const overdue = isLinearOverdue(issue)
  return (
    <a
      href={issue.url}
      target="_blank"
      rel="noopener noreferrer"
      className="block py-2 border-b border-rule-soft hover:bg-paper transition-colors"
    >
      <span className="flex items-baseline gap-2 flex-wrap">
        <span className="label text-ink-faint">{issue.id}</span>
        {issue.priority > 0 && (
          <span className="label" style={{ color: priorityColor(issue.priority) }}>
            {issue.priorityLabel}
          </span>
        )}
        {issue.statusType === "started" && <span className="label text-email">In progress</span>}
        {overdue && <span className="label text-danger">overdue</span>}
      </span>
      <span className="block font-body text-ink text-[0.9rem] leading-snug mt-0.5">{issue.title}</span>
      <span className="label text-ink-faint">{issue.team}</span>
    </a>
  )
}

function Chip({
  active,
  dot,
  danger,
  onClick,
  children,
}: {
  active: boolean
  dot?: string
  danger?: boolean
  onClick: () => void
  children: React.ReactNode
}) {
  return (
    <button
      onClick={onClick}
      className={`label inline-flex items-center gap-1.5 px-2 py-1 rounded-sm border transition-colors ${
        active
          ? danger
            ? "bg-danger text-paper border-danger"
            : "bg-ink text-paper border-ink"
          : "border-rule text-ink-soft hover:border-ink"
      }`}
    >
      {dot && <span className="h-2 w-2 rounded-full shrink-0" style={{ background: dot }} />}
      {children}
    </button>
  )
}

// A persistent worklist beside the office: active brief tasks (routed to a
// desk) plus open Linear issues. Brief rows open the owning desk; Linear rows
// open the issue in Linear. Filterable by desk and urgency.
export default function OpenItems({
  briefItems,
  linearIssues,
  pulledAt,
  onSelect,
}: {
  briefItems: { item: ActionItem; owner: AgentId }[]
  linearIssues: LinearIssue[]
  pulledAt: string
  onSelect: (agentId: AgentId) => void
}) {
  const [desk, setDesk] = useState<AgentId | null>(null)
  const [urgentOnly, setUrgentOnly] = useState(false)

  const fb = briefItems.filter(
    ({ item, owner }) => (!desk || owner === desk) && (!urgentOnly || item.urgent),
  )
  const fl = linearIssues.filter(
    (i) => (!desk || (i.owner ?? "chief") === desk) && (!urgentOnly || isLinearUrgent(i)),
  )

  return (
    <aside className="w-full xl:w-[340px] xl:flex-shrink-0 xl:sticky xl:top-6 xl:max-h-[calc(100vh-3rem)] overflow-y-auto bg-paper-raised border border-rule rounded-sm">
      <div className="flex items-baseline justify-between px-4 pt-4 pb-2">
        <h2 className="font-display text-ink text-lg" style={{ fontWeight: 600 }}>
          Open items
        </h2>
        <span className="label text-ink-faint tabular-nums">{fb.length + fl.length}</span>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap gap-1.5 px-4 pb-3">
        <Chip active={desk === null && !urgentOnly} onClick={() => { setDesk(null); setUrgentOnly(false) }}>
          All
        </Chip>
        {AGENTS.map((a) => (
          <Chip key={a.id} active={desk === a.id} dot={a.shirt} onClick={() => setDesk(desk === a.id ? null : a.id)}>
            {a.name}
          </Chip>
        ))}
        <Chip active={urgentOnly} danger onClick={() => setUrgentOnly((v) => !v)}>
          Urgent
        </Chip>
      </div>

      {/* Brief tasks */}
      <div className="px-4">
        <div className="flex items-baseline gap-2 mt-1 mb-1">
          <span className="label text-ink">Needs action</span>
          <span className="label text-ink-faint tabular-nums">{fb.length}</span>
          <span className="flex-1 border-t border-rule" />
        </div>
        {fb.length === 0 && <p className="label text-ink-faint py-2">Nothing here</p>}
        {fb.map(({ item, owner }) => (
          <button
            key={item.id}
            onClick={() => onSelect(owner)}
            aria-label={`${item.sender} — open ${AGENT_BY_ID[owner].role}`}
            className="w-full text-left flex gap-2.5 py-2 border-b border-rule-soft hover:bg-paper transition-colors"
          >
            <span
              className="mt-1.5 h-2.5 w-2.5 rounded-full shrink-0"
              style={{ background: AGENT_BY_ID[owner].shirt }}
              title={AGENT_BY_ID[owner].role}
            />
            <span className="min-w-0 flex-1">
              <span className="flex items-baseline gap-2">
                {item.urgent && <span className="h-1.5 w-1.5 rounded-full bg-danger shrink-0" />}
                <span className="font-display text-ink text-[0.92rem] truncate" style={{ fontWeight: 540 }}>
                  {item.sender}
                </span>
                <span className="label text-ink-faint ml-auto shrink-0 tabular-nums">
                  {item.overduedays ? `${item.overduedays}d` : item.time}
                </span>
              </span>
              <span className="block font-body text-ink-soft text-[0.85rem] leading-snug truncate">
                {item.subject}
              </span>
            </span>
          </button>
        ))}
      </div>

      {/* Linear issues */}
      <div className="px-4 pb-4">
        <div className="flex items-baseline gap-2 mt-5 mb-1">
          <span className="label text-ink">Linear</span>
          <span className="label text-ink-faint tabular-nums">{fl.length}</span>
          <span className="flex-1 border-t border-rule" />
        </div>
        {fl.length === 0 && <p className="label text-ink-faint py-2">Nothing here</p>}
        {fl.map((issue) => (
          <LinearRow key={issue.id} issue={issue} />
        ))}
        <p className="label text-ink-faint mt-3 leading-relaxed">Linear · assigned to you · pulled {pulledAt}</p>
      </div>
    </aside>
  )
}
