/** TA features — TS port of packages/patterns/ta_features.py (no pandas-ta). */

import type { YahooBar } from "./yahoo.js";

export const MA_FAST = 20;
export const MA_SLOW = 50;
export const ATR_PERIOD = 14;
export const VOLUME_RECENT_BARS = 10;
export const VOLUME_BASELINE_BARS = 50;

export const MIN_TA_BARS = VOLUME_RECENT_BARS + VOLUME_BASELINE_BARS;

export interface TaFeatures {
  bar_count: number;
  volume_dry_up_ratio: number | null;
  ma20: number | null;
  ma50: number | null;
  ma_stack_bullish: boolean | null;
  atr: number | null;
  atr_pct: number | null;
}

function sma(values: number[], period: number): number | null {
  if (values.length < period) return null;
  const slice = values.slice(-period);
  return slice.reduce((sum, v) => sum + v, 0) / period;
}

function wilderSmooth(values: number[], period: number): number[] {
  const alpha = 1 / period;
  const out: number[] = [];
  for (let i = 0; i < values.length; i++) {
    if (i === 0) out.push(values[i]);
    else out.push(out[i - 1] + alpha * (values[i] - out[i - 1]));
  }
  return out;
}

function computeAtr(highs: number[], lows: number[], closes: number[], period = ATR_PERIOD): number | null {
  if (closes.length < period + 1) return null;
  const tr: number[] = [];
  for (let i = 0; i < closes.length; i++) {
    if (i === 0) {
      tr.push(highs[i] - lows[i]);
      continue;
    }
    const prevClose = closes[i - 1];
    tr.push(Math.max(highs[i] - lows[i], Math.abs(highs[i] - prevClose), Math.abs(lows[i] - prevClose)));
  }
  const atrSeries = wilderSmooth(tr, period);
  const atr = atrSeries[atrSeries.length - 1];
  return Number.isFinite(atr) ? atr : null;
}

function volumeDryUpRatio(volumes: number[]): number | null {
  const needed = VOLUME_RECENT_BARS + VOLUME_BASELINE_BARS;
  if (volumes.length < needed) return null;
  const recent = volumes.slice(-VOLUME_RECENT_BARS).reduce((a, b) => a + b, 0) / VOLUME_RECENT_BARS;
  const baseline = volumes.slice(-needed, -VOLUME_RECENT_BARS).reduce((a, b) => a + b, 0) / VOLUME_BASELINE_BARS;
  if (baseline <= 0) return null;
  return recent / baseline;
}

function round4(n: number): number {
  return Math.round(n * 10000) / 10000;
}

/** Compute volume dry-up, MA stack (20/50), and ATR from OHLCV bars. */
export function computeTaFeatures(bars: YahooBar[]): TaFeatures | null {
  if (bars.length < MA_SLOW) return null;

  const closes = bars.map((b) => b.close);
  const highs = bars.map((b) => b.high);
  const lows = bars.map((b) => b.low);
  const volumes = bars.map((b) => b.volume);

  const ma20 = sma(closes, MA_FAST);
  const ma50 = sma(closes, MA_SLOW);
  const maStackBullish = ma20 != null && ma50 != null ? ma20 > ma50 : null;
  const atr = computeAtr(highs, lows, closes);
  const lastClose = closes[closes.length - 1];
  const atrPct = atr != null && lastClose > 0 ? atr / lastClose : null;
  const dryUp = volumeDryUpRatio(volumes);

  return {
    bar_count: bars.length,
    volume_dry_up_ratio: dryUp != null ? round4(dryUp) : null,
    ma20: ma20 != null ? round4(ma20) : null,
    ma50: ma50 != null ? round4(ma50) : null,
    ma_stack_bullish: maStackBullish,
    atr: atr != null ? round4(atr) : null,
    atr_pct: atrPct != null ? round4(atrPct) : null,
  };
}
