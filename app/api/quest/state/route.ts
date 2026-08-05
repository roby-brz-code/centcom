import { NextResponse } from "next/server"
import fs from "node:fs/promises"
import path from "node:path"
import { authEnabled, isAuthed } from "@/lib/server/auth"

// Server-side persistence: one JSON file, one user (see PRD §6).
const FILE = path.join(process.cwd(), "data", "quest-store.json")
const MAX_BYTES = 512 * 1024

export async function GET() {
  if (!(await isAuthed())) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  let store: unknown = null
  try {
    store = JSON.parse(await fs.readFile(FILE, "utf8"))
  } catch {
    // No saved state yet
  }
  return NextResponse.json({ store, auth: authEnabled() })
}

export async function PUT(req: Request) {
  if (!(await isAuthed())) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  const text = await req.text()
  if (text.length > MAX_BYTES) {
    return NextResponse.json({ error: "Payload too large" }, { status: 413 })
  }
  let parsed: unknown
  try {
    parsed = JSON.parse(text)
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 })
  }
  if (typeof parsed !== "object" || parsed === null || Array.isArray(parsed)) {
    return NextResponse.json({ error: "Expected an object" }, { status: 400 })
  }

  await fs.mkdir(path.dirname(FILE), { recursive: true })
  const tmp = `${FILE}.tmp`
  await fs.writeFile(tmp, JSON.stringify(parsed, null, 2), "utf8")
  await fs.rename(tmp, FILE)
  return NextResponse.json({ ok: true })
}
