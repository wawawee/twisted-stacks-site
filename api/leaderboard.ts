import { createClient } from "@supabase/supabase-js";

const TABLE_NAME = "pongg_scores";
const DEFAULT_LIMIT = 5;
const MAX_LIMIT = 10;
const PLAYER_NAME_LIMIT = 6;
const SCORE_MIN = 1;
const SCORE_MAX = 10_000_000;
const LEVEL_MIN = 1;
const LEVEL_MAX = 9;
const RATE_LIMIT_WINDOW_MS = 60_000;
const RATE_LIMIT_MAX_WRITES = 8;

interface ScoreEntry {
  name: string;
  score: number;
  level: number;
  date: string;
}

interface ScoreRow {
  name: string;
  score: number;
  level: number;
  created_at: string;
}

interface ScoreSubmission {
  name: string;
  score: number;
  level: number;
  outcome: "lost" | "champion";
}

type VercelRequest = {
  method?: string;
  query: Record<string, string | string[] | undefined>;
  body?: unknown;
  headers: Record<string, string | string[] | undefined>;
};

type VercelResponse = {
  setHeader(name: string, value: string): void;
  status(code: number): VercelResponse;
  json(body: unknown): void;
  end(): void;
};

const writeWindows = new Map<string, number[]>();

function readEnv(name: string) {
  const value = process.env[name]?.trim();
  return value?.replace(/^['"]|['"]$/g, "");
}

function getSupabaseClient() {
  const url = readEnv("SUPABASE_URL") || readEnv("VITE_SUPABASE_URL");
  const serviceRoleKey =
    readEnv("SUPABASE_SERVICE_ROLE_KEY") ||
    readEnv("SUPABASE_SECRET_KEY") ||
    readEnv("SUPABASE_SERVICE_KEY");

  if (!url || !serviceRoleKey) {
    throw new Error("Supabase leaderboard environment is not configured.");
  }

  return createClient(url, serviceRoleKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  });
}

function normalizePlayerName(value: unknown) {
  return String(value ?? "")
    .toUpperCase()
    .replace(/[^A-Z0-9]/g, "")
    .slice(0, PLAYER_NAME_LIMIT);
}

function parseLimit(value: string | string[] | undefined) {
  const raw = Array.isArray(value) ? value[0] : value;
  const parsed = Number.parseInt(raw || String(DEFAULT_LIMIT), 10);
  if (!Number.isFinite(parsed)) return DEFAULT_LIMIT;
  return Math.max(1, Math.min(MAX_LIMIT, parsed));
}

function rankScoreboard(entries: ScoreEntry[], limit: number) {
  const deduped = new Map<string, ScoreEntry>();

  entries.forEach((entry) => {
    const name = normalizePlayerName(entry.name) || "PLAYER";
    const score = Math.max(0, Math.round(entry.score));
    const level = Math.max(LEVEL_MIN, Math.min(LEVEL_MAX, Math.round(entry.level || LEVEL_MIN)));
    const date = typeof entry.date === "string" ? entry.date : new Date().toISOString();
    if (score <= 0) return;

    const key = `${name}:${score}:${level}`;
    const current = deduped.get(key);
    if (!current || date.localeCompare(current.date) < 0) {
      deduped.set(key, { name, score, level, date });
    }
  });

  return [...deduped.values()]
    .sort((a, b) => b.score - a.score || b.level - a.level || a.date.localeCompare(b.date))
    .slice(0, limit);
}

function getClientIp(req: VercelRequest) {
  const forwardedFor = req.headers["x-forwarded-for"];
  const raw = Array.isArray(forwardedFor) ? forwardedFor[0] : forwardedFor;
  return raw?.split(",")[0]?.trim() || "unknown";
}

function isRateLimited(req: VercelRequest) {
  const ip = getClientIp(req);
  const now = Date.now();
  const recent = (writeWindows.get(ip) || []).filter((timestamp) => now - timestamp < RATE_LIMIT_WINDOW_MS);
  if (recent.length >= RATE_LIMIT_MAX_WRITES) {
    writeWindows.set(ip, recent);
    return true;
  }
  recent.push(now);
  writeWindows.set(ip, recent);
  return false;
}

function parseRequestBody(body: unknown) {
  if (typeof body !== "string") return body;
  try {
    return JSON.parse(body) as unknown;
  } catch {
    return null;
  }
}

function parseSubmission(body: unknown): ScoreSubmission {
  const parsedBody = parseRequestBody(body);
  const data = typeof parsedBody === "object" && parsedBody !== null ? (parsedBody as Record<string, unknown>) : {};
  const name = normalizePlayerName(data.name);
  const score = Math.round(Number(data.score));
  const level = Math.round(Number(data.level));
  const outcome = data.outcome === "champion" ? "champion" : data.outcome === "lost" ? "lost" : null;

  if (!name) throw new Error("Invalid player name.");
  if (!Number.isFinite(score) || score < SCORE_MIN || score > SCORE_MAX) throw new Error("Invalid score.");
  if (!Number.isFinite(level) || level < LEVEL_MIN || level > LEVEL_MAX) throw new Error("Invalid level.");
  if (!outcome) throw new Error("Invalid outcome.");

  return { name, score, level, outcome };
}

async function fetchScores(limit: number) {
  const client = getSupabaseClient();
  const { data, error } = await client
    .from(TABLE_NAME)
    .select("name,score,level,created_at")
    .order("score", { ascending: false })
    .order("level", { ascending: false })
    .order("created_at", { ascending: true })
    .limit(Math.max(limit * 3, limit));

  if (error) throw new Error(error.message);

  const scores = ((data ?? []) as ScoreRow[]).map((row) => ({
    name: row.name,
    score: row.score,
    level: row.level,
    date: row.created_at,
  }));

  return rankScoreboard(scores, limit);
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
  res.setHeader("Cache-Control", "no-store");

  try {
    const limit = parseLimit(req.query.limit);

    if (req.method === "GET") {
      res.status(200).json({ scores: await fetchScores(limit) });
      return;
    }

    if (req.method === "POST") {
      if (isRateLimited(req)) {
        res.status(429).json({ error: "Too many score submissions. Try again later." });
        return;
      }

      const submission = parseSubmission(req.body);
      const client = getSupabaseClient();
      const { error } = await client.from(TABLE_NAME).insert(submission);
      if (error) throw new Error(error.message);

      res.status(200).json({ scores: await fetchScores(limit) });
      return;
    }

    res.setHeader("Allow", "GET, POST");
    res.status(405).json({ error: "Method not allowed." });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Leaderboard unavailable.";
    const isValidationError = message.startsWith("Invalid ");
    if (!isValidationError) {
      console.error("Leaderboard API error:", message);
    }
    res.status(isValidationError ? 400 : 500).json({ error: message });
  }
}
