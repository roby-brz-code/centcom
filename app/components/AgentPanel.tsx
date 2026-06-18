"use client"

import type { ActionItem, AgentId, FYIItem } from "@/types/brief"
import {
  AGENT_BY_ID,
  type Agent,
  type LinearIssue,
  type Report,
  type ScoutBrief,
  type Skill,
  type SkillRun,
  cadenceLabel,
  isRecurringDue,
} from "@/app/lib/office"
import reportsData from "@/data/reports.json"
import scoutData from "@/data/scout.json"
import ActionCard from "./ActionCard"
import Portrait from "./Portrait"
import { LinearRow } from "./OpenItems"

const REPORTS = reportsData as unknown as Record<string, Report>
const SCOUT = scoutData as unknown as ScoutBrief

function SectionHead({ title, count }: { title: string; count: number }) {
  return (
    <div className="flex items-baseline gap-3 mb-1 mt-7">
      <h3 className="label text-ink">{title}</h3>
      <span className="label text-ink-faint tabular-nums">{count}</span>
      <span className="flex-1 border-t border-rule" />
    </div>
  )
}

function when(at: number) {
  const d = new Date(at)
  const sameDay = d.toDateString() === new Date().toDateString()
  return sameDay
    ? d.toLocaleTimeString("en-GB", { hour: "2-digit", minute: "2-digit" })
    : d.toLocaleDateString("en-GB", { day: "numeric", month: "short" })
}

// A structured report (metrics + notes), backed by real warehouse data.
function ReportView({ report }: { report: Report }) {
  const deltaColor = (dir?: string) =>
    dir === "down" ? "text-danger" : dir === "up" ? "text-email" : "text-ink-faint"
  return (
    <div className="mt-2 border-l-2 border-accent/50 pl-3">
      <div className="label text-ink-faint">{report.period}</div>
      <div className="mt-2 divide-y divide-rule-soft">
        {report.metrics.map((m, i) => (
          <div key={i} className="flex items-baseline justify-between gap-3 py-1">
            <span className="font-body text-ink-soft text-[0.9rem]">{m.label}</span>
            <span className="flex items-baseline gap-2 flex-shrink-0">
              <span className="font-display text-ink text-[0.95rem] tabular-nums" style={{ fontWeight: 560 }}>
                {m.value}
              </span>
              {m.delta && <span className={`label ${deltaColor(m.dir)}`}>{m.delta}</span>}
            </span>
          </div>
        ))}
      </div>
      <ul className="mt-2.5 space-y-1.5">
        {report.notes.map((n, i) => (
          <li key={i} className="font-body text-ink-soft text-[0.88rem] leading-snug flex gap-2">
            <span className="text-ink-faint flex-shrink-0">·</span>
            <span>{n}</span>
          </li>
        ))}
      </ul>
      <div className="label text-ink-faint mt-2">{report.source}</div>
    </div>
  )
}

// One runnable skill: label, cadence/due state, a Run button, and the latest
// completed run's output (a structured report, or text) inline.
function SkillRow({
  skill,
  lastDone,
  running,
  due,
  report,
  onRun,
}: {
  skill: Skill
  lastDone?: SkillRun
  running: boolean
  due: boolean
  report?: Report
  onRun: () => void
}) {
  return (
    <div className="py-3 border-b border-rule-soft">
      <div className="flex items-baseline gap-2">
        <span className="font-display text-ink text-[0.95rem]" style={{ fontWeight: 540 }}>
          {skill.label}
        </span>
        {skill.cadence && <span className="label text-ink-faint">{cadenceLabel(skill.cadence)}</span>}
        {skill.cadence && due && <span className="label text-accent">· due</span>}
        {lastDone && !due && <span className="label text-ink-faint">· ran {when(lastDone.at)}</span>}
        <button
          onClick={onRun}
          disabled={running}
          className="ml-auto label px-2 py-0.5 rounded-sm border border-rule hover:border-ink hover:bg-paper text-ink transition-colors disabled:opacity-50 disabled:hover:border-rule"
        >
          {running ? "Running…" : "Run ▶"}
        </button>
      </div>
      <p className="font-body text-ink-soft text-[0.9rem] leading-snug mt-0.5">{skill.summary}</p>
      {lastDone && report && <ReportView report={report} />}
      {lastDone?.output && !report && (
        <p className="font-body text-ink text-[0.9rem] leading-snug mt-2 border-l-2 border-accent/50 pl-3">
          {lastDone.output}
        </p>
      )}
    </div>
  )
}

// A desk's working surface: brief tray (routed by the Chief of Staff), recurring
// tasks, and on-demand skills. Opening a draft or dismissing here is the same
// action as on the Morning Brief.
export default function AgentPanel({
  agent,
  actions,
  fyis,
  linear,
  runs,
  onDismiss,
  onRunSkill,
  onClose,
  chiefView,
}: {
  agent: Agent
  actions: ActionItem[]
  fyis: FYIItem[]
  linear: LinearIssue[]
  runs: SkillRun[]
  onDismiss: (id: number) => void
  onRunSkill: (skill: Skill) => void
  onClose: () => void
  chiefView?: {
    recurringDue: number
    onConveneStandup: () => void
  }
}) {
  const urgent = actions.filter((a) => a.urgent)
  const normal = actions.filter((a) => !a.urgent)
  const recurring = agent.skills.filter((s) => s.cadence)
  const onDemand = agent.skills.filter((s) => !s.cadence)
  const now = new Date()
  const lastDoneOf = (skillId: string) => runs.find((r) => r.skillId === skillId && r.status === "done")
  const isRunning = (skillId: string) => runs.some((r) => r.skillId === skillId && r.status === "running")

  const trayCount = actions.length + linear.length
  const greeting = trayCount
    ? `${urgent.length ? `${urgent.length} urgent · ` : ""}${trayCount} in your tray.`
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

        <div className="flex-1 overflow-y-auto px-5 pb-8">
          {/* Chief of Staff orchestrator view */}
          {chiefView && (
            <div className="mt-5 p-4 bg-paper-raised border border-rule rounded-sm">
              <div className="flex items-baseline justify-between">
                <span className="label text-ink">Scout · Daily Brief</span>
                <span className="label text-ink-faint">{SCOUT.date}</span>
              </div>
              <p className="font-body italic text-ink-soft text-[0.92rem] leading-snug mt-1">{SCOUT.headline}</p>

              <div className="label text-ink-faint mt-3 mb-1">Top of the list</div>
              {SCOUT.topItems.map((t, i) => (
                <div key={i} className="py-1.5 border-b border-rule-soft">
                  <div className="flex items-baseline gap-2">
                    {t.urgent ? (
                      <span className="h-2 w-2 rounded-full bg-danger shrink-0" />
                    ) : (
                      <span
                        className="h-2 w-2 rounded-full shrink-0"
                        style={{ background: t.owner ? AGENT_BY_ID[t.owner].shirt : "var(--ink-faint)" }}
                      />
                    )}
                    <span className="font-display text-ink text-[0.92rem]" style={{ fontWeight: 540 }}>
                      {t.title}
                    </span>
                  </div>
                  <p className="font-body text-ink-soft text-[0.85rem] leading-snug mt-0.5 pl-4">{t.note}</p>
                </div>
              ))}

              <div className="label text-ink-faint mt-3 mb-1">Linear in focus</div>
              {SCOUT.linearFocus.map((l) => (
                <a
                  key={l.id}
                  href={l.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-baseline gap-2 py-1 hover:bg-paper transition-colors"
                >
                  <span className="label text-ink-faint shrink-0">{l.id}</span>
                  <span className="font-body text-ink text-[0.88rem] truncate">{l.title}</span>
                  <span className="label text-ink-faint ml-auto shrink-0">{l.note}</span>
                </a>
              ))}

              <p className="label text-ink-faint mt-3">
                {SCOUT.meetings.length} meetings · {chiefView.recurringDue} recurring due
              </p>
              <div className="flex flex-wrap gap-2 mt-3">
                <button
                  onClick={chiefView.onConveneStandup}
                  className="label px-2.5 py-1 rounded-sm border border-rule hover:border-ink hover:bg-paper text-ink transition-colors"
                >
                  🔔 Convene standup
                </button>
                <a
                  href={SCOUT.source}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="label px-2.5 py-1 rounded-sm border border-rule hover:border-ink hover:bg-paper text-ink transition-colors"
                >
                  Open in Cowork →
                </a>
              </div>
              <p className="label text-ink-faint mt-2">Scout · pulled {SCOUT.pulledAt}</p>
            </div>
          )}

          {/* Brief tray */}
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

          {linear.length > 0 && (
            <section>
              <SectionHead title="Linear" count={linear.length} />
              {linear.map((issue) => (
                <LinearRow key={issue.id} issue={issue} />
              ))}
            </section>
          )}

          {/* Recurring tasks */}
          {recurring.length > 0 && (
            <section>
              <SectionHead title="Recurring" count={recurring.length} />
              {recurring.map((skill) => {
                const lastDone = lastDoneOf(skill.id)
                return (
                  <SkillRow
                    key={skill.id}
                    skill={skill}
                    lastDone={lastDone}
                    running={isRunning(skill.id)}
                    due={isRecurringDue(skill, lastDone?.at, now)}
                    report={skill.reportId ? REPORTS[skill.reportId] : undefined}
                    onRun={() => onRunSkill(skill)}
                  />
                )
              })}
            </section>
          )}

          {/* On-demand skills */}
          {onDemand.length > 0 && (
            <section>
              <SectionHead title="Skills" count={onDemand.length} />
              {onDemand.map((skill) => {
                const lastDone = lastDoneOf(skill.id)
                return (
                  <SkillRow
                    key={skill.id}
                    skill={skill}
                    lastDone={lastDone}
                    running={isRunning(skill.id)}
                    due={false}
                    report={skill.reportId ? REPORTS[skill.reportId] : undefined}
                    onRun={() => onRunSkill(skill)}
                  />
                )
              })}
            </section>
          )}
        </div>
      </aside>
    </>
  )
}
