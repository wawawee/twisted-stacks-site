import { requireSession, type VercelRequest, type VercelResponse } from "../_lib/session.js";

const GAMMA_API = "https://gamma-api.polymarket.com";
const CACHE_MAX_AGE = 300;

/**
 * Polymarket Gamma API — public, no API key.
 * Slugs are stable lookups; if Polymarket renames markets, fetch fails → mock fallback.
 * @see https://docs.polymarket.com/market-data/fetching-markets
 */
const LIVE_MARKET_TARGETS = [
  {
    slug: "fed-rate-cut-by-july-2026-meeting-577",
    label: "Fed cut Jul '26",
  },
  {
    slug: "will-bitcoin-reach-100000-by-december-31-2026-571-361-361",
    label: "BTC $100K Dec",
  },
] as const;

/** Improved static fallback — aligned with recent Polymarket levels when API is down. */
export const MOCK_MACRO_QUOTES = [
  { label: "Fed cut Jul '26", prob: 1, source: "mock" as const },
  { label: "BTC $100K Dec", prob: 10, source: "mock" as const },
] as const;

export type MacroQuoteSource = "live" | "mock";

export interface MacroQuote {
  label: string;
  prob: number;
  source: MacroQuoteSource;
  slug?: string;
}

export interface MacroResponse {
  source: MacroQuoteSource | "mixed";
  quotes: MacroQuote[];
  whale: { amount: string; pnl: string; source: MacroQuoteSource };
  fetchedAt: string;
}

interface GammaMarket {
  slug?: string;
  question?: string;
  outcomePrices?: string | string[];
  closed?: boolean;
}

function parseYesProb(outcomePrices: string | string[] | undefined): number | null {
  if (!outcomePrices) return null;
  const raw = typeof outcomePrices === "string" ? (JSON.parse(outcomePrices) as string[]) : outcomePrices;
  const yes = Number(raw[0]);
  if (!Number.isFinite(yes) || yes < 0 || yes > 1) return null;
  return Math.round(yes * 100);
}

async function fetchMarketBySlug(slug: string): Promise<GammaMarket | null> {
  const res = await fetch(`${GAMMA_API}/markets/slug/${encodeURIComponent(slug)}`, {
    headers: { Accept: "application/json" },
    signal: AbortSignal.timeout(8000),
  });
  if (!res.ok) return null;
  const market = (await res.json()) as GammaMarket;
  if (!market || market.closed) return null;
  return market;
}

async function fetchLiveQuotes(): Promise<MacroQuote[]> {
  const results: (MacroQuote | null)[] = await Promise.all(
    LIVE_MARKET_TARGETS.map(async (target) => {
      try {
        const market = await fetchMarketBySlug(target.slug);
        const prob = parseYesProb(market?.outcomePrices);
        if (prob === null) return null;
        return { label: target.label, prob, source: "live" as const, slug: target.slug };
      } catch {
        return null;
      }
    }),
  );
  return results.filter((q) => q !== null);
}

function mockResponse(): MacroResponse {
  return {
    source: "mock",
    quotes: MOCK_MACRO_QUOTES.map((q) => ({ ...q })),
    whale: { amount: "$1.2M YES", pnl: "+$4.7M lifetime", source: "mock" },
    fetchedAt: new Date().toISOString(),
  };
}

export async function buildMacroResponse(): Promise<MacroResponse> {
  const live = await fetchLiveQuotes();

  if (live.length === 0) return mockResponse();

  const quotes: MacroQuote[] = LIVE_MARKET_TARGETS.map((target, i) => {
    const hit = live.find((q) => q.slug === target.slug);
    if (hit) return hit;
    const mock = MOCK_MACRO_QUOTES[i];
    return { label: mock?.label ?? target.label, prob: mock?.prob ?? 0, source: "mock" };
  });

  const liveCount = quotes.filter((q) => q.source === "live").length;
  const source: MacroResponse["source"] =
    liveCount === quotes.length ? "live" : liveCount === 0 ? "mock" : "mixed";

  return {
    source,
    quotes,
    whale: { amount: "$1.2M YES", pnl: "+$4.7M lifetime", source: "mock" },
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

  try {
    const payload = await buildMacroResponse();
    res.status(200).json(payload);
  } catch (err) {
    const message = err instanceof Error ? err.message : "Macro fetch failed";
    res.status(502).json({ error: message });
  }
}
