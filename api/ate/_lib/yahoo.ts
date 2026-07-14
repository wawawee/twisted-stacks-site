/** Yahoo Finance chart API — server-side only (no API key). */

export interface YahooBar {
  symbol: string;
  timeframe: string;
  ts: string;
  open: number;
  high: number;
  low: number;
  close: number;
  volume: number;
}

const RANGE_MAP: Record<string, string> = {
  "1mo": "1mo",
  "3mo": "3mo",
  "6mo": "6mo",
  "1y": "1y",
  "2y": "2y",
  "5y": "5y",
};

const INTERVAL_MAP: Record<string, string> = {
  "1d": "1d",
  "4h": "1h",
  "1h": "1h",
  "15m": "15m",
};

export async function fetchYahooBars(
  symbol: string,
  timeframe: string,
  range = "1y",
): Promise<YahooBar[]> {
  const interval = INTERVAL_MAP[timeframe] || "1d";
  const yahooRange = RANGE_MAP[range] || "1y";
  const url = `https://query1.finance.yahoo.com/v8/finance/chart/${encodeURIComponent(symbol)}?interval=${interval}&range=${yahooRange}`;

  const res = await fetch(url, {
    headers: { "User-Agent": "ATE/0.1 (twistedstacks.com)" },
  });
  if (!res.ok) {
    throw new Error(`Yahoo chart ${res.status} for ${symbol}`);
  }

  const json = await res.json();
  const result = json?.chart?.result?.[0];
  if (!result) {
    throw new Error(`No chart data for ${symbol}`);
  }

  const timestamps: number[] = result.timestamp || [];
  const q = result.indicators?.quote?.[0];
  if (!q) return [];

  const bars: YahooBar[] = [];
  for (let i = 0; i < timestamps.length; i++) {
    const open = q.open?.[i];
    const high = q.high?.[i];
    const low = q.low?.[i];
    const close = q.close?.[i];
    const volume = q.volume?.[i];
    if ([open, high, low, close].some((v) => v == null || Number.isNaN(v))) continue;

    bars.push({
      symbol: symbol.toUpperCase(),
      timeframe,
      ts: new Date(timestamps[i] * 1000).toISOString(),
      open,
      high,
      low,
      close,
      volume: volume ?? 0,
    });
  }

  return bars;
}

export function quoteFromBars(bars: YahooBar[]) {
  if (!bars.length) return null;
  const last = bars[bars.length - 1];
  const prev = bars.length > 1 ? bars[bars.length - 2] : last;
  const change = last.close - prev.close;
  const changePct = prev.close ? (change / prev.close) * 100 : 0;
  return {
    symbol: last.symbol,
    price: last.close,
    change,
    changePct,
    high: last.high,
    low: last.low,
    volume: last.volume,
    asOf: last.ts,
  };
}
