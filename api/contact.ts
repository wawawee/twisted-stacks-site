/**
 * TwistedStacks contact form endpoint — POST /api/contact
 *
 * Accepts a JSON body from the in-app contact panel (Book Demo / Contact /
 * easter vault / per-project CTA) and:
 *
 *   1. Validates the shape — name + email + topic + intent + message.
 *      Anything that fails the regex / length checks is rejected as 400.
 *   2. Checks a hidden honeypot field (`website`). Filled by a bot? 200 OK
 *      with no store, no email. Real users never see this field.
 *   3. Rate-limits per client IP — same pattern as /api/leaderboard.
 *   4. Stores the row in Supabase (`contact_submissions` table) with a
 *      service-role key. PII stays server-side.
 *   5. Tries to forward the message to the studio inbox via Resend when
 *      RESEND_API_KEY is set. Without the key, the row is still stored
 *      and the endpoint returns success — the operator triages in the
 *      Supabase Studio until the key is wired.
 *   6. Sends a one-line auto-reply to the submitter when Resend is set,
 *      so they get the "we got it" confirmation without the studio
 *      having to reply manually.
 *
 * Required env (server-side):
 *   SUPABASE_URL                    — Supabase project URL
 *   SUPABASE_SERVICE_ROLE_KEY       — server-side service role key
 *
 * Optional env (turns on email forwarding):
 *   RESEND_API_KEY                  — Resend API key
 *   CONTACT_FROM_EMAIL              — sender (e.g. hello@twistedstacks.com)
 *   CONTACT_TO_EMAIL                — recipient (defaults to hello@twistedstacks.com)
 *   CONTACT_REPLY_TO                — reply-to (defaults to the submitter's email)
 *   CONTACT_NOTIFY_EMAIL            — bcc (defaults to dev@twistedstacks.com)
 */

import { createClient } from "@supabase/supabase-js";

const TABLE_NAME = "contact_submissions";

const NAME_MIN = 1;
const NAME_MAX = 120;
const EMAIL_MAX = 254;
const COMPANY_MAX = 160;
const TOPIC_MAX = 80;
const MESSAGE_MIN = 1;
const MESSAGE_MAX = 4000;
const LOCALE_MAX = 8;
const UA_MAX = 512;
const URL_MAX = 2048;

const RATE_LIMIT_WINDOW_MS = 60_000;
const RATE_LIMIT_MAX_WRITES = 3; // tighter than leaderboard — this writes PII

const VALID_INTENTS = new Set(["demo", "feedback", "bug", "query"]);

const EMAIL_REGEX = /^[^@\s]+@[^@\s]+\.[^@\s]+$/;
// Block obvious role aliases and obvious spam patterns at the email layer.
// These are still validated server-side again; the regex is the first gate.
const EMAIL_BLOCKLIST = new Set([
  "noreply@twistedstacks.com",
  "no-reply@twistedstacks.com",
  "postmaster@twistedstacks.com",
]);

interface ContactSubmission {
  name: string;
  email: string;
  company: string | null;
  topic: string;
  intent: "demo" | "feedback" | "bug" | "query";
  message: string;
  website?: string; // honeypot
  locale?: string;
  sourceUrl?: string;
  referrer?: string;
  userAgent?: string;
}

interface NormalizedSubmission {
  name: string;
  email: string;
  company: string | null;
  topic: string;
  intent: "demo" | "feedback" | "bug" | "query";
  message: string;
  locale: string | null;
  sourceUrl: string | null;
  referrer: string | null;
  userAgent: string | null;
}

interface VercelRequest {
  method?: string;
  query: Record<string, string | string[] | undefined>;
  body?: unknown;
  headers: Record<string, string | string[] | undefined>;
}

interface VercelResponse {
  setHeader(name: string, value: string): void;
  status(code: number): VercelResponse;
  json(body: unknown): void;
  end(): void;
}

const writeWindows = new Map<string, number[]>();

function readEnv(name: string): string | null {
  const raw = process.env[name];
  if (typeof raw !== "string") return null;
  const trimmed = raw.trim();
  if (!trimmed) return null;
  return trimmed.replace(/^['"]|['"]$/g, "");
}

function getSupabaseClient() {
  const url = readEnv("SUPABASE_URL") || readEnv("VITE_SUPABASE_URL");
  const serviceRoleKey =
    readEnv("SUPABASE_SERVICE_ROLE_KEY") ||
    readEnv("SUPABASE_SECRET_KEY") ||
    readEnv("SUPABASE_SERVICE_KEY");

  if (!url || !serviceRoleKey) {
    throw new Error("Supabase contact environment is not configured.");
  }

  return createClient(url, serviceRoleKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  });
}

function trimTo(value: unknown, max: number): string | null {
  if (typeof value !== "string") return null;
  const collapsed = value.replace(/\s+/g, " ").trim();
  if (!collapsed) return null;
  return collapsed.slice(0, max);
}

function plainTo(value: unknown, max: number): string | null {
  if (typeof value !== "string") return null;
  const trimmed = value.trim();
  if (!trimmed) return null;
  return trimmed.slice(0, max);
}

function normalize(value: unknown, max: number): string | null {
  // For free-form fields (message, source URL, user agent) we keep the raw
  // shape — only trim ends and clip to max length. No whitespace squashing.
  if (typeof value !== "string") return null;
  const trimmed = value.trim();
  if (!trimmed) return null;
  return trimmed.slice(0, max);
}

function normalizeSubmission(body: unknown): NormalizedSubmission {
  const data =
    typeof body === "object" && body !== null ? (body as Record<string, unknown>) : {};

  const name = trimTo(data.name, NAME_MAX);
  const email = trimTo(data.email, EMAIL_MAX)?.toLowerCase() ?? null;
  const company = trimTo(data.company, COMPANY_MAX);
  const topic = trimTo(data.topic, TOPIC_MAX);
  const intent = typeof data.intent === "string" ? data.intent.toLowerCase() : "";
  const message = normalize(data.message, MESSAGE_MAX);
  const locale = plainTo(data.locale, LOCALE_MAX);
  const sourceUrl = plainTo(data.sourceUrl, URL_MAX);
  const referrer = plainTo(data.referrer, URL_MAX);
  const userAgent = plainTo(data.userAgent, UA_MAX);

  if (!name) throw new ValidationError("Name is required.");
  if (!email || !EMAIL_REGEX.test(email)) throw new ValidationError("Valid email is required.");
  if (EMAIL_BLOCKLIST.has(email)) throw new ValidationError("That email cannot receive a reply.");
  if (!topic) throw new ValidationError("Topic is required.");
  if (!VALID_INTENTS.has(intent)) throw new ValidationError("Pick a valid intent.");
  if (!message || message.length < MESSAGE_MIN) throw new ValidationError("Message cannot be empty.");
  if (message.length > MESSAGE_MAX) throw new ValidationError("Message is too long.");

  return {
    name,
    email,
    company,
    topic,
    intent: intent as NormalizedSubmission["intent"],
    message,
    locale,
    sourceUrl,
    referrer,
    userAgent,
  };
}

class ValidationError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "ValidationError";
  }
}

function parseBody(body: unknown): unknown {
  if (body == null) return null;
  if (typeof body === "string") {
    try {
      return JSON.parse(body);
    } catch {
      return null;
    }
  }
  return body;
}

function getClientIp(req: VercelRequest): string {
  const forwardedFor = req.headers["x-forwarded-for"];
  const raw = Array.isArray(forwardedFor) ? forwardedFor[0] : forwardedFor;
  return raw?.split(",")[0]?.trim() || "unknown";
}

function isRateLimited(req: VercelRequest): boolean {
  const ip = getClientIp(req);
  const now = Date.now();
  const recent = (writeWindows.get(ip) || []).filter(
    (timestamp) => now - timestamp < RATE_LIMIT_WINDOW_MS,
  );
  if (recent.length >= RATE_LIMIT_MAX_WRITES) {
    writeWindows.set(ip, recent);
    return true;
  }
  recent.push(now);
  writeWindows.set(ip, recent);
  return false;
}

function looksLikeBot(body: unknown): boolean {
  if (typeof body !== "object" || body === null) return false;
  const data = body as Record<string, unknown>;
  // Honeypot — bots fill every input, real users never see this field.
  const website = typeof data.website === "string" ? data.website.trim() : "";
  return website.length > 0;
}

async function storeSubmission(
  submission: NormalizedSubmission,
  ip: string,
): Promise<{ id: number } | null> {
  const client = getSupabaseClient();
  const { data, error } = await client
    .from(TABLE_NAME)
    .insert({
      name: submission.name,
      email: submission.email,
      company: submission.company,
      topic: submission.topic,
      intent: submission.intent,
      message: submission.message,
      source_url: submission.sourceUrl,
      referrer: submission.referrer,
      user_agent: submission.userAgent,
      ip,
      locale: submission.locale,
    })
    .select("id")
    .single();

  if (error) throw new Error(error.message);
  return data as { id: number } | null;
}

async function markForwarded(
  id: number,
  provider: string,
  errorMessage: string | null,
): Promise<void> {
  try {
    const client = getSupabaseClient();
    await client
      .from(TABLE_NAME)
      .update({
        forwarded_at: errorMessage ? null : new Date().toISOString(),
        forward_provider: provider,
        forward_error: errorMessage,
      })
      .eq("id", id);
  } catch (err) {
    // The row is already stored; a failure to mark the forward outcome is
    // not worth blocking the response on. We log and move on.
    console.warn("Could not update forward status:", err);
  }
}

function escapeHtml(value: string): string {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

function buildNotificationEmail(submission: NormalizedSubmission): {
  subject: string;
  text: string;
  html: string;
} {
  const subject = `[TwistedStacks] ${submission.topic} — ${submission.intent} from ${submission.name}`;
  const lines: string[] = [
    `Name:     ${submission.name}`,
    `Email:    ${submission.email}`,
    `Company:  ${submission.company ?? "(not provided)"}`,
    `Topic:    ${submission.topic}`,
    `Intent:   ${submission.intent}`,
    `Locale:   ${submission.locale ?? "(unknown)"}`,
    `Source:   ${submission.sourceUrl ?? "(unknown)"}`,
    `Referrer: ${submission.referrer ?? "(none)"}`,
    `UA:       ${submission.userAgent ?? "(unknown)"}`,
    "",
    "Message:",
    submission.message,
  ];
  const text = lines.join("\n");

  const html = `
    <div style="font-family: 'JetBrains Mono', ui-monospace, monospace; color: #1a0e0c; line-height: 1.55;">
      <h2 style="margin: 0 0 14px; font-size: 16px; letter-spacing: 0.12em; text-transform: uppercase;">
        New contact submission
      </h2>
      <table style="border-collapse: collapse; font-size: 13px;">
        ${[
          ["Name", submission.name],
          ["Email", submission.email],
          ["Company", submission.company ?? "(not provided)"],
          ["Topic", submission.topic],
          ["Intent", submission.intent],
          ["Locale", submission.locale ?? "(unknown)"],
          ["Source URL", submission.sourceUrl ?? "(unknown)"],
          ["Referrer", submission.referrer ?? "(none)"],
          ["User-Agent", submission.userAgent ?? "(unknown)"],
        ]
          .map(
            ([label, value]) =>
              `<tr><td style="padding: 3px 12px 3px 0; color: #564a42; text-transform: uppercase; letter-spacing: 0.12em; font-size: 11px;">${label}</td><td style="padding: 3px 0;">${escapeHtml(value)}</td></tr>`,
          )
          .join("")}
      </table>
      <h3 style="margin: 18px 0 8px; font-size: 12px; letter-spacing: 0.18em; text-transform: uppercase; color: #564a42;">
        Message
      </h3>
      <pre style="white-space: pre-wrap; margin: 0; padding: 12px 14px; background: #f6efe7; border: 1px solid #d8c5b9; font-size: 13px; line-height: 1.55;">${escapeHtml(submission.message)}</pre>
    </div>
  `;

  return { subject, text, html };
}

function buildAutoReply(submission: NormalizedSubmission): {
  subject: string;
  text: string;
  html: string;
} {
  const subject = "Tack för ditt meddelande till TwistedStacks";
  const text = [
    `Hej ${submission.name},`,
    "",
    "Tack för att du hör av dig till TwistedStacks. Vi har tagit emot ditt meddelande och svarar inom 1–2 arbetsdagar.",
    "",
    "— Per Brinell",
    "TwistedStacks · hello@twistedstacks.com",
  ].join("\n");

  const html = `
    <div style="font-family: 'Space Grotesk', system-ui, sans-serif; color: #261512; line-height: 1.6;">
      <p style="margin: 0 0 14px;">Hej ${escapeHtml(submission.name)},</p>
      <p style="margin: 0 0 14px;">
        Tack för att du hör av dig till TwistedStacks. Vi har tagit emot ditt
        meddelande och svarar inom 1–2 arbetsdagar.
      </p>
      <p style="margin: 18px 0 0; color: #564a42;">— Per Brinell<br/>TwistedStacks · hello@twistedstacks.com</p>
    </div>
  `;

  return { subject, text, html };
}

interface ResendResponse {
  id?: string;
}

interface SendResult {
  ok: boolean;
  id: string | null;
  error: string | null;
}

async function sendViaResend(
  payload: { subject: string; text: string; html: string },
  options: { to: string; replyTo?: string; from: string; cc?: string },
  apiKey: string,
): Promise<SendResult> {
  try {
    const response = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        from: options.from,
        to: [options.to],
        ...(options.cc ? { cc: [options.cc] } : {}),
        ...(options.replyTo ? { reply_to: [options.replyTo] } : {}),
        subject: payload.subject,
        text: payload.text,
        html: payload.html,
      }),
    });

    if (!response.ok) {
      const errorText = await response.text().catch(() => "");
      return {
        ok: false,
        id: null,
        error: `Resend ${response.status}: ${errorText.slice(0, 240)}`,
      };
    }

    const json = (await response.json().catch(() => ({}))) as ResendResponse;
    return { ok: true, id: json.id || "sent", error: null };
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    return { ok: false, id: null, error: message };
  }
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
  res.setHeader("Cache-Control", "no-store");

  if (req.method !== "POST") {
    res.setHeader("Allow", "POST");
    res.status(405).json({ error: "Method not allowed." });
    return;
  }

  if (isRateLimited(req)) {
    res.status(429).json({ error: "Too many submissions. Try again in a minute." });
    return;
  }

  const rawBody = parseBody(req.body);

  // Honeypot check — pretend success so bots move on, store nothing.
  if (looksLikeBot(rawBody)) {
    res.status(200).json({ ok: true, stored: false });
    return;
  }

  let submission: NormalizedSubmission;
  try {
    submission = normalizeSubmission(rawBody);
  } catch (err) {
    if (err instanceof ValidationError) {
      res.status(400).json({ error: err.message });
      return;
    }
    throw err;
  }

  const ip = getClientIp(req);
  let storedId: number | null = null;
  try {
    const stored = await storeSubmission(submission, ip);
    storedId = stored?.id ?? null;
  } catch (err) {
    const message = err instanceof Error ? err.message : "Contact store unavailable.";
    console.error("Contact store error:", message);
    res.status(500).json({ error: "Could not store your message. Email hello@twistedstacks.com directly." });
    return;
  }

  // Forward via Resend if configured.
  const apiKey = readEnv("RESEND_API_KEY");
  const fromEmail = readEnv("CONTACT_FROM_EMAIL") || "TwistedStacks <hello@twistedstacks.com>";
  const toEmail = readEnv("CONTACT_TO_EMAIL") || "hello@twistedstacks.com";
  const notifyEmail = readEnv("CONTACT_NOTIFY_EMAIL") || "dev@twistedstacks.com";
  const replyTo = readEnv("CONTACT_REPLY_TO") || submission.email;

  let forwarded = false;
  let forwardError: string | null = null;

  if (apiKey) {
    const notification = buildNotificationEmail(submission);
    const studioResult = await sendViaResend(
      notification,
      { to: toEmail, replyTo, from: fromEmail, cc: notifyEmail },
      apiKey,
    );
    if (studioResult.ok) {
      forwarded = true;
    } else if (studioResult.error) {
      forwardError = studioResult.error;
    }

    // Auto-reply only when forwarding actually worked — otherwise the
    // submitter would get a "we got it" message from us while we still
    // didn't see it. We never send an auto-reply when forwarding fails.
    if (forwarded) {
      const autoReply = buildAutoReply(submission);
      const replyResult = await sendViaResend(
        autoReply,
        { to: submission.email, from: fromEmail },
        apiKey,
      );
      if (!replyResult.ok && replyResult.error) {
        // Auto-reply failure is logged but does not flip `forwarded`.
        forwardError = forwardError
          ? `${forwardError}; auto-reply: ${replyResult.error}`
          : `auto-reply: ${replyResult.error}`;
      }
    }

    if (storedId) {
      await markForwarded(storedId, "resend", forwarded ? null : forwardError);
    }
  } else {
    // No Resend key yet — store-only mode is the documented fallback.
    console.warn(
      "Contact received without RESEND_API_KEY; stored only, not forwarded.",
      { storedId, topic: submission.topic, intent: submission.intent },
    );
  }

  res.status(200).json({
    ok: true,
    stored: storedId != null,
    forwarded,
  });
}
