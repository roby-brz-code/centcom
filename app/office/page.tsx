import type { Metadata } from "next"
import Link from "next/link"
import OfficeScene from "../components/OfficeScene"

export const metadata: Metadata = {
  title: "The Office",
  description: "Walk the floor and run processes with your finance agents",
}

export default function OfficePage() {
  return (
    <div className="min-h-screen">
      <div className="max-w-[1180px] mx-auto px-6 sm:px-10">
        <header className="pt-10 pb-4">
          <div className="flex items-baseline justify-between mb-3">
            <Link href="/" className="label text-ink-soft hover:text-ink transition-colors">
              ← The Morning Brief
            </Link>
            <span className="label text-ink-faint">Pixel shell · preview</span>
          </div>
          <h1
            className="font-display text-ink leading-[0.95] tracking-tight"
            style={{ fontWeight: 600, fontSize: "clamp(2rem, 6vw, 3rem)" }}
          >
            The Office
          </h1>
          <p className="font-body italic text-ink-soft mt-2 leading-snug">
            Walk the floor and talk to your finance agents. Click a desk — or stroll up and press E.
          </p>
          <div className="mt-4 border-t-2 border-ink" />
          <div className="mt-0.5 border-t border-ink" />
        </header>

        <OfficeScene />

        <p className="label text-ink-faint text-center my-10 leading-relaxed">
          Smallest shell — processes are previews for now. Tell me which to wire up first.
        </p>
      </div>
    </div>
  )
}
