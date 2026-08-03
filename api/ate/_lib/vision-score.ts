/**
 * Resolve vision lane score for TRADE fusion.
 * Prefers ATE FastAPI bridge (`ATE_VISION_URL` or `ATE_HITL_PROXY_URL` host + /vision/score).
 * Graceful 0 when unreachable — Vercel cannot see ~/ate-data ONNX directly.
 */

export type VisionScoreSource = "bridge" | "none";

export interface VisionScoreResult {
  score: number;
  status: string;
  source: VisionScoreSource;
  model_id?: string;
}

const DEFAULT_TIMEOUT_MS = 8_000;

function visionEndpoint(): string | null {
  const explicit = process.env.ATE_VISION_URL?.trim();
  if (explicit) return explicit.replace(/\/$/, "");

  const hitl = process.env.ATE_HITL_PROXY_URL?.trim();
  if (hitl) {
    try {
      const u = new URL(hitl);
      return `${u.origin}/vision/score`;
    } catch {
      return null;
    }
  }
  return null;
}

function bridgeAuthHeaders(): HeadersInit {
  const token = process.env.ATE_BRIDGE_TOKEN?.trim();
  if (!token) return {};
  return { Authorization: `Bearer ${token}` };
}

export async function fetchVisionScore(
  symbol: string,
  timeframe: string,
): Promise<VisionScoreResult> {
  const base = visionEndpoint();
  if (!base) {
    return { score: 0, status: "no_bridge", source: "none" };
  }

  const url = new URL(base.includes("?") ? base : base);
  if (!base.includes("symbol=")) {
    url.searchParams.set("symbol", symbol);
    url.searchParams.set("timeframe", timeframe);
  }

  const ctrl = new AbortController();
  const timer = setTimeout(() => ctrl.abort(), DEFAULT_TIMEOUT_MS);
  try {
    const res = await fetch(url.toString(), {
      headers: { Accept: "application/json", ...bridgeAuthHeaders() },
      signal: ctrl.signal,
    });
    if (!res.ok) {
      return { score: 0, status: `http_${res.status}`, source: "none" };
    }
    const body = (await res.json()) as {
      score?: number;
      status?: string;
      model_id?: string;
    };
    const score =
      typeof body.score === "number" && Number.isFinite(body.score)
        ? Math.max(0, Math.min(1, body.score))
        : 0;
    return {
      score,
      status: body.status || "ok",
      source: "bridge",
      model_id: body.model_id,
    };
  } catch {
    return { score: 0, status: "bridge_unreachable", source: "none" };
  } finally {
    clearTimeout(timer);
  }
}
