import { requireSession, type VercelRequest, type VercelResponse } from "../_lib/session.js";

type HitlDecision = "approved" | "rejected";

interface HitlRequestBody {
  symbol?: string;
  decision?: HitlDecision;
  fusion_score?: number;
  workflow_id?: string;
}

/** Map UI decision to PaperTickWorkflow Temporal signal names. */
function temporalSignalName(decision: HitlDecision): "approve_hitl" | "reject_hitl" {
  return decision === "approved" ? "approve_hitl" : "reject_hitl";
}

function postHitlStatus(decision: HitlDecision): string {
  return decision === "approved" ? "paper_ready" : "hitl_rejected";
}

function defaultWorkflowId(symbol: string): string {
  return `paper-tick-${symbol.toUpperCase()}`;
}

function isTemporalConfigured(): boolean {
  const address = process.env.TEMPORAL_ADDRESS?.trim();
  const namespace = process.env.TEMPORAL_NAMESPACE?.trim();
  return Boolean(address && namespace);
}

async function signalTemporalProxy(params: {
  symbol: string;
  decision: HitlDecision;
  workflowId: string;
  fusionScore: number | null;
}): Promise<{ signaled: boolean; detail?: string; temporal?: unknown }> {
  const proxyUrl = process.env.ATE_HITL_PROXY_URL?.trim();
  if (!proxyUrl) {
    return {
      signaled: false,
      detail: "ATE_HITL_PROXY_URL not set — log-only stub (see docs/DEPLOY_ENV.md)",
    };
  }

  const resp = await fetch(proxyUrl, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      symbol: params.symbol,
      decision: params.decision,
      workflow_id: params.workflowId,
      fusion_score: params.fusionScore,
    }),
  });

  if (!resp.ok) {
    const text = await resp.text();
    return { signaled: false, detail: `proxy ${resp.status}: ${text.slice(0, 200)}` };
  }

  const body = (await resp.json()) as Record<string, unknown>;
  return { signaled: true, temporal: body };
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
  res.setHeader("Cache-Control", "no-store");

  if (req.method !== "POST") {
    res.setHeader("Allow", "POST");
    res.status(405).json({ error: "Method not allowed" });
    return;
  }

  if (!requireSession(req, res)) return;

  const body = (req.body ?? {}) as HitlRequestBody;
  const symbol = String(body.symbol || "").trim().toUpperCase();
  const decision = body.decision;

  if (!symbol || !/^[A-Z0-9./\-]+$/.test(symbol)) {
    res.status(400).json({ error: "Invalid or missing symbol" });
    return;
  }

  if (decision !== "approved" && decision !== "rejected") {
    res.status(400).json({ error: 'decision must be "approved" or "rejected"' });
    return;
  }

  const fusionScore =
    typeof body.fusion_score === "number" && Number.isFinite(body.fusion_score)
      ? body.fusion_score
      : null;
  const workflowId = body.workflow_id?.trim() || defaultWorkflowId(symbol);

  const record = {
    symbol,
    decision,
    fusion_score: fusionScore,
    workflow_id: workflowId,
    temporal_signal: temporalSignalName(decision),
    at: new Date().toISOString(),
  };

  console.info("[ate/hitl]", JSON.stringify(record));

  let temporalResult: { signaled: boolean; detail?: string; temporal?: unknown } | null = null;
  if (isTemporalConfigured()) {
    temporalResult = await signalTemporalProxy({
      symbol,
      decision,
      workflowId,
      fusionScore,
    });
    if (temporalResult.signaled) {
      console.info("[ate/hitl] temporal signaled", JSON.stringify(temporalResult.temporal));
    } else {
      console.warn("[ate/hitl] temporal stub", temporalResult.detail);
    }
  }

  const status = postHitlStatus(decision);

  res.status(200).json({
    ok: true,
    status,
    recorded: record,
    temporal: temporalResult,
  });
}
