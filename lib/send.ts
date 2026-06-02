import type { ReplyTarget } from "@/types/brief"

// All credentials come from the environment — never hardcoded, never echoed.
// Least privilege: Gmail uses a refresh token scoped to gmail.send only;
// Slack uses a bot token with chat:write only.

export type SendResult = { ok: true } | { ok: false; error: string }

function base64url(input: string): string {
  return Buffer.from(input, "utf-8")
    .toString("base64")
    .replace(/\+/g, "-")
    .replace(/\//g, "_")
    .replace(/=+$/, "")
}

async function getGoogleAccessToken(): Promise<string> {
  const clientId = process.env.GOOGLE_CLIENT_ID
  const clientSecret = process.env.GOOGLE_CLIENT_SECRET
  const refreshToken = process.env.GOOGLE_REFRESH_TOKEN

  if (!clientId || !clientSecret || !refreshToken) {
    throw new Error("Gmail credentials are not configured on the server")
  }

  const res = await fetch("https://oauth2.googleapis.com/token", {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({
      client_id: clientId,
      client_secret: clientSecret,
      refresh_token: refreshToken,
      grant_type: "refresh_token",
    }),
  })

  if (!res.ok) {
    throw new Error("Could not refresh Gmail access token")
  }
  const json = (await res.json()) as { access_token?: string }
  if (!json.access_token) {
    throw new Error("Gmail token response missing access_token")
  }
  return json.access_token
}

export async function sendEmailReply(
  reply: ReplyTarget,
  body: string
): Promise<SendResult> {
  if (!reply.to || !reply.threadId) {
    return { ok: false, error: "This item has no email reply target" }
  }

  try {
    const accessToken = await getGoogleAccessToken()

    const subject = reply.emailSubject
      ? reply.emailSubject.startsWith("Re:")
        ? reply.emailSubject
        : `Re: ${reply.emailSubject}`
      : "Re:"

    // Build a minimal RFC 822 message. In-Reply-To / References keep Gmail
    // threading intact so it shows up as a reply, not a new conversation.
    const headers = [
      `To: ${reply.to}`,
      `Subject: ${subject}`,
      'Content-Type: text/plain; charset="UTF-8"',
      "MIME-Version: 1.0",
    ]
    if (reply.messageId) {
      headers.push(`In-Reply-To: ${reply.messageId}`)
      headers.push(`References: ${reply.messageId}`)
    }
    const raw = base64url(`${headers.join("\r\n")}\r\n\r\n${body}`)

    const res = await fetch(
      "https://gmail.googleapis.com/gmail/v1/users/me/messages/send",
      {
        method: "POST",
        headers: {
          Authorization: `Bearer ${accessToken}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ raw, threadId: reply.threadId }),
      }
    )

    if (!res.ok) {
      return { ok: false, error: "Gmail rejected the send" }
    }
    return { ok: true }
  } catch (err) {
    return {
      ok: false,
      error: err instanceof Error ? err.message : "Unknown error sending email",
    }
  }
}

export async function sendSlackReply(
  reply: ReplyTarget,
  text: string
): Promise<SendResult> {
  if (!reply.channel) {
    return { ok: false, error: "This item has no Slack reply target" }
  }

  const token = process.env.SLACK_BOT_TOKEN
  if (!token) {
    return { ok: false, error: "Slack credentials are not configured on the server" }
  }

  try {
    const res = await fetch("https://slack.com/api/chat.postMessage", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json; charset=utf-8",
      },
      body: JSON.stringify({
        channel: reply.channel,
        thread_ts: reply.threadTs,
        text,
      }),
    })

    const json = (await res.json()) as { ok: boolean; error?: string }
    if (!json.ok) {
      return { ok: false, error: `Slack: ${json.error ?? "send failed"}` }
    }
    return { ok: true }
  } catch (err) {
    return {
      ok: false,
      error: err instanceof Error ? err.message : "Unknown error sending Slack message",
    }
  }
}
