import { detectCupAndHandle } from "../_lib/cup-handle.js";
import { classifyRegime } from "../_lib/regime-gate.js";
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

  if (!/^[A-Z0-9./\-]+$/.test(symbol)) {
    res.status(400).json({ error: "Invalid symbol" });
    return;
  }

  try {
    const bars = await fetchYahooBars(symbol, timeframe, range);
    const signals = detectCupAndHandle(bars, { min_confidence: minConfidence });
    const regime = classifyRegime(bars, symbol);
    res.status(200).json({
      symbol,
      timeframe,
      range,
      bar_count: bars.length,
      signal_count: signals.length,
      signals,
      regime,
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Scan failed";
    res.status(502).json({ error: message });
  }
}
