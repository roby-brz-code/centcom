"use client"

import { useEffect, useMemo, useRef, useState } from "react"
import Link from "next/link"
import briefData from "@/data/brief.json"
import type { AgentId, Brief } from "@/types/brief"
import {
  AGENTS,
  AGENT_BY_ID,
  bucketByAgent,
  charPalette,
  CHAR,
  drawSprite,
  isRecurringDue,
  type PropType,
} from "@/app/lib/office"
import { useDismissed } from "../hooks/useDismissed"
import { useRuns } from "../hooks/useRuns"
import AgentPanel from "./AgentPanel"

// ---------------------------------------------------------------------------
// The Office — pixel-art RPG view over the live Morning Brief.
//
// Walk the floor (WASD / arrows), then click a desk or press E to open that
// agent's tray. The standup is Margo giving the brief: each desk reports the
// items it actually owns. Dismissals here sync with the Morning Brief.
// Hand-rolled canvas (no game engine) so it stays dependency-free.
// ---------------------------------------------------------------------------

const TS = 16 // tile size in logical pixels
const COLS = 20
const ROWS = 14
const W = COLS * TS // 320
const H = ROWS * TS // 224
const SPEED = 1.4
const PW = 10 // player collision box
const PH = 12
const NEAR = 24 // talk radius in logical px

// Solid rectangles [x, y, w, h] in logical px: walls, desks, the centre table.
const SOLIDS: [number, number, number, number][] = [
  [0, 0, W, TS], [0, H - TS, W, TS], [0, 0, TS, H], [W - TS, 0, TS, H], // walls
  [32, 32, 48, TS], [240, 32, 48, TS], [32, 160, 48, TS], [240, 160, 48, TS], // desks
  [128, 176, 64, TS], // reception desk
  [128, 96, 64, 32], // standup table
]

const PLAYER = charPalette("#3b5a7a") // Roby

function drawDesk(ctx: CanvasRenderingContext2D, tx: number, ty: number, w: number) {
  const x = tx * TS
  const y = ty * TS
  ctx.fillStyle = "#aab4c2"
  ctx.fillRect(x, y, w * TS, TS)
  ctx.fillStyle = "#cdd5e0"
  ctx.fillRect(x, y, w * TS, TS - 3)
}

function drawProp(ctx: CanvasRenderingContext2D, type: PropType, tx: number, ty: number) {
  const x = tx * TS
  const y = ty * TS
  if (type === "chart") {
    ctx.fillStyle = "#2b3340"; ctx.fillRect(x + 3, y + 1, 10, 8)
    ctx.fillStyle = "#dbe7f5"; ctx.fillRect(x + 4, y + 2, 8, 6)
    ctx.fillStyle = "#2f6df0"
    ctx.fillRect(x + 5, y + 6, 1, 2); ctx.fillRect(x + 7, y + 5, 1, 3); ctx.fillRect(x + 9, y + 4, 1, 4)
    ctx.fillStyle = "#2b3340"; ctx.fillRect(x + 7, y + 9, 2, 2)
  } else if (type === "vault") {
    ctx.fillStyle = "#8b95a6"; ctx.fillRect(x + 3, y + 1, 10, 10)
    ctx.fillStyle = "#6b7689"; ctx.fillRect(x + 5, y + 3, 6, 6)
    ctx.fillStyle = "#2f6df0"; ctx.fillRect(x + 7, y + 5, 2, 2)
  } else if (type === "ledger") {
    ctx.fillStyle = "#7c5cff"; ctx.fillRect(x + 3, y + 3, 10, 7)
    ctx.fillStyle = "#ffffff"; ctx.fillRect(x + 4, y + 4, 8, 5)
    ctx.fillStyle = "#2f6df0"; ctx.fillRect(x + 3, y + 3, 2, 7)
  } else if (type === "terminal") {
    ctx.fillStyle = "#f43f7e"; ctx.fillRect(x + 9, y - 1, 2, 5) // a card
    ctx.fillStyle = "#2b3340"; ctx.fillRect(x + 4, y + 2, 8, 8)
    ctx.fillStyle = "#2f6df0"; ctx.fillRect(x + 5, y + 3, 6, 3)
    ctx.fillStyle = "#cdd5e0"; ctx.fillRect(x + 6, y + 8, 4, 1)
  } else if (type === "bell") {
    ctx.fillStyle = "#6b7689"; ctx.fillRect(x + 7, y + 2, 2, 2)
    ctx.fillStyle = "#c4ccd6"; ctx.fillRect(x + 5, y + 4, 6, 5); ctx.fillRect(x + 4, y + 9, 8, 1)
  }
}

export default function OfficeScene() {
  const brief = briefData as Brief
  const { dismissedIds, dismiss } = useDismissed(brief.generatedAt)
  const buckets = useMemo(() => bucketByAgent(brief, dismissedIds), [brief, dismissedIds])
  const totals = useMemo(() => {
    const active = brief.actions.filter((a) => !dismissedIds.includes(a.id))
    return {
      urgent: active.filter((a) => a.urgent).length,
      active: active.length,
      fyis: brief.fyis.length,
    }
  }, [brief, dismissedIds])

  const canvasRef = useRef<HTMLCanvasElement | null>(null)
  const playerRef = useRef({ x: 80, y: 112 })
  const keysRef = useRef<Set<string>>(new Set())
  const rafRef = useRef(0)
  const nearestRef = useRef<AgentId | null>(null)
  const openRef = useRef(false)

  const [nearestId, setNearestId] = useState<AgentId | null>(null)
  const [selectedId, setSelectedId] = useState<AgentId | null>(null)
  const [standupOpen, setStandupOpen] = useState(false)

  const anyOpen = selectedId !== null || standupOpen
  const selectedAgent = selectedId ? AGENT_BY_ID[selectedId] : null

  // Skill runs — persisted across sessions; "due" is cadence-aware.
  const { runs, runSkill } = useRuns()

  // Chief-of-Staff orchestrator data: dispatch summary + floor-wide recurring due.
  const lastDoneAt = useMemo(() => {
    const m = new Map<string, number>()
    for (const r of runs) if (r.status === "done" && !m.has(r.skillId)) m.set(r.skillId, r.at)
    return m
  }, [runs])
  const recurringDue = useMemo(
    () =>
      AGENTS.reduce(
        (n, a) => n + a.skills.filter((s) => s.cadence && isRecurringDue(s, lastDoneAt.get(s.id))).length,
        0,
      ),
    [lastDoneAt],
  )
  const routes = useMemo(
    () =>
      AGENTS.map((a) => ({
        id: a.id,
        name: a.name,
        role: a.role,
        shirt: a.shirt,
        active: buckets[a.id].active,
        urgent: buckets[a.id].urgent,
      })),
    [buckets],
  )

  // Keep the game loop aware of whether an overlay is capturing input.
  useEffect(() => {
    openRef.current = anyOpen
  }, [anyOpen])

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return
    const ctx = canvas.getContext("2d")
    if (!ctx) return
    ctx.imageSmoothingEnabled = false

    const MOVE = new Set(["arrowleft", "arrowright", "arrowup", "arrowdown", "w", "a", "s", "d"])

    const hits = (x: number, y: number) =>
      SOLIDS.some(
        ([sx, sy, sw, sh]) => x < sx + sw && x + PW > sx && y < sy + sh && y + PH > sy,
      )

    const move = (dx: number, dy: number) => {
      const p = playerRef.current
      if (!hits(p.x + dx, p.y)) p.x += dx
      if (!hits(p.x, p.y + dy)) p.y += dy
    }

    const updateNearest = () => {
      const p = playerRef.current
      const pcx = p.x + PW / 2
      const pcy = p.y + PH / 2
      let best: AgentId | null = null
      let bestD = NEAR
      for (const a of AGENTS) {
        const d = Math.hypot(a.tile[0] * TS + 8 - pcx, a.tile[1] * TS + 8 - pcy)
        if (d < bestD) {
          bestD = d
          best = a.id
        }
      }
      if (best !== nearestRef.current) {
        nearestRef.current = best
        setNearestId(best)
      }
    }

    const render = (now: number) => {
      // floor
      for (let ty = 0; ty < ROWS; ty++) {
        for (let tx = 0; tx < COLS; tx++) {
          ctx.fillStyle = (tx + ty) % 2 === 0 ? "#eef1f6" : "#e3e8ef"
          ctx.fillRect(tx * TS, ty * TS, TS, TS)
        }
      }
      // standup rug
      ctx.fillStyle = "#e6ecf7"; ctx.fillRect(116, 86, 88, 54)
      // walls
      ctx.fillStyle = "#d3dae4"
      ctx.fillRect(0, 0, W, TS); ctx.fillRect(0, H - TS, W, TS)
      ctx.fillRect(0, 0, TS, H); ctx.fillRect(W - TS, 0, TS, H)
      ctx.fillStyle = "#bcc5d3"
      ctx.fillRect(0, TS - 2, W, 2); ctx.fillRect(0, H - TS, W, 2)
      ctx.fillRect(TS - 2, 0, 2, H); ctx.fillRect(W - TS, 0, 2, H)
      // door (decorative)
      ctx.fillStyle = "#aab4c2"; ctx.fillRect(9 * TS, H - TS, 2 * TS, TS)
      ctx.fillStyle = "#6b7689"; ctx.fillRect(9 * TS + 3, H - TS + 3, 2 * TS - 6, TS - 3)
      // standup table
      ctx.fillStyle = "#b3bdcb"; ctx.fillRect(128, 96, 64, 32)
      ctx.fillStyle = "#cdd5e0"; ctx.fillRect(128, 96, 64, 29)
      ctx.fillStyle = "#ffffff"; ctx.fillRect(140, 104, 10, 8)
      ctx.fillStyle = "#2f6df0"; ctx.fillRect(170, 106, 6, 6)
      // desks + props
      for (const a of AGENTS) {
        drawDesk(ctx, a.desk[0], a.desk[1], a.desk[2])
        drawProp(ctx, a.prop, a.propTile[0], a.propTile[1])
      }
      // sprites, depth-sorted by feet
      const p = playerRef.current
      const moving = [...keysRef.current].some((k) => MOVE.has(k))
      const list = [
        ...AGENTS.map((a) => ({
          feet: a.tile[1] * TS + TS,
          draw: () => {
            const bob = Math.sin(now / 320 + a.phase) > 0 ? 0 : -1
            drawSprite(ctx, CHAR, charPalette(a.shirt), a.tile[0] * TS + 2, a.tile[1] * TS + 2 + bob)
          },
        })),
        {
          feet: p.y + PH,
          draw: () => {
            const bob = moving && !openRef.current && Math.sin(now / 90) > 0 ? -1 : 0
            drawSprite(ctx, CHAR, PLAYER, Math.round(p.x - 1), Math.round(p.y - 2) + bob)
          },
        },
      ].sort((m, n) => m.feet - n.feet)
      for (const d of list) d.draw()
    }

    const loop = (now: number) => {
      rafRef.current = requestAnimationFrame(loop)
      if (!openRef.current) {
        const k = keysRef.current
        let dx = 0
        let dy = 0
        if (k.has("arrowleft") || k.has("a")) dx -= 1
        if (k.has("arrowright") || k.has("d")) dx += 1
        if (k.has("arrowup") || k.has("w")) dy -= 1
        if (k.has("arrowdown") || k.has("s")) dy += 1
        if (dx && dy) { dx *= Math.SQRT1_2; dy *= Math.SQRT1_2 }
        if (dx || dy) move(dx * SPEED, dy * SPEED)
        updateNearest()
      }
      render(now)
    }

    const onKeyDown = (e: KeyboardEvent) => {
      const k = e.key.toLowerCase()
      if (openRef.current) {
        if (k === "escape") { setSelectedId(null); setStandupOpen(false) }
        return
      }
      if (MOVE.has(k) || k === " ") e.preventDefault()
      if (k === "e" || k === "enter" || k === " ") {
        if (nearestRef.current) setSelectedId(nearestRef.current)
        return
      }
      keysRef.current.add(k)
    }
    const onKeyUp = (e: KeyboardEvent) => {
      keysRef.current.delete(e.key.toLowerCase())
    }

    window.addEventListener("keydown", onKeyDown)
    window.addEventListener("keyup", onKeyUp)
    rafRef.current = requestAnimationFrame(loop)
    return () => {
      cancelAnimationFrame(rafRef.current)
      window.removeEventListener("keydown", onKeyDown)
      window.removeEventListener("keyup", onKeyUp)
    }
  }, [])

  return (
    <div className="w-full flex flex-col items-center">
      <div className="relative w-full" style={{ maxWidth: 760 }}>
        <div className="relative w-full" style={{ aspectRatio: "320 / 224" }}>
          <canvas
            ref={canvasRef}
            width={W}
            height={H}
            className="pixelated absolute inset-0 w-full h-full rounded-sm"
            style={{ border: "3px solid var(--ink)" }}
          />
          {AGENTS.map((a) => {
            const leftPct = ((a.tile[0] * TS + 8) / W) * 100
            const topPct = ((a.tile[1] * TS + 8) / H) * 100
            const b = buckets[a.id]
            return (
              <button
                key={a.id}
                onClick={() => setSelectedId(a.id)}
                aria-label={`Open ${a.name}, ${a.role} — ${b.active} to action`}
                className="group absolute z-10 -translate-x-1/2 -translate-y-1/2 flex items-center justify-center"
                style={{ left: `${leftPct}%`, top: `${topPct}%`, width: "13%", height: "24%" }}
              >
                {b.active > 0 && (
                  <span
                    className="absolute -top-2 right-0 label tabular-nums text-paper rounded-full min-w-[16px] h-[16px] px-1 flex items-center justify-center leading-none"
                    style={{ background: b.urgent > 0 ? "var(--danger)" : "var(--ink-soft)" }}
                  >
                    {b.active}
                  </span>
                )}
                {nearestId === a.id && !anyOpen && (
                  <span className="absolute -top-5 label bg-ink text-paper px-1.5 py-0.5 rounded-sm whitespace-nowrap">
                    Press E
                  </span>
                )}
                <span className="absolute -bottom-4 label text-ink-soft bg-paper-raised/80 px-1 rounded-sm whitespace-nowrap group-hover:text-ink transition-colors">
                  {a.role}
                </span>
                <span className="absolute inset-0 rounded-sm ring-0 group-hover:ring-2 group-hover:ring-ink/40 transition" />
              </button>
            )
          })}
        </div>

        <div className="mt-3 flex items-center justify-between gap-3">
          <span className="label text-ink-faint">
            Arrow keys / WASD to move · E or click a desk
          </span>
          <button
            onClick={() => setStandupOpen(true)}
            className="label text-ink border border-rule hover:border-ink px-2.5 py-1 rounded-sm transition-colors"
          >
            🔔 Standup
          </button>
        </div>
      </div>

      {selectedAgent && (
        <AgentPanel
          agent={selectedAgent}
          actions={buckets[selectedAgent.id].actions}
          fyis={buckets[selectedAgent.id].fyis}
          runs={runs.filter((r) => r.agentId === selectedAgent.id)}
          onDismiss={dismiss}
          onRunSkill={(skill) => runSkill(selectedAgent.id, skill)}
          onClose={() => setSelectedId(null)}
          chiefView={
            selectedAgent.id === "chief"
              ? { routes, recurringDue, onConveneStandup: () => { setSelectedId(null); setStandupOpen(true) } }
              : undefined
          }
        />
      )}

      {standupOpen && (
        <div
          className="fixed inset-0 z-40 flex items-center justify-center bg-ink/40 px-4"
          onClick={() => setStandupOpen(false)}
        >
          <div
            onClick={(e) => e.stopPropagation()}
            className="w-full max-w-[580px] max-h-[85vh] overflow-y-auto bg-paper-raised p-6 relative"
            style={{ boxShadow: "0 0 0 3px var(--paper-raised), 0 0 0 6px var(--ink)" }}
          >
            <button
              onClick={() => setStandupOpen(false)}
              aria-label="Close"
              className="absolute top-3 right-4 label text-ink-faint hover:text-ink transition-colors"
            >
              Esc ✕
            </button>
            <div className="label text-ink-faint">{brief.date} · weekly standup</div>
            <h2 className="font-display text-ink text-2xl" style={{ fontWeight: 600 }}>
              Around the table
            </h2>
            <p className="font-body italic text-ink-soft mt-1 leading-snug">
              Margo gives the brief:{" "}
              <span className="not-italic text-ink">{totals.urgent} urgent</span> ·{" "}
              {totals.active} to action · {totals.fyis} noted across the floor.
            </p>
            <div className="mt-3 border-t-2 border-ink" />
            <div className="mt-0.5 border-t border-ink" />

            <ul className="mt-3">
              {AGENTS.map((a) => {
                const b = buckets[a.id]
                const count =
                  b.active > 0
                    ? `${b.urgent > 0 ? `${b.urgent} urgent · ` : ""}${b.active} to action`
                    : b.fyis.length > 0
                      ? `${b.fyis.length} noted`
                      : "clear"
                return (
                  <li key={a.id}>
                    <button
                      onClick={() => { setStandupOpen(false); setSelectedId(a.id) }}
                      className="group w-full text-left flex gap-3 py-3 border-b border-rule-soft hover:bg-paper transition-colors"
                    >
                      <span className="mt-1 h-3 w-3 rounded-full shrink-0" style={{ background: a.shirt }} />
                      <div className="min-w-0 flex-1">
                        <div className="flex items-baseline gap-2 flex-wrap">
                          <span className="label text-ink">{a.name}</span>
                          <span className="label text-ink-faint">{a.role}</span>
                          <span className={`label ${b.urgent > 0 ? "text-danger" : "text-ink-faint"}`}>· {count}</span>
                        </div>
                        <p className="font-body text-ink-soft text-[0.95rem] leading-snug mt-0.5">
                          {b.leadText}
                        </p>
                      </div>
                      <span className="label text-ink-faint self-center group-hover:text-ink transition-colors">
                        open →
                      </span>
                    </button>
                  </li>
                )
              })}
            </ul>

            <Link
              href="/"
              className="label text-ink inline-block mt-5 underline decoration-rule decoration-1 underline-offset-2 hover:decoration-ink transition-colors"
            >
              Open the full Morning Brief →
            </Link>
          </div>
        </div>
      )}
    </div>
  )
}
