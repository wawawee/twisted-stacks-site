import { requireSession, type VercelRequest, type VercelResponse } from "../_lib/session.js";

const GAMMA_API = "https://gamma-api.polymarket.com";
const CLOB_API = "https://clob.polymarket.com";
const CACHE_MAX_AGE = 300;

const TIER_KEYWORDS: Record<string, string[]> = {
  tier1: ["bitcoin", "ethereum", "btc", "eth", "etf", "sec", "crypto", "binance", "coinbase"],
  tier2: ["fed", "cpi", "inflation", "recession", "rates", "gdp", "unemployment", "nfp"],
  tier3: ["iran", "israel", "russia", "ukraine", "china", "taiwan", "sanctions", "war", "oil"],
  tier4: ["spacex", "nvidia", "ai", "antitrust", "google", "apple", "microsoft", "tsmc"],
};

const SEARCH_KEYWORDS = ["bitcoin", "fed", "recession", "ethereum", "cpi", "rates"];

const SHIFT_THRESHOLD = 0.05;
const VOLUME_FLOOR = 10_000;

export type MacroAlertTier = "tier1" | "tier2" | "tier3" | "tier4" | "noise";
export type MacroAlertSource = "live" | "mock";

export interface MacroAlert {
  marketId: string;
  platform: "polymarket" | "kalshi" | "limitless" | "opinion";
  title: string;
  tier: MacroAlertTier;
  eventType: "crypto" | "macro" | "geopolitical" | "tech" | "other";
  yesPrice: number;
  probShift: number;
  volume24h: number;
  direction: "bullish" | "bearish" | "neutral";
  confidence: number;
  source: MacroAlertSource;
}

export interface MacroAlertsResponse {
  source: MacroAlertSource | "mixed";
  alerts: MacroAlert[];
  fetchedAt: string;
}

export const MOCK_MACRO_ALERTS: MacroAlert[] = [
  {
    marketId: "btc-100k-dec",
    platform: "polymarket",
    title: "Bitcoin reaches $100K by Dec 2026",
    tier: "tier1",
    eventType: "crypto",
    yesPrice: 0.68,
    probShift: 0.12,
    volume24h: 245_000,
    direction: "bullish",
    confidence: 0.87,
    source: "mock",
  },
  {
    marketId: "fed-cut-jul-26",
    platform: "kalshi",
    title: "Fed rate cut in Jul 2026",
    tier: "tier2",
    eventType: "macro",
    yesPrice: 0.72,
    probShift: -0.07,
    volume24h: 189_000,
    direction: "bearish",
    confidence: 0.79,
    source: "mock",
  },
];

function classifyTier(title: string): { tier: MacroAlertTier; eventType: MacroAlert["eventType"] } {
  const text = title.toLowerCase();
  const eventMap: Record<string, MacroAlert["eventType"]> = {
    tier1: "crypto",
    tier2: "macro",
    tier3: "geopolitical",
    tier4: "tech",
  };
  for (const [tier, keywords] of Object.entries(TIER_KEYWORDS)) {
    if (keywords.some((kw) => text.includes(kw))) {
      return { tier: tier as MacroAlertTier, eventType: eventMap[tier] ?? "other" };
    }
  }
  return { tier: "noise", eventType: "other" };
}

function calcConfidence(shift: number, volume: number): number {
  const volScore = Math.min(volume / 100_000, 1);
  const shiftScore = Math.min(Math.abs(shift) * 10, 1);
  return volScore * 0.5 + shiftScore * 0.5;
}

interface GammaMarket {
  id?: string;
  slug?: string;
  question?: string;
  outcomePrices?: string | string[];
  volume24hr?: number;
  volume?: number;
  closed?: boolean;
  clobTokenIds?: string | string[];
}

async function fetchGammaMarkets(query: string): Promise<GammaMarket[]> {
  const params = new URLSearchParams({ q: query, limit: "10", active: "true" });
  const res = await fetch(`${GAMMA_API}/markets?${params}`, {
    headers: { Accept: "application/json" },
    signal: AbortSignal.timeout(8000),
  });
  if (!res.ok) return [];
  const data = (await res.json()) as GammaMarket[] | { markets?: GammaMarket[] };
  if (Array.isArray(data)) return data;
  return data.markets ?? [];
}

async function fetchClobHistory(tokenId: string): Promise<{ prev: number; curr: number } | null> {
  const params = new URLSearchParams({
    market: tokenId,
    interval: "max",
    fidelity: "60",
  });
  const res = await fetch(`${CLOB_API}/prices-history?${params}`, {
    headers: { Accept: "application/json" },
    signal: AbortSignal.timeout(8000),
  });
  if (!res.ok) return null;
  const payload = (await res.json()) as { history?: { p: number }[] };
  const history = payload.history ?? [];
  if (history.length < 2) return null;
  const curr = history[history.length - 1].p;
  const idx = Math.max(0, history.length - 25);
  const prev = history[idx].p;
  return { prev, curr };
}

function parseYesProb(outcomePrices: string | string[] | undefined): number | null {
  if (!outcomePrices) return null;
  const raw =
    typeof outcomePrices === "string"
      ? (JSON.parse(outcomePrices) as string[])
      : outcomePrices;
  const yes = Number(raw[0]);
  if (!Number.isFinite(yes) || yes < 0 || yes > 1) return null;
  return yes;
}

function parseTokenId(market: GammaMarket): string | null {
  const raw = market.clobTokenIds;
  if (!raw) return null;
  const ids = typeof raw === "string" ? (JSON.parse(raw) as string[]) : raw;
  return ids[0] ? String(ids[0]) : null;
}

async function buildLiveAlerts(): Promise<MacroAlert[]> {
  const seen = new Set<string>();
  const alerts: MacroAlert[] = [];

  for (const kw of SEARCH_KEYWORDS) {
    let markets: GammaMarket[];
    try {
      markets = await fetchGammaMarkets(kw);
    } catch {
      continue;
    }

    for (const market of markets) {
      const id = market.id ?? market.slug ?? "";
      if (!id || seen.has(id) || market.closed) continue;
      seen.add(id);

      const title = market.question ?? "";
      const { tier, eventType } = classifyTier(title);
      if (tier === "noise") continue;

      const volume = Number(market.volume24hr ?? market.volume ?? 0);
      if (volume < VOLUME_FLOOR) continue;

      const tokenId = parseTokenId(market);
      if (!tokenId) continue;

      let history: { prev: number; curr: number } | null = null;
      try {
        history = await fetchClobHistory(tokenId);
      } catch {
        continue;
      }
      if (!history) continue;

      const shift = history.curr - history.prev;
      if (Math.abs(shift) < SHIFT_THRESHOLD) continue;
      if (tier !== "tier1" && tier !== "tier2") continue;

      const confidence = calcConfidence(shift, volume);
      if (confidence <= 0.6) continue;

      alerts.push({
        marketId: id,
        platform: "polymarket",
        title,
        tier,
        eventType,
        yesPrice: history.curr,
        probShift: shift,
        volume24h: volume,
        direction: shift > 0 ? "bullish" : shift < 0 ? "bearish" : "neutral",
        confidence,
        source: "live",
      });
    }
  }

  alerts.sort((a, b) => b.confidence * Math.abs(b.probShift) - a.confidence * Math.abs(a.probShift));
  return alerts;
}

export async function buildMacroAlertsResponse(limit = 10): Promise<MacroAlertsResponse> {
  const envJson = process.env.ATE_PMXT_ALERTS_JSON;
  if (envJson) {
    try {
      const parsed = JSON.parse(envJson) as { alerts?: MacroAlert[] };
      const alerts = (parsed.alerts ?? []).slice(0, limit);
      if (alerts.length > 0) {
        return {
          source: "live",
          alerts,
          fetchedAt: new Date().toISOString(),
        };
      }
    } catch {
      /* fall through */
    }
  }

  const live = await buildLiveAlerts();
  if (live.length === 0) {
    return {
      source: "mock",
      alerts: MOCK_MACRO_ALERTS.slice(0, limit),
      fetchedAt: new Date().toISOString(),
    };
  }

  return {
    source: "live",
    alerts: live.slice(0, limit),
    fetchedAt: new Date().toISOString(),
  };
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
  res.setHeader("Cache-Control", `public, max-age=${CACHE_MAX_AGE}, s-maxage=${CACHE_MAX_AGE}`);

  if (req.method !== "GET") {
    res.setHeader("Allow", "GET");
    res.status(405).json({ error: "Method not allowed" });
    return;
  }

  if (!requireSession(req, res)) return;

  const limitParam = req.query.limit;
  const limitRaw = Array.isArray(limitParam) ? limitParam[0] : limitParam;
  const limit = Math.min(Math.max(Number(limitRaw) || 10, 1), 50);

  try {
    const payload = await buildMacroAlertsResponse(limit);
    res.status(200).json(payload);
  } catch (err) {
    const message = err instanceof Error ? err.message : "Macro alerts fetch failed";
    res.status(502).json({ error: message });
  }
}
