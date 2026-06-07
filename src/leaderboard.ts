import { createClient, type SupabaseClient } from "@supabase/supabase-js";

export interface ScoreEntry {
  name: string;
  score: number;
  level: number;
  date: string;
}

export interface ScoreSubmission {
  name: string;
  score: number;
  level: number;
  outcome: "lost" | "champion";
}

interface ScoreRow {
  name: string;
  score: number;
  level: number;
  created_at: string;
}

const TABLE_NAME = "pongg_scores";

let supabaseClient: SupabaseClient | null | undefined;

function getSupabaseClient() {
  if (supabaseClient !== undefined) return supabaseClient;

  const url = import.meta.env.VITE_SUPABASE_URL?.trim();
  const publishableKey = import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY?.trim();

  if (!url || !publishableKey) {
    supabaseClient = null;
    return supabaseClient;
  }

  supabaseClient = createClient(url, publishableKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  });
  return supabaseClient;
}

export function isRemoteLeaderboardConfigured() {
  return getSupabaseClient() !== null;
}

export async function fetchRemoteScores(limit: number): Promise<ScoreEntry[]> {
  const client = getSupabaseClient();
  if (!client) return [];

  const { data, error } = await client
    .from(TABLE_NAME)
    .select("name,score,level,created_at")
    .order("score", { ascending: false })
    .order("level", { ascending: false })
    .order("created_at", { ascending: true })
    .limit(limit);

  if (error) throw error;

  return ((data ?? []) as ScoreRow[]).map((row) => ({
    name: row.name,
    score: row.score,
    level: row.level,
    date: row.created_at,
  }));
}

export async function submitRemoteScore(submission: ScoreSubmission, limit: number): Promise<ScoreEntry[]> {
  const client = getSupabaseClient();
  if (!client) return [];

  const { error } = await client.from(TABLE_NAME).insert({
    name: submission.name,
    score: submission.score,
    level: submission.level,
    outcome: submission.outcome,
  });

  if (error) throw error;
  return fetchRemoteScores(limit);
}
