import { requireSession, type VercelRequest, type VercelResponse } from "../_lib/session.js";

const CACHE_MAX_AGE = 300;

export type GeoIntelKind =
  | "country_risk"
  | "conflict"
  | "economic"
  | "prediction_market"
  | "news";

export type GeoIntelSource = "live" | "mock";

export interface GeoIntelItem {
  kind: GeoIntelKind;
  title: string;
  summary: string;
  countryIso?: string;
  score: number | null;
  severity: number;
  source: GeoIntelSource;
}

export interface GeoIntelResponse {
  source: GeoIntelSource;
  items: GeoIntelItem[];
  fetchedAt: string;
  policy: "context_only";
}

/** Static fixtures when WORLDMONITOR_API_KEY is not available on Vercel. */
export const MOCK_GEO_INTEL: GeoIntelItem[] = [
  {
    kind: "country_risk",
    title: "US composite instability",
    summary: "Mock CII — set WORLDMONITOR_API_KEY on ATE worker for live MCP.",
    countryIso: "US",
    score: 22,
    severity: 0.22,
    source: "mock",
  },
  {
    kind: "conflict",
    title: "Active conflict watch",
    summary: "Tier-3 geo context for Macro Scout — not a fusion input.",
    score: 45,
    severity: 0.45,
    source: "mock",
  },
  {
    kind: "economic",
    title: "Fed Funds / macro calendar",
    summary: "Economic radar placeholder (WorldMonitor get_economic_data).",
    countryIso: "US",
    score: 30,
    severity: 0.3,
    source: "mock",
  },
];

export default async function handler(req: VercelRequest, res: VercelResponse) {
  res.setHeader("Cache-Control", `public, s-maxage=${CACHE_MAX_AGE}, stale-while-revalidate=60`);

  if (req.method !== "GET") {
    res.setHeader("Allow", "GET");
    res.status(405).json({ error: "Method not allowed" });
    return;
  }

  if (!requireSession(req, res)) return;

  const limitRaw = Array.isArray(req.query.limit) ? req.query.limit[0] : req.query.limit;
  const limit = Math.min(Math.max(Number(limitRaw) || 5, 1), 20);

  // Live WorldMonitor calls need a server-side key + MCP; Vercel edge uses mock
  // unless ATE_GEO_INTEL_URL points at the Python worker cache.
  const proxy = process.env.ATE_GEO_INTEL_URL?.trim();
  if (proxy) {
    try {
      const upstream = await fetch(`${proxy}?limit=${limit}`, {
        headers: { Accept: "application/json" },
      });
      if (upstream.ok) {
        const body = (await upstream.json()) as GeoIntelResponse;
        res.status(200).json({ ...body, policy: "context_only" });
        return;
      }
    } catch {
      // fall through to mock
    }
  }

  const payload: GeoIntelResponse = {
    source: "mock",
    items: MOCK_GEO_INTEL.slice(0, limit),
    fetchedAt: new Date().toISOString(),
    policy: "context_only",
  };
  res.status(200).json(payload);
}
