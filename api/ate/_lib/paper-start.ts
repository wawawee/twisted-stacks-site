/**
 * Start PaperTickWorkflow via ATE FastAPI so TRADE gets a real workflow_id.
 * Prefers ATE_PAPER_START_URL, else derives from ATE_HITL_PROXY_URL host + /paper/start.
 * Graceful null when unreachable — HITL stays log-only without guessing ids.
 */

export type PaperStartSource = "bridge" | "none";

export interface PaperStartResult {
  workflow_id: string | null;
  run_id: string | null;
  status: string;
  source: PaperStartSource;
}

const DEFAULT_TIMEOUT_MS = 12_000;

function paperStartEndpoint(): string | null {
  const explicit = process.env.ATE_PAPER_START_URL?.trim();
  if (explicit) return explicit.replace(/\/$/, "");

  const hitl = process.env.ATE_HITL_PROXY_URL?.trim();
  if (hitl) {
    try {
      const u = new URL(hitl);
      return `${u.origin}/paper/start`;
    } catch {
      return null;
    }
  }
  return null;
}

function bridgeAuthHeaders(): HeadersInit {
  const token = process.env.ATE_BRIDGE_TOKEN?.trim();
  if (!token) return {};
  return { Authorization: `Bearer ${token}` };
}

export async function startPaperTickWorkflow(params: {
  symbol: string;
  equityUsd?: number;
}): Promise<PaperStartResult> {
  const url = paperStartEndpoint();
  if (!url) {
    return { workflow_id: null, run_id: null, status: "no_bridge", source: "none" };
  }

  const ctrl = new AbortController();
  const timer = setTimeout(() => ctrl.abort(), DEFAULT_TIMEOUT_MS);
  try {
    const res = await fetch(url, {
      method: "POST",
      headers: {
        Accept: "application/json",
        "Content-Type": "application/json",
        ...bridgeAuthHeaders(),
      },
      body: JSON.stringify({
        symbol: params.symbol,
        equity_usd: params.equityUsd,
        max_ticks: 1,
      }),
      signal: ctrl.signal,
    });
    if (!res.ok) {
      return {
        workflow_id: null,
        run_id: null,
        status: `http_${res.status}`,
        source: "none",
      };
    }
    const body = (await res.json()) as {
      workflow_id?: string;
      run_id?: string;
      ok?: boolean;
    };
    const workflowId =
      typeof body.workflow_id === "string" && body.workflow_id.trim()
        ? body.workflow_id.trim()
        : null;
    return {
      workflow_id: workflowId,
      run_id: typeof body.run_id === "string" ? body.run_id : null,
      status: workflowId ? "started" : "missing_id",
      source: workflowId ? "bridge" : "none",
    };
  } catch {
    return {
      workflow_id: null,
      run_id: null,
      status: "bridge_unreachable",
      source: "none",
    };
  } finally {
    clearTimeout(timer);
  }
}
