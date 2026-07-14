import { requireSession, type VercelRequest, type VercelResponse } from "../_lib/session.js";
import { fetchYahooBars, quoteFromBars } from "../_lib/yahoo.js";

export default async function handler(req: VercelRequest, res: VercelResponse) {
  res.setHeader("Cache-Control", "public, max-age=60");

  if (req.method !== "GET") {
    res.setHeader("Allow", "GET");
    res.status(405).json({ error: "Method not allowed" });
    return;
  }

  if (!requireSession(req, res)) return;

  const symbol = String(req.query.symbol || "SPY").toUpperCase();
  const timeframe = String(req.query.timeframe || "1d");
  const range = String(req.query.range || "1y");

  if (!/^[A-Z0-9./\-]+$/.test(symbol)) {
    res.status(400).json({ error: "Invalid symbol" });
    return;
  }

  try {
    const bars = await fetchYahooBars(symbol, timeframe, range);
    const quote = quoteFromBars(bars);
    res.status(200).json({
      symbol,
      timeframe,
      range,
      bar_count: bars.length,
      quote,
      bars,
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Market fetch failed";
    res.status(502).json({ error: message });
  }
}
