"use client"

import { useState } from "react"
import { ActionItem } from "@/types/brief"

export default function ActionCard({
  item,
  index,
  onDismiss,
}: {
  item: ActionItem
  index: number
  onDismiss: () => void
}) {
  const [expanded, setExpanded] = useState(false)
  const [copied, setCopied] = useState(false)

  function copyDraft() {
    navigator.clipboard.writeText(item.draft)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

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

          {/* Draft — framed like a quoted reply, not a SaaS textbox */}
          <div
            className={`border-l-2 pl-4 mb-5 ${
              isSlack ? "border-slack/40" : "border-email/40"
            }`}
          >
            <div className="label text-ink-faint mb-2">
              Draft reply{item.draftUrl ? ` · ready in ${sourceLabel}` : ""}
            </div>
            <p className="font-body text-ink text-[1.05rem] leading-relaxed whitespace-pre-line max-w-prose">
              {item.draft}
            </p>
          </div>

          {/* Actions — open the ready-made draft, or fall back to the thread */}
          <div className="flex items-center gap-5">
            {item.draftUrl ? (
              <a
                href={item.draftUrl}
                target="_blank"
                rel="noopener noreferrer"
                className={`label px-3 py-1.5 rounded-sm transition-colors ${
                  isSlack
                    ? "bg-slack text-paper-raised hover:bg-slack/90"
                    : "bg-email text-paper-raised hover:bg-email/90"
                }`}
              >
                Open draft in {sourceLabel} ↗
              </a>
            ) : (
              <span className="label text-ink-faint">
                Draft will appear in {sourceLabel} after the next brief
              </span>
            )}
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
              onClick={onDismiss}
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
