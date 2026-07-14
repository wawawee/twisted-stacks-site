/** Risk gate — TS port of packages/risk/gate.py + packages/risk/officer.py. */

import { DEFAULT_TRADE_THRESHOLD } from "./fusion.js";

export interface RiskOfficerConfig {
  max_notional_frac: number;
  hitl_notional_usd: number;
}

export const DEFAULT_RISK_CONFIG: RiskOfficerConfig = {
  max_notional_frac: 0.05,
  hitl_notional_usd: 5_000,
};

/** Paper equity default — mirrors ATE `paper_equity_usd`. */
export const DEFAULT_PAPER_EQUITY_USD = 100_000;

export interface RiskGateDecision {
  requires_hitl: boolean;
  approved: boolean;
  adjusted_notional_frac: number;
  veto_reason: string | null;
  proposed_notional_frac: number;
  notional_usd: number;
}

export interface RiskGatePipeline extends RiskGateDecision {
  status: string;
  action: string;
  equity_usd: number;
}

/** Scale position fraction by fused confidence, capped at max. */
export function proposedNotionalFrac(
  fusedScore: number,
  maxFrac = DEFAULT_RISK_CONFIG.max_notional_frac,
): number {
  return Math.min(maxFrac, Math.max(0, fusedScore * maxFrac));
}

/** Hybrid veto + sizing; flag HITL when USD notional exceeds threshold. */
export function evaluateRiskGate(
  fusedScore: number,
  equityUsd: number,
  config: RiskOfficerConfig = DEFAULT_RISK_CONFIG,
): RiskGateDecision {
  const proposed = proposedNotionalFrac(fusedScore, config.max_notional_frac);

  if (proposed > config.max_notional_frac) {
    return {
      requires_hitl: false,
      approved: false,
      adjusted_notional_frac: 0,
      veto_reason: `proposed notional ${proposed.toFixed(4)} exceeds max ${config.max_notional_frac.toFixed(4)}`,
      proposed_notional_frac: proposed,
      notional_usd: 0,
    };
  }

  const adjusted = Math.min(Math.max(proposed, 0), config.max_notional_frac);
  const notionalUsd = equityUsd * adjusted;
  const requiresHitl = notionalUsd > config.hitl_notional_usd;

  return {
    requires_hitl: requiresHitl,
    approved: true,
    adjusted_notional_frac: adjusted,
    veto_reason: null,
    proposed_notional_frac: proposed,
    notional_usd: notionalUsd,
  };
}

/** Apply risk gate to fusion output — mirrors `apply_risk_gate` pipeline status. */
export function applyRiskGate(params: {
  fusedScore: number;
  tradeAllowed: boolean;
  hasSignal: boolean;
  equityUsd?: number;
  config?: RiskOfficerConfig;
  tradeThreshold?: number;
}): RiskGatePipeline {
  const {
    fusedScore,
    tradeAllowed,
    hasSignal,
    equityUsd = DEFAULT_PAPER_EQUITY_USD,
    config = DEFAULT_RISK_CONFIG,
    tradeThreshold = DEFAULT_TRADE_THRESHOLD,
  } = params;

  const gated = !tradeAllowed || fusedScore < tradeThreshold;

  if (!hasSignal || gated) {
    return {
      requires_hitl: false,
      approved: false,
      adjusted_notional_frac: 0,
      veto_reason: !hasSignal ? "no_signal_for_risk" : "trade_gated",
      proposed_notional_frac: 0,
      notional_usd: 0,
      equity_usd: equityUsd,
      status: "rejected",
      action: "noop",
    };
  }

  const decision = evaluateRiskGate(fusedScore, equityUsd, config);

  if (!decision.approved) {
    return {
      ...decision,
      equity_usd: equityUsd,
      status: "risk_vetoed",
      action: "noop",
    };
  }

  if (decision.requires_hitl) {
    return {
      ...decision,
      equity_usd: equityUsd,
      status: "awaiting_hitl",
      action: "await_hitl",
    };
  }

  return {
    ...decision,
    equity_usd: equityUsd,
    status: "paper_ready",
    action: "paper_ready",
  };
}
