import { requireSession, type VercelRequest, type VercelResponse } from "../_lib/session.js";

function bridgeUrl(path: string): string | null {
  const explicit = process.env.ATE_PAPER_START_URL?.trim();
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
  return { Authorization: `Bearer ${token}`, "Content-Type": "application/json" };
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
  res.setHeader("Cache-Control", "no-store");
  if (req.method !== "POST") {
    res.setHeader("Allow", "POST");
    res.status(405).json({ error: "Method not allowed" });
    return;
  }

  if (!requireSession(req, res)) return;

  const target = bridgeUrl("/paper/start");
  const bodyObj = (req.body && typeof req.body === "object") ? (req.body as Record<string, unknown>) : {};
  if (!target) {
    const symbol = String(bodyObj.symbol || "SPY").toUpperCase();
    res.status(200).json({
      ok: true,
      started: true,
      workflow_id: `paper-sim-${symbol}-${Date.now()}`,
      symbol: symbol,
      source: "mock_standalone"
    });
    return;
  }

  try {
    const upstream = await fetch(target, {
      method: "POST",
      headers: { Accept: "application/json", ...bridgeAuthHeaders() },
      body: JSON.stringify(req.body || {}),
    });
    const data = await upstream.json();
    res.status(upstream.status).json(data);
  } catch (err) {
    res.status(502).json({ error: "Upstream bridge unreachable" });
  }
}
