# Temporal workflows — durable pipeline (research lock)

Fundament for replay, HITL, and agent debugging. Bad workflow design = impossible to answer *"what happened at 14:32 when Vision said 0.91 but Risk vetoed?"*

---

## Canonical pipeline

```text
ingest → scan → validate → risk → execute
         │        │          │        │
         │        │          │        └─ PaperExecutionGateway / HITL gate
         │        │          └─ Risk Officer (veto | sizing | hitl flag)
         │        └─ Vision + Sequence + Fusion (Phase 2–3)
         └─ Classical C&H (Phase 1 live)
```

Each step = **Temporal activity** (all I/O). Workflow code = orchestration only.

---

## Workflows (Phase 5)

| Workflow | Purpose | continue-as-new? |
|----------|---------|------------------|
| `IngestWorkflow` | OHLCV + alt-data pull | Yes (market streams) |
| `ScanCupHandleWorkflow` | Classical scan | Per tick / schedule |
| `ValidateWorkflow` | Vision + sequence scores | Per candidate |
| `PaperTickWorkflow` | Scheduled paper loop | Yes |
| `ApproveAndExecuteWorkflow` | HITL → order intent | Signal-driven |

**Live today (2026-08-03):**

| Component | Status |
|-----------|--------|
| `ScanCupHandleWorkflow` | Skeleton + hello probe |
| `PaperTickWorkflow` | Risk gate + HITL pause wired; TRADE starts via `POST /paper/start` → id `paper-tick-{SYMBOL}-{unix}` (no fixed guess) |
| `run_vision_onnx_activity` | ONNX classify → `~/ate-data/cache/vision/{SYMBOL}.json` |
| HITL API proxy | `/hitl/signal` → Temporal `approve_hitl` / `reject_hitl` (requires `ATE_BRIDGE_TOKEN` + `ATE_BRIDGE_ALLOW_HITL`) |
| Nightly batch | `scripts/nightly-batch.sh` — hybrid-scan + research + pmxt/worldmonitor |
| LangGraph swarm | `services/swarm/paper_tick_graph.py` stub (Temporal bind pending) |
| Merge | `feat/ate-local-bridge` on `main` (`320e027`) |
| HITL e2e | `scripts/hitl-e2e.py` — approve/reject + `/hitl/signal` proxy verified (2026-08-03) |
| HITL chaos | `scripts/hitl-chaos.py` — kill worker mid-`in_hitl_wait`, resume, approve → `paper_ready` |

**HITL smoke:**

```bash
temporal server start-dev --headless
# optional API proxy:
ATE_BRIDGE_TOKEN=smoke ATE_BRIDGE_ALLOW_HITL=true uvicorn services.api.main:app --port 8000
python scripts/hitl-e2e.py --decision approved
python scripts/hitl-e2e.py --decision rejected --via-api
# Chaos (kill worker mid-HITL, resume, approve):
python scripts/hitl-chaos.py
```

**Continue-as-new (TASKLIST #18, done):** `PaperTickWorkflow.run(max_ticks_per_run=50)`
hands the remaining tick budget to a fresh execution via `workflow.continue_as_new` once
`max_ticks_per_run` ticks complete in the current run, keyed off the pure
`should_continue_as_new(ticks_run, max_ticks_per_run, in_hitl_wait)` helper
(`services/temporal_worker/workflows/hitl_logic.py`) — always `False` while
`_in_hitl_wait`, so a pending `approve_hitl`/`reject_hitl` signal can't be lost across
the history reset. Same `workflow_id`, fresh history; `symbol` / `interval_seconds` /
`equity_usd` / `hitl_timeout_hours` / `use_swarm_graph` / `max_ticks_per_run` carry over
unchanged, only `max_ticks` becomes the remaining count. Default `max_ticks=1` never
reaches the chunk boundary, so single-tick / e2e behavior is unaffected.

**Pending:** chaos kill/resume CI test.

---

## Idempotency & replay

| Rule | Why |
|------|-----|
| Client order IDs on every intent | Safe retry on execute activity |
| Activity inputs logged to episodes | Episodic memory citation |
| Workflow ID = `symbol/tf/date` for scans | Dedup scheduled runs |
| HITL = Temporal **signal** `approve` / `reject` | Durable pause |

---

## UI mapping (Telemetry + Swarm Map)

| UI | Temporal binding |
|----|------------------|
| **Telemetry lane** | Live activity log: step, status, latency, error |
| Agent Swarm Map (Phase 6) | Nodes highlight current workflow step |
| HITL modal | Fires `ApproveAndExecuteWorkflow` signal |

See [telemetry.md](telemetry.md) for early colab stub.

---

## Chaos / exit criteria

- Kill worker mid-approval → resume without duplicate order
- CI: Temporal kill test in Phase 5+ ([qa-chaos agent](../../.cursor/agents/qa-chaos.md))

*Tasks in [TASKLIST.md](../../TASKLIST.md) Phase 5.*
