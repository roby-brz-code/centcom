"use client"

import type { ActionItem, AgentId, FYIItem } from "@/types/brief"
import { type Agent, type Skill, type SkillRun, cadenceLabel } from "@/app/lib/office"
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

function clock(at: number) {
  return new Date(at).toLocaleTimeString("en-GB", { hour: "2-digit", minute: "2-digit" })
}

// One runnable skill: label, cadence/due state, a Run button, and the latest
// run's output inline.
function SkillRow({ skill, run, onRun }: { skill: Skill; run?: SkillRun; onRun: () => void }) {
  const running = run?.status === "running"
  const done = run?.status === "done"
  return (
    <div className="py-3 border-b border-rule-soft">
      <div className="flex items-baseline gap-2">
        <span className="font-display text-ink text-[0.95rem]" style={{ fontWeight: 540 }}>
          {skill.label}
        </span>
        {skill.cadence && <span className="label text-ink-faint">{cadenceLabel(skill.cadence)}</span>}
        {skill.cadence &&
          (done ? (
            <span className="label text-ink-faint">· ran {clock(run!.at)}</span>
          ) : (
            <span className="label text-accent">· due</span>
          ))}
        <button
          onClick={onRun}
          disabled={running}
          className="ml-auto label px-2 py-0.5 rounded-sm border border-rule hover:border-ink hover:bg-paper text-ink transition-colors disabled:opacity-50 disabled:hover:border-rule"
        >
          {running ? "Running…" : "Run ▶"}
        </button>
      </div>
      <p className="font-body text-ink-soft text-[0.9rem] leading-snug mt-0.5">{skill.summary}</p>
      {done && run!.output && (
        <p className="font-body text-ink text-[0.9rem] leading-snug mt-2 border-l-2 border-accent/50 pl-3">
          {run!.output}
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
  runs,
  onDismiss,
  onRunSkill,
  onClose,
  chiefView,
}: {
  agent: Agent
  actions: ActionItem[]
  fyis: FYIItem[]
  runs: SkillRun[]
  onDismiss: (id: number) => void
  onRunSkill: (skill: Skill) => void
  onClose: () => void
  chiefView?: {
    routes: { id: AgentId; name: string; role: string; shirt: string; active: number; urgent: number }[]
    recurringDue: number
    onConveneStandup: () => void
  }
}) {
  const urgent = actions.filter((a) => a.urgent)
  const normal = actions.filter((a) => !a.urgent)
  const recurring = agent.skills.filter((s) => s.cadence)
  const onDemand = agent.skills.filter((s) => !s.cadence)
  const latestRun = (skillId: string) => runs.find((r) => r.skillId === skillId)

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

        <div className="flex-1 overflow-y-auto px-5 pb-8">
          {/* Chief of Staff orchestrator view */}
          {chiefView && (
            <div className="mt-5 p-4 bg-paper-raised border border-rule rounded-sm">
              <div className="label text-ink-faint">Today's routing</div>
              <ul className="mt-2 space-y-1">
                {chiefView.routes.map((r) => (
                  <li key={r.id} className="flex items-baseline gap-2">
                    <span className="h-2 w-2 rounded-full shrink-0" style={{ background: r.shirt }} />
                    <span className="font-body text-ink text-[0.92rem]">{r.name}</span>
                    <span className="label text-ink-faint">{r.role}</span>
                    <span className={`ml-auto label tabular-nums ${r.urgent > 0 ? "text-danger" : "text-ink-faint"}`}>
                      {r.active > 0 ? `${r.active}${r.urgent > 0 ? ` · ${r.urgent} urgent` : ""}` : "clear"}
                    </span>
                  </li>
                ))}
              </ul>
              <p className="label text-ink-faint mt-3">{chiefView.recurringDue} recurring tasks due across the floor</p>
              <div className="flex flex-wrap gap-2 mt-3">
                <button
                  onClick={chiefView.onConveneStandup}
                  className="label px-2.5 py-1 rounded-sm border border-rule hover:border-ink hover:bg-paper text-ink transition-colors"
                >
                  🔔 Convene standup
                </button>
                <a
                  href="/"
                  className="label px-2.5 py-1 rounded-sm border border-rule hover:border-ink hover:bg-paper text-ink transition-colors"
                >
                  Open Morning Brief →
                </a>
              </div>
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

          {/* Recurring tasks */}
          {recurring.length > 0 && (
            <section>
              <SectionHead title="Recurring" count={recurring.length} />
              {recurring.map((skill) => (
                <SkillRow key={skill.id} skill={skill} run={latestRun(skill.id)} onRun={() => onRunSkill(skill)} />
              ))}
            </section>
          )}

          {/* On-demand skills */}
          {onDemand.length > 0 && (
            <section>
              <SectionHead title="Skills" count={onDemand.length} />
              {onDemand.map((skill) => (
                <SkillRow key={skill.id} skill={skill} run={latestRun(skill.id)} onRun={() => onRunSkill(skill)} />
              ))}
            </section>
          )}
        </div>
      </aside>
    </>
  )
}
