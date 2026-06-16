"use client"

import { useEffect, useRef, useState } from "react"
import Link from "next/link"

// ---------------------------------------------------------------------------
// The Office — pixel-art RPG shell.
//
// Smallest-shell first: a walkable top-down office where each desk is a finance
// agent. Move with arrow keys / WASD, walk up + press E (or click a desk) to
// talk. Processes are previews for now; the weekly standup pulls seeded lines.
// Hand-rolled canvas (no game engine) so it stays dependency-free; we can
// graduate to a real tilemap engine when we expand.
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

type PropType = "chart" | "vault" | "ledger" | "terminal" | "bell"
type ProcAction = "preview" | "standup" | "brief"
interface Proc { label: string; action: ProcAction }
interface Agent {
  id: string
  name: string
  role: string
  blurb: string
  shirt: string
  tile: [number, number] // tile the NPC stands on
  desk: [number, number, number] // [tx, ty, widthInTiles]
  propTile: [number, number]
  prop: PropType
  phase: number // idle-bob offset
  hasFlag?: boolean // shows a 💬 "I have something for you" bubble
  standupLine: string
  processes: Proc[]
}

const preview = (labels: string[]): Proc[] =>
  labels.map((label) => ({ label, action: "preview" as const }))

const AGENTS: Agent[] = [
  {
    id: "fpa",
    name: "Fern",
    role: "FP&A Manager",
    blurb: "Runs the numbers — forecast, burn, and where the money's going.",
    shirt: "#3d6b6b",
    tile: [3, 4],
    desk: [2, 2, 3],
    propTile: [3, 2],
    prop: "chart",
    phase: 0,
    standupLine:
      "Marty's SaaS inventory is in — I can flag duplicate tools before renewals.",
    processes: preview([
      "Refresh the forecast",
      "Budget vs actual variance",
      "Burn & runway snapshot",
      "SaaS spend sweep",
      "Board metrics pack",
    ]),
  },
  {
    id: "treasury",
    name: "Theo",
    role: "Treasurer",
    blurb: "Watches the cash — banks, wires, and settlement liquidity.",
    shirt: "#4f7a4a",
    tile: [16, 4],
    desk: [15, 2, 3],
    propTile: [16, 2],
    prop: "vault",
    phase: 1.1,
    hasFlag: true,
    standupLine:
      "$7M + 500k USDC moved via Nonco yesterday — confirming settlement and refreshing the cash position.",
    processes: preview([
      "Cash position across banks",
      "Prep a wire / sweep",
      "Crypto settlement liquidity",
      "Runway alarm",
      "FX exposure",
    ]),
  },
  {
    id: "accounting",
    name: "Ada",
    role: "Accountant",
    blurb: "Keeps the books clean — close, tax, audits, and bills.",
    shirt: "#6b4d8a",
    tile: [3, 9],
    desk: [2, 10, 3],
    propTile: [3, 10],
    prop: "ledger",
    phase: 2.0,
    hasFlag: true,
    standupLine:
      "Dante's BSA/AML letter is 14 days overdue and Numeral still can't file 5 states — both need a nudge.",
    processes: preview([
      "Month-end close checklist",
      "Audit tracker",
      "Tax filing status",
      "Approve bills",
      "Reconciliations",
    ]),
  },
  {
    id: "settlement",
    name: "Sol",
    role: "Settlement FinOps",
    blurb: "Owns settlement — payouts, processor recon, and breaks.",
    shirt: "#b3412a",
    tile: [16, 9],
    desk: [15, 10, 3],
    propTile: [16, 10],
    prop: "terminal",
    phase: 3.0,
    standupLine:
      "Worldpay IC++ invoice is in for recon, and there's one settlement break to clear.",
    processes: preview([
      "Run settlement",
      "Processor recon",
      "Payout & break monitor",
      "Chargeback watch",
      "Reserve tracking",
    ]),
  },
  {
    id: "chief",
    name: "Margo",
    role: "Chief of Staff",
    blurb: "Keeps the floor moving — briefs you and runs the standup.",
    shirt: "#b08a3e",
    tile: [9, 10],
    desk: [8, 11, 4],
    propTile: [9, 11],
    prop: "bell",
    phase: 0.6,
    hasFlag: true,
    standupLine:
      "Three approvals are waiting in Bill.com and Ramp — I'll tee them up for you.",
    processes: [
      { label: "Open the Morning Brief", action: "brief" },
      { label: "Convene weekly standup", action: "standup" },
      { label: "What needs me today?", action: "preview" },
    ],
  },
]

// 12×14 humanoid; palette-swapped per agent. '.' = transparent.
const CHAR = [
  "....hhhh....",
  "..hhhhhhhh..",
  ".hhhhhhhhhh.",
  ".hffffffffh.",
  ".ffffffffff.",
  ".ffeffffeff.",
  ".ffffffffff.",
  "..ffffffff..",
  "...tttttt...",
  ".tttttttttt.",
  ".tttttttttt.",
  "..nttttttn..",
  "...ll..ll...",
  "...ss..ss...",
]

function charPalette(shirt: string): Record<string, string> {
  return {
    h: "#3a2c22", // hair
    f: "#e7b08a", // skin
    e: "#1f1c18", // eyes (ink)
    t: shirt, // shirt
    n: "#e7b08a", // hands
    l: "#5c564d", // trousers (ink-soft)
    s: "#1f1c18", // shoes (ink)
  }
}

const PLAYER = charPalette("#3b5a7a") // Roby

function drawSprite(
  ctx: CanvasRenderingContext2D,
  rows: string[],
  palette: Record<string, string>,
  dx: number,
  dy: number,
) {
  for (let y = 0; y < rows.length; y++) {
    const row = rows[y]
    for (let x = 0; x < row.length; x++) {
      const color = palette[row[x]]
      if (!color) continue
      ctx.fillStyle = color
      ctx.fillRect(dx + x, dy + y, 1, 1)
    }
  }
}

function drawDesk(ctx: CanvasRenderingContext2D, tx: number, ty: number, w: number) {
  const x = tx * TS
  const y = ty * TS
  ctx.fillStyle = "#9c7b4e"
  ctx.fillRect(x, y, w * TS, TS)
  ctx.fillStyle = "#c2a373"
  ctx.fillRect(x, y, w * TS, TS - 3)
}

function drawProp(ctx: CanvasRenderingContext2D, type: PropType, tx: number, ty: number) {
  const x = tx * TS
  const y = ty * TS
  if (type === "chart") {
    ctx.fillStyle = "#2b2b2b"; ctx.fillRect(x + 3, y + 1, 10, 8)
    ctx.fillStyle = "#cfe3df"; ctx.fillRect(x + 4, y + 2, 8, 6)
    ctx.fillStyle = "#3d6b6b"
    ctx.fillRect(x + 5, y + 6, 1, 2); ctx.fillRect(x + 7, y + 5, 1, 3); ctx.fillRect(x + 9, y + 4, 1, 4)
    ctx.fillStyle = "#2b2b2b"; ctx.fillRect(x + 7, y + 9, 2, 2)
  } else if (type === "vault") {
    ctx.fillStyle = "#6b6b6b"; ctx.fillRect(x + 3, y + 1, 10, 10)
    ctx.fillStyle = "#4a4a4a"; ctx.fillRect(x + 5, y + 3, 6, 6)
    ctx.fillStyle = "#c9a227"; ctx.fillRect(x + 7, y + 5, 2, 2)
  } else if (type === "ledger") {
    ctx.fillStyle = "#6b4d8a"; ctx.fillRect(x + 3, y + 3, 10, 7)
    ctx.fillStyle = "#f6f3ec"; ctx.fillRect(x + 4, y + 4, 8, 5)
    ctx.fillStyle = "#b3412a"; ctx.fillRect(x + 3, y + 3, 2, 7)
  } else if (type === "terminal") {
    ctx.fillStyle = "#b3412a"; ctx.fillRect(x + 9, y - 1, 2, 5) // a card
    ctx.fillStyle = "#2b2b2b"; ctx.fillRect(x + 4, y + 2, 8, 8)
    ctx.fillStyle = "#3d6b6b"; ctx.fillRect(x + 5, y + 3, 6, 3)
    ctx.fillStyle = "#c9a227"; ctx.fillRect(x + 6, y + 8, 4, 1)
  } else if (type === "bell") {
    ctx.fillStyle = "#8a6e1f"; ctx.fillRect(x + 7, y + 2, 2, 2)
    ctx.fillStyle = "#c9a227"; ctx.fillRect(x + 5, y + 4, 6, 5); ctx.fillRect(x + 4, y + 9, 8, 1)
  }
}

export default function OfficeScene() {
  const canvasRef = useRef<HTMLCanvasElement | null>(null)
  const portraitRef = useRef<HTMLCanvasElement | null>(null)
  const playerRef = useRef({ x: 80, y: 112 })
  const keysRef = useRef<Set<string>>(new Set())
  const rafRef = useRef(0)
  const nearestRef = useRef<string | null>(null)
  const openRef = useRef(false)

  const [nearestId, setNearestId] = useState<string | null>(null)
  const [dialogueId, setDialogueId] = useState<string | null>(null)
  const [standupOpen, setStandupOpen] = useState(false)
  const [previewLine, setPreviewLine] = useState<string | null>(null)

  const anyOpen = dialogueId !== null || standupOpen
  const dialogueAgent = AGENTS.find((a) => a.id === dialogueId) ?? null

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

    const openDialogue = (id: string) => {
      setDialogueId(id)
      setPreviewLine(null)
    }

    const hits = (x: number, y: number) => {
      return SOLIDS.some(
        ([sx, sy, sw, sh]) => x < sx + sw && x + PW > sx && y < sy + sh && y + PH > sy,
      )
    }

    const move = (dx: number, dy: number) => {
      const p = playerRef.current
      if (!hits(p.x + dx, p.y)) p.x += dx
      if (!hits(p.x, p.y + dy)) p.y += dy
    }

    const updateNearest = () => {
      const p = playerRef.current
      const pcx = p.x + PW / 2
      const pcy = p.y + PH / 2
      let best: string | null = null
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
          ctx.fillStyle = (tx + ty) % 2 === 0 ? "#efeadf" : "#e7e0d2"
          ctx.fillRect(tx * TS, ty * TS, TS, TS)
        }
      }
      // standup rug
      ctx.fillStyle = "#f0e0d8"; ctx.fillRect(116, 86, 88, 54)
      // walls
      ctx.fillStyle = "#cdc6b6"
      ctx.fillRect(0, 0, W, TS); ctx.fillRect(0, H - TS, W, TS)
      ctx.fillRect(0, 0, TS, H); ctx.fillRect(W - TS, 0, TS, H)
      ctx.fillStyle = "#b7af9d"
      ctx.fillRect(0, TS - 2, W, 2); ctx.fillRect(0, H - TS, W, 2)
      ctx.fillRect(TS - 2, 0, 2, H); ctx.fillRect(W - TS, 0, 2, H)
      // door (decorative)
      ctx.fillStyle = "#9c7b4e"; ctx.fillRect(9 * TS, H - TS, 2 * TS, TS)
      ctx.fillStyle = "#6e5636"; ctx.fillRect(9 * TS + 3, H - TS + 3, 2 * TS - 6, TS - 3)
      // standup table
      ctx.fillStyle = "#9c7b4e"; ctx.fillRect(128, 96, 64, 32)
      ctx.fillStyle = "#c2a373"; ctx.fillRect(128, 96, 64, 29)
      ctx.fillStyle = "#f6f3ec"; ctx.fillRect(140, 104, 10, 8)
      ctx.fillStyle = "#b3412a"; ctx.fillRect(170, 106, 6, 6)
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
        if (k === "escape") { setDialogueId(null); setStandupOpen(false) }
        return
      }
      if (MOVE.has(k) || k === " ") e.preventDefault()
      if (k === "e" || k === "enter" || k === " ") {
        if (nearestRef.current) openDialogue(nearestRef.current)
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

  // Portrait inside the dialogue box.
  useEffect(() => {
    if (!dialogueAgent) return
    const c = portraitRef.current
    if (!c) return
    const pctx = c.getContext("2d")
    if (!pctx) return
    pctx.clearRect(0, 0, c.width, c.height)
    pctx.imageSmoothingEnabled = false
    drawSprite(pctx, CHAR, charPalette(dialogueAgent.shirt), 0, 0)
  }, [dialogueAgent])

  function handleProcess(agent: Agent, proc: Proc) {
    if (proc.action === "standup") {
      setDialogueId(null)
      setStandupOpen(true)
    } else {
      setPreviewLine(`▶ ${agent.name} would run “${proc.label}” — wiring up next.`)
    }
  }

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
            return (
              <button
                key={a.id}
                onClick={() => { setDialogueId(a.id); setPreviewLine(null) }}
                aria-label={`Talk to ${a.name}, ${a.role}`}
                className="group absolute z-10 -translate-x-1/2 -translate-y-1/2 flex items-center justify-center"
                style={{ left: `${leftPct}%`, top: `${topPct}%`, width: "13%", height: "24%" }}
              >
                {a.hasFlag && (
                  <span className="absolute -top-1 text-[11px] leading-none drop-shadow-sm" aria-hidden>
                    💬
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
            Arrow keys / WASD to move · E or click a desk to talk
          </span>
          <button
            onClick={() => setStandupOpen(true)}
            className="label text-ink border border-rule hover:border-ink px-2.5 py-1 rounded-sm transition-colors"
          >
            🔔 Standup
          </button>
        </div>
      </div>

      {dialogueAgent && (
        <div className="fixed inset-x-0 bottom-0 z-30 flex justify-center px-4 pb-4">
          <div
            className="w-full max-w-[760px] bg-paper-raised p-4 relative"
            style={{ boxShadow: "0 0 0 3px var(--paper-raised), 0 0 0 6px var(--ink), 0 12px 30px rgba(0,0,0,.18)" }}
          >
            <button
              onClick={() => setDialogueId(null)}
              aria-label="Close"
              className="absolute top-2 right-3 label text-ink-faint hover:text-ink transition-colors"
            >
              Esc ✕
            </button>
            <div className="flex gap-4">
              <canvas
                ref={portraitRef}
                width={12}
                height={14}
                className="pixelated shrink-0 self-start"
                style={{ width: 60, height: 70, border: "2px solid var(--ink)", background: "var(--accent-soft)" }}
              />
              <div className="min-w-0 flex-1">
                <div className="flex items-baseline gap-2.5">
                  <span className="font-display text-ink text-xl" style={{ fontWeight: 600 }}>
                    {dialogueAgent.name}
                  </span>
                  <span className="label text-ink-faint">{dialogueAgent.role}</span>
                </div>
                <p className="font-body italic text-ink-soft mt-0.5 leading-snug">{dialogueAgent.blurb}</p>
                <div className="mt-3 flex flex-wrap gap-2">
                  {dialogueAgent.processes.map((proc) =>
                    proc.action === "brief" ? (
                      <Link
                        key={proc.label}
                        href="/"
                        className="label border border-rule hover:border-ink hover:bg-paper px-2 py-1 rounded-sm text-ink transition-colors"
                      >
                        {proc.label} →
                      </Link>
                    ) : (
                      <button
                        key={proc.label}
                        onClick={() => handleProcess(dialogueAgent, proc)}
                        className="label border border-rule hover:border-ink hover:bg-paper px-2 py-1 rounded-sm text-ink transition-colors"
                      >
                        {proc.label}
                      </button>
                    ),
                  )}
                </div>
                {previewLine && <p className="label text-accent mt-3">{previewLine}</p>}
              </div>
            </div>
          </div>
        </div>
      )}

      {standupOpen && (
        <div
          className="fixed inset-0 z-40 flex items-center justify-center bg-ink/40 px-4"
          onClick={() => setStandupOpen(false)}
        >
          <div
            onClick={(e) => e.stopPropagation()}
            className="w-full max-w-[560px] bg-paper-raised p-6 relative"
            style={{ boxShadow: "0 0 0 3px var(--paper-raised), 0 0 0 6px var(--ink)" }}
          >
            <button
              onClick={() => setStandupOpen(false)}
              aria-label="Close"
              className="absolute top-3 right-4 label text-ink-faint hover:text-ink transition-colors"
            >
              Esc ✕
            </button>
            <div className="label text-ink-faint">Monday · weekly standup</div>
            <h2 className="font-display text-ink text-2xl" style={{ fontWeight: 600 }}>
              Around the table
            </h2>
            <div className="mt-2 border-t-2 border-ink" />
            <div className="mt-0.5 border-t border-ink" />
            <ul className="mt-4 space-y-3">
              {AGENTS.map((a) => (
                <li key={a.id} className="flex gap-3">
                  <span className="mt-1.5 h-3 w-3 rounded-full shrink-0" style={{ background: a.shirt }} />
                  <div className="min-w-0">
                    <div className="label text-ink">
                      {a.name} · <span className="text-ink-faint">{a.role}</span>
                    </div>
                    <p className="font-body text-ink-soft text-[0.95rem] leading-snug">{a.standupLine}</p>
                  </div>
                </li>
              ))}
            </ul>
            <p className="label text-ink-faint mt-5 leading-relaxed">
              Seeded preview — the live agenda wires up from your brief next.
            </p>
          </div>
        </div>
      )}
    </div>
  )
}
