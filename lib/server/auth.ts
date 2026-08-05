import { createHash, createHmac, timingSafeEqual } from "node:crypto"
import { cookies } from "next/headers"

// Passphrase auth for a single-user personal app: the password lives in
// QUEST_PASSWORD (never in code), sessions are signed httpOnly cookies.
// With no QUEST_PASSWORD set the app runs in open dev mode.

export const SESSION_COOKIE = "qm_session"
const SESSION_SECONDS = 30 * 24 * 3600

export function authEnabled(): boolean {
  return Boolean(process.env.QUEST_PASSWORD)
}

function secret(): string {
  // Optional dedicated signing secret; otherwise derived from the password
  return (
    process.env.QUEST_SECRET ??
    createHash("sha256").update(`qm-secret:${process.env.QUEST_PASSWORD}`).digest("hex")
  )
}

function sign(exp: number): string {
  return createHmac("sha256", secret()).update(String(exp)).digest("hex")
}

export function makeSessionCookie(): { value: string; maxAge: number } {
  const exp = Math.floor(Date.now() / 1000) + SESSION_SECONDS
  return { value: `${exp}.${sign(exp)}`, maxAge: SESSION_SECONDS }
}

export async function isAuthed(): Promise<boolean> {
  if (!authEnabled()) return true
  const raw = (await cookies()).get(SESSION_COOKIE)?.value
  if (!raw) return false
  const dot = raw.indexOf(".")
  if (dot < 1) return false
  const exp = Number(raw.slice(0, dot))
  const sig = raw.slice(dot + 1)
  if (!Number.isFinite(exp) || exp < Date.now() / 1000) return false
  const expected = Buffer.from(sign(exp))
  const given = Buffer.from(sig)
  return given.length === expected.length && timingSafeEqual(given, expected)
}

export function checkPassword(candidate: string): boolean {
  const real = process.env.QUEST_PASSWORD
  if (!real || typeof candidate !== "string") return false
  // Compare digests so lengths always match for timingSafeEqual
  const a = createHash("sha256").update(candidate).digest()
  const b = createHash("sha256").update(real).digest()
  return timingSafeEqual(a, b)
}
