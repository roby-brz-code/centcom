import type { ActionItem, AgentId, Brief, FYIItem } from "@/types/brief"

// ---------------------------------------------------------------------------
// The Office roster + the routing that maps brief items onto desks.
//
// Single source of truth for who works the floor, their pixel-sprite identity,
// and how an inbox item finds its owner. Both the canvas scene and the agent
// panels read from here so the office and the Morning Brief stay in sync.
// ---------------------------------------------------------------------------

export type PropType = "chart" | "vault" | "ledger" | "terminal" | "bell"
export type ProcessAction = "preview" | "standup" | "brief"
export interface Process {
  label: string
  action: ProcessAction
}

export interface Agent {
  id: AgentId
  name: string
  role: string
  blurb: string
  idle: string // what they say when their tray is empty
  shirt: string
  tile: [number, number] // tile the NPC stands on
  desk: [number, number, number] // [tx, ty, widthInTiles]
  propTile: [number, number]
  prop: PropType
  phase: number // idle-bob offset
  keywords: string[] // fallback routing when an item has no explicit owner
  processes: Process[]
}

const preview = (labels: string[]): Process[] =>
  labels.map((label) => ({ label, action: "preview" as const }))

export const AGENTS: Agent[] = [
  {
    id: "fpa",
    name: "Fern",
    role: "FP&A Manager",
    blurb: "Runs the numbers — forecast, burn, and where the money's going.",
    idle: "Models are current — keeping an eye on spend.",
    shirt: "#2f6df0",
    tile: [3, 4],
    desk: [2, 2, 3],
    propTile: [3, 2],
    prop: "chart",
    phase: 0,
    keywords: ["forecast", "budget", "burn", "runway", "saas", "spend", "metrics", "board", "dashboard", "amazon", "valuation"],
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
    idle: "Balances look healthy — no moves needed right now.",
    shirt: "#0d9488",
    tile: [16, 4],
    desk: [15, 2, 3],
    propTile: [16, 2],
    prop: "vault",
    phase: 1.1,
    keywords: ["wire", "bank", "cash", "svb", "mercury", "wells fargo", "first citizens", "sweep", "liquidity", "nonco", "usdc", "fx", "treasury"],
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
    idle: "Books are tidy at the moment.",
    shirt: "#7c5cff",
    tile: [3, 9],
    desk: [2, 10, 3],
    propTile: [3, 10],
    prop: "ledger",
    phase: 2.0,
    keywords: ["tax", "audit", "bill.com", "invoice", "close", "reconcil", "numeral", "fica", "gusto", "payroll", "ledger", "401", "guideline", "bsa", "aml", "wework", "bridge", "reimburse"],
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
    idle: "Settlements are clean — nothing breaking.",
    shirt: "#f43f7e",
    tile: [16, 9],
    desk: [15, 10, 3],
    propTile: [16, 10],
    prop: "terminal",
    phase: 3.0,
    keywords: ["settlement", "payout", "processor", "worldpay", "checkout", "chargeback", "reserve", "velonix", "merchant", "recon"],
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
    blurb: "Keeps the floor moving — gives the brief and runs the standup.",
    idle: "Floor's calm — nothing needs you this minute.",
    shirt: "#f59e0b",
    tile: [9, 10],
    desk: [8, 11, 4],
    propTile: [9, 11],
    prop: "bell",
    phase: 0.6,
    keywords: ["hire", "candidate", "head of finance", "recruit", "calendar", "office hours", "send-off", "schedule", "standup", "visa"],
    processes: [
      { label: "Give the standup", action: "standup" },
      { label: "Open the Morning Brief", action: "brief" },
      { label: "What needs me today?", action: "preview" },
    ],
  },
]

export const AGENT_BY_ID: Record<AgentId, Agent> = Object.fromEntries(
  AGENTS.map((a) => [a.id, a]),
) as Record<AgentId, Agent>

// --- pixel sprite (shared by the canvas scene and the portrait component) ---

// 12×14 humanoid; palette-swapped per agent. '.' = transparent.
export const CHAR = [
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

export function charPalette(shirt: string): Record<string, string> {
  return {
    h: "#2f2a28", // hair
    f: "#e7b08a", // skin
    e: "#1a2230", // eyes (slate)
    t: shirt, // shirt
    n: "#e7b08a", // hands
    l: "#3a4254", // trousers (cool slate)
    s: "#1a2230", // shoes (slate)
  }
}

export function drawSprite(
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

// --- routing -----------------------------------------------------------------

// Keyword fallback for items the brief hasn't tagged with an owner yet.
export function classifyOwner(item: ActionItem | FYIItem): AgentId {
  const subject = "subject" in item ? item.subject : ""
  const hay = `${item.sender} ${subject} ${item.summary}`.toLowerCase()
  for (const agent of AGENTS) {
    if (agent.keywords.some((k) => hay.includes(k))) return agent.id
  }
  return "chief" // unrouted lands with the Chief of Staff
}

export function ownerOf(item: ActionItem | FYIItem): AgentId {
  return item.owner ?? classifyOwner(item)
}

export interface AgentBucket {
  agent: Agent
  actions: ActionItem[] // active (non-dismissed), urgent first
  fyis: FYIItem[]
  urgent: number
  active: number
  leadText: string // the desk's headline talking point for the standup
}

const byOverdue = (a: ActionItem, b: ActionItem) =>
  (b.overduedays ?? 0) - (a.overduedays ?? 0)

// Group the live brief onto desks, dropping anything already dismissed.
export function bucketByAgent(
  brief: Brief,
  dismissedIds: number[],
): Record<AgentId, AgentBucket> {
  const buckets = Object.fromEntries(
    AGENTS.map((agent) => [
      agent.id,
      { agent, actions: [], fyis: [], urgent: 0, active: 0, leadText: "" } as AgentBucket,
    ]),
  ) as Record<AgentId, AgentBucket>

  for (const action of brief.actions) {
    if (dismissedIds.includes(action.id)) continue
    buckets[ownerOf(action)].actions.push(action)
  }
  for (const fyi of brief.fyis) {
    buckets[ownerOf(fyi)].fyis.push(fyi)
  }

  for (const agent of AGENTS) {
    const b = buckets[agent.id]
    b.actions.sort((x, y) => Number(y.urgent) - Number(x.urgent) || byOverdue(x, y))
    b.active = b.actions.length
    b.urgent = b.actions.filter((a) => a.urgent).length
    const lead = b.actions[0] ?? b.fyis[0]
    b.leadText = lead ? lead.summary : agent.idle
  }

  return buckets
}
