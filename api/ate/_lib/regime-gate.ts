/** RegimeGate v1 — price-only ADX/ATR/slope gating (TS port of packages/fusion/regime_gate.py). */

import type { YahooBar } from "./yahoo.js";

export type RegimeLabel = "trending" | "ranging" | "chop" | "crisis";

export interface RegimeGateResult {
  regime: RegimeLabel;
  cup_handle_allowed: boolean;
  adx?: number;
}

export interface RegimeGateConfig {
  adx_min_spy: number;
  adx_min_btc: number;
  atr_percentile_max: number;
  crisis_atr_percentile: number;
}

const ADX_PERIOD = 14;
const MA_PERIOD = 20;
const ATR_HISTORY_BARS = 90;
const RANGING_ADX_MAX = 20;
const MIN_BARS = ADX_PERIOD * 2 + MA_PERIOD;

const DEFAULT_CONFIG: RegimeGateConfig = {
  adx_min_spy: 25,
  adx_min_btc: 20,
  atr_percentile_max: 0.8,
  crisis_atr_percentile: 0.9,
};

function adxMinForSymbol(symbol: string, config: RegimeGateConfig): number {
  const sym = symbol.toUpperCase();
  if (sym === "BTC" || sym === "BTC-USD" || sym === "BTC/USD") {
    return config.adx_min_btc;
  }
  return config.adx_min_spy;
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

function computeAdxAtr(
  highs: number[],
  lows: number[],
  closes: number[],
  period = ADX_PERIOD,
): { adx: number[]; atr: number[] } {
  const n = closes.length;
  const tr: number[] = [];
  const plusDm: number[] = [];
  const minusDm: number[] = [];

  for (let i = 0; i < n; i++) {
    if (i === 0) {
      tr.push(highs[i] - lows[i]);
      plusDm.push(0);
      minusDm.push(0);
      continue;
    }
    const prevClose = closes[i - 1];
    const prevHigh = highs[i - 1];
    const prevLow = lows[i - 1];
    tr.push(Math.max(highs[i] - lows[i], Math.abs(highs[i] - prevClose), Math.abs(lows[i] - prevClose)));
    const upMove = highs[i] - prevHigh;
    const downMove = prevLow - lows[i];
    plusDm.push(upMove > downMove && upMove > 0 ? upMove : 0);
    minusDm.push(downMove > upMove && downMove > 0 ? downMove : 0);
  }

  const atr = wilderSmooth(tr, period);
  const plusDi = wilderSmooth(plusDm, period).map((v, i) => (atr[i] > 0 ? (100 * v) / atr[i] : 0));
  const minusDi = wilderSmooth(minusDm, period).map((v, i) => (atr[i] > 0 ? (100 * v) / atr[i] : 0));
  const dx = plusDi.map((p, i) => {
    const sum = p + minusDi[i];
    return sum > 0 ? (100 * Math.abs(p - minusDi[i])) / sum : 0;
  });
  const adx = wilderSmooth(dx, period);
  return { adx, atr };
}

function atrPercentile(atrPctSeries: number[], window = ATR_HISTORY_BARS): number {
  const history = atrPctSeries.filter((v) => Number.isFinite(v)).slice(-window);
  if (history.length < 2) return 0.5;
  const latest = history[history.length - 1];
  const rank = history.filter((v) => v <= latest).length;
  return rank / history.length;
}

function maSlope(closes: number[], period = MA_PERIOD, lookback = 5): number {
  const ma: number[] = [];
  for (let i = 0; i < closes.length; i++) {
    if (i < period - 1) continue;
    let sum = 0;
    for (let j = i - period + 1; j <= i; j++) sum += closes[j];
    ma.push(sum / period);
  }
  if (ma.length <= lookback) return 0;
  const last = ma[ma.length - 1];
  const prev = ma[ma.length - 1 - lookback];
  return (last - prev) / lookback;
}

type InternalRegime = "trend_up" | "trend_down" | "range" | "high_vol";

function classifyInternal(
  adx: number,
  atrPct: number,
  slope: number,
  adxMin: number,
  config: RegimeGateConfig,
): InternalRegime {
  if (atrPct > config.crisis_atr_percentile) return "high_vol";
  if (adx < RANGING_ADX_MAX) return "range";
  if (adx >= adxMin && slope > 0 && atrPct <= config.atr_percentile_max) return "trend_up";
  if (adx >= adxMin && slope < 0 && atrPct <= config.atr_percentile_max) return "trend_down";
  if (atrPct > config.atr_percentile_max) return "high_vol";
  return "range";
}

function toUiRegime(internal: InternalRegime, adx: number, atrPct: number, config: RegimeGateConfig): RegimeLabel {
  if (atrPct > config.crisis_atr_percentile) return "crisis";
  if (adx < RANGING_ADX_MAX) return "ranging";
  if (internal === "trend_up") return "trending";
  return "chop";
}

export function classifyRegime(
  bars: YahooBar[],
  symbol: string,
  config: Partial<RegimeGateConfig> = {},
): RegimeGateResult {
  const cfg = { ...DEFAULT_CONFIG, ...config };

  if (bars.length < MIN_BARS) {
    return { regime: "ranging", cup_handle_allowed: false };
  }

  const highs = bars.map((b) => b.high);
  const lows = bars.map((b) => b.low);
  const closes = bars.map((b) => b.close);

  const { adx: adxSeries, atr: atrSeries } = computeAdxAtr(highs, lows, closes);
  const adx = adxSeries[adxSeries.length - 1];
  const atrPctSeries = atrSeries.map((a, i) => (closes[i] > 0 ? a / closes[i] : 0));
  const atrPct = atrPercentile(atrPctSeries);
  const slope = maSlope(closes);
  const adxMin = adxMinForSymbol(symbol, cfg);

  const internal = classifyInternal(adx, atrPct, slope, adxMin, cfg);
  const regime = toUiRegime(internal, adx, atrPct, cfg);

  return {
    regime,
    cup_handle_allowed: regime === "trending",
    adx: Math.round(adx * 100) / 100,
  };
}
