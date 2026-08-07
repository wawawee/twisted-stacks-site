import { requireSession, type VercelRequest, type VercelResponse } from "../_lib/session.js";

function bridgeUrl(path: string): string | null {
  const explicit = process.env.ATE_PAPER_LEADERBOARD_URL?.trim();
  if (explicit) return explicit;
  const base = process.env.ATE_BRIDGE_URL?.trim() || process.env.ATE_HITL_PROXY_URL?.trim();
  if (!base) return null;
  try {
    const u = new URL(base);
    return `${u.origin}${path}`;
  } catch {
    return null;
  }
}

function bridgeAuthHeaders(): HeadersInit {
  const token = process.env.ATE_BRIDGE_TOKEN?.trim();
  if (!token) return {};
  return { Authorization: `Bearer ${token}` };
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
  res.setHeader("Cache-Control", "no-store");
  if (!requireSession(req, res)) return;

  const target = bridgeUrl("/paper/leaderboard");
  if (!target) {
    res.status(200).json({
      ok: true,
      initial_balance_usd: 100000.0,
      members: [
        { id: "joachim", name: "Joachim", equity_usd: 100000.0, pnl_pct: 0.0, trades: 0, rank: 1 },
        { id: "per", name: "Per", equity_usd: 100000.0, pnl_pct: 0.0, trades: 0, rank: 1 },
        { id: "kris", name: "Kris", equity_usd: 100000.0, pnl_pct: 0.0, trades: 0, rank: 1 },
        { id: "baha", name: "Baha", equity_usd: 100000.0, pnl_pct: 0.0, trades: 0, rank: 1 },
      ],
    });
    return;
  }

  try {
    const upstream = await fetch(target, {
      headers: { Accept: "application/json", ...bridgeAuthHeaders() },
    });
    if (!upstream.ok) {
      res.status(200).json({ ok: false, error: `http_${upstream.status}` });
      return;
    }
    const data = await upstream.json();
    res.status(200).json(data);
  } catch (err) {
    res.status(200).json({ ok: false, error: "unreachable" });
  }
}
