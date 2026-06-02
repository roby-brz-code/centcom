"use client"

import { useState } from "react"
import { ActionItem } from "@/types/brief"

export default function ActionCard({ item, index }: { item: ActionItem; index: number }) {
  const [expanded, setExpanded] = useState(false)
  const [copied, setCopied] = useState(false)
  const [done, setDone] = useState(false)
  const [draft, setDraft] = useState(item.draft)
  const [sending, setSending] = useState(false)
  const [sent, setSent] = useState(false)
  const [error, setError] = useState<string | null>(null)

  function copyDraft() {
    navigator.clipboard.writeText(draft)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  async function send() {
    setSending(true)
    setError(null)
    try {
      const res = await fetch("/api/send", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id: item.id, draft }),
      })
      const json = (await res.json()) as { ok: boolean; error?: string }
      if (!json.ok) {
        setError(json.error ?? "Send failed")
        return
      }
      setSent(true)
      // Slide the card out once the reply is on its way.
      setTimeout(() => setDone(true), 1200)
    } catch {
      setError("Network error — could not reach the server")
    } finally {
      setSending(false)
    }
  }

  if (done) return null

  const isSlack = item.source === "slack"
  const sourceLabel = isSlack ? "Slack" : "Email"
  const sourceColor = isSlack ? "text-slack" : "text-email"

  return (
    <article
      className={`group border-b border-rule-soft border-l-2 transition-colors ${
        isSlack ? "border-l-slack/50" : "border-l-email/50"
      } ${expanded ? "bg-paper-raised" : "hover:bg-paper-raised/60"}`}
    >
      <button
        onClick={() => setExpanded(!expanded)}
        className="w-full text-left flex gap-4 px-1 py-4 items-baseline"
      >
        {/* Index / urgent marker */}
        <div className="w-7 flex-shrink-0 pt-0.5 text-center">
          {item.urgent ? (
            <span className="inline-block w-2 h-2 rounded-full bg-accent" />
          ) : (
            <span className="label text-ink-faint tabular-nums">
              {String(index + 1).padStart(2, "0")}
            </span>
          )}
        </div>

        <div className="flex-1 min-w-0">
          {/* Byline */}
          <div className="flex items-center gap-2.5 mb-1">
            <span
              className={`label inline-flex items-center px-1.5 py-0.5 rounded-sm ${sourceColor} ${
                isSlack ? "bg-slack/10" : "bg-email/10"
              }`}
            >
              {sourceLabel}
            </span>
            <span className="label text-ink-faint tabular-nums">{item.time}</span>
            {item.overduedays && (
              <>
                <span className="w-1 h-1 rounded-full bg-rule" />
                <span className="label text-accent">{item.overduedays}d waiting</span>
              </>
            )}
          </div>

          {/* Headline: sender + subject */}
          <h3 className="leading-snug">
            <span
              className="font-display text-ink"
              style={{ fontWeight: 560, fontSize: "1.0625rem" }}
            >
              {item.sender}
            </span>
            <span className="text-ink-faint mx-1.5">·</span>
            <span className="font-body italic text-ink-soft text-[1.05rem]">
              {item.subject}
            </span>
          </h3>

          {!expanded && (
            <p className="text-ink-faint text-[0.95rem] leading-snug mt-0.5 line-clamp-1">
              {item.preview}
            </p>
          )}
        </div>

        <span
          className={`label text-ink-faint flex-shrink-0 transition-transform pt-1 ${
            expanded ? "rotate-90" : ""
          }`}
        >
          ›
        </span>
      </button>

      {expanded && (
        <div className="pl-12 pr-1 pb-6 -mt-1">
          <p className="font-body text-ink-soft text-[1.05rem] leading-relaxed mb-5 max-w-prose">
            {item.summary}
          </p>

          {/* Draft — editable, framed like a quoted reply, not a SaaS textbox */}
          <div
            className={`border-l-2 pl-4 mb-4 ${
              isSlack ? "border-slack/40" : "border-email/40"
            }`}
          >
            <div className="label text-ink-faint mb-2">
              Reply{item.reply?.to ? ` to ${item.reply.to}` : ""}
            </div>
            <textarea
              value={draft}
              onChange={(e) => setDraft(e.target.value)}
              disabled={sending || sent}
              rows={Math.max(3, draft.split("\n").length + 1)}
              className="w-full bg-transparent font-body text-ink text-[1.05rem] leading-relaxed resize-none outline-none max-w-prose disabled:opacity-60"
            />
          </div>

          {error && (
            <p className="label text-accent mb-3">{error}</p>
          )}

          {/* Actions */}
          <div className="flex items-center gap-5">
            <button
              onClick={send}
              disabled={sending || sent || draft.trim().length === 0}
              className={`label px-3 py-1.5 rounded-sm transition-colors disabled:opacity-50 ${
                sent
                  ? "bg-email/15 text-email"
                  : isSlack
                  ? "bg-slack text-paper-raised hover:bg-slack/90"
                  : "bg-email text-paper-raised hover:bg-email/90"
              }`}
            >
              {sent ? "Sent ✓" : sending ? "Sending…" : `Send via ${sourceLabel}`}
            </button>
            <button
              onClick={copyDraft}
              className="label text-ink hover:text-accent transition-colors underline decoration-rule decoration-1 underline-offset-4 hover:decoration-accent"
            >
              {copied ? "Copied ✓" : "Copy"}
            </button>
            <a
              href={item.link}
              target="_blank"
              rel="noopener noreferrer"
              className="label text-ink hover:text-accent transition-colors underline decoration-rule decoration-1 underline-offset-4 hover:decoration-accent"
            >
              Open original ↗
            </a>
            <button
              onClick={() => setDone(true)}
              className="label text-ink-faint hover:text-ink transition-colors ml-auto"
            >
              Dismiss
            </button>
          </div>
        </div>
      )}
    </article>
  )
}
