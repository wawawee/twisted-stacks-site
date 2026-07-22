import { createClient } from "@supabase/supabase-js";

import {
  getSupabaseServiceKey,
  getSupabaseUrl,
  parseCookieHeader,
  readEnv,
  requireSession,
  type VercelRequest,
  type VercelResponse,
} from "../_lib/session.js";

const BUCKET = "space-shared";
const TABLE = "space_files";
const VALID_MEMBERS = new Set(["per", "joachim", "guest"]);
const MAX_BYTES = 25 * 1024 * 1024;
const SIGNED_URL_TTL_SEC = 3600;
const RATE_LIMIT_WINDOW_MS = 60_000;
const RATE_LIMIT_MAX_WRITES = 6;

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

function getMemberFromRequest(req: VercelRequest) {
  const cookies = parseCookieHeader(req.headers.cookie);
  const member = cookies.get("space_member")?.trim().toLowerCase() || "";
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

function sanitizeFilename(name: string) {
  const base = name.replace(/[/\\?%*:|"<>]/g, "-").trim().slice(0, 120);
  return base || "fil";
}

function randomSuffix() {
  return Math.random().toString(36).slice(2, 10);
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
      .select("id, storage_path, original_name, member, size_bytes, content_type, created_at")
      .order("created_at", { ascending: false })
      .limit(100);

    if (error) {
      res.status(500).json({ error: error.message });
      return;
    }

    const rows = data || [];
    const files = await Promise.all(
      rows.map(async (row) => {
        const signed = await supabase.storage
          .from(BUCKET)
          .createSignedUrl(row.storage_path, SIGNED_URL_TTL_SEC);
        return {
          id: row.id,
          name: row.original_name,
          member: row.member,
          sizeBytes: row.size_bytes,
          contentType: row.content_type,
          createdAt: row.created_at,
          downloadUrl: signed.data?.signedUrl || null,
        };
      }),
    );

    res.status(200).json({ files });
    return;
  }

  if (req.method === "POST") {
    if (isRateLimited(req)) {
      res.status(429).json({ error: "För många uppladdningar — vänta en stund." });
      return;
    }

    const member = getMemberFromRequest(req);
    if (!member) {
      res.status(400).json({ error: "Ogiltig session — logga in igen." });
      return;
    }

    const body = parseBody(req.body);
    if (!body) {
      res.status(400).json({ error: "Invalid body" });
      return;
    }

    const originalName = sanitizeFilename(String(body.filename ?? "fil"));
    const sizeBytes = Number(body.size ?? 0);
    const contentType = String(body.contentType ?? "application/octet-stream").slice(0, 120);

    if (!Number.isFinite(sizeBytes) || sizeBytes <= 0) {
      res.status(400).json({ error: "Ogiltig filstorlek." });
      return;
    }
    if (sizeBytes > MAX_BYTES) {
      res.status(400).json({ error: "Filen är för stor (max 25 MB). Maila större filer till teamet." });
      return;
    }

    const storagePath = `files/${new Date().toISOString().slice(0, 10)}/${randomSuffix()}-${originalName}`;

    const { error: insertError } = await supabase.from(TABLE).insert({
      storage_path: storagePath,
      original_name: originalName,
      member,
      size_bytes: sizeBytes,
      content_type: contentType,
    });

    if (insertError) {
      res.status(500).json({ error: insertError.message });
      return;
    }

    const { data: uploadData, error: uploadError } = await supabase.storage
      .from(BUCKET)
      .createSignedUploadUrl(storagePath);

    if (uploadError || !uploadData) {
      res.status(500).json({ error: uploadError?.message || "Kunde inte skapa uppladdnings-URL" });
      return;
    }

    res.status(200).json({
      uploadUrl: uploadData.signedUrl,
      path: uploadData.path,
      token: uploadData.token,
    });
    return;
  }

  res.setHeader("Allow", "GET, POST");
  res.status(405).json({ error: "Method not allowed" });
}
