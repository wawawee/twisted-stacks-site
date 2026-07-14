import { createClient } from "@supabase/supabase-js";

import {
  parseCookieHeader,
  readEnv,
  requireSession,
  type VercelRequest,
  type VercelResponse,
} from "./session.js";
import { syncIdeaToWiki } from "./sync-idea-wiki.js";

const TABLE = "ate_ideas";
const VALID_MEMBERS = new Set(["baha", "kris", "joachim", "per"]);

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
  const member = cookies.get("ate_member")?.trim().toLowerCase() || "";
  return VALID_MEMBERS.has(member) ? member : "";
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
    const { data, error } = await supabase
      .from(TABLE)
      .select("id, member, body, created_at")
      .order("created_at", { ascending: false })
      .limit(50);
    if (error) {
      res.status(500).json({ error: error.message });
      return;
    }
    const ideas = (data || []).reverse().map((row: { id: number; member: string; body: string; created_at: string }) => ({
      id: row.id,
      member: row.member,
      body: row.body,
      createdAt: row.created_at,
    }));
    res.status(200).json({ ideas });
    return;
  }

  if (req.method === "POST") {
    const member = getMemberFromRequest(req);
    if (!member) {
      res.status(400).json({ error: "Ogiltig session" });
      return;
    }
    const bodyObj = typeof req.body === "string" ? JSON.parse(req.body) : req.body;
    const text = String(bodyObj?.body ?? "").trim().slice(0, 8000);
    if (!text) {
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
    const idea = {
      id: data.id,
      member: data.member,
      body: data.body,
      createdAt: data.created_at,
    };

    const wiki = await syncIdeaToWiki({
      id: data.id,
      member: data.member,
      body: data.body,
      createdAt: data.created_at,
    });

    res.status(201).json({ idea, wiki });
    return;
  }

  res.setHeader("Allow", "GET, POST");
  res.status(405).json({ error: "Method not allowed" });
}
