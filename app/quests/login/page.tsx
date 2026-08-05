"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import PixelHero from "@/app/components/quest/PixelHero"

export default function QuestLoginPage() {
  const router = useRouter()
  const [password, setPassword] = useState("")
  const [error, setError] = useState(false)
  const [busy, setBusy] = useState(false)

  // Skip the gate entirely when auth isn't configured
  useEffect(() => {
    fetch("/api/quest/login")
      .then((r) => r.json())
      .then((d) => {
        if (!d.enabled || d.authed) router.replace("/quests")
      })
      .catch(() => {})
  }, [router])

  async function submit() {
    if (!password || busy) return
    setBusy(true)
    setError(false)
    const res = await fetch("/api/quest/login", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ password }),
    }).catch(() => null)
    if (res?.ok) {
      router.replace("/quests")
    } else {
      setError(true)
      setBusy(false)
    }
  }

  return (
    <div className="qm-page min-h-screen flex items-center justify-center px-4">
      <div className="qm-panel px-8 sm:px-12 py-10 w-full max-w-sm flex flex-col items-center gap-5">
        <PixelHero state="idle" size={64} />
        <div className="text-center">
          <h1 className="font-display text-[1.5rem] font-semibold text-qm-bright">Quest Mode</h1>
          <p className="text-[0.8rem] text-qm-dim mt-1">Speak the passphrase to enter</p>
        </div>
        <input
          type="password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && submit()}
          placeholder="Passphrase"
          autoFocus
          className="qm-chip w-full text-center text-[0.95rem] py-2.5 text-qm-bright outline-none placeholder:text-qm-dim/50"
          aria-label="Passphrase"
        />
        {error && <p className="text-[0.78rem] text-qm-danger">That's not it — try again.</p>}
        <button
          onClick={submit}
          disabled={busy || !password}
          className="qm-btn-gold w-full py-3 text-[0.95rem] disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {busy ? "Checking…" : "Enter"}
        </button>
      </div>
    </div>
  )
}
