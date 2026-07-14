import { detectCupAndHandle } from "../_lib/cup-handle.js";
import { fuseSignal, macroLaneScore, tradeAllowed } from "../_lib/fusion.js";
import { buildMacroResponse } from "../_handlers/macro.js";
import { classifyRegime } from "../_lib/regime-gate.js";
import { applyRiskGate, DEFAULT_PAPER_EQUITY_USD } from "../_lib/risk-gate.js";
import { computeTaFeatures } from "../_lib/ta-features.js";
import { fetchYahooBars } from "../_lib/yahoo.js";
import { requireSession, type VercelRequest, type VercelResponse } from "../_lib/session.js";

export default async function handler(req: VercelRequest, res: VercelResponse) {
  res.setHeader("Cache-Control", "public, max-age=120");

  if (req.method !== "GET") {
    res.setHeader("Allow", "GET");
    res.status(405).json({ error: "Method not allowed" });
    return;
  }

  if (!requireSession(req, res)) return;

  const symbol = String(req.query.symbol || "SPY").toUpperCase();
  const timeframe = String(req.query.timeframe || "1d");
  const range = String(req.query.range || "1y");
  const minConfidence = Number(req.query.min_confidence || 0.55);
  const equityUsd = Number(req.query.equity_usd || DEFAULT_PAPER_EQUITY_USD);

  if (!/^[A-Z0-9./\-]+$/.test(symbol)) {
    res.status(400).json({ error: "Invalid symbol" });
    return;
  }

  try {
    const bars = await fetchYahooBars(symbol, timeframe, range);
    const signals = detectCupAndHandle(bars, { min_confidence: minConfidence });
    const regime = classifyRegime(bars, symbol);
    const ta = computeTaFeatures(bars);

    const macro = await buildMacroResponse();
    const macroScore = macroLaneScore(macro.quotes);

    const top = signals[0];
    const fusedScore = top
      ? fuseSignal(
          top.breakout_confidence,
          top.vision_score,
          top.sequence_prob,
          macroScore,
          regime.multiplier,
        )
      : 0;

    const allowed = tradeAllowed(fusedScore);
    const risk = applyRiskGate({
      fusedScore,
      tradeAllowed: allowed,
      hasSignal: top != null,
      equityUsd: Number.isFinite(equityUsd) ? equityUsd : DEFAULT_PAPER_EQUITY_USD,
    });

    res.status(200).json({
      symbol,
      timeframe,
      range,
      bar_count: bars.length,
      signal_count: signals.length,
      signals,
      regime,
      ta,
      macro_score: macroScore,
      fused_score: fusedScore,
      trade_allowed: allowed,
      requires_hitl: risk.requires_hitl,
      risk: {
        requires_hitl: risk.requires_hitl,
        approved: risk.approved,
        adjusted_notional_frac: risk.adjusted_notional_frac,
        veto_reason: risk.veto_reason,
        proposed_notional_frac: risk.proposed_notional_frac,
        notional_usd: risk.notional_usd,
        equity_usd: risk.equity_usd,
        status: risk.status,
        action: risk.action,
      },
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Scan failed";
    res.status(502).json({ error: message });
  }
}
