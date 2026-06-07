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

interface LeaderboardResponse {
  scores?: ScoreEntry[];
  error?: string;
}

const LEADERBOARD_API_PATH = import.meta.env.VITE_LEADERBOARD_API_PATH || "/api/leaderboard";

export function isRemoteLeaderboardConfigured() {
  return LEADERBOARD_API_PATH.trim().length > 0;
}

function normalizeLimit(limit: number) {
  return Math.max(1, Math.min(10, Math.round(limit || 5)));
}

async function parseLeaderboardResponse(response: Response): Promise<ScoreEntry[]> {
  const payload = (await response.json()) as LeaderboardResponse;
  if (!response.ok) {
    throw new Error(payload.error || "Remote leaderboard unavailable.");
  }
  return Array.isArray(payload.scores) ? payload.scores : [];
}

export async function fetchRemoteScores(limit: number): Promise<ScoreEntry[]> {
  const query = new URLSearchParams({ limit: String(normalizeLimit(limit)) });
  const response = await fetch(`${LEADERBOARD_API_PATH}?${query.toString()}`, {
    headers: { Accept: "application/json" },
  });
  return parseLeaderboardResponse(response);
}

export async function submitRemoteScore(submission: ScoreSubmission, limit: number): Promise<ScoreEntry[]> {
  const query = new URLSearchParams({ limit: String(normalizeLimit(limit)) });
  const response = await fetch(`${LEADERBOARD_API_PATH}?${query.toString()}`, {
    method: "POST",
    headers: {
      Accept: "application/json",
      "Content-Type": "application/json",
    },
    body: JSON.stringify(submission),
  });
  return parseLeaderboardResponse(response);
}
