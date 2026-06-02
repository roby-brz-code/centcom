import { Brief } from "@/types/brief"
import briefData from "@/data/brief.json"

export const dynamic = "force-dynamic"
import ActionCard from "./components/ActionCard"

export default function Home() {
  const brief = briefData as Brief
  const urgent = brief.actions.filter(a => a.urgent)
  const normal = brief.actions.filter(a => !a.urgent)

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Top bar */}
      <header className="bg-white border-b border-gray-200 sticky top-0 z-10">
        <div className="max-w-2xl mx-auto px-6 py-4 flex items-center justify-between">
          <div>
            <h1 className="text-base font-semibold text-gray-900">Morning Brief</h1>
            <p className="text-xs text-gray-500">{brief.date}</p>
          </div>
          <div className="flex items-center gap-3 text-xs text-gray-500">
            <span className="inline-flex items-center gap-1">
              <span className="w-1.5 h-1.5 rounded-full bg-red-400 inline-block" />
              {urgent.length} urgent
            </span>
            <span className="text-gray-300">·</span>
            <span>{brief.actions.length} actions</span>
            <span className="text-gray-300">·</span>
            <span>{brief.fyis.length} FYIs</span>
          </div>
        </div>
      </header>

      <main className="max-w-2xl mx-auto px-6 py-8 space-y-8">

        {/* Urgent */}
        {urgent.length > 0 && (
          <section>
            <div className="flex items-center gap-2 mb-3">
              <span className="text-xs font-semibold text-red-500 uppercase tracking-wide">Urgent</span>
              <div className="flex-1 h-px bg-red-100" />
            </div>
            <div className="space-y-2">
              {urgent.map((item, i) => (
                <ActionCard key={item.id} item={item} index={i} />
              ))}
            </div>
          </section>
        )}

        {/* Actions */}
        {normal.length > 0 && (
          <section>
            <div className="flex items-center gap-2 mb-3">
              <span className="text-xs font-semibold text-gray-400 uppercase tracking-wide">Actions</span>
              <div className="flex-1 h-px bg-gray-200" />
            </div>
            <div className="space-y-2">
              {normal.map((item, i) => (
                <ActionCard key={item.id} item={item} index={i} />
              ))}
            </div>
          </section>
        )}

        {/* FYIs */}
        {brief.fyis.length > 0 && (
          <section>
            <div className="flex items-center gap-2 mb-3">
              <span className="text-xs font-semibold text-gray-400 uppercase tracking-wide">FYIs</span>
              <div className="flex-1 h-px bg-gray-200" />
            </div>
            <div className="bg-white rounded-xl border border-gray-200 divide-y divide-gray-100">
              {brief.fyis.map((fyi, i) => (
                <div key={i} className="px-5 py-3 flex items-start gap-3">
                  <div className="flex-1 min-w-0">
                    <span className="text-sm font-medium text-gray-700">{fyi.sender}</span>
                    <span className="text-gray-300 mx-1.5 text-sm">—</span>
                    <span className="text-sm text-gray-500">{fyi.summary}</span>
                  </div>
                  <span className="text-xs text-gray-400 flex-shrink-0 mt-0.5">{fyi.time}</span>
                </div>
              ))}
            </div>
          </section>
        )}

        <p className="text-center text-xs text-gray-400 pb-4">
          Generated at {new Date(brief.generatedAt).toLocaleTimeString("en-GB", { hour: "2-digit", minute: "2-digit" })}
          {" · "}Run <code className="bg-gray-100 px-1 rounded">/morning-brief</code> to refresh
        </p>
      </main>
    </div>
  )
}
