import { Brief } from "@/types/brief"
import briefData from "@/data/brief.json"
import ActionCard from "./components/ActionCard"

export const dynamic = "force-dynamic"

function SectionHead({ title, count }: { title: string; count: number }) {
  return (
    <div className="flex items-baseline gap-3 mb-1 mt-10">
      <h2 className="label text-ink">{title}</h2>
      <span className="label text-ink-faint tabular-nums">{count}</span>
      <span className="flex-1 border-t border-rule" />
    </div>
  )
}

export default function Home() {
  const brief = briefData as Brief
  const urgent = brief.actions.filter((a) => a.urgent)
  const normal = brief.actions.filter((a) => !a.urgent)

  const genTime = new Date(brief.generatedAt).toLocaleTimeString("en-GB", {
    hour: "2-digit",
    minute: "2-digit",
  })

  return (
    <div className="min-h-screen">
      <div className="max-w-[42rem] mx-auto px-6 sm:px-10">
        {/* Masthead */}
        <header className="pt-14 pb-2">
          <div className="flex items-baseline justify-between mb-3">
            <span className="label text-ink-soft">{brief.date}</span>
            <span className="label text-ink-faint">Email · Slack</span>
          </div>
          <h1
            className="font-display text-ink leading-[0.95] tracking-tight"
            style={{ fontWeight: 600, fontSize: "clamp(2.5rem, 8vw, 4rem)" }}
          >
            The Morning Brief
          </h1>
          {/* Newspaper double rule */}
          <div className="mt-5 border-t-2 border-ink" />
          <div className="mt-1 border-t border-ink" />
          <div className="flex items-center justify-between py-2.5">
            <span className="label text-ink-soft">
              {urgent.length} urgent · {brief.actions.length} to action · {brief.fyis.length} noted
            </span>
            <span className="label text-ink-faint">Filed {genTime}</span>
          </div>
          <div className="border-t border-ink" />
        </header>

        <main className="pb-20">
          {urgent.length > 0 && (
            <section>
              <SectionHead title="Needs you first" count={urgent.length} />
              <div>
                {urgent.map((item, i) => (
                  <ActionCard key={item.id} item={item} index={i} />
                ))}
              </div>
            </section>
          )}

          {normal.length > 0 && (
            <section>
              <SectionHead title="To action" count={normal.length} />
              <div>
                {normal.map((item, i) => (
                  <ActionCard key={item.id} item={item} index={i} />
                ))}
              </div>
            </section>
          )}

          {brief.fyis.length > 0 && (
            <section>
              <SectionHead title="Noted, no reply needed" count={brief.fyis.length} />
              <ul>
                {brief.fyis.map((fyi, i) => (
                  <li
                    key={i}
                    className="flex items-baseline gap-4 py-2.5 border-b border-rule-soft"
                  >
                    <span className="font-display text-ink text-[0.95rem] flex-shrink-0" style={{ fontWeight: 540 }}>
                      {fyi.sender}
                    </span>
                    <span className="font-body italic text-ink-soft text-[0.98rem] leading-snug flex-1">
                      {fyi.summary}
                    </span>
                    <span className="label text-ink-faint flex-shrink-0 tabular-nums">{fyi.time}</span>
                  </li>
                ))}
              </ul>
            </section>
          )}

          <p className="label text-ink-faint text-center mt-14 leading-relaxed">
            Run <span className="text-ink">/morning-brief</span> to refile
          </p>
        </main>
      </div>
    </div>
  )
}
