# ATE — Project History

Honest timeline. No invented revenue or live trading beyond what [TRUTH-STATUS.md](TRUTH-STATUS.md) confirms.

**Last updated:** 2026-07-24

---

## Era summary

### 2026-07: Bootstrap & Pre-Phase-0

- Repository created (`wawawee/ATE`, private)
- Canonical docs: `ULTIMATE_PLAN.md`, `CORE_STACK.md`, `AGENT_SWARM.md`, `TASKLIST.md`
- Cursor agent team under `.cursor/agents/`
- Skills pack: cup-and-handle scan, vision validate, risk CVaR check
- **Pre-Phase-0** (2026-07-14): investor colab room on twisted-stacks-site (`/ate`), wiki scratchpad, monorepo scaffold, Pydantic contracts stub, Docker Compose skeleton
- Parallel universe locked: **SPY + BTC**
- Risk Officer: hybrid veto + sizing documented

---

## Key milestones

| Date | Milestone | Evidence |
|------|-----------|----------|
| 2026-07-14 | Pre-Phase-0 bootstrap | Monorepo folders, `docs/TRUTH-STATUS.md`, colab `/ate` route |
| 2026-07-14 | Investor wiki + scratchpad | `docs/wiki/`, `wiki/by-topic/` |
| 2026-07-14 | Schema contracts stub | `packages/schemas/signals.py` |
| 2026-07-14 | Infra skeleton | `infra/docker-compose.yml`, Temporal hello workflow |
| 2026-07-14 | BTC 4h C&H backtest + tear sheet | 62 trades, +19.75%, Sharpe 0.57 — `~/ate-data/artifacts/backtest_BTC-USD_4h.html` |
| 2026-07-14 | TRADE colab v2 | Live RegimeGate, Polymarket macro, fusion + TA in scan — twistedstacks.com/ate |
| 2026-07-14 | Vision dataset v0 | 167 PNGs (`ate_v1`) — SPY 1d + BTC-USD 4h weak supervision |
| 2026-07-14 | Classical expansion | chart_patterns, pandas-ta, fusion + Risk Officer stubs |
| 2026-07-14 | Vision dataset batch | **376 pos / 165 neg** in `~/ate-data/vision/ate_v1/` (SPY, QQQ, BTC-USD) |
| 2026-07-14 | hybrid-scan export | Watchlist JSON/CSV + regime–macro correlation (`6e06f64`) |
| 2026-07-14 | Alt-data stubs | `NullOnChainProvider`, `NullSentimentProvider`, `ingest_alt_data_activity` |
| 2026-07-14 | TRADE four-lane + HITL stub | Fusion status panel + approve/reject modal (`bc3329a`) |
| 2026-07-14 | Real Edge research track | Tasks 1.1–1.4 designed; adapter swap blocked on go/no-go |
| 2026-07-14 | Phase 2 YOLO + ONNX | 50 epochs, val top1 100%; `cup-handle-yolov8n.onnx` (5.8 MB) |
| 2026-07-14 | Real Edge 1.1 NO-GO | Funding rate — 8.6% hit, 0.42× lift |
| 2026-07-14 | Real Edge 1.3 NO-GO | DXY–crypto — 47% same-day, 0.93× lift, N=17 |
| 2026-07-14 | Real Edge 1.4 NO-GO | Polymarket shifts — 41% BTC 1d, 0.91× lift, N=51 |
| 2026-07-14 | Phase 4 agents | Pattern Scout + Vision Validator (`d4ba51e`) |
| 2026-07-14 | Nightly automation batch | launchd `com.ate.nightly`, GH Actions Mon 05:00 UTC, HITL Temporal proxy, vision ONNX activity (`79b55ba`) |
| 2026-07-16 | Real Edge 1.2 deferred | No free historical netflow; CryptoQuant/Glassnode → [PAID_ALTERNATIVES.md](PAID_ALTERNATIVES.md) |
| 2026-07-16 | LangGraph paper-tick | `services/swarm/paper_tick_graph.py` — validate → risk → paper/HITL |

---

## 2026-07-14 — evening automation batch

Shipped in `79b55ba`:

- **Local schedule:** `infra/launchd/com.ate.nightly.plist` → `scripts/nightly-batch.sh` at 06:00 local (hybrid-scan CSV + research tasks 1.1/1.3/1.4; Task 1.2 deferred)
- **CI schedule:** `.github/workflows/nightly-research.yml` — tasks 1.1, 1.3, 1.4 every Monday 05:00 UTC; CSV artifacts uploaded
- **HITL proxy:** `packages/temporal/hitl_signal.py` + `services/api/routes/hitl.py` — `/hitl/signal` forwards approve/reject to `PaperTickWorkflow`; site handler wired (`038dbed`)
- **Vision ONNX activity:** `run_vision_onnx_activity` caches `VisionScore` under `~/ate-data/cache/vision/`
- **Smoke test:** `scripts/test-hitl-smoke.sh` · docs in [infra/NIGHTLY_AUTOMATION.md](../infra/NIGHTLY_AUTOMATION.md)

### 2026-07-24 evening — Macro Scout OSS pack

- **WorldMonitor:** `WorldMonitorProvider` + `scripts/worldmonitor-scan.py` (MCP, mock without key) — context only
- **FRED:** `FredSentimentProvider` for RegimeGate flags
- **Whales:** null/mock providers; TRADE geo-intel strip on colab
- **ATE signals MCP stub:** `GET /mcp/tools` · skills for Real Edge / Macro Scout / RegimeGate / distill
- **Watchlist:** [OSS_WATCHLIST.md](OSS_WATCHLIST.md) (Vibe-Trading, waggle, cangjie = reference)

### 2026-08-03 — bridge branch on main + HITL e2e

- **Merge:** `feat/ate-local-bridge` → `main` (`320e027`) — WorldMonitor, swarm stub, local HTTPS bridge
- **HITL e2e:** Temporal `PaperTickWorkflow` approve/reject smoke via `scripts/hitl-e2e.py` (client + `/hitl/signal` with bridge token)
- **HITL chaos:** `scripts/hitl-chaos.py` — worker kill mid-`in_hitl_wait`, resume, approve → `paper_ready`

---

## What's next

**Active:** Phase 4 LangGraph (extend sequence/sizer nodes) · Phase 5 continue-as-new + chaos tests · bulk vision export.

**Policy:** OSS + free/free-tier on critical path. Paid APIs: [PAID_ALTERNATIVES.md](PAID_ALTERNATIVES.md).

**Next build:** LangGraph → Temporal activity bind · continue-as-new · chaos kill/resume.

See **[TASKLIST.md](../TASKLIST.md)** § Immediate Next Actions.
