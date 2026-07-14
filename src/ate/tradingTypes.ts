export interface MarketBar {
  symbol: string;
  timeframe: string;
  ts: string;
  open: number;
  high: number;
  low: number;
  close: number;
  volume: number;
}

export interface MarketQuote {
  symbol: string;
  price: number;
  change: number;
  changePct: number;
  high: number;
  low: number;
  volume: number;
  asOf: string;
}

export interface CupHandleSignal {
  ticker: string;
  timeframe: string;
  breakout_confidence: number;
  vision_score: number;
  sequence_prob: number;
  fused_score: number;
  invalidation: number;
  timestamp: string;
}

export type RegimeLabel = "trending" | "ranging" | "chop" | "crisis";

export interface RegimeGateResult {
  regime: RegimeLabel;
  cup_handle_allowed: boolean;
  adx?: number;
  multiplier: number;
}

export interface TaFeatures {
  bar_count: number;
  volume_dry_up_ratio: number | null;
  ma20: number | null;
  ma50: number | null;
  ma_stack_bullish: boolean | null;
  atr: number | null;
  atr_pct: number | null;
}

export type MacroQuoteSource = "live" | "mock";

export interface MacroQuote {
  label: string;
  prob: number;
  source: MacroQuoteSource;
  slug?: string;
}

export interface MacroPayload {
  source: MacroQuoteSource | "mixed";
  quotes: MacroQuote[];
  whale: { amount: string; pnl: string; source: MacroQuoteSource };
  fetchedAt: string;
}

export const WATCHLIST = [
  { symbol: "SPY", label: "S&P 500 ETF" },
  { symbol: "QQQ", label: "Nasdaq 100" },
  { symbol: "BTC-USD", label: "Bitcoin" },
  { symbol: "ETH-USD", label: "Ethereum" },
] as const;
