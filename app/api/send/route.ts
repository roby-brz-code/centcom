import briefData from "@/data/brief.json"
import type { Brief } from "@/types/brief"
import { sendEmailReply, sendSlackReply } from "@/lib/send"

export const runtime = "nodejs"
export const dynamic = "force-dynamic"

const MAX_DRAFT_LENGTH = 10_000

export async function POST(request: Request) {
  let payload: unknown
  try {
    payload = await request.json()
  } catch {
    return Response.json({ ok: false, error: "Invalid JSON body" }, { status: 400 })
  }

  // Explicit input validation — id must be a number, draft a bounded string.
  const { id, draft } = (payload ?? {}) as { id?: unknown; draft?: unknown }
  if (typeof id !== "number" || !Number.isFinite(id)) {
    return Response.json({ ok: false, error: "Missing or invalid id" }, { status: 400 })
  }
  if (typeof draft !== "string" || draft.trim().length === 0) {
    return Response.json({ ok: false, error: "Draft is empty" }, { status: 400 })
  }
  if (draft.length > MAX_DRAFT_LENGTH) {
    return Response.json({ ok: false, error: "Draft is too long" }, { status: 413 })
  }

  // Resolve the target from the server's own data, NOT from the client.
  // The client may edit the draft text, but it cannot choose the recipient.
  const brief = briefData as Brief
  const item = brief.actions.find((a) => a.id === id)
  if (!item) {
    return Response.json({ ok: false, error: "Unknown action id" }, { status: 404 })
  }
  if (!item.reply) {
    return Response.json(
      { ok: false, error: "This item has no reply target configured" },
      { status: 422 }
    )
  }

  const result =
    item.source === "slack"
      ? await sendSlackReply(item.reply, draft)
      : await sendEmailReply(item.reply, draft)

  if (!result.ok) {
    return Response.json({ ok: false, error: result.error }, { status: 502 })
  }
  return Response.json({ ok: true })
}
