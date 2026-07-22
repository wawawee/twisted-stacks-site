import { createClient } from "@supabase/supabase-js";

import {
  getSupabaseServiceKey,
  getSupabaseUrl,
  requireSession,
  type VercelRequest,
  type VercelResponse,
} from "../_lib/session.js";

const TABLE = "space_session_signups";
const BODY_MAX = 2000;
const RATE_LIMIT_WINDOW_MS = 60_000;
const RATE_LIMIT_MAX_WRITES = 5;

const writeWindows = new Map<string, number[]>();

function getSupabaseClient() {
  const url = getSupabaseUrl();
  const serviceRoleKey = getSupabaseServiceKey();
  if (!url || !serviceRoleKey) {
    throw new Error("Supabase is not configured.");
  }
  return createClient(url, serviceRoleKey, {
    auth: { autoRefreshToken: false, persistSession: false },
  });
}

function parseBody(body: unknown) {
  if (typeof body !== "string") return body as Record<string, unknown>;
  try {
    return JSON.parse(body) as Record<string, unknown>;
  } catch {
    return null;
  }
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

export default async function handler(req: VercelRequest, res: VercelResponse) {
  res.setHeader("Cache-Control", "private, no-store");

  if (!requireSession(req, res)) return;

  if (req.method === "GET") {
    try {
      const supabase = getSupabaseClient();
      const { data, error } = await supabase
        .from(TABLE)
        .select("id, name, email, interest, preferred_slot, note, created_at")
        .order("created_at", { ascending: false })
        .limit(50);

      if (error) {
        res.status(500).json({ error: error.message });
        return;
      }

      res.status(200).json({
        signups: (data || []).map((row) => ({
          id: row.id,
          name: row.name,
          email: row.email,
          interest: row.interest,
          preferredSlot: row.preferred_slot,
          note: row.note,
          createdAt: row.created_at,
        })),
      });
    } catch (err) {
      res.status(503).json({ error: err instanceof Error ? err.message : "Unavailable" });
    }
    return;
  }

  if (req.method === "POST") {
    if (isRateLimited(req)) {
      res.status(429).json({ error: "För många försök — vänta en minut" });
      return;
    }

    const body = parseBody(req.body);
    if (!body || typeof body !== "object") {
      res.status(400).json({ error: "Invalid body" });
      return;
    }

    const name = String(body.name ?? "").trim().slice(0, 120);
    const email = String(body.email ?? "").trim().toLowerCase().slice(0, 200);
    const interest = String(body.interest ?? "blender").trim().toLowerCase().slice(0, 40);
    const preferredSlot = String(body.preferredSlot ?? "").trim().slice(0, 120);
    const note = String(body.note ?? "").trim().slice(0, BODY_MAX);

    if (!name || name.length < 2) {
      res.status(400).json({ error: "Ange ditt namn" });
      return;
    }
    if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      res.status(400).json({ error: "Ange en giltig e-post" });
      return;
    }
    if (!["blender", "unity", "commons", "any"].includes(interest)) {
      res.status(400).json({ error: "Ogiltigt intresse" });
      return;
    }

    try {
      const supabase = getSupabaseClient();
      const { data, error } = await supabase
        .from(TABLE)
        .insert({
          name,
          email,
          interest,
          preferred_slot: preferredSlot || null,
          note: note || null,
        })
        .select("id, name, email, interest, preferred_slot, note, created_at")
        .single();

      if (error) {
        res.status(500).json({ error: error.message });
        return;
      }

      res.status(201).json({
        ok: true,
        signup: {
          id: data.id,
          name: data.name,
          email: data.email,
          interest: data.interest,
          preferredSlot: data.preferred_slot,
          note: data.note,
          createdAt: data.created_at,
        },
      });
    } catch (err) {
      res.status(503).json({ error: err instanceof Error ? err.message : "Unavailable" });
    }
    return;
  }

  res.setHeader("Allow", "GET, POST");
  res.status(405).json({ error: "Method not allowed" });
}
