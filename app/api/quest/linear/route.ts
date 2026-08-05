import { NextResponse } from "next/server"
import { isAuthed } from "@/lib/server/auth"
import demoData from "@/data/quests-demo.json"
import { Quest, Tier } from "@/types/quest"

// Quests come from Linear when LINEAR_API_KEY is set (a personal API key,
// https://linear.app/settings/api). Without it the demo quest file serves
// as a stand-in so the app stays fully usable.

export const dynamic = "force-dynamic"

const MAIN_LABEL = "quest:main"

interface LinearIssue {
  id: string
  identifier: string
  title: string
  url: string
  labels: { nodes: { name: string }[] }
}

function toTier(issue: LinearIssue): Tier {
  return issue.labels.nodes.some((l) => l.name.toLowerCase() === MAIN_LABEL) ? "main" : "side"
}

function toQuest(issue: LinearIssue): Quest {
  return {
    id: issue.id,
    identifier: issue.identifier,
    title: issue.title,
    tier: toTier(issue),
    url: issue.url,
  }
}

// Date is inlined as a string literal so we don't depend on Linear's
// exact scalar name for the comparator input type.
function buildQuery(completedAfter: string): string {
  return `
    query QuestBoard {
      viewer {
        open: assignedIssues(
          first: 50
          filter: { state: { type: { in: ["triage", "backlog", "unstarted", "started"] } } }
        ) {
          nodes { id identifier title url labels { nodes { name } } }
        }
        done: assignedIssues(
          first: 50
          filter: { state: { type: { eq: "completed" } }, completedAt: { gt: "${completedAfter}" } }
        ) {
          nodes { id identifier title url labels { nodes { name } } }
        }
      }
    }
  `
}

export async function GET() {
  if (!(await isAuthed())) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  const key = process.env.LINEAR_API_KEY
  if (!key) {
    return NextResponse.json({
      source: "demo",
      open: (demoData.quests as Quest[]).map((q) => ({ ...q })),
      completed: [],
    })
  }

  try {
    const completedAfter = new Date(Date.now() - 30 * 86_400_000).toISOString()
    const res = await fetch("https://api.linear.app/graphql", {
      method: "POST",
      headers: { "Content-Type": "application/json", Authorization: key },
      body: JSON.stringify({ query: buildQuery(completedAfter) }),
      cache: "no-store",
    })
    if (!res.ok) throw new Error(`Linear responded ${res.status}`)
    const json = await res.json()
    if (json.errors?.length) throw new Error(json.errors[0]?.message ?? "GraphQL error")

    const viewer = json.data.viewer
    return NextResponse.json({
      source: "linear",
      open: (viewer.open.nodes as LinearIssue[]).map(toQuest),
      completed: (viewer.done.nodes as LinearIssue[]).map(toQuest),
    })
  } catch (err) {
    return NextResponse.json(
      { source: "error", open: [], completed: [], error: String(err) },
      { status: 502 }
    )
  }
}
