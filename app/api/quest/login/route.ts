import { cookies } from "next/headers"
import { NextResponse } from "next/server"
import { authEnabled, checkPassword, isAuthed, makeSessionCookie, SESSION_COOKIE } from "@/lib/server/auth"

export async function GET() {
  return NextResponse.json({ enabled: authEnabled(), authed: await isAuthed() })
}

export async function POST(req: Request) {
  if (!authEnabled()) return NextResponse.json({ ok: true })

  let password = ""
  try {
    const body = await req.json()
    password = typeof body?.password === "string" ? body.password : ""
  } catch {
    return NextResponse.json({ error: "Bad request" }, { status: 400 })
  }
  if (password.length === 0 || password.length > 256) {
    return NextResponse.json({ error: "Bad request" }, { status: 400 })
  }

  if (!checkPassword(password)) {
    // Slow down brute-force attempts
    await new Promise((r) => setTimeout(r, 400))
    return NextResponse.json({ error: "Wrong password" }, { status: 401 })
  }

  const session = makeSessionCookie()
  const store = await cookies()
  store.set(SESSION_COOKIE, session.value, {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: session.maxAge,
  })
  return NextResponse.json({ ok: true })
}

export async function DELETE() {
  const store = await cookies()
  store.delete(SESSION_COOKIE)
  return NextResponse.json({ ok: true })
}
