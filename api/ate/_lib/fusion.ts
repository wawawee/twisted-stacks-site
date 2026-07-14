/** Signal fusion — TS port of packages/fusion/fuse.py. */

export interface FusionConfig {
  classical_weight: number;
  vision_weight: number;
  sequence_weight: number;
  macro_weight: number;
}

export const DEFAULT_FUSION_CONFIG: FusionConfig = {
  classical_weight: 0.35,
  vision_weight: 0.35,
  sequence_weight: 0.15,
  macro_weight: 0.15,
};

export const DEFAULT_TRADE_THRESHOLD = 0.6;

function clamp01(value: number): number {
  return Math.max(0, Math.min(1, Math.round(value * 1_000_000) / 1_000_000));
}

export function fuseSignal(
  classical: number,
  vision: number,
  sequence: number,
  macro: number,
  regimeMultiplier = 1,
  config: FusionConfig = DEFAULT_FUSION_CONFIG,
): number {
  const raw =
    config.classical_weight * classical +
    config.vision_weight * vision +
    config.sequence_weight * sequence +
    config.macro_weight * macro;
  return clamp01(raw * regimeMultiplier);
}

export function tradeAllowed(fusedScore: number, threshold = DEFAULT_TRADE_THRESHOLD): boolean {
  return fusedScore >= threshold;
}

/** Average macro quote probability (0–1) from Polymarket-style payloads. */
export function macroLaneScore(quotes: { prob: number }[]): number {
  if (!quotes.length) return 0;
  const avg = quotes.reduce((sum, q) => sum + q.prob, 0) / quotes.length;
  return clamp01(avg / 100);
}
