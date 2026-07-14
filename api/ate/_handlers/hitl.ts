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
  const workflowId = body.workflow_id?.trim() || null;

  const record = {
    symbol,
    decision,
    fusion_score: fusionScore,
    workflow_id: workflowId,
    temporal_signal: temporalSignalName(decision),
    at: new Date().toISOString(),
  };

  console.info("[ate/hitl]", JSON.stringify(record));

  const status = postHitlStatus(decision);

  res.status(200).json({
    ok: true,
    status,
    recorded: record,
  });
}
