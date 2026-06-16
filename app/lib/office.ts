import type { ActionItem, AgentId, Brief, FYIItem } from "@/types/brief"

// ---------------------------------------------------------------------------
// The Office roster, the skills each desk can run, and the routing that maps
// brief items onto desks.
//
// Single source of truth for who works the floor, their pixel-sprite identity,
// the skills they can run (on-demand + recurring), and how an inbox item finds
// its owner. The canvas scene and the agent panels both read from here.
// ---------------------------------------------------------------------------

export type PropType = "chart" | "vault" | "ledger" | "terminal" | "bell"
export type Cadence = "daily" | "weekly" | "monthly" | "quarterly"

// A capability a desk can run. `cadence` marks it as a recurring task; `sample`
// is the placeholder output shown when run (swap for a real call later).
export interface Skill {
  id: string
  label: string
  summary: string
  sample: string
  cadence?: Cadence
}

// One invocation of a skill. Lives in session state for now.
export interface SkillRun {
  id: number
  agentId: AgentId
  skillId: string
  label: string
  at: number
  status: "running" | "done"
  output?: string
}

export function cadenceLabel(c: Cadence): string {
  return { daily: "Daily", weekly: "Weekly", monthly: "Monthly", quarterly: "Quarterly" }[c]
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
  skills: Skill[]
}

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
    skills: [
      { id: "fpa-runway", label: "Burn & runway snapshot", cadence: "weekly", summary: "Net burn vs plan and months of runway at current spend.", sample: "Net burn ~$420k, just under plan. Runway ≈ 14 months. Two lines above forecast: cloud (+$12k), contractors (+$8k)." },
      { id: "fpa-variance", label: "Budget vs actual variance", cadence: "monthly", summary: "Compare the month's actuals to budget and flag the movers.", sample: "May: revenue +3% vs budget, opex +6%. Largest variance: SaaS (+$18k). Drafted a note for the board pack." },
      { id: "fpa-saas", label: "SaaS spend sweep", cadence: "monthly", summary: "Inventory SaaS tools and flag duplicates before renewals.", sample: "47 tools, $62k/mo. 6 likely duplicates (2× analytics, 2× e-sign). Est. $9k/mo if consolidated." },
      { id: "fpa-forecast", label: "Refresh the forecast", summary: "Rebuild the operating forecast from the latest actuals.", sample: "Forecast rebuilt from May actuals. Q3 revenue +4% vs prior model; runway unchanged." },
      { id: "fpa-board", label: "Board metrics pack", cadence: "monthly", summary: "Assemble the monthly metrics pack for review.", sample: "Drafted the pack: ARR, net burn, runway, headcount, top variances. Ready for your review." },
    ],
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
    skills: [
      { id: "tre-cash", label: "Cash position across banks", cadence: "daily", summary: "Consolidated balances across SVB, First Citizens, Mercury, Wells.", sample: "Total cash healthy across 4 banks; none below minimum. 5 payments scheduled today, 5 processed yesterday." },
      { id: "tre-crypto", label: "Crypto settlement liquidity", cadence: "daily", summary: "Check the settlement wallet is funded for today's runs.", sample: "Nonco: ETH in, $7.5M USDC out yesterday. Settlement wallet funded for today. No action." },
      { id: "tre-wire", label: "Prep a wire / sweep", summary: "Draft a sweep or wire for your approval.", sample: "Drafted: sweep idle balance → operating; AUS counsel wire queued. Both await your approval." },
      { id: "tre-runway", label: "Runway alarm", cadence: "weekly", summary: "Alert if the min-cash threshold is at risk in the horizon.", sample: "No breach of the min-cash threshold within the forecast horizon. All clear." },
      { id: "tre-fx", label: "FX exposure", cadence: "monthly", summary: "Review foreign-currency exposure and hedge needs.", sample: "AUD exposure from counsel invoices is small and within tolerance. No hedge recommended." },
    ],
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
    skills: [
      { id: "acc-recon", label: "Reconciliations", cadence: "weekly", summary: "Reconcile bank and processor activity for the week.", sample: "Bank + processor recon complete through last week. 1 unmatched item ($107 DoorDash) pending a memo." },
      { id: "acc-close", label: "Month-end close checklist", cadence: "monthly", summary: "Work the close checklist to a clean cutoff.", sample: "Close: 18/24 complete. Open: AUS counsel accrual, WeWork invoices, FICA adjustment." },
      { id: "acc-tax", label: "Tax filing status", cadence: "weekly", summary: "Status of state filings and any blockers.", sample: "Numeral: 5 states blocked on portal creds (ID/MN/KY/AL/NJ). CO & MS filed. Needs creds today." },
      { id: "acc-bills", label: "Approve bills", cadence: "daily", summary: "Pull bills and reimbursements awaiting approval.", sample: "Bill.com: 3 bills awaiting approval ($2.5k Fidelifacts + 2). Ramp: 4 reimbursements pending." },
      { id: "acc-audit", label: "Audit tracker", cadence: "weekly", summary: "Track open audit and confirmation requests.", sample: "BSA/AML (Dante) 14d overdue · Bridge YE confirmation monitoring · Checkout.com credit docs outstanding." },
    ],
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
    skills: [
      { id: "set-recon", label: "Processor recon", cadence: "weekly", summary: "Reconcile processor invoices to internal reports.", sample: "Worldpay IC++ invoice 437577906 reconciled to the MI report. 1 fee variance flagged for review." },
      { id: "set-run", label: "Run settlement", cadence: "daily", summary: "Build today's merchant settlement batch.", sample: "Today's batch built: payouts staged, totals balanced. Ready to release on your go." },
      { id: "set-payout", label: "Payout & break monitor", cadence: "daily", summary: "Watch payouts and surface settlement breaks.", sample: "All payouts cleared. Yesterday's Velonix break resolved. No open breaks." },
      { id: "set-chargeback", label: "Chargeback watch", cadence: "weekly", summary: "Monitor dispute volume and evidence deadlines.", sample: "Chargeback ratio within thresholds. 2 new disputes; evidence due in 5 days." },
      { id: "set-reserve", label: "Reserve tracking", cadence: "monthly", summary: "Track rolling reserves and processor reserve changes.", sample: "Rolling reserves on track. No processor reserve increases this period." },
    ],
  },
  {
    id: "chief",
    name: "Margo",
    role: "Chief of Staff",
    blurb: "Keeps the floor moving — routes the brief and runs the standup.",
    idle: "Floor's calm — nothing needs you this minute.",
    shirt: "#f59e0b",
    tile: [9, 10],
    desk: [8, 11, 4],
    propTile: [9, 11],
    prop: "bell",
    phase: 0.6,
    keywords: ["hire", "candidate", "head of finance", "recruit", "calendar", "office hours", "send-off", "schedule", "standup", "visa"],
    skills: [
      { id: "cos-route", label: "Route the morning brief", cadence: "daily", summary: "Sort the daily brief onto the right desks.", sample: "Routed the brief: Ada 7, Theo 1, Sol 1, Margo 2, Fern 0. 5 urgent flagged for first attention." },
      { id: "cos-today", label: "What needs me today?", summary: "The shortlist of things only you can clear.", sample: "Top 3 for you: Dante BSA/AML (14d), Numeral state creds, Dom's Head-of-Finance shortlist." },
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
