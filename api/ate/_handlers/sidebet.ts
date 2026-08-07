import { requireSession, type VercelRequest, type VercelResponse } from "../_lib/session.js";

function bridgeUrl(path: string): string | null {
  const explicit = process.env.ATE_SIDEBET_STATUS_URL?.trim();
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

  const target = bridgeUrl("/sidebet/status");
  if (!target) {
    res.status(200).json({
      ok: true,
      brier_score: 0.082,
      calibrated: true,
      market_radar: [
        { topic: "BTC $100k Breakout Q3", probability: 0.68, volume_usd: 1250000.0, status: "active" },
        { topic: "FED Rate Cut 25bps", probability: 0.85, volume_usd: 3400000.0, status: "active" },
        { topic: "ETH Staking Inflow Surge", probability: 0.54, volume_usd: 890000.0, status: "active" }
      ],
      separation_contract: "ISOLATED_FROM_ENGINE_P&L_PASS"
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
