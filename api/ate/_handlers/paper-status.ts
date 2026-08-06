/**
 * Proxy Temporal PaperTick hitl_status (in_hitl_wait) for TRADE UI.
 * Uses ATE_PAPER_STATUS_URL or derives from ATE_HITL_PROXY_URL / ATE_PAPER_START_URL host.
 */
import { requireSession, type VercelRequest, type VercelResponse } from "../_lib/session.js";

function paperStatusEndpoint(): string | null {
  const explicit = process.env.ATE_PAPER_STATUS_URL?.trim();
  if (explicit) return explicit.replace(/\/$/, "");

  for (const key of ["ATE_PAPER_START_URL", "ATE_HITL_PROXY_URL"] as const) {
    const raw = process.env[key]?.trim();
    if (!raw) continue;
    try {
      const u = new URL(raw);
      return `${u.origin}/paper/status`;
    } catch {
      /* try next */
    }
  }
  return null;
}

function bridgeAuthHeaders(): HeadersInit {
  const token = process.env.ATE_BRIDGE_TOKEN?.trim();
  if (!token) return {};
  return { Authorization: `Bearer ${token}` };
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
  res.setHeader("Cache-Control", "no-store");

  if (req.method !== "GET") {
    res.setHeader("Allow", "GET");
    res.status(405).json({ error: "Method not allowed" });
    return;
  }

  if (!requireSession(req, res)) return;

  const workflowId = String(req.query.workflow_id || "").trim();
  if (!workflowId || workflowId.length > 128) {
    res.status(400).json({ error: "Invalid or missing workflow_id" });
    return;
  }

  const base = paperStatusEndpoint();
  if (!base) {
    res.status(200).json({
      ok: false,
      workflow_id: workflowId,
      in_hitl_wait: false,
      awaiting_signal: false,
      status: "no_bridge",
      source: "none",
    });
    return;
  }

  const url = new URL(base);
  url.searchParams.set("workflow_id", workflowId);
  const runId = String(req.query.run_id || "").trim();
  if (runId) url.searchParams.set("run_id", runId);

  const ctrl = new AbortController();
  const timer = setTimeout(() => ctrl.abort(), 8_000);
  try {
    const upstream = await fetch(url.toString(), {
      headers: { Accept: "application/json", ...bridgeAuthHeaders() },
      signal: ctrl.signal,
    });
    if (!upstream.ok) {
      const text = await upstream.text();
      res.status(200).json({
        ok: false,
        workflow_id: workflowId,
        in_hitl_wait: false,
        awaiting_signal: false,
        status: `http_${upstream.status}`,
        detail: text.slice(0, 200),
        source: "none",
      });
      return;
    }
    const body = (await upstream.json()) as Record<string, unknown>;
    res.status(200).json({
      ok: body.ok === true,
      workflow_id: body.workflow_id ?? workflowId,
      run_id: body.run_id ?? null,
      in_hitl_wait: body.in_hitl_wait === true,
      awaiting_signal: body.awaiting_signal !== false,
      pending_decision: body.pending_decision ?? null,
      hitl_status: body.hitl_status ?? null,
      status: "ok",
      source: "bridge",
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : "query failed";
    res.status(200).json({
      ok: false,
      workflow_id: workflowId,
      in_hitl_wait: false,
      awaiting_signal: false,
      status: "bridge_unreachable",
      detail: message,
      source: "none",
    });
  } finally {
    clearTimeout(timer);
  }
}
