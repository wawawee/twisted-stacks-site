/** Cup-and-handle detector (TS port of packages/patterns/cup_and_handle.py). */

import type { YahooBar } from "./yahoo.js";

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

interface CupHandleConfig {
  min_cup_bars: number;
  max_cup_bars: number;
  min_handle_bars: number;
  max_handle_bars: number;
  cup_depth_min_pct: number;
  cup_depth_max_pct: number;
  rim_tolerance_pct: number;
  handle_depth_max_pct: number;
  swing_lookback: number;
  min_confidence: number;
  breakout_buffer_pct: number;
}

const DEFAULT_CONFIG: CupHandleConfig = {
  min_cup_bars: 20,
  max_cup_bars: 120,
  min_handle_bars: 5,
  max_handle_bars: 40,
  cup_depth_min_pct: 0.12,
  cup_depth_max_pct: 0.5,
  rim_tolerance_pct: 0.1,
  handle_depth_max_pct: 0.18,
  swing_lookback: 5,
  min_confidence: 0.55,
  breakout_buffer_pct: 0.01,
};

interface SwingPoint {
  index: number;
  price: number;
  kind: "high" | "low";
}

function swingPoints(bars: YahooBar[], lookback: number): SwingPoint[] {
  const points: SwingPoint[] = [];
  const n = bars.length;
  if (n < lookback * 2 + 1) return points;

  for (let i = lookback; i < n - lookback; i++) {
    let isHigh = true;
    let isLow = true;
    for (let j = i - lookback; j <= i + lookback; j++) {
      if (bars[j].high > bars[i].high) isHigh = false;
      if (bars[j].low < bars[i].low) isLow = false;
    }
    if (isHigh) points.push({ index: i, price: bars[i].high, kind: "high" });
    else if (isLow) points.push({ index: i, price: bars[i].low, kind: "low" });
  }
  return points;
}

function rimLevel(bars: YahooBar[], start: number, end: number): [number, number] {
  let bestI = start;
  let bestH = bars[start].high;
  for (let i = start; i <= end; i++) {
    if (bars[i].high > bestH) {
      bestH = bars[i].high;
      bestI = i;
    }
  }
  return [bestI, bestH];
}

function scorePattern(
  leftRim: number,
  rightRim: number,
  cupBottom: number,
  handleLow: number,
  lastClose: number,
  cupBars: number,
  handleBars: number,
  cfg: CupHandleConfig,
): [number, number] {
  const rimAvg = (leftRim + rightRim) / 2;
  if (rimAvg <= 0) return [0, cupBottom];

  const cupDepth = (rimAvg - cupBottom) / rimAvg;
  const rimSym = 1 - Math.min(Math.abs(leftRim - rightRim) / rimAvg / cfg.rim_tolerance_pct, 1);
  const handleDepth = (rightRim - handleLow) / rightRim;
  const handleOk =
    1 -
    Math.min(Math.max(handleDepth - cfg.handle_depth_max_pct * 0.5, 0) / cfg.handle_depth_max_pct, 1);

  let depthOk = 1;
  if (cupDepth < cfg.cup_depth_min_pct) depthOk = cupDepth / cfg.cup_depth_min_pct;
  else if (cupDepth > cfg.cup_depth_max_pct)
    depthOk = Math.max(0, 1 - (cupDepth - cfg.cup_depth_max_pct) / cfg.cup_depth_max_pct);

  let durationOk = 1;
  if (cupBars < cfg.min_cup_bars) durationOk *= cupBars / cfg.min_cup_bars;
  if (handleBars < cfg.min_handle_bars) durationOk *= handleBars / cfg.min_handle_bars;

  const breakoutProx = lastClose / rightRim;
  let breakoutScore: number;
  if (breakoutProx >= 1) breakoutScore = 1;
  else if (breakoutProx >= 1 - cfg.breakout_buffer_pct * 3) {
    breakoutScore =
      0.7 + (0.3 * (breakoutProx - (1 - cfg.breakout_buffer_pct * 3))) / (cfg.breakout_buffer_pct * 3);
  } else {
    breakoutScore = (Math.max(0, breakoutProx - 0.85) / 0.15) * 0.5;
  }

  const confidence =
    0.25 * rimSym + 0.2 * depthOk + 0.2 * handleOk + 0.15 * durationOk + 0.2 * breakoutScore;
  const invalidation = Math.min(handleLow, cupBottom);
  return [Math.min(Math.max(confidence, 0), 1), invalidation];
}

export function detectCupAndHandle(
  bars: YahooBar[],
  config: Partial<CupHandleConfig> = {},
): CupHandleSignal[] {
  if (bars.length < 40) return [];

  const cfg = { ...DEFAULT_CONFIG, ...config };
  const ts = bars[bars.length - 1].ts;
  const swings = swingPoints(bars, cfg.swing_lookback);
  const lows = swings.filter((p) => p.kind === "low");
  const signals: CupHandleSignal[] = [];
  const seen = new Set<string>();

  for (const cupLow of lows) {
    const bIdx = cupLow.index;
    const cupBottom = cupLow.price;

    const cupStart = Math.max(0, bIdx - cfg.max_cup_bars);
    const [leftI, leftRim] = rimLevel(bars, cupStart, bIdx);
    if (leftI >= bIdx - cfg.min_cup_bars / 2) continue;

    const cupEnd = Math.min(bars.length - 1, bIdx + cfg.max_cup_bars);
    const [rightI, rightRim] = rimLevel(bars, bIdx, cupEnd);
    if (rightI <= bIdx + cfg.min_cup_bars / 3) continue;

    const cupBars = rightI - leftI;
    if (cupBars < cfg.min_cup_bars || cupBars > cfg.max_cup_bars) continue;

    const rimAvg = (leftRim + rightRim) / 2;
    const cupDepth = (rimAvg - cupBottom) / rimAvg;
    if (cupDepth < cfg.cup_depth_min_pct || cupDepth > cfg.cup_depth_max_pct) continue;

    const rimDiff = Math.abs(leftRim - rightRim) / rimAvg;
    if (rimDiff > cfg.rim_tolerance_pct) continue;

    const handleStart = rightI;
    const handleEnd = Math.min(bars.length - 1, rightI + cfg.max_handle_bars);
    if (handleEnd <= handleStart) continue;

    let handleLow = Infinity;
    for (let j = handleStart; j <= handleEnd; j++) {
      handleLow = Math.min(handleLow, bars[j].low);
    }
    const handleBars = handleEnd - handleStart;
    if (handleBars < cfg.min_handle_bars) continue;

    const handleDepth = (rightRim - handleLow) / rightRim;
    if (handleDepth > cfg.handle_depth_max_pct || handleDepth <= 0) continue;

    const key = `${leftI}-${rightI}`;
    if (seen.has(key)) continue;
    seen.add(key);

    const lastClose = bars[bars.length - 1].close;
    const [confidence, invalidation] = scorePattern(
      leftRim,
      rightRim,
      cupBottom,
      handleLow,
      lastClose,
      cupBars,
      handleBars,
      cfg,
    );
    if (confidence < cfg.min_confidence) continue;

    signals.push({
      ticker: bars[0].symbol,
      timeframe: bars[0].timeframe,
      breakout_confidence: Math.round(confidence * 10000) / 10000,
      vision_score: 0,
      sequence_prob: 0,
      fused_score: Math.round(confidence * 10000) / 10000,
      invalidation: Math.round(invalidation * 10000) / 10000,
      timestamp: ts,
    });
  }

  return signals.sort((a, b) => b.breakout_confidence - a.breakout_confidence);
}
