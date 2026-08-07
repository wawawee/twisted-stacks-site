import { requireSession, type VercelRequest, type VercelResponse } from "../_lib/session.js";

function bridgeUrl(path: string): string | null {
  const explicit = process.env.ATE_FEED_SIGNALS_URL?.trim();
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

  const target = bridgeUrl("/feed/signals");
  if (!target) {
    res.status(200).json({ ok: false, signals: [], error: "no_bridge" });
    return;
  }

  const url = new URL(target);
  const symbols = String(req.query.symbols || "SPY,QQQ,BTC-USD,ETH-USD,SOL-USD,NVDA");
  url.searchParams.set("symbols", symbols);

  try {
    const upstream = await fetch(url.toString(), {
      headers: { Accept: "application/json", ...bridgeAuthHeaders() },
    });
    if (!upstream.ok) {
      res.status(200).json({ ok: false, signals: [], error: `http_${upstream.status}` });
      return;
    }
    const data = await upstream.json();
    res.status(200).json(data);
  } catch (err) {
    res.status(200).json({ ok: false, signals: [], error: "unreachable" });
  }
}
