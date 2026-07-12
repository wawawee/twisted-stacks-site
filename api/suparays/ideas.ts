import { createClient } from "@supabase/supabase-js";

import {
  parseCookieHeader,
  readEnv,
  requireSession,
  type VercelRequest,
  type VercelResponse,
} from "./session.js";
import { syncIdeaToWiki } from "./sync-idea-wiki.js";

const TABLE = "suparays_ideas";
const VALID_MEMBERS = new Set(["baha", "kris", "joachim", "per"]);
const BODY_MIN = 1;
const BODY_MAX = 8000;
const DEFAULT_LIMIT = 50;
const MAX_LIMIT = 100;
const RATE_LIMIT_WINDOW_MS = 60_000;
const RATE_LIMIT_MAX_WRITES = 8;

const writeWindows = new Map<string, number[]>();

interface IdeaEntry {
  id: number;
  member: string;
  body: string;
  createdAt: string;
}

function getSupabaseClient() {
  const url = readEnv("SUPABASE_URL") || readEnv("VITE_SUPABASE_URL");
  const serviceRoleKey = readEnv("SUPABASE_SERVICE_ROLE_KEY") || readEnv("SUPABASE_SERVICE_KEY");
  if (!url || !serviceRoleKey) {
    throw new Error("Supabase is not configured.");
  }
  return createClient(url, serviceRoleKey, {
    auth: { autoRefreshToken: false, persistSession: false },
  });
}

function getMemberFromRequest(req: VercelRequest) {
  const cookies = parseCookieHeader(req.headers.cookie);
  const member = cookies.get("suparays_member")?.trim().toLowerCase() || "";
  return VALID_MEMBERS.has(member) ? member : "";
}

function getClientIp(req: VercelRequest) {
  const forwardedFor = req.headers["x-forwarded-for"];
  const raw = Array.isArray(forwardedFor) ? forwardedFor[0] : forwardedFor;
  return raw?.split(",")[0]?.trim() || "unknown";
}

function isRateLimited(req: VercelRequest) {
  const ip = getClientIp(req);
  const now = Date.now();
  const recent = (writeWindows.get(ip) || []).filter((t) => now - t < RATE_LIMIT_WINDOW_MS);
  if (recent.length >= RATE_LIMIT_MAX_WRITES) {
    writeWindows.set(ip, recent);
    return true;
  }
  recent.push(now);
  writeWindows.set(ip, recent);
  return false;
}

function parseBody(body: unknown) {
  if (typeof body !== "string") return body as Record<string, unknown>;
  try {
    return JSON.parse(body) as Record<string, unknown>;
  } catch {
    return null;
  }
}

function parseLimit(value: string | string[] | undefined) {
  const raw = Array.isArray(value) ? value[0] : value;
  const parsed = Number.parseInt(raw || String(DEFAULT_LIMIT), 10);
  if (!Number.isFinite(parsed)) return DEFAULT_LIMIT;
  return Math.max(1, Math.min(MAX_LIMIT, parsed));
}

function normalizeBody(value: unknown) {
  return String(value ?? "")
    .replace(/\r\n/g, "\n")
    .trim()
    .slice(0, BODY_MAX);
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
  res.setHeader("Cache-Control", "no-store");

  if (!requireSession(req, res)) return;

  let supabase;
  try {
    supabase = getSupabaseClient();
  } catch (err) {
    res.status(503).json({ error: err instanceof Error ? err.message : "Database unavailable" });
    return;
  }

  if (req.method === "GET") {
    const limit = parseLimit(req.query.limit);
    const { data, error } = await supabase
      .from(TABLE)
      .select("id, member, body, created_at")
      .order("created_at", { ascending: false })
      .limit(limit);

    if (error) {
      res.status(500).json({ error: error.message });
      return;
    }

    const rows = (data || []) as Array<{ id: number; member: string; body: string; created_at: string }>;
    const ideas: IdeaEntry[] = rows.reverse().map((row) => ({
      id: row.id,
      member: row.member,
      body: row.body,
      createdAt: row.created_at,
    }));

    res.status(200).json({ ideas });
    return;
  }

  if (req.method === "POST") {
    if (isRateLimited(req)) {
      res.status(429).json({ error: "För många idéer — vänta en stund." });
      return;
    }

    const member = getMemberFromRequest(req);
    if (!member) {
      res.status(400).json({ error: "Ogiltig session — logga in igen." });
      return;
    }

    const bodyObj = parseBody(req.body);
    const text = normalizeBody(bodyObj?.body);
    if (text.length < BODY_MIN) {
      res.status(400).json({ error: "Idén är tom." });
      return;
    }

    const { data, error } = await supabase
      .from(TABLE)
      .insert({ member, body: text })
      .select("id, member, body, created_at")
      .single();

    if (error) {
      res.status(500).json({ error: error.message });
      return;
    }

    const row = data as { id: number; member: string; body: string; created_at: string };
    const idea = {
      id: row.id,
      member: row.member,
      body: row.body,
      createdAt: row.created_at,
    } satisfies IdeaEntry;

    const wiki = await syncIdeaToWiki(idea);

    try {
      if (wiki.synced) {
        await supabase
          .from(TABLE)
          .update({ wiki_synced_at: new Date().toISOString(), wiki_sync_error: null })
          .eq("id", row.id);
      } else if (wiki.reason && !wiki.skipped) {
        await supabase
          .from(TABLE)
          .update({ wiki_sync_error: wiki.reason.slice(0, 500) })
          .eq("id", row.id);
      }
    } catch {
      /* wiki_sync_* columns optional until migration runs */
    }

    res.status(201).json({ idea, wiki });
    return;
  }

  if (req.method === "DELETE") {
    const member = getMemberFromRequest(req);
    if (!member) {
      res.status(400).json({ error: "Ogiltig session — logga in igen." });
      return;
    }

    const idParam = req.query.id;
    const idRaw = Array.isArray(idParam) ? idParam[0] : idParam;
    const id = Number.parseInt(String(idRaw ?? ""), 10);
    if (!Number.isFinite(id)) {
      res.status(400).json({ error: "Ogiltigt id." });
      return;
    }

    const { error } = await supabase.from(TABLE).delete().eq("id", id);
    if (error) {
      res.status(500).json({ error: error.message });
      return;
    }

    res.status(200).json({ ok: true, deletedId: id });
    return;
  }

  res.setHeader("Allow", "GET, POST, DELETE");
  res.status(405).json({ error: "Method not allowed" });
}
