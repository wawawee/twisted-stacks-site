# ATE TASKLIST

Master checklist for the hybrid classical + vision + sequence + RL + agent-swarm trading system.

Canonical docs:
- [docs/ULTIMATE_PLAN.md](docs/ULTIMATE_PLAN.md)
- [docs/CORE_STACK.md](docs/CORE_STACK.md)
- [docs/AGENT_SWARM.md](docs/AGENT_SWARM.md)
- [docs/FUTURE_FEATURES.md](docs/FUTURE_FEATURES.md)
- [`.cursor/agents/`](.cursor/agents/) — Cursor build team

**Status legend:** `[ ]` todo · `[~]` in progress · `[x]` done · `[-]` deferred

---

## Phase 0 — Foundation & Contracts

- [x] Decide monorepo layout (`apps/ate-ui`, `packages/*`, `services/{api,temporal-worker,swarm}`, `infra/`)
- [x] Pre-Phase-0 investor colab: `docs/TRUTH-STATUS.md`, `wiki/`, `/ate` on twisted-stacks-site
- [x] Add Apache-2.0 / MIT LICENSE for own code; document GPL/AGPL neighbors in `docs/CORE_STACK.md` (`LICENSE` is MIT; watchlist in `docs/CORE_STACK.md` §11)
- [x] Define Pydantic v2 schemas: `Bar`, `CupAndHandleSignal`, `VisionScore`, `BreakoutProb`, `FusedSignal`, `RegimeState`, `RiskDecision`, `PositionSizing`, `OrderIntent`
- [x] `DataProvider` protocol + `YFinanceProvider` stub; `ExecutionGateway` + `PaperExecutionGateway` stub
- [x] Pydantic Settings for venues, risk caps, MCP endpoints
- [~] Dev stack: **native default** — `./scripts/dev-setup.sh` + [infra/NATIVE_DEV.md](infra/NATIVE_DEV.md); Docker optional (`questdb-only` / `full` profiles)
- [ ] Install / enable **Temporal Cursor plugin** (`/add-plugin temporal` on desktop; local clone already in env notes)
- [x] Wire Temporal Python SDK skeleton (`workflows/`, `activities/`, worker)
- [x] Bootstrap Supabase migrations: `episodes`, `memories`, `agent_configs`, `skill_registry` + pgvector + RLS stubs
- [x] FastAPI health + OpenAPI stub
- [x] CI: ruff/pytest + schema tests + packages coverage gate ([`.github/workflows/ci.yml`](.github/workflows/ci.yml); DOC-4 floor 71%, 72% measured 2026-08-06)
- [x] `.env.example` for Alpaca paper, Finnhub, OpenBB, Temporal, Supabase

**Exit:** `./scripts/dev-status.sh` healthy (or manual pg_isready + Temporal :7233) **OR** `docker compose --profile full up` healthy; schemas importable; Temporal hello completes; `NullDataProvider` + alt-data types tested.

---

## Phase 1 — Classical Cup & Handle

- [x] Data adapters: yfinance (SPY daily); OpenBB/CCXT deferred
- [x] Persist OHLCV to Parquet (`~/ate-data/ohlcv/{SYMBOL}/{tf}.parquet`)
- [x] Colab **TRADE** UI on twistedstacks.com/ate (chart, scan, mobile-first) — see wiki [ui-design.md](wiki/by-topic/ui-design.md)
- [x] **Telemetry lane v0** in TRADE sidopanel (last scan, fetch time, lane status) — [wiki/by-topic/telemetry.md](wiki/by-topic/telemetry.md)
- [x] Integrate `chart_patterns` for H&S / doubles / flags baseline
- [x] Implement **own** cup-and-handle ABCDE detector (thresholds configurable)
- [ ] Evaluate `BennyThadikaran/stock-pattern` for VCP / pre-breakout flags (feature flag)
- [~] pandas-ta features: volume dry-up, MA stack, ATR (`packages/patterns/ta_features.py`, `--ta` on scan); TA-Lib deferred
- [x] VectorBT harness for C&H long-only on SPY daily (`scripts/backtest-cup-handle.py`, `[research]` deps)
- [x] VectorBT on BTC 4H + QuantStats tear sheet artifact per run (`scripts/backtest-cup-handle.py --tear-sheet`)
- [ ] Unit tests for pattern extrema edge cases (flat cups, too-steep handles)

**Exit:** Reproducible scan on SPY/BTC; backtest metrics logged to MLflow or `artifacts/`.

---

## Phase 2 — Vision Channel

- [x] Deterministic mplfinance renderer (style hash `ate_v1` — `packages/vision/renderer.py`)
- [x] Weak supervision labels stub (`packages/vision/weak_labels.py`, drop uncertain)
- [x] Export batch run on SPY/BTC/QQQ — **376 pos / 165 neg** in `~/ate-data/vision/ate_v1/` (SPY 1d: 112/24, QQQ 1d: 121/4, BTC-USD 4h: 143/137; `--min-spacing-bars 8`; pos ~300 met, neg ~200 partial)
- [ ] Bulk export labeled charts from classical detections (positives + hard negatives)
- [x] Train / fine-tune YOLOv8 on cup-handle (+ optional H&S); track mAP — `scripts/train-yolo-cup-handle.py` — **50 ep, val top1 100%**
- [ ] Optional ViT classifier (`google/vit-base-patch16-224`) for validity score
- [ ] Optional Qwen2-VL structured JSON scorer (local via Ollama/transformers)
- [ ] Benchmark ChartScanAI / foduucom weights as baselines — do not hard-depend
- [x] ONNX export path for worker inference — `scripts/export-yolo-onnx.py` → `~/ate-data/models/cup_handle_yolo_ate_v1/cup-handle-yolov8n.onnx`
- [ ] Vision metrics: precision/recall vs classical labels; latency p95

**Exit:** Vision model produces `VisionScore` for candidates; false-positive rate vs classical-only measured.

---

## Phase 3 — Fusion, Risk, Research Loop

- [x] Fusion service stub: `0.35×classical + 0.35×vision + 0.15×sequence + 0.15×macro` (`packages/fusion/fuse.py`, live in colab scan)
- [x] **RegimeGate v1** — ADX/ATR/slope; live in Python + colab scan — [regime-gate.md](wiki/by-topic/regime-gate.md)
- [x] **Macro Scout** — live Polymarket Gamma quotes in TRADE — [macro-scout.md](wiki/by-topic/macro-scout.md)
- [x] PMXT adapter stub (`NullPredictionMarketProvider`, `PmxtPredictionMarketProvider`)
- [ ] Optuna study: thresholds, weights, stop/TP; pruned trials
- [~] Karpathy autoresearch adaptation: editable `fusion_weights.py`, fixed backtest budget, git keep/revert — design spec in [docs/research/FUSION-AUTORESEARCH-LOOP.md](docs/research/FUSION-AUTORESEARCH-LOOP.md), waits on RES-3
- [ ] nanoGPT or Darts/NeuralForecast head for `BreakoutProb` (even weak model OK v1)
- [ ] PyPortfolioOpt / CVaR Risk Officer (hard notional caps) — **stub done** (`packages/risk/officer.py`: veto, sizing, HITL; CVaR/PyPortfolioOpt pending)
- [ ] Walk-forward + purged/embargo splits
- [ ] Paper simulation ledger (no live keys required)

**Exit:** Walk-forward report; risk veto demonstrated on oversized intents.

---

## Phase 4 — In-App Trading Swarm

- [x] Pydantic AI agents: Pattern Scout, Vision Validator, Sequence Predictor, RL Sizer (stub), Risk Officer, Execution Bot (paper) — `d4ba51e`
- [~] LangGraph orchestration with checkpointing — `services/swarm/paper_tick_graph.py` (validate → risk → paper/HITL; `.[agents]`)
- [ ] Optional CrewAI role wrappers (feature-flagged)
- [x] Skill markdown pack under `skills/` with frontmatter — `pattern-scout`, `vision-validator`, `risk-officer`, `paper-execution` (Phase 4 paper-only stubs)
- [ ] Hybrid memory: BM25 + pgvector + RRF retrieval
- [ ] Episodic write on every signal/decision/trade
- [ ] Usage limits (tokens/tool calls) on agents
- [ ] Gym-Trading-Env or gym-anytrading hook for sizer experiments
- [ ] Logfire/LangSmith traces for one end-to-end paper decision

**Exit:** End-to-end typed signal → risk → paper intent with memory citations.

---

## Phase 5 — Durable Execution + MCP

- [x] Temporal workflows per [wiki/by-topic/temporal-workflows.md](wiki/by-topic/temporal-workflows.md): **skeletons done** (`2e17e44`); **Risk Officer + HITL wired** in `PaperTickWorkflow`
- [x] Extend schemas: `WhaleAlert`, `MacroSignal` (see macro-scout wiki)
- [x] Telemetry v1 — episodic log + SSE to colab from workflow activities
- [x] HITL via Temporal signals/updates for live-size thresholds — **Temporal client proxy** (`79b55ba` — `/hitl/signal` → `approve_hitl` / `reject_hitl`); **TRADE bind** (`038dbed` site → ATE proxy when configured); smoke `scripts/test-hitl-smoke.sh`
- [x] continue-as-new for long market streams
- [x] Chaos test: kill worker mid-approval → resume
- [x] Enable **hummingbot/mcp** against local Hummingbot API (Tailscale note in docs)
- [x] Enable **Alpaca MCP** paper trading
- [x] Enable OpenBB / Alpha Vantage / yahoo MCP for research (quotas documented)
- [x] Own **ATE signals MCP** (`get_fused_signals`, `run_backtest`, `risk_status`)
- [x] `RISK-7` **Idempotent order activities (client order ids)** — `PaperExecutionGateway.submit` dedupes on `OrderIntent.client_order_id` via a file-backed ledger (`packages/execution/paper.py`); `run_paper_tick_graph_activity` derives a retry-stable key from Temporal `activity.info()` so a retried tick submits the same id instead of a fresh random one — `tests/test_risk7_idempotent_orders.py`

**Exit:** Natural-language MCP check of paper P&L; Temporal resume proven.

---

## Phase 6 — ATE UI Differentiation

- [x] Signal-colored UI: RegimeGate banner, fusion 4 lanes, Telemetry — [ui-design.md](wiki/by-topic/ui-design.md)
- [x] Fusion strip 4 lanes (amber / purple / green / **blue macro**) + fused score row
- [x] React Flow canvas: agent nodes + workflow step edges (binds Temporal)
- [x] Zustand store synced to FastAPI/WebSocket
- [x] Live P&L + open signals panel
- [x] Memory explorer (semantic neighbors + episode timeline)
- [x] Skill inspector / version pin
- [x] HITL approve/reject modal bound to `/api/ate/hitl` (`efc9977`); Temporal signal via ATE proxy when `TEMPORAL_ADDRESS` set (`038dbed`)
- [x] Modern TradingView Lightweight Chart & Swarm Fleet dashboard

**Exit:** Operator can watch and gate a paper trade from the UI.

---

## Phase 7 — Multi-Strategy Swarm

- [x] Consensus model: quorum + Risk veto chain — [wiki/by-topic/consensus.md](wiki/by-topic/consensus.md)
- [x] Add lanes: bull flag, inverse H&S, double bottom, VCP, harmonics, SFP, Entropy microbursts
- [x] Typed ballots UI on swarm map
- [x] Cross-asset transfer via semantic memory (BTC → ETH)
- [x] Shadow mode dashboard & multi-account fleet runner (`scripts/live-multi-account-daemon.py`)

**Exit:** ≥3 strategies paper-running with shared Risk Officer.

---

## Phase 9 — Geometric Intelligence Layer

- [x] `DDOI-2` · **Volatility Surface Builder — IV term structure, skew surface & dealer gravity wells** — Build `VolSurface` with Brent root-find BSM IV per contract, `get_atm_vol(T)`, `get_skew(T)`, `get_term_structure()`, and `DealerGravityWell` KDE peak detection over open interest density. Wire into `MacroScoutContext` + `RiskOfficer`: price within ±0.5% of gravity well tightens stop 15%. 8+ unit tests.
- [x] `CPCV-2` · **CPCV Meta-Labeling Live Backtest — SIG-1 measurable predictive content audit** — Load SPY 1d via `parquet_store`, apply `TripleBarrierLabeler`, run `CPCVCombinatorialSplitter(6,2)` → φ=15 OOS paths, fit LightGBM secondary meta-label classifier per fold, reconstruct paths, compute distributional Sharpe (mean ± 2σ), emit GO/NO-GO memo to `docs/agent/proposals/sig1-cpcv-audit.md`. 4+ unit tests.
- [x] `TOPO-1` · **Market Geometry State — unified Betti × Entropy × Ricci phase classifier** — `MarketGeometryClassifier.classify()` with 4-quadrant phase logic (BREAKOUT / KINETIC_ARREST / CHAOTIC / UNCERTAIN), wire into `fuse.py` ContextSnapshot and `RiskOfficer`: KINETIC_ARREST + CHAOTIC veto GO; BREAKOUT adds +0.1 to quorum score. 8+ unit tests.

**Exit:** Vol surface operational, SIG-1 verdict published, market geometry phase integrated in risk chain.

---

## Phase 8 — Controlled Live & Paper Fleet

- [x] Multi-Strategy Paper Fleet Daemon running on 15m & 1h crypto universe
- [x] Circuit breakers: daily loss 2.0%, friction-floor stop padding, stale data veto
- [x] Multi-asset universe: BTC, ETH, SOL, AVAX, DOGE, SPY, NVDA
- [x] Real-time JSON Showroom & Telemetry stream (`reports/ate_live_showroom.json`)
- [~] Phase 8 Live canary validation with HITL gating above configured notional

**Exit:** Documented live canary with HITL mandatory above $X notional.

---

## BUILD-50 — full-system build plan (prediction-market UI track)

The complete build tasklist/prompts for the whole system — including the
open-source **prediction-market trading interface** (patterns, vision models,
divergences, long horizontals, live Polymarket/Kalshi data, Lightweight Charts
UI) — lives in [docs/BUILD_PLAN_50.md](docs/BUILD_PLAN_50.md) (50 tasks, Phases
A–J, each with a paste-ready prompt and done-condition). Follow the same
evidence rules as the audit queue: `agent-brief.py --log` on completion, no
measured number without provenance.

---

## Audit follow-ups — 2026-08-05

Source: [docs/ENGINE-AUDIT-2026-08-05.md](docs/ENGINE-AUDIT-2026-08-05.md). Findings are
numbered there; the number in brackets is the finding.

**This section is the human view of [docs/agent/work-queue.yaml](docs/agent/work-queue.yaml).**
The backtick id on each line is the canonical task id — agents read the YAML,
`pytest tests/test_agent_context.py` fails if the two diverge. Start any agent session with
`python scripts/agent-brief.py`.

### Tool routing (Cursor ↔ Claude ↔ Antigravity)

Rules: [docs/agent/tool-routing.yaml](docs/agent/tool-routing.yaml) · Active sessions:
`python scripts/collab-handoff.py --status`

`docs/agent/tool-routing.yaml` + `docs/agent/active-session.yaml` are git-tracked on
purpose (unlike `AGENT_LOCK.json` and `~/ate-data/collab/bus.jsonl`, which are
local-only) — a claim made by one tool on one machine is only visible to another
tool/machine once **committed and pushed**. `--claim`/`--release` do not do this for
you; commit+push `active-session.yaml` right after each, not batched with unrelated work.

| Tool | Focus | Spend context on |
|------|-------|------------------|
| **Cursor** | `ARENA-13` | Code + pytest + Temporal/risk |
| **Claude** | *(none pinned — DOC-6 closed same session; no research-shaped task open)* | Verify data-source URLs/pricing → YAML |
| **Antigravity** | *(claim before starting — see tool-routing.yaml)* | Whatever it's assigned; must `--claim` first so it doesn't work invisibly to the others |
| **Human** | `SIDE-3` | Sign charter before capital |

```bash
python scripts/collab-handoff.py --claim ARENA-13 --tool cursor
python scripts/collab-handoff.py --status --tool claude
./scripts/collab-sync-labels.sh   # once, creates GitHub labels
```

Budget: **1 implementation task / Cursor session**, **2 research tasks max / Claude session**,
**1 task / Antigravity session** (`context_budget` in tool-routing.yaml).

### Landed on `fix/engine-audit-p0`

- [x] **[#1] Detector freshness** — `max_signal_age_bars` gate, `bars_since_handle` /
      `breakout_level` / `pattern_end_index` on `CupAndHandleSignal`, freshest-first sort
- [x] **[#2] Bounded right-rim search** — `rim_search_ratio`, rim can no longer migrate to
      an unrelated high 120 bars later
- [x] **[#1] Two-sided breakout score** — extension past the rim decays instead of
      saturating at 1.0; already-extended setups are rejected outright
- [x] **[#3] Fusion renormalisation** — lanes are `float | None`, weights redistribute over
      reporting lanes, `min_reporting_weight` coverage floor
- [x] **[#4] HITL reachable** — threshold is the tighter of `risk_hitl_notional_usd` and
      `risk_hitl_notional_frac` × equity
- [x] **[#5] Vision fails loudly** — `inference_mode="unavailable"`, `vision_score=None`;
      no more classical passthrough
- [x] **[#6] RegimeGate on the live path** — classified in `scan_cup_and_handle`, carried
      through `PatternScoutResult`, gates `run_validate_pipeline`
- [x] **[#7] Backtest costs + realistic stop fills** — `--fees` / `--slippage` with
      per-asset defaults, `--gross` escape hatch, stops fill at the stop not the close
- [x] **[#11] Non-destructive Parquet** — merge on `ts` + `ingested_at` stamp
- [x] **[#12/#14] Bar quality guards** — `packages/data/quality.py`, incomplete-bar drop,
      staleness veto in the Risk Officer
- [x] **[#16] Risk caps moved from schema to policy** — breaches are vetoed and audited
      instead of raising `ValidationError`
- [x] **Regression tests** — `tests/test_signal_freshness.py` (21 new economic-property tests)

### Delegated — small, self-contained, safe for a local/free model

Each item is one file, has a clear done-condition, and is covered by `pytest`. Work them
in any order; none block each other.

- [x] `DATA-3` · **[#13] Session-aware 4h resample** — `_resample_4h` anchors SPY to 09:30 ET,
      BTC to midnight UTC, drops buckets with <2 hourly bars. Evidence:
      `tests/test_yfinance_resample.py`.
- [x] `FB-1` · **Signal schema JSON + Python loader** — `packages/schemas/signal_schema.json`
      (shared verdict vocabulary from FUSION_STRATEGY.md §2) plus
      `packages/schemas/signal_schema.py` exposing `MIN_N_FOR_VERDICT` etc.;
      `MIN_N_FOR_VERDICT["NO-GO"] == 100`. Evidence: `tests/test_signal_schema.py` (9 passed).
- [x] `FB-3` · **history.jsonl + TASKLIST tick** — FB-1 recorded in
      `docs/agent/history.jsonl`; `FB-1` and `FB-3` both `[x]` in this file.
- [x] `FB-4` · **Wire MIN_N_FOR_VERDICT into task-2-0-bootstrap-nogo.py** —
      `scripts/research/task-2-0-bootstrap-nogo.py` imports
      `MIN_N_FOR_VERDICT` from `packages.schemas.signal_schema` instead of
      hardcoded 100; bootstrap CIs + power analysis on Task 1.1/1.3/1.4 CSVs.
      No fuse.py. Evidence: `scripts/research/task-2-0-bootstrap-nogo.py`.
- [x] `FB-5` · **Freebuff batch closeout** — OC-3 (net-liquidity FRED lag) and AG-1
      (mempool urgency ROC) both already `[x]` in TASKLIST; signal_atlas.json stub
      deferred. Freebuff batch complete. Evidence: this line.
- [x] `VIS-2` · **[#10] ONNX class index from metadata** — `packages/vision/inference.py:53` uses
      `_positive_class_index_from_labels(CLASS_NAMES) or 1`, which returns the right index
      only because `0` is falsy. Read class names from the ONNX metadata
      (`session.get_modelmeta().custom_metadata_map["names"]`) and raise if absent.
      *Done when:* a test with a stubbed session asserts the correct index and that a
      missing/renamed class raises rather than silently inverting the score.
- [x] `VIS-3` · **[#10] ONNX preprocessing parity** — same file: `Image.resize((224,224))` squashes a
      10×6 chart, while Ultralytics resizes the short side then centre-crops. Mirror the
      Ultralytics transform and assert `score_chart_onnx` matches `score_chart` within
      1e-3 on a fixture PNG. *Done when:* the parity test passes or is skipped with a clear
      reason when weights are absent.
- [x] `VIS-4` · **[#18] Cache ONNX session** — `ort.InferenceSession` is constructed on every call.
      Memoise on `onnx_path` with `functools.lru_cache`. *Done when:* a test asserts the
      constructor runs once across two scoring calls.
- [x] `RISK-3` · **[#18] Activity retry policies** — no `execute_activity` call in
      `services/temporal_worker/workflows/` sets a `RetryPolicy`, so failures retry forever.
      Add `RetryPolicy(maximum_attempts=3, initial_interval=timedelta(seconds=2))` and mark
      `BarQualityError` / `DataProviderError` non-retryable. *Done when:* a workflow test
      asserts a permanently failing activity terminates.
- [x] `RISK-4` · **[#18] Unique workflow ids** — `new_paper_tick_workflow_id` uses second-resolution
      `time.time()`, so two starts in the same second collide. Append `uuid4().hex[:8]`.
      *Done when:* a test asserts 1000 ids generated in a tight loop are unique.
- [x] `DATA-4` · **[#18] Bar cache for the paper tick** — `packages/data/bar_cache.py` +
      `scan_cup_and_handle` reads Parquet first, incremental tail fetch, 60s in-process
      throttle so a second tick skips the provider.
- [x] `DOC-2` · **[P4] Pin ruff in CI** — pinned `ruff==0.12.8`; CI scope now
      `packages services scripts sidebet tests`; scripts E402 ignored; F401/F841 cleared.
      *Done when:* `ruff check packages services scripts sidebet tests` clean and version pinned.
- [x] `DOC-3` · **[P4] Run mypy in CI** — `mypy` is in the dev extra but no workflow step calls it.
      Add a non-blocking step first (`continue-on-error: true`), then tighten. *Done when:*
      CI shows a mypy step and its current error count is recorded in the PR body.
- [x] `DOC-4` · **[P4] Coverage gate** — add `pytest-cov` and a `--cov-fail-under` floor set to the
      current measured number, so it can only go up. *Done when:* CI prints coverage and
      fails below the floor.
- [x] `DOC-1` · **[P4] Regenerate TRUTH-STATUS** — `docs/TRUTH-STATUS.md` still labels the classical
      scanner, fusion, and Risk Officer as *Planned* and README quotes the fusion split as
      `0.4/0.4/0.2` against the code's `0.35/0.35/0.15/0.15`. Write
      `scripts/gen-truth-status.py` that derives the table from imports and `FusionConfig`,
      and call it from the wiki-sync workflow. *Done when:* the doc regenerates and README
      matches the code.
- [x] `ENG-5` · **[P0-follow-up] Golden fixtures for the detector** — capture 10 real SPY/BTC windows
      with hand-checked labels under `tests/fixtures/` and assert detector output does not
      drift. *Done when:* a fixture test fails if `CupHandleConfig` defaults change.
      `tests/test_cup_and_handle_golden.py` — 13/13 passing on real, hand-checked SPY/BTC windows.
- [x] `ENG-6` · **Superseded synthetic fixture test fails, confuses the real ENG-5 suite** —
      `tests/test_cup_handle_fixtures.py`'s synthetic `no_handle` case fires a signal it
      shouldn't. Confirmed pre-existing (already broken at `3b68fd4`, before any 2026-08-07
      work) via `git archive` + isolated run — not a live detector regression; the real
      ABCDE detector is unchanged since `3b68fd4` and ENG-5's real-data suite is clean.
      Either fix the synthetic generator or delete this superseded file.
- [x] `ENG-7` · **`test_paper_tick_activity_structure` expects a stale `"paper_ready"` status** —
      actual is `"paper_submitted"`. Also pre-existing at `3b68fd4`. Needs someone to decide
      which side is right and fix it.
- [x] `ENG-8` · **`test_autopilot_dry_run_once` broke because the queue is (almost) empty** —
      `collab-autopilot.py --dry-run` now exits on "no ready task for cursor" before the
      `[dry-run]` line the test asserts on, because 46/47 `work-queue.yaml` tasks are done
      and the one left (`SIDE-3`) is human-only. Good news dressed as a test failure — needs
      a ready-task stub in the fixture, not a code fix.

### Needs judgement — keep on the main track

- [x] `VIS-5` · **[#9] Rebuild the vision split** — group by symbol *and* time, embargo at least
      `chart_window + forward_bars` bars at the seam, raise `--min-spacing-bars` above the
      100-bar window so images stop overlapping 92%. Retrain and report precision/recall
      plus a confusion matrix on a symbol the model never saw. **Expect the 100% val top1
      to collapse — that is the point.** Blocks any honest claim about the vision lane.
      **2026-08-07 — done, but read the result, don't just read the checkbox:**
      split + spacing code shipped
      (`packages/vision/dataset.py::_split_grouped_by_symbol`, embargo_bars=120 =
      `CHART_WINDOW_BARS`+`FORWARD_BARS`, `--min-spacing-bars` default 15→100, 5
      leakage tests in `tests/test_vision_dataset.py`) and retrained natively
      (Pelle's Mac, `scripts/train-yolo-cup-handle.py`, 50 epochs, Ultralytics
      YOLOv8n-cls). **Result: val top1 0.977 (top5 1.0) on 561 train / 130 val —
      it did NOT collapse to noise as expected.** Two honest caveats, not spin:
      (1) only SPY 1d and QQQ 1d were re-exported at the new spacing before this
      run — the 691-image pool is still mostly the old, densely-overlapping
      `--min-spacing-bars 15` export, so the "images stop overlapping 92%" part
      of this task's own done_condition is not actually satisfied yet end-to-end
      (needs a full re-export of every symbol/timeframe, then a from-scratch
      retrain, to know if that alone would have collapsed it);
      (2) the val split is *early-vs-late per symbol*, not a symbol the model
      never saw at all (every symbol contributes training data) — weaker than
      the "unseen symbol" bar this task set for itself.
      Best current explanation for why it's still ~98%: `VIS-6` — the model is
      trained on the *classical detector's own* ABCDE-geometric labels, so a
      near-100% score plausibly means "the CNN learned to recognize the shape
      the deterministic detector already looks for," not "the CNN predicts
      market outcomes." VIS-5 only closed the temporal-leakage hole; it was
      never going to be able to close that one. **Do not cite this 0.977 as
      vision-lane edge — see `VIS-6` below.**
      **2026-08-09 — both remaining caveats closed (Claude):** full re-export at
      `--min-spacing-bars 100` (now the default) across every symbol/timeframe with
      bars — SPY, QQQ, DIA, IWM, BTC-USD 1d+4h, ETH-USD — with `--labeler
      triple-barrier` throughout (so VIS-6's independent-label fix is baked into this
      dataset, not just the earlier SPY+QQQ-only retrain). **This alone shrank the
      usable pool from ~691 images to 81 (32 positive / 49 negative)** — confirming
      the done_condition's premise directly: most classical cup-and-handle detections
      cluster inside a single ~100-bar formation, so the old export was ~92%
      near-duplicate windows of a handful of real patterns. Also added a genuine
      unseen-symbol split — `packages/vision/dataset.py::_split_held_out_symbols`,
      `held_out_symbols` param on `prepare_yolo_classify_dataset` — strictly stronger
      than the early-vs-late-per-symbol embargo split above (that one still trains on
      every symbol). Held out IWM + ETH-USD entirely: 69 train images, 12 val images,
      **retrained YOLOv8n-cls 50 epochs, val top1 0.833 — it did collapse this time**,
      from 0.977. New `scripts/eval-vision-classifier.py` reports real precision/recall
      + confusion matrix (top1 alone hides class imbalance): positive
      precision=0.667 recall=0.667 (support=3), negative precision=0.889 recall=0.889
      (support=9), confusion matrix `[[2,1],[1,8]]`. **n=12 (3 positive) is too small
      to trust as an edge estimate** — read this as "leak-free data volume here is
      currently too small to support a vision-lane edge claim either way," not as
      "0.833 is the number." Two bugs fixed along the way: (1) `prepare_yolo_classify_dataset`
      never cleared its destination tree, so a second run silently mixed in stale
      symlinks from the previous one; (2) the export filename regex's symbol class was
      `[A-Z0-9]+`, which can't match `BTC-USD`/`ETH-USD` (the hyphen) — those symbols
      silently fell back to "unparseable → always train" under *both* split modes,
      meaning they were never actually embargoed under the original VIS-5 split either.
      **Do not cite 0.977, 0.970, or 0.833 as vision-lane edge.** Full detail in
      `docs/agent/history.jsonl` (2026-08-09 measurement entry).
- [x] `VIS-6` · **[#9] Break the label/lane circularity** — vision is trained on the classical
      detector's own detections and invalidation levels, then fused with it at equal
      weight. Either label from forward returns independently of the detector, or drop the
      vision weight until it is independent.
      **Code done 2026-08-07** (Claude): `TripleBarrierLabeler` in
      `packages/vision/weak_labels.py` labels purely from `bars` + `anchor_index` — ATR-sized
      TP/SL barriers (default 2×/1× ATR-14) plus a time barrier at `max_holding_bars`, no
      `breakout_level`/`invalidation` parameter exists on `.label()` at all, so the classical
      detector's own levels structurally cannot leak into the label (enforced by
      `tests/test_weak_labels.py::test_label_signature_cannot_take_a_detector_level`, 10/10
      tests passing). Wired into `scripts/export-vision-charts.py` via `--labeler
      {classical,triple-barrier}` (default stays `classical` for backward compat).
      **Retrained 2026-08-07** (antigravity, commit `ba1dd5d`): re-exported 590 PNGs
      (404 pos / 186 neg, SPY + QQQ 1d only) with `--labeler triple-barrier`, fine-tuned
      YOLOv8n-cls 50 epochs, **val top1 0.970**. This is the first vision number with the
      classical-detector circularity actually removed, so unlike VIS-5's 0.977 it is not
      automatically disqualified — but two things need to happen before it can be cited as
      real edge: (1) the split is still SPY+QQQ only, early-vs-late per symbol, not a truly
      held-out symbol — same weaker-than-intended bar as VIS-5; (2) **the retrain commit also
      changed `packages/vision/inference.py`'s `_positive_class_index_from_names_metadata`
      to fall back to guessing index 1 when the class name isn't an exact match** — this is
      the same silent-guess failure mode `VIS-2` deliberately replaced with a hard raise
      (finding #10: `_positive_class_index_from_labels(...) or 1` returning 1 because 0 is
      falsy). Needs a proper fix (find out why the exact-match lookup didn't find this
      model's class names, not paper over it with a fallback) before this number is trusted.
      `tests/test_vision_inference_parity.py`'s `PARITY_TOLERANCE` was also loosened
      `1e-3` → `1e-2` in the same commit, unexplained — worth checking whether that's masking
      a real ONNX/PyTorch divergence rather than just accommodating the new weights.
- [x] `RES-2` · **[#8] Walk-forward + purged/embargo splits** before any Optuna work, or the
      optimiser finds the leak first. `packages/backtest/walkforward.py` —
      `purged_walk_forward_splits`; any future Optuna study must iterate it rather than
      a single split or `sklearn` k-fold.
- [x] `RISK-5` · **[#15] Portfolio-level Risk Officer** — aggregate notional, correlation between SPY
      and BTC, realised daily P&L against `daily_loss_cap_frac` (defined in settings,
      surfaced in the MCP status endpoint, read by nothing). Needs a position store.
      **2026-08-07 (antigravity, verified by Claude):** `packages/risk/officer.py` gained
      `OpenPosition`, `get_asset_group()`, and three new vetoes in `evaluate()`: aggregate
      portfolio notional vs `max_total_notional_frac` (20%), correlated-group notional vs
      `max_correlated_notional_frac` (10%), and portfolio drawdown vs
      `max_portfolio_drawdown_frac` (10%). `apply_risk_gate` passes `open_positions` /
      `drawdown_frac` through cleanly. 6 tests in `tests/test_risk_officer_portfolio.py`
      (not the "32" the terse summary line below claims — corrected here), all passing,
      covering each veto plus an uncorrelated-approval and a gate-integration case. **Caveat:**
      `get_asset_group()` is a static hardcoded bucket list (`SPY/QQQ/IWM/VOO/DIA` →
      `equity_index`, a handful of majors → `crypto`), not a computed correlation — fine as a
      v1 proxy, but "correlation between SPY and BTC" in this task's own title implies actual
      correlation math, which this is not yet. No position store yet either (`open_positions`
      must be passed in by the caller) — still needed before this can run unattended.
- [x] `RISK-6` · **[#17] Correlate HITL signals to the decision** — `hitl_context` on each
      HITL pause (`decision_id`, symbol, notional, fused_score); `/hitl/signal` requires
      matching payload + optional `run_id`; workflow rejects mismatches and logs
      `mismatch_reason`.
- [x] `RISK-7` · **[#18] Idempotent order activities** — `PaperExecutionGateway.submit` dedupes on `OrderIntent.client_order_id` via file-backed ledger (`packages/execution/paper.py`) and activity bind keying (`tests/test_risk7_idempotent_orders.py`).
- [x] `DATA-5` · **[#11] Point-in-time ingestion** — `auto_adjust=True` means historical prices change
      on every refetch. Keep raw and adjusted columns so backtests are reproducible.
      (Promotes the existing "Data Engineer" standing task.)
      **2026-08-07:** `Bar` (`packages/schemas/signals.py`) gained optional
      `open_raw`/`high_raw`/`low_raw`/`close_raw` fields (default `None`, so every
      existing caller/provider/Parquet file keeps working unchanged).
      `YFinanceProvider._fetch_sync` now makes a second `auto_adjust=False` fetch
      alongside the existing adjusted one and matches rows by timestamp — `.close`
      etc. stay split/dividend-adjusted (unchanged for every downstream consumer),
      `.close_raw` etc. carry what the tape actually printed, which does not get
      rewritten by a later split. Parquet round-trips both sets of columns for free
      via the existing `model_dump()`/`model_validate()` path; old Parquet files
      without the `*_raw` columns load fine with them defaulting to `None`. 5 tests
      in `tests/test_yfinance_raw_adjusted.py` (split-adjustment divergence, missing
      raw row, schema round-trip, old-file-without-columns round-trip).
- [x] `DATA-6` · **Verify the data-source registry** — every entry in
      [docs/agent/data-sources.yaml](docs/agent/data-sources.yaml) is `verified: false`.
      Check tiers, limits and access against live docs; set `verified: true` only with a
      URL and date in `verified_note`. Same for the cost claims in
      [PAID_ALTERNATIVES.md](docs/PAID_ALTERNATIVES.md). *Delegable.*
- [x] `RISK-8` · **Phase 8 live-readiness gate** — circuit breakers (daily loss, API error
      rate, stale data), venue allowlist, rollback runbook. Blocked by `RISK-6`, `RISK-7`,
      `RES-3`.
- [x] `RES-4` · **Three-way attribution sweep** — `scripts/backtest-cup-handle.py --sweep`
      runs loose/gross, tight/gross and tight/net over identical bars and writes the
      comparison to `history.jsonl` with commit, data range and gate settings. A single
      RES-3 number cannot distinguish "the edge was built on stale signals" from "the
      freshness gate is too tight" from "costs ate it" — the first two look identical in a
      headline return and are told apart by trade count, so counts sit beside returns in
      the table. A failed arm refuses to log. Caveat recorded in the queue: the loose arm
      uses the loosest in-schema gates (30 / 0.30 / 3.0), not the unbounded pre-audit
      detector, so it understates how much of the old edge came from staleness.
- [x] `DATA-7` · **History depth** — explicit thresholds in
      [docs/research/DATA-DEPTH-POLICY.md](docs/research/DATA-DEPTH-POLICY.md);
      enforced by `scripts/measure-data-depth.py`. **2026-08-06:** SPY 1d 8436 bars /
      58 opps, BTC 1d 4340 / 33, BTC 4h 10956 / 40 — all pass; RES-3 unblocked on depth.
- [x] `DATA-8` · **BTC 4h beyond yfinance cap** — `packages/data/ccxt_provider.py` +
      `scripts/fetch-ccxt-bars.py`; Binance via CCXT, overlap vs yfinance max 0.67% on
      4155 shared bars; merged to `~/ate-data/ohlcv/BTC-USD/4h.parquet`.
- [x] `RES-3` · **Re-measure everything** — the Phase 1 backtest numbers and the Phase 2 vision
      metrics were produced by the pre-fix engine. Re-run with costs and freshness gating
      before any of them is quoted again.

### 2026-08-09 NotebookLM research-dump audit

Operator asked to double-check a day's worth of NotebookLM research (macro liquidity,
entropy regimes, meta-labeling, dollar bars, GEX, VCP, Renko/VPIN/OFI) against the actual
pipeline. Most of it already has code + tests and Tasks 2.1-2.4 already ran and correctly
landed `NO_SIGNAL`/context-only (see [docs/research/README.md](docs/research/README.md));
`packages/risk/officer.py` and `packages/fusion/fuse.py` import none of them, so nothing
needs un-wiring. Five real gaps queued:

- [x] `RES-5` · **VCP / Renko-VPIN-OFI has no GO/NO-GO memo** — `packages/patterns/vcp.py`
      is already live in `packages/patterns/proximity.py` (the signal-proximity radar) but,
      unlike Task 2.1-2.4, never ran the RESEARCH-STANDARD negative controls or got a memo.
      Same class of gap already flagged on the bus for the antigravity vision-exit commit.
- [x] `RES-6` · **Task 2.6 meta-labeling implementation** — design memo's blockers (purged
      K-fold, VIS-5 label independence) are now cleared; remaining blocker is shadow-book
      logging depth. Promote to a runnable script; own GO memo before any risk-officer wiring.
- [x] `DATA-11` · **Dollar bars / volume bars** — pure OHLCV resample transform, no new data
      source. Input-representation experiment for vision/entropy lanes only.
- [x] `RES-7` · **Overnight/intraday return decomposition** — "day destroys the night"
      long-horizon reversal signal, run through the same Task 1.x NO-GO gate as everything
      else, not cited as a result because a literature review discussed it.
- [x] `ENG-9` · **Volume dry-up in the C&H handle leg** — optional, off-by-default detector
      check; one of the few classical TA criteria the review cites as surviving backtests.
- [x] `RES-8` · **winning_combinations_report.md was fabricated** — found 2026-08-15,
      removed 2026-08-16 at the operator's request. `scripts/research/find_winning_combinations.py`
      optimized Optuna against `random.gauss(0.002 * (w_classical + w_vision), 0.02)`
      synthetic noise, not a real backtest; its "shuffle control" just checked
      `mean(returns) > 0.001`, which the synthetic mean satisfied by construction. The
      script now exits 1 instead of fabricating a report; the report and the stray JSON
      artifact are tombstoned with an explanation. If revisited, needs a full rewrite
      against a real walk-forward backtest (RES-2/RES-3/RES-4 standard) with a
      `history.jsonl` measurement entry — not a patch of the removed script.
- [x] `VIS-8` · **Vision Exit model was trained only on synthetic charts** — found
      2026-08-16. `scripts/export-vision-exit-charts.py` procedurally draws hard-coded
      placeholder shapes per class, not real data; the logged "100% top1 validation
      accuracy" (2026-08-07) is the model recognizing its own synthetic generator. Added
      `_VISION_EXIT_ONNX_TRUSTED = False` gate in `packages/vision/exit_classifier.py` so
      the ONNX branch is skipped unconditionally until a real retrain happens, matching the
      VIS-1 "report unavailable, don't trust an unverified score" discipline. Both scripts
      carry a caveat docstring now.
- [x] `ENG-10` · **`/paper/start` 404'd** — found 2026-08-15. The route function existed
      but its `@router.post("/start", ...)` decorator was lost in the swarm-dashboard
      merge; fixed.
- [x] `SIDE-6` · **ENTROPY-ATLAS broke ATE/SIDEBET track separation** — found 2026-08-15.
      `sidebet/atlas_pipeline.py` imported directly from `packages/microstructure/`,
      failing `tests/test_track_separation.py` silently since 2026-08-11. Fixed by
      vendoring an independent copy to `sidebet/atlas_microstructure/`.
- [x] `DOC-5` · **`docs/compendium/` had drifted hundreds of entries behind the codebase**
      — found 2026-08-15, regenerated and re-pinned `EXPECTED_ENTRY_COUNTS`.

Not queued: GEX/VEX (gamma/vanna exposure) needs an options-chain provider ATE doesn't have;
already tracked as the unchecked "Options overlay" line below.

### 2026-08-26 NotebookLM deep-dive research audit & engine enrichment

Operator provided research notes covering Data Paranoia, Red Team sceptic protocols, moneyness-conditioned Vanna/GEX feedback loops, Multi-Timeframe pixel fusion, Sequence Lane entropy regimes, Microstructural Fuel (liquidation clusters + mempool urgency), and Prediction Market Transfer Entropy causality. High-leverage tasks queued:

- [x] `DATA-12` · **Mission 6 Automated Red Team Agent for Data Acquisition Scepticism** — Sceptic agent enforces sample-size bottleneck defense (non-overlapping opportunity count vs parameter dimensions), single-concession standard, free/OSS tier check, and "physical object vs shadow" verification before acquiring new data feeds.
- [x] `RISK-11` · **Moneyness-Conditioned Vanna Exposure (VEX) Feedback Loop Detector** — Models customer-sold OTM vs ITM put dynamics to detect when market sell-offs push concentrated strikes into the money, turning positive VEX into a destabilizing negative VEX short-selling cascade. Triggers automated risk throttle in `packages/risk/officer.py`.
- [x] `VIS-9` · **Multi-Timeframe (MTF) Pixel Fusion Chart Renderer** — `render_mtf_fusion_chart` composite single-image PNGs (e.g. 4h macro trend panel + 15m execution panel) with `style_hash` verification, keeping operational telemetry decoupled in JSONL files.
- [x] `SEQ-1` · **Permutation Entropy & Lempel-Ziv Complexity Regime Forecaster for Sequence Lane** — Upgrades Sequence Lane from point-direction predictions to entropy/compressibility regime forecasting ($H_n$ and LZ complexity), suppressing breakouts in chaotic random walk regimes, and testing model sufficiency via Permutation Dependence (PD) residuals.
- [x] `MICRO-1` · **Microstructural Fuel Engine (Liquidation Heatmaps & Mempool Urgency)** — Ingests Liquidation Heatmap clusters (Coinglass/Hyblock) at pattern necklines to confirm breakout fuel and optimize dynamic TP/SL placement; implements Bitcoin Mempool Urgency ($M/G^K/1$ queue modeling, 24h fee ROC Sats/vB, OP_RETURN dust filtering via 30d transaction count z-score, Poisson block discovery smoothing) to scale down Confidence-Aware Neural Fusion (CNF) weights when breakouts lack physical fuel.
- [ ] `MACRO-1` · **Prediction Market Cross-Platform Divergence & Transfer Entropy Causality Filter** — Extends PMXT pipeline to auto-discover matching contracts across Polymarket and Kalshi via Jaccard similarity; flags cross-platform probability divergence (>5%) as structural uncertainty in RegimeGate; implements bidirectional Transfer Entropy ($TE(PM \to Spot)$ vs $TE(Spot \to PM)$) to strictly ensure prediction sentiment is only utilized when informational causality ($PM \to Spot$) is statistically proven.
- [x] `MICRO-2` · **Topological Data Analysis (TDA) for Order Book Fragmentation & Kinetic Arrest** — Processes Level-2 order book point clouds using persistent homology to evaluate Ricci scalar curvature ($\kappa_t$), Betti-0 fragmentation count ($\beta_0$) for liquidity holes, and Betti-1 loops ($\beta_1$) for wash-trading/feedback loops, gating order execution under kinetic arrest regimes.
- [x] `FUSION-1` · **Confidence-Aware Neural Fusion (CNF) Layer with Aleatoric Uncertainty Weighting** — Softmax attention layer weighting modalities based on latent states and learned log-variances $[h_m \parallel \sigma^2_m]$ with temperature scaling $T$, dynamically suppressing noisy modalities ($\alpha_m \to 0$) during high aleatoric data noise.
- [x] `RES-10` · **Multiplicative 3-of-4 Confluence Gate with Closed-Bar Integrity & Identity Defaults** — Implements 3-of-4 quorum gate over horizontal level proximity, entropy regime, ATR volatility expansion, and Risk Officer veto; strictly multiplicative ($G \in [0, 1]$), defaulting to 1.0 on missing inputs.
- [x] `MACRO-2` · **Cross-Domain Entropy: Information Asymmetry Index (Prediction Markets vs Options Implied)** — Computes $\text{Index} = |P_{\text{Prediction\_Market}} - P_{\text{Options\_Implied}}|$ using Black-Scholes $\Phi(d_2)$, detecting macro events where rapid PM probability shifts with flat IV/skew act as a 12-hour directional tractor beam.
- [x] `MACRO-3` · **GDELT Geopolitical Volatility GARCH(1,1) Mapping (Task 2.5)** — Ingests GDELT Context 2.0 translingual sentence streams to compute rolling 48-hour Goldstein averages; detects shocks (> 2.5 std below baseline) and feeds as exogenous dummy into GARCH(1,1) for RegimeGate volatility alerts.
- [x] `RISK-12` · **Macro Policy & Corporate Earnings Blackout Gating (FedWatch Spikes & Earnings Exclusion)** — Monitors CME FedWatch / Kalshi policy expectations (>5% shifts in 1h triggering temporary lockout) and enforces $\pm 24$h earnings blackout windows for equities.
- [x] `MICRO-3` · **Perpetual Open Interest Delta & Squeeze Exhaustion Engine** — Tracks Open Interest (OI) delta against price action to mathematically distinguish between "New Money Fuel" (OI Up + Price Up) and "Short Squeeze Exhaustion" (OI Down + Price Up).
- [x] `META-1` · **Meta-Labeling Secondary Model for Post-GO Sizing (Task 2.6 / López de Prado Ch. 3)** — Trains secondary meta-model (regularized logistic regression / shallow decision tree) on pattern entries using CPCV with temporal embargoes; outputs $meta\_p\_win$ scaling notional sizing post-GO.

- [x] `ENTROPY-1` · **Complexity-Entropy Causality Plane ($H_n \times C_{JS}$) & Amplitude-Aware PE Toolkit** — Implements LMC statistical complexity $C_{JS} = Q_0 \cdot J[P, P_e] \cdot H_n[P]$ to separate structured chaos from pure white noise, along with Amplitude-Aware (AAPE) and Weighted (WPE) permutation entropy.
- [x] `FUSION-2` · **Epistemic Uncertainty Quantification via Monte Carlo Dropout ($K=50$)** — Implements $K=50$ parallel stochastic forward passes with active dropout masks during inference in neural forecasters to measure parameter variance, gating or scaling down trades on out-of-distribution geometries.

### 2026-08-16 parallel compendium-volume sweep

Operator asked to chunk the `find-improvements` skill across sub-agents, one per
`docs/compendium/` volume, running in parallel. Findings cross-checked against the live
tree before queuing — this is a concurrently-edited repo; the autopilot loop closed
`RES-5/6/7`/`ENG-9` from the 08-09 sweep, plus `RES-8`/`ENG-10`/`VIS-8`/`DOC-5`/`SIDE-6`,
while these sub-agents were running. One unambiguous one-line bug found
(`run_paper_tick_graph_activity` registered twice in
`services/temporal_worker/worker.py`'s `activities=[...]` list) was fixed inline, not
queued.

- [x] `RISK-9` · **`paper_exchange.py` bypasses the Risk Officer entirely** — a second,
      fully independent order path (`POST /paper/order`) opens positions directly against
      an in-memory global with no veto, no sizing cap, no HITL check, and no `RISK-7`-style
      idempotency. Its `evaluate_position_exit` recommendations (stop-loss, take-profit,
      ...) are computed but never auto-executed. Blocks trusting `RISK-8`'s Phase 8
      live-readiness gate, which closed without catching this.
- [x] `RISK-10` · **`ledger.py::mark_to_market` isn't atomic** — the exit ledger row and the
      position's closed-status flip aren't persisted together; a crash/retry between them
      can double-count `realized_pnl`. Same class of bug `RISK-7` fixed elsewhere, this
      function has no equivalent guard. (Fixed 2026-08-26: atomic `_save_positions` per exit and before `append_ledger_row`, custom `ledger_file` support, verified via `tests/test_paper_ledger.py`).
- [x] `ENG-11` · **`packages/indicators/` duplicates `packages/patterns/` and
      `scripts/research/`** — three functions/modules copy-pasted rather than shared,
      with a live consequence: `services/api/routes/feed.py` imports `compute_kryst`/
      `compute_krswifty` from two different places in the same function, silently
      shadowing the first.
- [ ] `RES-9` · **`confluence_gate.py` shipped with no GO/NO-GO memo** — same gap `RES-5`
      already fixed for VCP; currently harmless since it's reachable only through the
      also-orphaned `shadow_book.py`, but could get silently wired in later.
- [x] `SIDE-7` · **`services/api/routes/sidebet.py` serves hardcoded fake data from inside
      the ATE app** — `GET /sidebet/status` returns invented numbers (`brier_score=0.082`,
      made-up market names), re-creating exactly the shared-process risk `SIDE-4` built a
      standalone service to avoid.
- [x] `DOC-6` · **`task-3-0-optuna-sweep.py` result never logged** — ran 2026-08-07
      (`best_sharpe -1.0`), missing from `docs/research/README.md`'s table and
      `history.jsonl`, unlike every sibling Task 2.x/3.x script. Fixed 2026-08-20:
      logged to `history.jsonl` and given its own "RES-3" table in
      `docs/research/README.md` (didn't fit Task 2.x or 3.1-3.4 thematically); also
      added `eval-vcp.py` as row 2.7. Caveat: the artifact files aren't present on
      this machine, so the -1.0 figure is carried forward from this task's own spec,
      not independently re-derived.
- [x] `ENG-12` · **Four orphaned/legacy modules need a keep-or-delete decision** —
      `packages/vision/renko.py` (zero callers), four Phase-0 Temporal workflow classes
      still registered on the live worker with zero test coverage, and
      `scripts/scan-patterns.py` (superseded by `scripts/hybrid-scan.py`).
- [x] `DOC-7` · **`GET /vision/score` and the Temporal worker entrypoint have no tests** —
      a smoke test on `worker.py` asserting no duplicate names in `workflows=[...]`/
      `activities=[...]` would have caught the duplicate-registration bug above
      automatically.

### 2026-08-06 operator goal — paper+live finish, UI, feeds, automation

Decomposition of the bus goal (06:12): finish paper/live trading, a fast clean UI,
signal/nearest-trade feeds, automated trades, decision-logic visualisation, backtest +
live test, and max pairs/futures coverage. **Live order wiring is not reopened here** —
it stays behind `RISK-8` (blocked on `RISK-7` + `RES-3`) and `SIDE-3`, per
`docs/agent/operator-mode.yaml`'s `ask_human_only_when` list.

- [x] `FEED-1` · **Signal feed** — `GET /feed/signals` (`packages/patterns/feed.py`,
      `services/api/routes/feed.py`) scans a watchlist concurrently, ranks
      nearest-breakout-first (`bars_since_handle` asc, `fused_score` tie-break), isolates
      per-symbol failures into `errors` instead of blanking the feed.
- [x] `DATA-9` · **Widen CCXT pairs** — `_CCXT_MARKETS` now covers 22 Binance-spot-USDT
      majors instead of just BTC/ETH. Spot only.
- [x] `DATA-10` · **Futures / perp coverage** — major USDT-margined perps, funding-rate
      aware so perp P&L isn't silently compared to spot.
- [x] `UI-1` · **Build out `apps/ate-ui`** — currently just a README. React Flow /
      Zustand dashboard rendering the signal feed, paper positions, HITL queue, and the
      fusion/risk decision trace. Biggest single item in the goal; needs an actual
      browser check, not just a type-check, before it's called done.
- [x] `AUTO-1` · **Automated paper-trading scheduler** — `scripts/paper-watchlist-tick.py` + `infra/NIGHTLY_AUTOMATION.md` runs `PaperTickWorkflow` across the watchlist without a manual `/paper/start` call per symbol; still gated by the existing risk/HITL path.
- [x] `VIZ-1` · **Visualise fusion + risk logic** — per-decision lane contributions
      (classical/vision/sequence/macro, `None` vs `0.0` per the renormalisation
      invariant) and the veto/size/HITL trace, not just the final fused number. Blocked
      on `UI-1`.

---

## Live arena & order-path review — 2026-08-17

Read-only review of the 8-account paper arena and the new execution modules, during the
8h live run. **Human view of [docs/agent/work-queue.yaml](docs/agent/work-queue.yaml)** —
the backtick id is canonical.

**Order path — blocks any live capital.** None of these are reachable today (no venue
credentials, no submit path), but all four must land before one exists.

- [x] `EXEC-1` **`reduce_only` on every exit payload.** Was already fixed as a side effect
      of the `EXEC-2` commit; work-queue.yaml just hadn't been synced. Re-verified
      2026-08-20 against all four venues directly.
- [x] `EXEC-2` **Protective stop must rest at the venue.** Today it exists only as a
      condition inside a 15s poll loop, so a hung process or sleeping host = no stop.
- [x] `EXEC-3` **Timeboxed exit ladder** (post-only → re-peg → cross reduce-only → market).
      The timebox is the point: the common maker loss is re-pegging for the rebate while
      price runs away.
- [x] `EXEC-4` **One resting exit order per position**, `remaining_qty` from venue fills.
      Client-side half of over-fill; `EXEC-1` cannot fix it alone.

**Operational integrity.**

- [x] `OPS-1` **Reconciler as a separate process** — position drift, direction flip, naked
      position, orphan orders, liveness, kill-switch. Must not live inside the daemon.
      Closed 2026-08-20 by extending `scripts/arena-watchdog.py` (already independent)
      with drift/mismatch checks and a gated `--kill-switch`; 10/10 new tests passing.
      Venue-position comparison explicitly reported not-applicable — no live connector
      exists yet.
- [x] `OPS-2` **Watchdog cron claims `SCHEDULED & ACTIVE` but was never installed.**
      Verified 2026-08-17: no crontab, no launchd agent, no watchdog script. Hour-1/2
      reports were written by hand. Same class as the voided pre-audit metrics.

**Arena result validity — no number from these runs should be cited until resolved.**

- [x] `ARENA-12` Wire `fee_model` into the arena (it is the only new execution module
      wired into nothing). PnL is currently frictionless. Control-plane drift, not new
      work: fixed 2026-08-18 (commit `3e6afdd`), two days before this entry was picked
      up on 2026-08-20 — status here was just never updated. Entry, stop-loss, take-profit
      and scale-out all charge realistic taker/maker fees + slippage, netted per-trade
      into the ledger.
- [ ] `ARENA-13` Fill-ratio sweep (100/60/40%) with taker-priced stops. Entry is now
      explicitly modelled as taker (fixed alongside `ARENA-12`) — it fills every signal
      instantly at the exact requested price with a taker fee charged, so the open
      question isn't fee-type mismatch anymore, it's whether instant full-size fills
      overstate the edge relative to plausible partial fills at that price.
- [x] `ARENA-14` **Accounts 6/7/8 do not run their named strategies.** Every account runs
      `detect_cup_and_handle` + `detect_horizontal_breakouts`; only thresholds differ.
      Cross-account conclusions are invalid until fixed or renamed.
- [x] `ARENA-15` Repainting — 15s poll on 1m bars means the last bar is partial and
      mutating. Reuse `krystulator.py`'s anti-repaint `shift(1)`. Fixed 2026-08-20 in
      `LiveArenaDaemon.fetch_bars()`; `pytest tests/test_arena15_anti_repaint.py` now
      run for real (5/5 passed, incl. the `fetch_bars()` integration case) — closed.
- [x] `ARENA-16` **31× per-trade edge gap between the two runs** (~81 bps vs ~2.6 bps,
      same system). Closed 2026-08-21 as control-plane drift, not new work: the task's
      own filing entry (history.jsonl line 140) already labeled the 81 bps figure
      "ARITHMETIC ON REPORTED FIGURES, NOT A NEW MEASUREMENT" and named the root cause
      (fee_model.py wired into nothing at the time; arena PnL was (exit-entry)*qty with
      zero friction). `ARENA-17`'s own done_condition already states it supersedes this
      task, and history.jsonl line 144 already carries the authoritative fee-adjusted
      re-measurement. Independently reconfirmed: the two reports aren't even the same
      run (different account rosters, pre- vs post-reset), and a same-day 369-trade
      retrospective shows real fees roughly equal to the 4h report's implied edge — the
      81 bps was omitted friction, not alpha. Both figures remain uncitable; `ARENA-17`'s
      negative-edge measurement is the number to trust.
- [ ] `ARENA-17` **Gross edge is negative before any costs — now confirmed at scale.**
      First measured 2026-08-17 over 321 1m trades: gross **−0.51 bps/trade**. Re-tested
      2026-08-18 on the rebuilt engine at **zero friction**, 4h, 10 symbols, ~2y:
      monk_075 mean **−0.27%** (median −0.49%, n=166, 2/10 symbols positive); the other
      three selectivity settings −0.64% to −0.77%. Cost sensitivity: 20 bps → −0.59%,
      true venue 13 bps → −0.48%, zero → −0.27%. **Friction is not the problem.**
      Maker rebates, exit ladders and timeframe changes all address friction and
      therefore cannot fix this. Supersedes `ARENA-16`; makes `EXEC-1..4` and `ARENA-18`
      premature until a signal with positive gross edge exists.
- [x] `ARENA-18` **1m friction ≈ one full 1m ATR.** Measured ATR 12.7 bps vs friction
      12.96 bps. Every round trip costs an entire average 1-minute candle of range.
      15m carries ~3.9× the range for the same cost; 1h ~7.8×.
- [x] `ARENA-19` **The backtest was not the strategy we run — fixed, and the edge was
      the bug.** `packages/arena/runner.py` now calls the same `evaluate_position_exit`
      as the live daemon (trail, entropy safeguard, scale-out), uses a real ATR, and
      drops the always-false `timed_out` and the `atr_multiplier`-as-bar-count rule.
      Controlled re-measurement 2026-08-18, same spec and data, 4h, 10 symbols:
      monk_075 mean **+0.90% (n=131) → −0.59% (n=166)**; control_055 **−0.67% → −1.35%**.
      The **+1.41%** / **+2.60%** figures are void — they measured an exit engine nobody
      trades. Only AVAX stays positive, which is what one winner in ten looks like under
      noise. n=166 clears the 100-trade gate, so this sample is real: **no edge.**
- [ ] `SIG-1` **The detectors are not edgeless — they are inverted.** Re-measured
      2026-08-18 with the sample doubled to 20 symbols and a bootstrapped verdict
      (`packages/validation/recommend_verdict`), non-overlapping windows, returns net of
      each asset's own drift. **4h: `cup_and_handle` n=192, lift 0.83 / 0.65 / 0.74 /
      0.78 at 5/10/20/40 bars — every 95% CI lies entirely below 1.0. NO-GO ×4.** Hit
      rate at 10 bars is **32.8%** against a 50.5% base. `horizontal_breakout` (n=445)
      and `golden_pocket` (n=243) are NO-GO at 20 bars; 11 of 12 4h cells point negative.
      **1d equities: underpowered** (n=31–82 vs 753–1204 required) — untested, not
      exonerated. Supersedes the earlier 10-symbol "indistinguishable from noise":
      doubling n tightened the intervals enough to exclude unity.
      *Measured* power: ~**1500** observations for a 1.1× lift at 80%.
      **Open hypothesis, not a plan:** a consistently negative signal may be tradeable
      inverted, but hit rate alone doesn't show that — friction is symmetric and payoff
      asymmetry is unmeasured. Needs its own pre-registered test.
      **Re-measured again 2026-08-21 at 2.5x the 1h power (25 symbols, every 1h-covered
      symbol) and for the first time on 1d (21 symbols, equities+BTC-USD).**
      `cup_and_handle`/`golden_pocket`/`capitulation_reversal` fire on **0 of 25**
      symbols on 1h — can't even be measured there. `horizontal_breakout` fires
      abundantly (46,781 signals, pooled n=91,534) but stays flat-null, |t| < 0.5 on
      all four horizons, NO-GO — a stronger confirmation of the null, not a new
      finding. `little_rizzy` (PLAY-2), measured for the first time: flat-null on 1h
      crypto (61,331 signals, |t| ≤ 0.52, NO-GO) but **negative and significant on 1d
      equities** (2,957 signals, t −1.76 to −4.61, hit rate 50.7–51.6% vs. each
      symbol's own 55.4–62.1% baseline — see `PLAY-2`'s own caveat). The "more
      observations" prescription is now satisfied for the original stack; the answer
      is unchanged. Recommend treating stack retirement/replacement as the live next
      step rather than further power-seeking — see `docs/agent/work-queue.yaml::SIG-1`
      evidence for full numbers.
- [x] `ARENA-20` **Accounts 1/5/7/8 share every entry parameter.** Entry config was
      derived from account-name substrings; these four matched nothing and emitted
      byte-identical trades while showing as four strategies. Wiring landed 2026-08-18
      (all 8 variants now hash distinct) — the sameness is visible now, not fixed.
- [x] `ARENA-21` **account_1's `fuse_signal` call passes hardcoded `0.5` for
      vision/sequence/macro instead of `None`.** Regression of audit finding #3
      (2026-08-05, "lanes are `float | None`") at one call site: `fuse.py` treats a
      float as a real report and blends it at full weight, so account_1's cup-and-handle
      score is permanently dragged toward 0.5 by three lanes that were never wired.
      Found 2026-08-20 while checking whether `ARENA-17`'s negative-edge figure can still
      be trusted — it can't be, not fully: this affects only account_1's slice of that
      321-trade sample, not accounts 2/4/5 which bypass `fuse_signal` entirely. Fixed
      2026-08-20: bypassed `fuse_signal` for account_1 too (passing `None` for the
      unwired lanes was a trap, not a fix — see work-queue.yaml evidence for the math),
      now matching accounts 2/4/5/7/8. `ARENA-17` still needs a re-run before its verdict
      is fully trusted.

- [x] `UI-9` **KRYST long/short zone bands.** `compute_kryst` returns a bare scalar; a
      modded version on TradingView plotted red/green long/short bands that read well.
      Thresholds must be *measured* (`signal-quality-study.py`), not eyeballed — see
      `SIG-1`.
- [x] `VPE-1` **`VPETradePlan.confluence_score` is hardcoded, and Setup A fires mostly
      in chop.** Fixed 2026-08-20: `confluence_score` is now a composite of proximity
      to the level, volume expansion, and risk:reward (varies per trade); Setup A now
      requires `signal_candle.at_edge`, so it can no longer fire mid-chop; live
      absorption/VPIN inputs default to `None` instead of stub values that silently
      claimed confirmation. Post-fix 4h/20-symbol rerun: Setup A n dropped 435→133
      (chop false-triggers removed), still `UNDERDETERMINED` but alpha now positive
      across all horizons. See the **NO MOCK DATA** rule at the top of `CLAUDE.md`,
      triggered by this finding, and `ENG-14` for the codebase-wide follow-up.

**Code health.**

- [x] `ENG-13` Two horizontal-level implementations, both exported from `__init__.py`,
      differing only by `detect_` vs `extract_`. Fixed 2026-08-20: both are real and
      used (Joachim quick-read indicator vs. the multi-timeframe clusterer the actual
      pattern detectors trade off of, both called by the same feed endpoint) — renamed
      `levels.py`'s `detect_horizontal_levels` to `cluster_joachim_levels` and
      cross-documented the two modules instead of deleting either.
- [ ] `ENG-14` Codebase-wide audit for hardcoded/mock values that read as real data
      (score/confidence/index-shaped fields), per the `VPE-1`-triggered NO MOCK DATA
      rule at the top of `CLAUDE.md`. Progress 2026-08-21: fixed
      `proximity_and_confluence.py`'s bots 9-12, which returned fixed literals
      (`75.0/25.0`, always `active_bias="BULLISH"`) while bots 1-8 in the same function
      already computed real proximity — wired in volume-profile/liquidity-sweep/
      order-flow-absorption data the caller was already computing but never passing
      through, plus a new genuine Bollinger-bandwidth squeeze measure for bot 12.
      Second fix same day: `CorrelationMatrix.tsx`'s entire heatmap was a client-side
      lookup table (hardcoded base correlations perturbed by a symbol-name hash), zero
      connection to real prices. Built `packages/indicators/cross_correlation.py` (real
      Pearson correlation + lead-lag cross-correlation from actual OHLCV returns,
      fetched live via yfinance for benchmarks not in the local cache) and a new
      `GET /feed/correlation-matrix` route; rewrote the component to fetch it with an
      honest loading/error state instead of ever showing fake numbers. Found a new,
      still-open issue while doing this: `NewsSentimentStream.tsx` silently substitutes
      a fully fabricated response (fake sentiment score, fake headlines attributed to
      real outlets) on any fetch error, undisclosed in the UI. Still open:
      `ThesisTestingLab.tsx`, `StrategyBacktester.tsx`, `NewsSentimentStream.tsx`, and
      the rest of `packages/fusion`/`packages/indicators`/`apps/ate-ui`.
      Full sweep 2026-08-21 (operator re-confirmed in Swedish: remove ALL synthetic
      data + random generators). Backend: `feed.py`'s `/vpe/analysis` sine-wave+random
      fallback removed (honest 404 instead); `/fused-signal/{symbol}` was almost
      entirely hardcoded literals dressed as computed fields (not random — found by
      reading the file, a reminder that grepping `random` alone isn't a complete
      sweep) — rewritten to real ADX/ATR/regime (`regime_gate.py`) + real LZ76
      (`entropy_regime.py`) fused via the existing `fuse_signal` engine, with
      vision/sequence/macro/microstructure/credit honestly `null` (no live source
      exists) instead of invented. `yolo_microstructure.py`'s YOLO model (trained
      solely on `train_yolo_patterns.py`'s synthetic candlesticks) had **no** trust
      gate unlike its sibling `exit_classifier.py` (`VIS-8`) — added
      `_YOLO_MICROSTRUCTURE_TRUSTED = False`; its rule-based fallback's own hardcoded
      confidence constants (0.92/0.88) replaced with real trigger-strength formulas.
      Frontend (4 parallel sub-agents): `marketData.ts` (the biggest single
      fabrication surface — fake OHLCV/FusedSignal/risk-timeline/placebo-results) and
      its 5 consumers rewired to real endpoints or honest unavailable states;
      `StrategyBacktester.tsx` and `ThesisTestingLab.tsx` wired to two brand-new real
      backend routes, `GET /arena/backtest` and `GET /validation/entropy-hypothesis-
      test`; `NewsSentimentStream.tsx`'s root cause traced to `server.ts`'s
      `getMockNewsSentiment()` (fake Reuters/Bloomberg/etc. headlines returned as
      HTTP 200 on any error) — deleted, now honest 503s; `SentimentVelocityChart.tsx`
      and `MacroLiquidityCreditChart.tsx` (fully sin/cos-fabricated series) now show
      real price + honest unavailable states for GDELT/HY-OAS. `text-flipping-board.
      tsx`/`DevConsole.tsx` confirmed benign (cosmetic animation / React key only).
      Research scripts `task-2-2-mempool-urgency.py` (hard-failed, incl. a fee
      fallback that was tautologically derived from its own possibly-fake price
      series), `task-2-4-entropy-regime.py`, `level_probe.py` brought up to the
      `task-2-3` gold standard (explicit `synthetic` field + loud warning). Post-fix
      re-grep of the whole repo for both `Math.random` and
      `np.random`/`random.*` confirms zero remaining unaddressed live-code hits
      (only comments, test fixtures, and already-classified legitimate statistical
      methodology remain). Full suite 875 passed/9 skipped/0 failed, ruff clean, `tsc
      --noEmit` clean, `docs/compendium/` regenerated + re-pinned. Honest residual
      scope: this pass didn't attempt an exhaustive hardcoded-literal sweep beyond
      files already flagged/read (the `/fused-signal` case shows that smell doesn't
      require `random` at all), and `sidebet/` (a deliberately separate, walled-off
      track — see `test_track_separation.py`) was left untouched by design. See
      `docs/agent/work-queue.yaml::ENG-14` for the full per-file evidence.
      Hardcoded-literal pass 2026-08-24. The operator pointed at a sibling fork
      (`~/Documents/ATE-COPY`, audited by a different model) and asked for a straight
      comparison. Running **their** CI guard against this tree found 4 real violations
      my sweep had missed, all of a shape I had never looked for: `value || <plausible
      constant>`. It contains neither `Math.random` nor a literal in a return, so every
      grep I ran was blind to it — and `||` (unlike `??`) also replaces a **genuine
      zero** with the constant. Gating this in CI instead of re-auditing by hand is
      better engineering than my one-time sweeps, and the idea is adopted. Fixed:
      fabricated account balances (`|| 500`, `|| 100`), `positionSizeUsd || 45`,
      `confluenceScore || 75`, `leverage || 3.5`, the **order amount field pre-filled
      with an invented $3500**, `volume || 100`, and a Renko brick size seeded from a
      fabricated price of 100.
      Three findings came from reading, **two of them regressions I caused myself**:
      `FusedScoreReasoningChain` (the panel explaining *why* a signal scored what it
      did) mirrored, value for value, the constants I removed from `/fused-signal` — so
      nulling the backend fields made the frontend copy fire on *every* render;
      `types.ts` declared the lanes non-nullable while the API sends null, leaving five
      unguarded reads as latent runtime crashes — and widening the types exposed the
      real gap: **`strictNullChecks` is off**, so every "tsc clean" I have reported is a
      far weaker signal than it reads as. Also fixed: `amt_setups.py`'s
      `confidence_score`, flagged unfixed since 2026-08-20, was four fixed literals
      (85/85/80/75) chosen only by which branch matched — now computed from measured
      geometry and order flow.
      Durable outcome: `scripts/guard-no-mock-data.py`, run by
      `tests/test_no_mock_data_guard.py` so it fails the suite. Adopted from the fork's
      guard with three holes closed, each found by running it against this tree: it
      scanned only `api/` though the bugs it was written to stop live in `components/`
      (so it could not have caught its own findings); it stripped only `//` and
      therefore reported my explanatory JSX comments *about* removed fabrication as
      fabrication; and it was TypeScript-only, blind to the `/fused-signal` class. The
      guard's own rules are unit-tested (13 tests) — which paid off immediately: my
      first rule-4 regex was **inert**, silently matching nothing while reading as a
      pass. The guard also caught 13 findings my hand grep missed entirely, because it
      matched only integers while this codebase's scores are mostly sub-1.0 decimals —
      including `?? 0.35`, exactly the entropy compression threshold, feeding the exit
      engine a borderline value whenever entropy was absent. Verification: 888 passed,
      0 failed; ruff, guard and compendium clean. Honestly remaining: enable
      `strictNullChecks` (expected to surface a large UI backlog, not attempted blind),
      a line-by-line constant review of `packages/`+`services/`, and `sidebet/`.
      **`strictNullChecks` påslaget 2026-08-24.** Att lägga den som en fråga istället för
      att bara köra den var fel, och operatören sa till. Resultat: **31 fel, inte den
      stora backlog jag befarade** — och de delade sig rent. **16 var äkta null-buggar**,
      precis de latenta krascharna jag förutsade: `OddsDashboard` läste
      `microstructure.*`/`credit.*` oskyddat på 12 ställen, `VolatilityHeatmap` jämförde
      null mot bucket-gränser på 4. Var och en hade kastat i samma stund en lane
      rapporterade null — vilket nu är normalfallet. De övriga 15 var
      typinferensfel (`never[]` från tilldelning inuti en forEach-closure, en otypad
      array, och `currentSignal ?? undefined` till en obligatorisk prop som dessutom
      läser `.symbol` — ännu en latent krasch). Hittat på vägen, samma brottsklass:
      `OddsDashboard`s "9-stegs pipeline-verifiering" hårdkodade `status: 'pass'` för
      steg 1/3/4/8/9 oavsett vad pipelinen gjorde — en verifieringspanel som bara kan
      rapportera framgång verifierar ingenting, och steg 4 påstod godkänd YOLO-vision
      medan den lanen är otrodd. **Nettoeffekt: `tsc --noEmit` är för första gången ett
      äkta kvitto i det här repot** — 0 fel med strictNullChecks på, där det förut inte
      kontrollerade null alls. 888 gröna, grind ren.
      **Fortsatt genomgång 2026-08-24 (packages/+services/).** Hittade den allvarligaste
      överträdelsen i denna omgång, i `services/api/routes/paper.py`: manuella
      paper-ordrar skrev `fusion_score=0.75` (hårdkodat) **permanent till den riktiga
      exekveringsledgern** via `PaperExecutionGateway.submit()` — riskgrinden själv
      påverkades inte (`officer.evaluate()` läser aldrig `fused_score`), men varje
      manuell order loggades ändå med ett påhittat övertygelse-tal. Samma endpoint satte
      `exec_price = 100.0` när ingen pris angavs och räknade fram `atr` som
      `exec_price*0.015` istället för att mäta den — det påhittade ATR-värdet gick sedan
      rakt in i den riktiga stop-loss-beräkningen. `GET /exit/evaluate` satte
      `current_price = entry_price` för alla öppna positioner (garanterat 0 kr
      orealiserad P&L, alltid), och `/position/close` stängde alltid till entry-pris
      (garanterat 0 kr realiserad P&L på varje manuell stängning) — ingen av dessa tre
      endpoints hade någon testtäckning alls innan denna fix. Fixat genom en ny delad
      modul `packages/fusion/live_signal.py` (`compute_live_fusion`) som återanvänder
      samma riktiga RSI/ADX-beräkning som `/fused-signal/{symbol}` redan bevisat — alla
      tre endpoints vägrar nu (HTTP 503) istället för att hitta på ett pris/score när
      ingen live-data finns. Ny `tests/test_paper_order_route.py` (6 tester) bevisar att
      det riktiga värdet når ledgern och riskbeslutet, och att alla tre vägrar rent utan
      live-data. `packages/data/worldmonitor_provider.py`s `MOCK_GEO_INTEL` granskad och
      bekräftad **inte** en överträdelse (ärligt märkt fixture). Verifiering: 894 gröna
      (888 + 6 nya), 9 skippade, 0 failade; ruff, guard och compendium rena (ombyggd två
      gånger, `EXPECTED_ENTRY_COUNTS` om-pinnad). Kvar: `journal_evaluator.py`,
      `strategy_state_machine.py`, `funding_squeeze.py`, `squeeze_probability.py`,
      `vision_confluence_bridge.py`, `exit_classifier.py`s resterande
      confidence-konstanter — obedömda; `sidebet/` fortfarande osvept.
      **Fortsättning samma dag.** `journal_evaluator.py`s `process_adherence_score=100.0`
      (vinnande trades) och `strategy_state_machine.py`s `conviction_weight`-konstanter
      (1.0/1.5/1.8/0.5) granskade och **inte** överträdelser — dokumenterade regler/
      positionsviktningar kopplade till riktiga tillståndsövergångar, inte påhittade
      mätvärden. `funding_squeeze.py`/`squeeze_probability.py` **var** riktiga
      överträdelser, och att läsa hela `/chart/candles` i `feed.py` (enda anroparen)
      avslöjade två till som en ren sökordsgrepp missat helt: en påhittad L2-orderbok
      (formelbaserad prisstege runt senaste stängning + en manuellt injicerad falsk
      "ghost spoof wall") körd genom det riktiga spoofing-filtret och returnerad som
      `cleaned_orderbook`, samt en påhittad 5-rads trade-tape skickad in i Golden
      Pocket Sniper-motorn. `detect_funding_squeeze` uppskattade funding rate från
      prisretur-skevhet och OI-förändring från volymtillväxt närhelst ingen live-data
      angavs — vilket var fallet för varje riktig anropare — och matade en
      regimklassificering med upp till 94% confidence byggd helt på orelaterade
      proxyvärden utan någon markering. `squeeze_probability.py` satte dessutom tyst
      `funding_rate=0.0100`/`oi_growth=2.5` som fallback när ingen funding-signal
      fanns — ett spöke-golv på +5 poäng i varje squeeze-score utan riktig data,
      ett andra fel ovanpå det första. Fixat: `detect_funding_squeeze` är nu async
      och hämtar en riktig funding rate via `ccxt_provider.py`s `CcxtProvider` för
      symboler med en riktig perpetual futures-marknad (aktier som SPY har ingen
      funding rate alls — begreppet gäller inte, så det returnerar `None` för dem);
      returnerar `None` vid varje misslyckande istället för att hitta på ett värde.
      `open_interest_change_24h_pct` är nu `float | None` och alltid `None` (ingen
      riktig OI-källa finns någonstans i det här repot). `squeeze_probability.py`s
      funding/OI-poäng är nu genuint noll, aldrig en påhittad baslinje, när data
      saknas. Den falska orderboken/tapen togs bort helt — `cleaned_orderbook` är
      nu ärligt `None`; `tape_trades=None` leder Golden Pocket Sniper genom sin
      egen redan existerande ärliga fallback ("micro-bar volume delta proxy",
      genuint beräknad från riktig OHLC). En subagent granskade frontend:
      `ChartViewer.tsx`, enda konsumenten av `/chart/candles`, skyddar redan varje
      läsning bakom `&&`/`if` — inga frontend-ändringar behövdes, till skillnad
      från `FusedScoreReasoningChain`/`types.ts`-regressionen tidigare i ENG-14.
      Verifierat live: BTC-USD ger nu en riktigt hämtad funding rate (0,01%,
      NEUTRAL), SPY ger korrekt `funding_squeeze=None`. 896 gröna, 9 skippade,
      0 failade; ruff/guard rena; compendium ombyggd och om-pinnad.
      **Nästa punkt samma dag:** `vision_confluence_bridge.py`s
      `evaluate_vision_confluence()` — bekräftad överträdelse, men för närvarande
      **inert** i produktion (endast importerad av sin egen `__init__.py` och ett
      test — inget i `services/`, `packages/agents/` eller `packages/fusion/`
      anropar den). Fixad ändå, samma standard som `amt_setups.py` tidigare.
      Felet: föll tillbaka till `vision_score=50.0` (eller 0.0 via en tyst
      `.get("score", 0.5)`) vid vilket undantag som helst, presenterat som en
      äkta "AI Vision Pattern Score" — och läste aldrig `status`-fältet från
      `resolve_vision_score`. I den här dev-miljön är `status="stub"` (ingen
      ONNX-modell på disk) med `score=0.0` — vilket betyder att bryggan skulle
      rapportera **"AI Vision Veto Triggered"** och sätta `vision_veto=True`
      som om en riktig AI-bedömning gjorts, fast ingen inferens alls kördes.
      Bekräftat att just den här modellen INTE behöver en VIS-8-liknande
      misstrogrind som `yolo_microstructure.py`/`exit_classifier.py` —
      `train-yolo-cup-handle.py` tränar på riktig parquet-OHLCV via
      weak-labeling på genuina framtida prisutfall, inte påhittade candlesticks.
      Fixat: `vision_score` är nu `float | None`, ny `vision_available: bool`;
      bryggan returnerar ärligt otillgängligt istället för att hitta på ett
      score/veto. 896 gröna, 9 skippade, 0 failade; ruff/guard rena.
      **Sista punkten i grepp-listan, samma dag:** `exit_classifier.py`s Bull Trap
      (`confidence=0.88`) och Double Top (`confidence=0.82`) — **bekräftat riktig
      och LIVE**, till skillnad från vissa andra punkter idag. `exit_strategy.py`
      grindar ett äkta EARLY_EXIT-beslut på `confidence >= 0.70` och loggar värdet
      till användaren — varje bull trap/double top, svag eller övertygande, gav
      exakt samma "88%"/"82%". Den redan existerande Shooting Star-grenen i samma
      funktion gjorde redan rätt (`0.70 + vol_ratio*0.10`, genuint varierande med
      mätt volym) — fixen speglar den etablerade lokala konventionen istället för
      att hitta på en ny. Bull Trap beräknas nu från verklig overshoot över
      breakout-toppen och penetration under föregående swing-låg; Double Top från
      verkligt avvisningsdjup plus liten bonus för extra nivåtester. Båda golvade
      på 0.70 så ett upptäckt mönster fortfarande alltid klarar grinden — bevarar
      dagens beteende istället för att tyst sluta trigga early exits på riktiga
      paper-positioner — men själva talet varierar nu genuint med bevisstyrkan.
      Nya regressionstester bevisar att confidence ökar med bevis och aldrig
      överstiger 0,95. **Detta stänger hela confidence-konstant-listan från idag**
      (6 punkter granskade: 4 riktiga överträdelser fixade, 2 bekräftat
      legitima policy-konstanter). 898 gröna, 9 skippade, 0 failade; ruff/guard
      rena. Kvar: `sidebet/` fortfarande osvept; detta var en riktad lista från
      en grepp-omgång, inte en uttömmande rad-för-rad-genomgång av varje fil i
      `packages/`+`services/` — ENG-14 kvarstår `not-done`.
      `sidebet/`-svepet påbörjat (ENG-14:s andra scope-post). Grep efter
      `np.random`/`random.*` gav en träff (`atlas_entropy_regime.py`s
      `phase_scramble_series`, bekräftat legitim FFT-fassvepnings-teknik på
      riktig indata, orörd). Grep efter hårdkodade konfidens/score/probability-
      literaler och `.get(key, <literal>)`-fallbacks hittade två riktiga
      överträdelser, båda fixade: `llm_triage.py`s `triage_geopolitical_event()`
      hade `confidence = 0.75` hårdkodat oavsett hur många bull/bear-nyckelord
      som faktiskt stödde bedömningen — nu beräknat från samstämmighet och
      bevisvolym (golv 0.30, tak 0.95), 2 nya tester bevisar variation.
      `pmxt_whale_tracker.py`s `detect_whale_anomalies()` hittade på
      `implied_probability=0.5` på två ställen när riktigt pris-data saknades
      (ett whale-trade utan `price`, en volymspik utan `current_price`) — matar
      ett obligatoriskt `Field(ge=0,le=1)` på `WhalePositionAlert`, så
      fabrikationen var tyst och schema-laglig. Båda ställena hoppar nu över
      larmet istället för att hitta på en sannolikhet, samma
      vägra-hellre-än-fabricera-mönster som `funding_squeeze.py` tidigare idag;
      2 nya tester bevisar respektive skip-väg. Verifiering: 902 gröna, 9
      skippade, 0 failade (upp från 898); ruff/guard rena; kompendiet
      regenererat två gånger och om-pinnat (05: 1107→1111, ingen
      funktions/klass-drift i `packages/` — båda fixarna är rent logik-interna).
      Kvar: ~20 `sidebet/`-moduler oläst än (`api.py`, `atlas_pipeline.py`,
      `calibration.py`, `clob_v2.py`, `clob_v2_streamer.py`,
      `cross_venue_arb.py`, `discover.py`, `garch_x.py`, `ledger.py`,
      `market_catalog.py`, `microstructure.py`, `narrative_model.py`,
      `regime_engine.py`, `registry.py`, `resolve.py`, `reversal_filter.py`,
      `risk_gate.py`, `schemas.py`, `dashboard.html`,
      `atlas_microstructure/renko_vpin_ofi.py`); `packages/`+`services/`
      fortfarande inte uttömmande rad-för-rad-granskat. ENG-14 kvarstår
      `not-done`.
      `sidebet/`-svepet klart. Läste resterande ~20 moduler i sin helhet
      (`api.py`, `atlas_pipeline.py`, `atlas_microstructure/renko_vpin_ofi.py`,
      `calibration.py`, `clob_v2.py`, `clob_v2_streamer.py`,
      `cross_venue_arb.py`, `dashboard.html`, `discover.py`, `garch_x.py`,
      `ledger.py`, `market_catalog.py`, `microstructure.py`,
      `narrative_model.py`, `regime_engine.py`, `registry.py`, `resolve.py`,
      `reversal_filter.py`, `risk_gate.py`, `schemas.py`) — alla rena, ingen
      fabricerad data hittad. Bekräftat legitima mönster: `garch_x.py`s
      MLE-fallback vid otillräcklig data flaggar `is_converged=False` istället
      för att presentera en otränad fit som riktig; `ledger.py`/`resolve.py`s
      `NullMarketResolver` returnerar `"unresolved"` istället för att gissa
      avräkning; `discover.py`/`market_catalog.py` returnerar en ärlig tom
      lista på en död API istället för att hitta på en radar;
      `regime_engine.py`/`narrative_model.py`s fasta modellkoefficienter är
      deklarerade hyperparametrar som en genuint varierande beräkning körs
      igenom mot riktig indata — samma klass som `strategy_state_machine.py`s
      `conviction_weight`-konstanter (redan bedömda legitima);
      `dashboard.html`s DEMO-payload är avstängd som standard med en synlig
      röd "DEMO DATA - NOT REAL"-badge, guldstandard-mönstret för öppen
      redovisning. Varaktigt resultat: `scripts/guard-no-mock-data.py`s
      `PY_TREE_RELS` utökad till att täcka `sidebet/` (tidigare skannades
      `sidebet/` aldrig av guarden alls, så den var "ren" genom att aldrig
      kontrolleras, inte genom att faktiskt vara kontrollerad);
      `sidebet/`s två legitima slump-ställen (`atlas_entropy_regime.py`s
      FFT-fassvepning, `microstructure.py`s Gibbs-sampler) tillagda i
      `_PY_RANDOM_ALLOWLIST` med motivering. Verifiering: 902 gröna, 9
      skippade, 0 failade; ruff/guard rena med `sidebet/` nu faktiskt
      skannat; kompendiet regenererat, ingen räknedrift. ENG-14: båda
      namngivna scope-poster (packages/+services/-konfidenslistan,
      sidebet/-svepet) klara, men ingen av dem var en uttömmande
      rad-för-rad-genomgång av varje fil — båda var riktade genomgångar mot
      de fabrikationsmönster uppgiften lärt sig känna igen hittills. Status
      kvarstår `not-done`; att markera den klar är ett beslut för operatören,
      inte något denna genomgång tar sig själv.
      Första fyndet från den bredare packages/+services/-genomgången:
      `services/api/routes/feed.py`s `/chart/candles` beräknade
      `entropy_chop` (20-bars glidande Shannon-entropi) via en handrullad
      per-bar-loop istället för ett pandas rolling-fönster som varje annat
      indikator i samma funktion — och hårdkodade `0.5` för de första 20
      uppvärmningsbarerna på varje enskild graf, en trolig avläsning
      omöjlig att skilja från en riktig i API-svaret. Varje syskon-indikator
      (`ema20`, `ema50`, `boll_upper/lower`, `rsi`, `atr`, `kryst`,
      `krswifty`, `obv`, `obv_rsi`) är genuint NaN under sin egen
      uppvärmning och renderas `None` via den befintliga
      `pd.notna(...) else None`-vakten i candles-byggaren —
      `entropy_chop` var det enda undantaget. Fixat genom att lägga till
      `float("nan")` istället för `0.5`, vilket flödar genom samma
      befintliga vakt (en rads ändring, ingen ny funktion). Spårade den
      enda levande anroparen och bekräftade att den redan var
      `float | None` med en None-säker konsument — ingen
      nedströms-beteendeändring bortom att uppvärmningsbarerna nu är
      ärliga. Ny `tests/test_chart_candles_entropy_warmup.py` (det första
      endpoint-testet för `/chart/candles` i detta repo) mockar
      `get_bars_for_scan` och `detect_funding_squeeze` för ett snabbt
      offline-test, och bevisar att barer 0-19 rapporterar
      `entropy_chop=None` medan barer 20+ rapporterar ett riktigt beräknat
      värde. Verifiering: 903 gröna, 9 skippade, 0 failade (upp från 902);
      ruff/guard rena; kompendiet regenererat två gånger och om-pinnat
      (05: 1111→1115, ingen räknedrift i `packages/`). Ett fynd från en
      bredare, fortfarande icke-uttömmande genomgång — inte ett påstående
      att packages/+services/ (~180 återstående filer) nu är fullständigt
      granskat.
      Fortsatte genomgången utan att pausa (per operatörens instruktion).
      Två riktiga fynd till, båda i den levande paper-execution-vägen.
      `packages/execution/paper.py`s `PaperExecutionGateway.submit()`
      föll tillbaka på ett hårdkodat `fill_price = 1.0` när varken en
      riktig `entry` eller `intent.limit_price` fanns — och två riktiga
      produktionsvägar gav aldrig något: `services/swarm/paper_tick_graph.py`s
      `paper_execute_node` (LangGraph-svärmen) anropade `submit(intent)`
      helt utan pris, och `packages/execution/submit.py`s
      `submit_paper_from_tick` (Temporal-aktivitetsvägen) kollade bara
      fält som `validate→risk`-pipelinen aldrig sätter. Varje riktig
      paper-fill genom endera vägen prissattes alltså tyst till exakt
      $1.00 oavsett symbolens verkliga marknadspris — samma VPE-1-mönster
      som utlöste denna uppgift, men på penningsidan. Fixat: `submit()`
      vägrar nu (kastar `ValueError`, river upp sin idempotens-post) istället
      för att hitta på ett pris; `paper_execute_node` hämtar nu en riktig
      senaste stängningskurs via `bar_cache.get_bars_for_scan`;
      `submit_paper_from_tick` kollar nu även `pattern_scout.top_signal.
      breakout_level` (ett riktigt cup-and-handle-pris beräknat på riktiga
      barer) innan den ger upp. Fyra testfiler uppdaterade/nya. Samtidigt,
      i `packages/hermes/controller.py`: `HermesController.analyze()`
      hämtade riktig per-bot proximity/confluence-telemetri men läste
      aldrig `bot-6`/`bot-2`s värden igen — deras `target_leverage`/
      `target_allocation_usd` var hårdkodade literaler (2,5x/$45, 3,0x/$50)
      identiska varje cykel oavsett den riktiga hämtade datan, och dessa
      värden är inte bara visning — de appliceras live via
      `hermes_cron.py`s auto-apply och `/hermes/fleet-tune`. Fixat: alla
      tre botarna föredrar nu sin egen riktiga rekommenderade
      hävstång/allokering från proximity-flödet, med modellens
      standardvärden bara som reserv när riktig data genuint saknas.
      Verifiering: 909 gröna, 9 skippade, 0 failade (upp från 903);
      ruff/guard rena; kompendiet om-pinnat (05: 1115→1124, ingen
      räknedrift i `packages/`). `services/api/routes/hermes.py`s
      `chat_with_hermes` flaggad under samma genomgång (ett hårdkodat
      narrativ-fallback-svar med påhittade BTC-priser/RSI/positioner när
      ingen LLM-leverantör är konfigurerad) — inte fixat än, nästa i
      samma pågående genomgång. Kvarstående scope oförändrat: packages/+
      services/ fortfarande inte uttömmande rad-för-rad-granskat.
      Fixade `services/api/routes/hermes.py`s `chat_with_hermes` och
      `apply_hermes_fleet_tune` (posten flaggad ovan). Tre fynd: (1)
      `.get(key, 0.45/0.20)` skyddade bara mot en saknad nyckel — som
      alltid finns — och gav en tyst "lugn marknad"-avläsning vid ett
      icke-numeriskt värde; ersatt med en `_num()`-koercion som speglar
      `HermesController`s egen doktrin (okänt får aldrig läsas som
      säkert), med ett ärligt "Telemetri otillgänglig"-svar när entropin
      genuint saknas. (2) "vända/trend"-svarsgrenen var ett helt
      manusstyrt narrativ med påhittade siffror (falska BTC-priser
      $64,2k/$64,1k/$64,4k, en fast "RSI 17-20p", påstådda Bot 6/7-fills)
      utan koppling till någon riktig variabel — ersatt med ett svar
      byggt enbart på den riktiga redan hämtade telemetrin. (3)
      `bot_adjustments` i både `/chat` och `/fleet-tune`s minnesskrivning
      hade samma "riktig data hämtad men aldrig läst"-mönster som i
      `controller.py` tidigare i denna genomgång — fixat med samma
      mönster. `apply_hermes_fleet_tune`s Qdrant-minnesskrivning
      indexerade alltid entropy=0,0/vpin=0,0 oavsett verklig marknad —
      fixat med valfria riktiga fält, och skriver nu ingenting hellre än
      en påhittad avläsning. Ny `tests/test_hermes_route_no_mock_data.py`
      (första testfilen för denna route, 5 tester). Verifiering: 914
      gröna, 9 skippade, 0 failade (upp från 909); ruff/guard rena;
      kompendiet om-pinnat (04: 827→829, 05: 1124→1131). Kvarstående
      scope oförändrat.

      Sjunde fyndet samma dag: `packages/vision/inference.py`s
      `score_chart` (den native Ultralytics-vägen) hade exakt samma bugg
      som VIS-2 redan fixat på ONNX-systervägen (`score_chart_onnx`) —
      `_positive_class_index` returnerade `None` när modellens
      klassnamn inte gick att matcha mot "positive", och anroparen
      gissade tyst "index 1 (eller 0) är positive" istället för att
      vägra. Ultralytics alfabetiserar klassnamn vid träning, så
      gissningen kunde precis som i ONNX-incidenten invertera varje
      poäng den här vägen producerar. `score_chart` returnerade också
      en bar `0.0` (omöjlig att skilja från en genuin "inte en
      cup-and-handle"-avläsning) när `predict()` inte gav några
      resultat eller checkpointen saknade `.probs`. Detta är en
      levande väg — `packages/agents/vision_validator.py` anropar
      `score_chart` direkt och fångade bara `FileNotFoundError`/
      `OSError`, så båda felfallen hade före denna fix kraschat
      vision-validator-agenten istället för att ge den redan
      dokumenterade "vision-spåret otillgängligt, ingen tyst
      genomsläppning"-nedgraderingen. Fixat: `_positive_class_index`
      kastar nu `ValueError` istället för att gissa; båda
      no-results-vägarna kastar `RuntimeError` istället för att
      fabricera `0.0`. `vision_validator.py`s `_yolo_score` fångar nu
      `RuntimeError`/`ValueError` utöver sina befintliga
      `FileNotFoundError`/`OSError` och nedgraderar till samma ärliga
      `inference_mode="unavailable"`-spår som redan används för en
      saknad modell. Nya tester: 4 index-upplösningstester i
      `tests/test_vision_inference.py` som speglar de befintliga
      VIS-2-ONNX-testerna en-till-en, plus ett `RuntimeError`-test för
      no-results, samt `tests/test_agents.py`s nya
      `test_yolo_score_degrades_honestly_when_score_chart_refuses_to_
      guess`. Verifiering: 920 gröna, 9 skippade, 0 failade (upp från
      914); ruff/guard rena; kompendiet om-pinnat (05: 1131→1142).
      Kvarstående scope oförändrat — detta stänger ett av 16 fynd från
      en 6-vägs parallell triage-sweep; resten kvar (bot_allocator.py,
      fabio_valentina_playbooks.py, hermes/reconciliation.py,
      ate_matrix/, samt ett 10-punkters indicators/patterns-block).

      Åttonde fyndet samma dag: `packages/fusion/bot_allocator.py`s
      `allocate_bots_for_market_state` — bot-2, bot-4, bot-6, bot-10 och
      bot-12 hårdkodade var sin fast `True`/`False` för
      `in_golden_pocket` eller `near_key_pivot` i sitt eget
      `compute_robbins_confluence_score`-anrop, oavsett det riktiga
      marknadsläget som skickades in. Båda flaggorna ger riktiga poäng i
      `scoring_system.py`s Lane 1 (GEX-regim-match, +10p) och Lane 2
      (VPE-kant/rabatt +20p, nyckel-pivot +15p), som matar
      `total_score` → `tier` →
      `recommended_leverage`/`recommended_size_usd` — så en bot kunde
      visa `is_scenario_matched=False` (korrekt, från den riktiga
      flaggan) samtidigt som dess confluence-poäng fortfarande
      beräknades som om dess eget villkor var uppfyllt. Verifierade att
      `allocate_bots_for_market_state` för närvarande är död kod (ingen
      anropare utanför dess egen testfil) innan fixen — alltså inte
      ännu en live-pengar-bugg som fyllningspris- och Hermes-fynden, men
      NO-MOCK-DATA-regeln gör inget undantag för oanvänd kod. Fixat:
      alla fem anrop skickar nu de riktiga flaggorna. Nytt test
      `test_bot_confluence_scores_use_real_golden_pocket_and_pivot_state`
      bevisar att varje berörd bots poäng blir strikt lägre borta från
      golden-pocket/pivot-läge än vid det läget. Verifiering: 921 gröna,
      9 skippade, 0 failade (upp från 920); ruff/guard rena; kompendiet
      om-pinnat (05: 1142→1143). Kvarstående scope oförändrat — detta
      stänger 2 av 16 fynd; resten kvar (fabio_valentina_playbooks.py,
      hermes/reconciliation.py, ate_matrix/, samt ett 10-punkters
      indicators/patterns-block).

      Nionde fyndet samma dag: `packages/fusion/fabio_valentina_
      playbooks.py` hade exakt samma binär-konfidens-kollaps som redan
      fixats i systermodulen `amt_setups.py`. Model B (Range Sweep &
      Snapback, både bullish och bearish gren) gav
      `confidence=90.0 if delta_exhaustion or auction_type=="RESPONSIVE"
      else 75.0`; Model A (LVN Retest) gav
      `confidence=85.0 if buying_imbalance_ratio>=3.0 else 70.0` — ett
      upplägg som precis klarade sin trigger fick samma poäng som ett
      som klarade den med marginal. Fixat på samma sätt som
      `amt_setups.py`: lokala `_confidence_from_evidence`/`_saturate`-
      hjälpare (duplicerade, inte importerade — matchar
      `amt_setups.py`s stil att varje modul äger sina egna
      poängsättningshjälpare) blandar riktigt uppmätta storheter —
      sweep-djup och reclaim-djup relativt Value Area-bredd,
      exhaustion-sida-bekräftelse, orderflödes-obalansstyrka för Model
      B; LVN-närhet, auktionstyp-styrka och obalansstyrka för Model A.
      Befintligt tests hårdkodade `confidence==85.0` uppdaterat till det
      riktiga beräknade 80.94 för det fixturet; två nya tester bevisar
      att ett avgörande bevisläge ger strikt högre poäng än ett som
      precis klarar tröskeln, för båda modellerna. Verifiering: 923
      gröna, 9 skippade, 0 failade (upp från 921); ruff/guard rena;
      kompendiet om-pinnat (01: 228→230, 05: 1143→1145). Kvarstående
      scope oförändrat — detta stänger 3 av 16 fynd; resten kvar
      (hermes/reconciliation.py, ate_matrix/, samt ett 10-punkters
      indicators/patterns-block).

      Tionde fyndet samma dag: `packages/hermes/reconciliation.py`s
      `track_outcome` parsade varje `CLOSE_POSITION`-post i
      emergency-action-loggen och gjorde sedan ingenting med den —
      loop-kroppen var bokstavligen `pass`, med kommentaren "PnL would
      be in a real system — here we note it's tracked". `realized_pnl`
      förblev alltid 0.0; `outcome_pnl` skrevs ändå till Qdrant-minnet
      och loggades som "Outcome tracked: PnL $X" som om det speglade
      verkligheten. Grundorsaken spårades ett steg djupare:
      `packages/hermes/execution_bridge.py`s `execute_emergency_action`
      skrev sin logg-post INNAN åtgärden dispatchades, så även ett
      fixat `reconciliation.py` hade inget riktigt att läsa — den
      sparade raden bar aldrig closens verkliga pnl/close_price, bara
      förfrågan. Fixat båda tillsammans: `execute_emergency_action`
      loggar nu en gång, efter exekvering, berikad med det riktiga
      utfallet; `track_outcome` summerar nu riktig pnl från
      `CLOSE_POSITION`/`SCALE_OUT_POSITION`/`EMERGENCY_FREEZE_ALL`-
      poster vid eller efter beslutets tidsstämpel (misslyckade
      åtgärder och poster utanför fönstret exkluderas korrekt). Ny
      `tests/test_hermes_reconciliation_no_mock_pnl.py` (första
      testfilen för `reconciliation.py`, 2 tester). Verifiering: 925
      gröna, 9 skippade, 0 failade (upp från 923); ruff/guard rena;
      kompendiet om-pinnat (05: 1145→1149). Kvarstående scope
      oförändrat — detta stänger 4 av 16 fynd; resten kvar (ate_matrix/,
      samt ett 10-punkters indicators/patterns-block).

      Elfte fyndet samma dag: `packages/ate_matrix/`, två filer. (1)
      `providers/position_matrix.py`s `fetch_position_matrix` föll
      tillbaka på `total_equity_usd=800.0`/`total_accounts=12` (via
      `sum(...) or 800.0` och `len(accounts) or 12`) närhelst
      dashboard-filen saknades, inte gick att läsa, eller hade en tom
      accounts-lista, och antog dessutom att ett saknat `"equity"`-fält
      per konto betydde exakt $100.0. Alla tre reservvärden är
      byte-för-byte identiska med `MatrixState`s/per-konto-defaultens
      egna värden — bekräftat live på den här maskinen: det befintliga
      testet `test_position_matrix_provider` (utan mockning) började
      faila en `isinstance(..., float)`-kontroll så fort det påhittade
      `or 800.0`-reservvärdet togs bort, eftersom maskinens riktiga
      dashboard-uppslagning just nu ger en tom accounts-lista. (2)
      `sinks/detailed_logger.py`s `export_matrix_parquet_snapshot` skrev
      `long_proximity_pct=50.0`/`short_proximity_pct=25.0`/
      `confluence_score=50.0` för varje bot utan `BotMatrixState` den
      ticken — återigen byte-för-byte `BotMatrixState`s egna defaultar —
      och blandade tyst in påhittade rader i ett ML-tränings-Parquet-
      korpus utan sätt att filtrera bort dem i efterhand. Fixat: noll
      konton betyder nu genuint `total_equity_usd=0.0`/
      `total_accounts=0`; ett konto utan numerisk equity hoppas över i
      summan (räknas inte som $100) men räknas ändå mot
      `total_accounts`; en saknad bots parquet-kolumner är nu `None`
      (riktig NaN) istället för den påhittade baslinjen. Tre nya tester
      i `tests/test_ate_matrix.py` bevisar den ärliga noll-vägen,
      hoppa-över-inte-fabricera-beteendet per konto, och att en
      närvarande bots riktiga telemetri passerar igenom medan en
      frånvarande bots kolumner blir null. Verifiering: 928 gröna, 9
      skippade, 0 failade (upp från 925); ruff/guard rena; kompendiet
      om-pinnat (05: 1149→1152). Kvarstående scope oförändrat — detta
      stänger 6 av 16 fynd; resten kvar: ett 10-punkters
      indicators/patterns-block.
      Tolfte fyndet samma dag: `packages/indicators/oscillators.py`s
      `compute_rsi`/`compute_stoch`/`compute_mfi` `.fillna(50.0)`:ade sin
      output, och `compute_kryst` `.fillna(0.0)`:ade sin momentum-delta och
      `.fillna(50.0)`:ade sitt RSI-SMA-ben — dolde både den genuina
      uppvärmningsperioden och en genuint odefinierad nämnare (platt
      marknad) bakom en "neutral" siffra som ser ut som en riktig
      beräkning för varje nedströms konsument. Alla fyra returnerar nu
      ärlig NaN. `services/api/routes/feed.py`s `/chart/candles` renderar
      redan varje sådan kolumn via `pd.notna(...) else None`, och
      `packages/fusion/live_signal.py`/feed.py:s klassiska score faller
      redan tillbaka till neutral endast när hela indikatorn saknas — båda
      var redan skrivna för detta och behövde inga ändringar.
      Fixen avslöjade en riktig, tidigare odetekterad bugg den hade dolt:
      `packages/vision/renderer.py::render_chart_with_schwifty_panel`
      beräknade Schwifty 2 (dess långsammaste ben behöver ~105 barer
      historik) på funktionens egen redan avkortade 100-bar
      visningsfönster — så varje chart funktionen någonsin renderat hade
      en helt odefinierad Schwifty-panel, tyst målad som en platt fejkad
      "50"-linje av just den fillna som detta fynd tar bort. Fixad genom
      att beräkna Schwifty över hela bar-historiken och skära ner till
      visningsfönstret efteråt; om anroparens fulla historik ändå inte
      räcker kastas nu ett `ValueError` istället för att rendera en panel
      utan riktig data. `tests/test_krystulator.py`s fyra
      intervall-assertions uppdaterade att `dropna()`:a innan
      0–100-kontrollen och assertar att uppvärmningsbaren ärligt är NaN.
      `tests/test_schwifty_renderer.py`s fixture bytt från en
      monotont stigande close-serie (gjorde RSI:s avg_loss permanent 0,
      dvs. genuint odefinierad RSI, inte en uppvärmningsartefakt) till en
      oscillerande, utökad till 150 barer, plus ett nytt test som
      bevisar `ValueError` vid otillräcklig historik.
      `packages/fusion/schwifty_ensemble.py` hittades ha samma
      NaN-kaskad-risk plus egna hårdkodade 50.0-fallbacks vid
      otillräcklig data — bekräftat död kod (inga anropare utanför sin
      egen modul och sitt eget testfilnamn) — lämnad som nästa punkt att
      fixa istället för att blandas in i denna commit, enligt
      en-fix-per-commit-disciplinen.
      Verifiering: 929 gröna, 9 skippade, 0 failade (upp från 928);
      ruff/guard rena; `test_agent_context.py` 8/8; kompendiet
      om-pinnat (05: 1152→1154).
      Trettonde fyndet samma dag: `packages/fusion/schwifty_ensemble.py`s
      `evaluate_12_schwifty_ensemble` och `compute_dual_shifted_schwifty`
      returnerade båda hårdkodade 50.0/"NEUTRAL"-platshållare vid
      `len(df) < 30` (med ett schema som inte ens matchade sin egen
      huvudvägs returnycklar — bevis på att denna väg aldrig testats
      eller anropats). Efter att `oscillators.py` slutade
      `fillna(50.0)`:a sin egen output (tolfte fyndet ovan) fick
      ensemble-loopen även en levande NaN-kaskadrisk: varje variant vars
      långsammaste stokastiska ben (upp till 240 barer för
      s11_climax_hunter) behövde mer historik än df hade skulle tyst
      förgifta `consensus_score` till NaN via `sum()`. Båda funktionerna
      returnerar nu ett ärligt resultat med alla värdefält `None` och
      `"INSUFFICIENT_DATA"` vid otillräcklig data, och ensemble-loopen
      hoppar nu över (istället för att snitta in) varje variant som gav
      NaN. Bekräftat död kod (inga anropare utanför sin egen modul och
      sitt eget testfilnamn) — fixad ändå enligt samma standard som alla
      andra fynd i denna uppgift. Städade även bort en oanvänd
      `import numpy as np` i modulen och en oanvänd `is_choppy_regime`-
      import i testfilen, upptäckta av ruff under verifieringen.
      Verifiering: 931 gröna, 9 skippade, 0 failade (upp från 929);
      ruff/guard rena; `test_agent_context.py` 8/8; kompendiet
      om-pinnat (05: 1154→1157).
      Fjortonde fyndet samma dag: `packages/indicators/divergence_staircase.py`
      hade två separata no-mock-data-problem i sin egen lokala duplicerade
      oscillator-implementation. `_compute_rsi` och `_compute_kryst_oscillator`
      `.fillna(50.0)`:ade sin output under uppvärmningsperioden — samma
      fabrikation som `oscillators.py`s `compute_rsi`/`compute_kryst` hade
      (tolfte fyndet) — nu ärlig NaN. Separat var `base_conf` en fast
      0.62/0.80/0.94 uppslagen enbart via vilken av 3 diskreta divergens-tiers
      en kedja nådde, identisk för en kedja vars länkar precis klarade
      0.5-poängsgränsen och en som divergerade med 20+ poäng — en 3-vägs
      generalisering av det binära confidence-collapse-mönstret som redan
      fixats i `amt_setups.py` och `fabio_valentina_playbooks.py`. Lade till
      `_TIER_CONFIDENCE_BANDS`/`_tier_confidence`/`_saturate`; båda
      divergens-looparna spårar nu varje bekräftad länks faktiska
      divergensmagnitud och `_tier_confidence` skalar linjärt inom tierens
      band utifrån genomsnittet, med fallback till tierens golv (aldrig en
      påhittad mittpunkt) när ingen länkstyrka finns spårad. Bekräftat att
      enda anroparen är `services/api/routes/feed.py`s `/chart/candles`, som
      passerar signalerna oförändrade.
      Verifiering: 933 gröna, 9 skippade, 0 failade (upp från 931);
      ruff/guard rena; `test_agent_context.py` 8/8; kompendiet
      om-pinnat (02: 247→249, 05: 1157→1159).
      Femtonde fyndet samma dag: `packages/indicators/levels.py::
      compute_joachim_levels` föll tillbaka till en syntetisk
      `last_px * 0.97`/`last_px * 1.03` (ett fast ±3%-offset utan koppling
      till någon riktig swing-extrempunkt) närhelst klustringen inte hittade
      någon genuin stöd-/motståndsnivå — och returnerade något som ser ut
      som en riktig data-härledd nyckelnivå, omöjlig att skilja från en
      backad av faktiska beröringar. Funktionens egen returtyp dokumenterar
      redan `None` som det ärliga "inget hittat"-fallet för
      `df.empty`/för-kort-historik-grenen; den tomma klustringsgrenen
      använder nu samma ärliga `None` istället för att hitta på en nivå.
      Bekräftat att `compute_joachim_levels` själv är oanropad i produktion
      (endast re-exporterad och testad) — `services/api/routes/feed.py`s
      `/chart/candles` har sin egen inline-version med en bättre
      tre-stegsfallback (riktig nivå → `horizontal_levels.py`s viktade nivå
      → först då det syntetiska ±3%), så den levande endpointen påverkades
      aldrig. Nytt test:
      `test_joachim_levels_honest_none_when_no_cluster_found`.
      Verifiering: 934 gröna, 9 skippade, 0 failade (upp från 933);
      ruff/guard rena; `test_agent_context.py` 8/8; kompendiet
      om-pinnat (05: 1159→1160).
      Sextonde fyndet samma dag: `packages/patterns/golden_pocket_sniper.py::
      detect_golden_pocket_confluence`s 5-pelar-modell gav en fast
      poängsumma i samma ögonblick som en pelares binära tröskel klarades,
      oavsett hur långt över tröskeln beviset faktiskt låg — en 29%-veke
      poängsattes likadant som en 90%-veke, KRYST på 24.9 likadant som
      KRYST på 2.0, en stapel som knappt nuddade Golden Pocket-kanten
      likadant som en som dök djupt in i den. Lade till modulnivåhjälparna
      `_saturate`/`_scaled_pillar_score` (samma golv..tak-mönster som
      `amt_setups.py`, `fabio_valentina_playbooks.py` och
      `divergence_staircase.py`) och kopplade om alla fem pelare: Pelare
      1:s zontest skalar nu efter hur stor andel av den buffrade Golden
      Pocket-zonen stapelns eget intervall faktiskt överlappar; Pelare 2:s
      tape-delta/absorptions- och no-tape-volymdelta-proxygrenar skalar
      efter hur långt deltakvoten (eller absorptions-/volymdeltats
      magnitud) överstiger sin utlösande tröskel; Pelare 3 skalar efter
      rejection-veke-procent över 28%; Pelare 4 skalar efter hur långt över
      KRYST/RSI-extremtröskeln oscillatorn läser; Pelare 5 skalar efter hur
      långt entropin ligger under 0.35 (eller ATR under lågvolatilitets-
      bandet). Den fasta +10-bonusen för front-run-bufferten lämnades
      medvetet orörd — den är ett deterministiskt exekveringsmekaniskt
      faktum (maker-prioritet när zonen väl är tangerad), inte bevis för
      konfluens. Nytt test i `tests/test_golden_pocket_sniper.py`,
      `test_pillar_scores_scale_with_evidence_strength_not_binary_collapse`,
      konstruerar knappt-kvalificerande och avgörande-kvalificerande bevis
      för samma stapel och visar att det avgörande fallet poängsätts
      strikt högre istället för att kollapsa till identiska poäng; det
      befintliga `test_golden_pocket_confluence_basic` (ett
      stark-bevis-fixtur som antar `confluence_score >= 70.0`/
      `actionable is True`) omverifierades empiriskt mot den nya
      kontinuerliga poängsättningen och passerar fortfarande utan att
      några konstanter behövde ändras (poängen landar på ~85 mot
      70-tröskeln).
      Verifiering: 935 gröna, 9 skippade, 0 failade (upp från 934);
      ruff/guard rena; `test_agent_context.py` 8/8; kompendiet
      om-pinnat (01: 230→232, 05: 1160→1162).
      Sjuttonde fyndet samma dag: `packages/indicators/entropy.py::
      compute_shannon_entropy` returnerade hårdkodat 1.0 — den maximalt
      möjliga avläsningen, omöjlig att skilja från en riktig "bekräftad
      slumpvandring" — närhelst det inte fanns tillräckligt med data
      (färre än 5 riktiga observationer) eller histogram-/binkonfiguration
      var degenererad för att beräkna ett riktigt entropivärde.
      `analyze_price_entropy` gjorde samma sak på EntropySignal-nivå: en
      tom eller för kort DataFrame returnerade `entropy=1.0`/
      `regime_order="HIGH_ENTROPY"`, en självsäker maximalt-brusig
      avläsning hittad på från ingenting. `compute_shannon_entropy`
      returnerar nu NaN (samma NaN-under-uppvärmning-konvention som redan
      används i `packages/indicators`); `analyze_price_entropy` returnerar
      nu `entropy=None`/`compression_ratio=None`/
      `regime_order="INSUFFICIENT_DATA"` både för en tom/för kort
      DataFrame och för ett NaN-entropiresultat, och EntropySignals fält
      `entropy`/`compression_ratio` blev Optional för att bära det.
      Bekräftat att den enda riktiga produktionsanroparen,
      `packages/patterns/proximity.py`s `calculate_proximity`, bara
      grenar på `regime_order == "HIGH_ORDER"` för sin
      konfluensbonus (läser aldrig `.entropy`/`.compression_ratio`
      direkt), så `INSUFFICIENT_DATA` degraderar säkert till "ingen
      bonus" istället för att krascha eller tyst återanvända en
      påhittad bonus — `proximity.py`s egna två kända problem
      (`calculate_rsi`s 50.0-uppvärmningsfallback,
      `calculate_proximity`s golv-på-10.0-utspädning) kvarstår öppna,
      spårade som nästa punkt i restomfånget nedan. Nya test:
      `test_compute_shannon_entropy_honest_nan_when_insufficient_data`,
      `test_analyze_price_entropy_too_few_bars_for_window`; befintligt
      `test_analyze_price_entropy_empty` uppdaterat för det nya kontraktet.
      Verifiering: 937 gröna, 9 skippade, 0 failade (upp från 935);
      ruff/guard rena; `test_agent_context.py` 8/8; kompendiet
      om-pinnat (05: 1162→1164).
      Artonde fyndet samma dag: `packages/indicators/volume_profile.py::
      compute_volume_profile` hittade på ett resultat i tre otillräcklig-
      data-fall istället för att erkänna att ingen riktig profil kunde
      beräknas: för få staplar returnerade ett all-noll
      `VolumeProfileResult` med `value_state` som standard satt till
      `"INSIDE_VALUE"` — ett specifikt, falskt påstående om var priset
      befinner sig; ett platt prisintervall (`max_px <= min_px`) och noll
      totalvolym i bins returnerade båda ett syntetiskt ±1%-vah/val-band
      runt aktuellt pris utan koppling till någon riktig handlad volym
      (samma antimönster som redan åtgärdats i `levels.py`s
      `compute_joachim_levels` och `entropy.py`s `analyze_price_entropy`).
      Denna hade riktig risk för live-handel: `scripts/live-multi-account-
      daemon.py`s Account 9 ("Volume Profile Value Rotation") kan öppna en
      riktig LONG-position vid en VAL-studs, och den — plus dess två
      fusionslager-konsumenter, `packages/fusion/fabio_valentina_
      playbooks.py`s Model B och `packages/fusion/amt_setups.py`s Setup C
      ("The Hook") — vaktade alla på `vah_price > 0 and val_price > 0`
      innan fälten litades på. Den vakten fångade aldrig den påhittade
      fallbacken (ett `price*0.99/1.01`-band är alltid > 0 för ett
      positivt pris), så en degenererad profil kunde tyst mata ett
      påhittat prisband in i riktig setup-/entrylogik. Åtgärdat genom att
      göra `poc_price`/`vah_price`/`val_price`/`in_value_area`/
      `total_profile_volume` Optional (None), `value_state` fick en ny
      `"INSUFFICIENT_DATA"`-litteral, och alla tre otillräcklig-data-
      grenar returnerar nu den ärliga all-None-sentinelen. Uppdaterade
      alla fyra riktiga konsumenter till att vakta på `is not None`
      istället för sanningsvärde/`> 0`: `live-multi-account-daemon.py`s
      Account 9, `fabio_valentina_playbooks.py`s Model B, `amt_setups.py`s
      Setup C, och `proximity_and_confluence.py`s Bot 9 (som använde
      `getattr(volume_profile, "poc_price", 0.0) > 0` — `getattr`s
      standardvärde gäller bara när ett attribut saknas, inte när det
      finns och är None, så även denna hade kastat `TypeError` på
      `None > 0` utan fixen). Två nya test i
      `tests/test_edge_and_risk_engine.py` som bevisar det ärliga
      None-kontraktet, plus tre kraschregressionstest som bevisar att
      varje vaktad konsument degraderar säkert istället för att kasta
      `TypeError`.
      Verifiering: 942 gröna, 9 skippade, 0 failade (upp från 939);
      ruff/guard rena; `test_agent_context.py` 8/8; kompendiet
      om-pinnat (05: 1164→1169).
      Nittonde fyndet samma dag: `packages/patterns/proximity.py` hade två
      separata no-mock-data-problem. (1) `calculate_rsi` hårdkodade ett
      neutralt 50.0 både under genuin uppvärmning (färre än period+1
      staplar) och i det sant 0/0-odefinierade fallet (noll genomsnittlig
      vinst OCH noll genomsnittlig förlust — ett helt platt fönster);
      grenen `last_loss == 0 and last_gain > 0` lämnades orörd, eftersom
      RSI=100 där är det korrekta, fullständigt definierade resultatet av
      standardformeln (inga förluster alls i tillbakablicksfönstret), inte
      en påhittad platshållare — bara det genuint odefinierade fallet var
      fabricerat. Båda fabricerade fallen returnerar nu NaN, omvandlat till
      ett ärligt None på det publika fältet `SignalProximityInfo.rsi_14`
      istället för att läcka en rå NaN genom `model_dump(mode="json")`s
      JSON-utdata. (2) `calculate_proximity`s eget golv `max(10.0, ...)`
      på `proximity_pct` rapporterade tyst en fabricerad minimum-10%
      "progress" även när den riktiga `base_ratio`-beräkningen antydde att
      en setup var långt ifrån sin breakout-nivå — nu `max(0.0, ...)`,
      fältets eget redan deklarerade schemagolv. Fem nya test i
      `tests/test_signal_proximity.py`:
      `test_calculate_rsi_honest_nan_during_warmup`,
      `test_calculate_rsi_honest_nan_when_genuinely_flat`,
      `test_calculate_rsi_real_100_when_all_gains_no_losses` (bevisar att
      den riktiga 100-grenen förblir orörd),
      `test_proximity_rsi_14_none_during_rsi_warmup`, och
      `test_proximity_pct_reflects_real_distance_not_diluted_to_a_10pct_floor`
      (bygger en 41-staplars fixtur där priset kollapsar till ~0.5% av
      breakout-nivån och bevisar att `proximity_pct` nu läses under det
      gamla fabricerade golvet).
      Verifiering: 947 gröna, 9 skippade, 0 failade (upp från 944);
      ruff/guard rena; `test_agent_context.py` 8/8; kompendiet
      om-pinnat (05: 1169→1174).
      Tjugonde fyndet samma dag: `packages/indicators/funding_squeeze.py`s
      `detect_funding_squeeze` hade en 3-grens variant av samma binära
      förtroendekollaps-mönster som dess egna EXTREME_*-grenar redan
      åtgärdats mot. `MODERATE_NEGATIVE`/`MODERATE_POSITIVE`/
      `NEUTRAL_EXPANSION` gav var och en en fast konfidens (0.70/0.65/0.55)
      så snart `funding_rate_8h_pct` föll någonstans i deras band —
      identisk konfidens för en ränta som knappt kvalificerade och en som
      låg precis vid kanten till nästa regim, medan
      `EXTREME_SHORT_HEAVY`/`EXTREME_LONG_HEAVY` redan skalade kontinuerligt
      med `abs(funding_rate_8h_pct)`. Lade till modulnivåhjälparna
      `_saturate`/`_scaled_band_confidence` (samma mönster som
      `amt_setups.py`, `fabio_valentina_playbooks.py`,
      `divergence_staircase.py`, `golden_pocket_sniper.py`) och kopplade om
      de tre platta grenarna till att skala efter hur långt räntan ligger
      från den minst riktningsbestämda punkten i sitt eget band: för
      `MODERATE_NEGATIVE`/`MODERATE_POSITIVE`, kanten delad med `NEUTRAL`
      (svagast bevis) mot kanten delad med angränsande `EXTREME_*`-regim
      (starkast); för `NEUTRAL`, vars band `[-0.0050, 0.0150)` inte är
      centrerat på 0.0, från bandets sanna centrum (0.0050, lika långt från
      båda kanterna, 0.0100) utåt mot endera kanten. Tre nya test i
      `tests/test_funding_squeeze.py`:
      `test_moderate_negative_confidence_scales_with_rate_not_flat`,
      `test_moderate_positive_confidence_scales_with_rate_not_flat`,
      `test_neutral_confidence_scales_with_distance_from_center_not_flat`
      (bevisar också att båda `NEUTRAL`-kanterna, som är lika långt från
      centrum, poängsätts inom 0.02 av varandra).
      Verifiering: 950 gröna, 9 skippade, 0 failade (upp från 947);
      ruff/guard rena; `test_agent_context.py` 8/8; kompendiet
      om-pinnat (02: 249→251, 05: 1174→1177).

      Tjugoförsta fyndet, samma dag, avslutar den ursprungliga listan på
      10 indicators/patterns-filer: `packages/patterns/horizontal_knock_and_fakeout.py`s
      `create_execution_intent` hade en fast `expected_slippage_bps=1.5` i
      `MARKET_TAKER`-grenen, oavsett orderstorlek eller volatilitet — en
      order på $100 i en lugn marknad och en på $250 000 i en våldsam fick
      exakt samma "1.5 bps". Ingen produktionsanropare fanns ännu (bara
      `packages/patterns/__init__.py`s re-export och filens egna test), så
      ingen krascher-risk att fixa på andra ställen. Ersatt med en riktig
      uppskattning från en ny valfri `atr`-parameter (samma ATR-beräkning
      som redan används i `detect_horizontal_knock_pressure`/
      `detect_swing_failure_patterns` i samma fil) via två nya
      modulhjälpare, `_saturate` och `_estimate_taker_slippage_bps`; utan
      `atr` är fältet nu ärligt `None` istället för en påhittad siffra.
      `ExecutionIntent.expected_slippage_bps` gick från `float = 0.0` till
      `float | None = None`. Lämnat orört som legitima, icke-påhittade
      konstanter: `expected_fee_pct` (båda grenarna — riktiga börsavgifter
      är genuint fasta per nivå, inte bevis som borde variera) och
      `LIMIT_MAKER`-grenens `expected_slippage_bps=0.0` (en post-only-order
      fylls exakt till sitt limitpris eller inte alls — noll slippage är
      det matematiskt korrekta deterministiska resultatet, inte en
      gissning). Tre nya test i `tests/test_knock_and_fakeout.py`:
      `test_taker_slippage_is_honest_none_without_atr`,
      `test_taker_slippage_scales_with_volatility_not_a_flat_constant`,
      `test_taker_slippage_scales_with_order_size_not_a_flat_constant`.
      Verifiering: 953 gröna, 9 skippade, 0 failade (upp från 950);
      ruff/guard rena; `test_agent_context.py` 8/8; kompendiet
      om-pinnat (01: 232→234, 05: 1177→1180).
      Kvarstående: inget kvar från den ursprungliga listan på 10
      indicators/patterns-filer. Innan `ENG-14` kan markeras klar behövs
      fortfarande en sista genomgång som bekräftar att inga hörn av
      `packages/` eller `services/` missades utanför den ursprungliga
      triage-sveepens tilldelade områden.
- [ ] `ENG-15` **Two more horizontal-level implementations, outside `ENG-13`'s scope.**
      `packages/validation/level_probe.py` and `scripts/research/level_probe.py` each
      define their own `detect_horizontal_levels`/`find_swing_extrema` — a third and
      fourth implementation of the same clustering problem. Lower priority than
      `ENG-13`: neither is re-exported from `__init__.py`, so no import collision.
- [x] `DOC-8` Uncommitted deletions (4 Temporal workflows, `paper_exchange.py`,
      `scan-patterns.py` — verified safe, nothing references them) and 5-vs-8 account
      naming drift.

---

## Trader playbook research — started 2026-08-20

Operator is analyzing top traders' stated methodologies to see what's algorithmic vs.
pure judgment. Algorithmic parts become real, measured detectors (never a hardcoded
"quality score" — see `CLAUDE.md`'s NO MOCK DATA rule); judgment-only parts go to
`TRADE_AGENT_GUIDE.md` for whichever agent is on the trading floor at decision time.

- [x] `PLAY-1` **Capitulation/mean-reversion detector (Lance Brightstein).**
      `packages/patterns/capitulation_reversal.py`: historically-boring asset (self-
      relative ATR% expansion, not a cross-asset baseline ATE doesn't have), multi-sigma
      drop, 5+ consecutive down bars, 3x+ relative volume, wait for close above the prior
      bar's high to confirm the turn. Raw features exposed, no invented composite score.
      Wired into `signal-quality-study.py` as `capitulation_reversal`. MEASURED: zero
      triggers across 8 symbols (4h + 1d) — each individual criterion fires sometimes on
      BTC-USD 1d alone (n_down≥5 on 20/993 bars, rvol≥3 on only 5/993) but never all four
      at once. Not an obvious bug (see evidence in `work-queue.yaml`), but means these
      thresholds may be too strict for this symbol set — needs a wider universe or a
      deliberate loosening before it can be measured for real. `TRADE_AGENT_GUIDE.md`
      created with the terminal-fundamental-impairment judgment call as entry #1.

- [x] `PLAY-2` **"Little Rizzy" fractal measured-move detector (Marci Silfrain).**
      `packages/patterns/little_rizzy.py`: 3-point swing fractal (origin A → extreme B →
      retracement C) implies an A-C trendline; the vertical gap between that line and B
      is a "measured move" distance, projected further as the next target; 20-SMA/2-std
      Bollinger Bands decide whether hitting that target would be "out of reality" (fade
      it) or not (ride it). Pure geometry — the source states no weighting scheme at all,
      so unlike PLAY-1 there was no invented score to reject in the first place. Raw
      geometry exposed on `LittleRizzyGeometry`, no composite score. Wired into
      `signal-quality-study.py` as `little_rizzy` (proxy score = clamped
      `risk_reward_ratio`, a genuine function of the detector's own entry/stop/target).
      Found and fixed a real bug while testing: invalidation originally compared price to
      the A-C trendline extrapolated forward (the source's literal wording) — proved by
      construction that this makes the `ARMED` ("waiting") state mathematically
      unreachable, since the extrapolated line sits below Point C within the same bars C
      needs to pivot-confirm. Fixed by comparing against Point A's price instead (a full
      round-trip invalidates, same spirit, but leaves `ARMED` a real window). 10 unit
      tests cover all 4 terminal states plus a regression guard that two fractals with
      different B depths must produce different measured-move numbers. No
      `TRADE_AGENT_GUIDE.md` entry — confirmed during implementation that nothing in this
      methodology needed a subjective judgment call, unlike PLAY-1's fundamental-
      impairment question.
      **Measured 2026-08-21 (see `SIG-1`): flat-null on 1h crypto, negative and
      statistically significant on 1d equities** (t −1.76 to −4.61 across all four
      horizons, hit rate ~51% vs. each symbol's own ~55–62% baseline). Implementation is
      correct per the stated methodology — this is a finding about the methodology's
      real-world predictive content, not a bug. Not tradeable pending a decision on
      whether/how to use it; see `docs/agent/work-queue.yaml::PLAY-2`'s `caveat` field.

---

## SIDEBET — separate track, not ATE

A discretionary prediction-market sleeve with live capital. **Nothing here is evidence
about ATE.** Shares infrastructure discipline; shares no ledger, capital or claims.
See [sidebet/README.md](sidebet/README.md). The boundary is enforced by
`tests/test_track_separation.py`, not by convention.

- [x] `SIDE-1` · **Track separation skeleton** — `sidebet/` with its own ledger and
      schemas; tests fail if ATE imports it, if it imports ATE, if it ships in the ATE
      wheel, or if a sidebet result appears in `docs/agent/history.jsonl`
- [x] `SIDE-2` · **Calibration scoring** — Brier for operator *and* for the entry market
      price. `skill_vs_market` is the headline; beating 0.25 proves nothing because the
      market already does. No verdict below 30 resolutions
- [ ] `SIDE-3` · **Sign the charter** — hard gate before any capital moves. Kill rule needs
      a named enforcer who is not the operator. See [sidebet/CHARTER.md](sidebet/CHARTER.md)
- [x] `SIDE-4` · **Resolution poller + standalone sleeve service + dashboard** —
      `uvicorn sidebet.api:app --port 8081`. Built as its own service, not a router inside
      `services/api`: a shared process is a shared blast radius and eventually a shared
      claim. Poller never invents an outcome (unknown stays `unresolved`, ambiguous
      settlement is `invalid` and refunds rather than counting as a wrong forecast).
      Dashboard at `/` renders the honest empty state with the gate closed; demo toggle is
      loudly labelled `DEMO DATA · NOT REAL`
- [x] `SIDE-5` · **Two-track TRADE panels** — separate panels, persistent status badges, no
      shared P&L line, calibration as the sleeve's headline. Implemented in
      `twisted-stacks-site` against
      [docs/TRADE-UI-TRACK-CONTRACT.md](docs/TRADE-UI-TRACK-CONTRACT.md)

---

## Cursor Build Team — Standing Tasks

- [ ] Architect: ADR for monorepo and schema versioning
- [ ] Data Engineer: point-in-time ingestion checklist
- [ ] Pattern Classic: cup-handle gold set ≥ N samples
- [ ] Vision ML: training config reproducibility
- [ ] Fusion Research: Optuna + autoresearch program.md
- [ ] Agent Runtime: skill schema v1
- [ ] Memory Supabase: hybrid RRF eval notebook
- [ ] Temporal: saga for failed order cancel
- [ ] Execution Risk: kill-switch integration test
- [ ] ATE UI: Flow node design system tokens
- [ ] QA Chaos: contract fuzzer + Temporal kill test in CI

---

## Future Functions Tracker

Track items from [docs/FUTURE_FEATURES.md](docs/FUTURE_FEATURES.md); promote into a Phase when selected.

- [ ] Regime router
- [ ] Multi-TF confluence
- [ ] Failed-breakout library
- [ ] Cost-aware Optuna
- [ ] Shadow mode
- [x] ONNX worker inference — `run_vision_onnx_activity` + cache (`79b55ba`)
- [ ] Options overlay
- [ ] Funding/basis sleeve
- [ ] Skill autogen from wins
- [ ] Swarm vote UI polish

---

---

## Research — locked decisions (2026-07-14)

Sorted from Kimi / investor colab session. Detail in `wiki/by-topic/`.

| Topic | Lock | Wiki |
|-------|------|------|
| **UI identity** | Amber B/W brutalist; color = signal not decor | [ui-design.md](wiki/by-topic/ui-design.md) |
| **TRADE vs Telemetry** | TRADE = investor chart; Telemetry = ops log lane | [telemetry.md](wiki/by-topic/telemetry.md) |
| **RegimeGate v1** | Price-only; C&H iff trending | [regime-gate.md](wiki/by-topic/regime-gate.md) |
| **Vision dataset** | Weak supervision, mplfinance `ate_v1`, 100 bars | [vision-dataset.md](wiki/by-topic/vision-dataset.md) |
| **Temporal pipeline** | ingest → scan → validate → risk → execute | [temporal-workflows.md](wiki/by-topic/temporal-workflows.md) |
| **Macro Scout** | PMXT + whale layer; investor eye-candy Phase 3 | [macro-scout.md](wiki/by-topic/macro-scout.md) |
| **Fusion lanes** | Classical / Vision / Sequence / Macro (4 colors) | [strategy.md](wiki/by-topic/strategy.md) |
| **Consensus** | Quorum + Risk veto (Phase 7) | [consensus.md](wiki/by-topic/consensus.md) |
| **Native dev** | No Docker default; `temporal server start-dev` | [infra/NATIVE_DEV.md](infra/NATIVE_DEV.md) |
| **Risk Officer** | Hybrid veto + sizing; HITL above threshold | [wiki/by-topic/risk.md](wiki/by-topic/risk.md) |
| **Real Edge** | Validate alt-data hypotheses before adapter swap | [docs/research/README.md](docs/research/README.md) · [ATE_Real_Edge_Research.md](docs/ATE_Real_Edge_Research.md) |

---

## Immediate Next Actions (this week)

**Last updated:** 2026-08-03

1. [x] **Phase 2** — YOLOv8 fine-tune on `~/ate-data/vision/ate_v1/` — **50 epochs done**, val top1 100% on `best.pt`
2. [x] **Phase 2** — Top up vision dataset toward ~300 pos / ~200 neg — **376/165 done**
3. [x] **Phase 4** — Pydantic AI Pattern Scout + Vision Validator agents (typed outputs) — `packages/agents/` (`d4ba51e`)
4. [x] **Phase 5** — Risk Officer + HITL in Temporal — proxy + e2e (`hitl-e2e.py`) + chaos (`hitl-chaos.py`)
5. [x] **Phase 6** — HITL approve/reject modal stub in TRADE (amber blink) — `bc3329a`
6. [ ] **Alt-data** — Keep null on-chain/sentiment stubs (Real Edge 1.1–1.4 no free go); paid revisit [PAID_ALTERNATIVES.md](docs/PAID_ALTERNATIVES.md)
7. [x] **Real Edge research** — 1.1/1.3/1.4 **NO-GO**; 1.2 **deferred** (paid netflow) — [docs/research/README.md](docs/research/README.md)
8. [x] **PMXT discovery context-only** — tier scan, Macro Scout display + nightly cache; no fusion wiring
9. [x] **WorldMonitor + Macro Scout pack** — geo intel provider, FRED sentiment, whale stubs, ATE MCP stub, skills ([OSS_WATCHLIST.md](docs/OSS_WATCHLIST.md))
10. [x] **Merge** `feat/ate-local-bridge` → `main` (`320e027`) — bridge, WorldMonitor, swarm stub on main
11. [x] **Delete** merged branch `feat/ate-local-bridge` (local + origin)
12. [x] **Local HITL open** when `ATE_BRIDGE_TOKEN` unset — native smoke without bearer ([docs/LOCAL_BRIDGE.md](docs/LOCAL_BRIDGE.md))
13. [x] **`in_hitl_wait` query + unit test** — chaos/e2e contract on `PaperTickWorkflow.hitl_status`
14. [x] **Phase 4 LangGraph** — Temporal activity bind done: `run_paper_tick_graph_activity` (`services/temporal_worker/activities/swarm_graph.py`), `PaperTickWorkflow.run(use_swarm_graph=False)` flag, worker registration — [`docs/research/tasks/CLAUDE_LANGGRAPH_TEMPORAL_BIND.md`](docs/research/tasks/CLAUDE_LANGGRAPH_TEMPORAL_BIND.md)
15. [x] **Vision lane in TRADE scan** — ONNX/cache via `score_for_scan` + `GET /vision/score`; site fetches `ATE_VISION_URL` (graceful 0 without bridge)
16. [x] **TRADE → workflow_id** — scan calls `POST /paper/start` → unique id to HITL modal (no `paper-tick-{SYMBOL}` guess)
17. [x] **TRADE UI** — poll `GET /paper/status` → show `in_hitl_wait` WAITING badge in HITL modal + toolbar
18. [x] **PaperTick continue-as-new** — `HARD-1` done: `should_continue_as_new` (`hitl_logic.py`) + `PaperTickWorkflow.run(max_ticks_per_run=50)` hands off remaining ticks via `workflow.continue_as_new`, never mid-`_in_hitl_wait` — [`docs/research/tasks/HARD_TRACK_CLAUDE_CURSOR.md`](docs/research/tasks/HARD_TRACK_CLAUDE_CURSOR.md)
19. [ ] **WorldMonitor live** — set `WORLDMONITOR_API_KEY` for real geo strip (context-only; mock OK without) — **human**
20. [ ] **Colab** — surface funding research milestones on Overview (investor track) — **opencode/Cursor UI**
21. [ ] **Watchlist only** — Waggle artifact handoffs / cangjie distill → skills (not order path) — **human/watchlist**
22. [x] **`OC-3` · Real Edge 2.1 net-liquidity FRED lag** — `scripts/research/task-2-1-net-liquidity.py` (L_net = WALCL − WTREGEN − RRP, PIT Friday open, 3y walk-forward, matched-vol placebo, CSCV PBO). Verdict **`NO_SIGNAL`**: gate veto **NO-GO** (vetoed mean fwd 0.31% vs placebo 0.22%, p=0.794, no separation), fwd-lift **GO** (top decile 0.85% vs base 0.29%, 2.95×), PBO **GO** (0.10), n windows **GO** (618). No fusion wiring — display L_net in Macro Scout context-only per spec — [task-2-1-net-liquidity-fred-lag.md](docs/research/notebookLM/task-2-1-net-liquidity-fred-lag.md)
23. [x] **Real Edge 2.1 closure** — go/no-go memo filed ([task-2-1-memo.md](docs/research/tasks/task-2-1-memo.md)); spec + README flipped to `done (NO_SIGNAL)`; consequence implemented: L_net (+ `is_gate_veto`) surfaced in Macro Scout **context-only** via `packages/data/net_liquidity.py` + `GET /mcp/call/ate_net_liquidity` (`fusion: false`), `ate_macro_policy` reason updated — no fusion wiring
24. [x] **Real Edge 2.2 memo** — mempool urgency (ran 2026-08-06, verdict **`NO_SIGNAL`**: monthly OOS IC **NO-GO**, PBO **NO-GO** 0.65, confluence lift 1.06× UNDERDETERMINED, n_breakouts GO) — memo filed ([task-2-2-memo.md](docs/research/tasks/task-2-2-memo.md)), spec + README flipped to `done (NO_SIGNAL)`, `history.jsonl` logged
25. [x] **Real Edge 2.3 GO memo + negative controls** — live re-run **NO_SIGNAL** (stress WR 0.67 > normal 0.55; wrong sign); prior synthetic GO voided; §4 controls run; no fusion wiring — [task-2-3-memo.md](docs/research/tasks/task-2-3-memo.md)
26. [x] **Real Edge 2.4 re-run / memo** — entropy-regime metrics exist (`NO_SIGNAL`: lift_in_structured_regime 0.12x NO-GO, shuffle_control NO-GO, marginal_vs_adx_gate NO-GO); honest memo filed, no fusion wiring — [task-2-4-entropy-regime.md](docs/research/notebookLM/task-2-4-entropy-regime.md)
27. [x] **`AG-1` · Real Edge 2.2 BTC mempool urgency ROC** — `scripts/research/task-2-2-mempool-urgency.py` (median sats/vB ROC vs BTC 4H price breakouts, 48h success lift, monthly OOS IC, CSCV PBO). Verdict **`NO_SIGNAL`**: `confluence_lift_48h` UNDERDETERMINED (1.06x), `monthly_oos_ic` NO-GO (0.0144), `pbo_cscv` NO-GO (0.65), `n_breakouts` GO (524). No fusion wiring — research artifact only per spec — [task-2-2-mempool-urgency-roc.md](docs/research/notebookLM/task-2-2-mempool-urgency-roc.md)
28. [x] **`AG-2` · Real Edge 2.3 High-Yield OAS Gating** — `scripts/research/task-2-3-hy-oas-gating.py` (ICE BofA US High Yield Index OAS vs SPY breakouts, win-rate decay in stress, WFER 1.11, DSR p-value 1.00). Verdict **`NO_SIGNAL`**: `win_rate_decay_in_stress` NO-GO (15.1%), `veto_precision` NO-GO (44.3%), `wfer_walk_forward` GO (1.11), `dsr_p_value` NO-GO (1.0000), `n_signals` GO (128). No fusion wiring — research artifact only per spec — [task-2-3-hy-oas-gating.md](docs/research/notebookLM/task-2-3-hy-oas-gating.md)
29. [x] **`AG-3` · Real Edge 2.4 Entropy / Complexity Regime Filter** — `scripts/research/task-2-4-entropy-regime.py` (Bandt-Pompe permutation entropy & LZ76 complexity vs SPY breakouts, block-shuffle control, marginal lift vs ADX). Verdict **`NO_SIGNAL`**: `lift_in_structured_regime` NO-GO (0.12x), `shuffle_control` NO-GO, `marginal_vs_adx_gate` NO-GO (p=0.3722), `n_structured_periods` GO (72). No fusion wiring — research artifact only per spec — [task-2-4-entropy-regime.md](docs/research/notebookLM/task-2-4-entropy-regime.md)
30. [~] **`VIS-6` · Break label/lane circularity** — retrained on the independent triple-barrier
    dataset, val top1 0.970. Not marking `[x]` here — see the full `VIS-6` entry above for the
    still-open unseen-symbol caveat and (fixed 2026-08-07) an `inference.py` regression the
    same commit briefly introduced.
31. [~] **`RISK-5` · Portfolio-level Risk Officer** — see the full `RISK-5` entry above. Core
    vetoes are real and tested (6 tests, not 32), but no position store yet and the
    "correlation" is a static asset-class bucket, not computed correlation.
32. [x] **`UI-1` / `SIDE-5` · ATE Operations Dashboard & Sidebet Integration** — `apps/ate-ui/index.html` built with Liquid Glass aesthetic, real-time agent swarm matrix, RISK-5 portfolio exposure gauges, Chart.js paper equity curve, active positions table, and HITL approve/veto modal. Served via FastAPI `/dashboard` and `/sidebet` endpoints.
38. [x] **`REG-1` · Prediction Market Event-to-Data-Source Registry Protocol** — `sidebet/registry.py` + `tests/test_sidebet_registry.py` (Binds Polymarket/Kalshi questions to FRED, CCXT, GDELT, SEC EDGAR ground-truth data feeds).
39. [x] **`GRANGER-1` · Granger Causality Lead-Lag Test on News Shocks** — `scripts/research/granger-causality-news.py` (Empirical VAR Granger test to verify if news/event shocks precede asset returns or lag market moves).

### Delegation triage (2026-08-06)

| Tier | Agent | Brief |
|------|--------|--------|
| Easy→bigger | **freebuff** | Batch1 done → [`FREEBUFF_BATCH_2.md`](docs/research/tasks/FREEBUFF_BATCH_2.md) — DOC-4 coverage, skills pack |
| Medium→harder | **opencode** | Batch1 done → [`OPENCODE_BATCH_2.md`](docs/research/tasks/OPENCODE_BATCH_2.md) — VIS-3 parity, ENG-5 fixtures, AUTO-1 scheduler |
| Hard | **Claude / Cursor** | HARD-1 continue-as-new **done**; `RISK-7` idempotent orders **done**; next VIS-5/6 — [`HARD_TRACK_CLAUDE_CURSOR.md`](docs/research/tasks/HARD_TRACK_CLAUDE_CURSOR.md) |

### Delegated to Claude (copy-paste)

_(LangGraph bind + HARD-1 continue-as-new done — next hard: HARD-2 `VIS-5` honest vision split)_

### Completed this session

- [x] TRADE colab live — chart, RegimeGate, live Polymarket, fusion + TA in scan
- [x] Classical: chart_patterns, pandas-ta, VectorBT SPY/BTC backtests + tear sheets
- [x] Vision: mplfinance `ate_v1` renderer + export batch
- [x] Fusion + Risk Officer stubs; Temporal pipeline skeletons
- [x] `hybrid-scan` — watchlist + JSON/CSV export, regime–macro correlation (`6e06f64`)
- [x] Alt-data stubs: `NullOnChainProvider`, `NullSentimentProvider`, `ingest_alt_data_activity`
- [x] TRADE: four-lane status panel + HITL modal stub (`bc3329a`)
- [x] Phase 4 agents: Pattern Scout + Vision Validator shipped (`d4ba51e`); Temporal validate/tick wired
- [x] Phase 5 HITL: TRADE modal → `/api/ate/hitl` approve/reject bind (`efc9977`); Temporal workflow signal dispatch pending
- [x] Real Edge Task 1.4: Polymarket event impact — **NO-GO** (41% BTC 1d, 0.91× lift); memo filed
- [x] Phase 2 ONNX export — `cup-handle-yolov8n.onnx` (5.8 MB, classify 224px)
- [x] Nightly automation — launchd + GH Actions + `scripts/nightly-batch.sh` (`79b55ba`)
- [x] HITL Temporal proxy — `/hitl/signal` + site handler when configured (`79b55ba` / `038dbed`)
- [x] Vision ONNX Temporal activity — cache under `~/ate-data/cache/vision/` (`79b55ba`)
- [x] Real Edge Task 1.2 deferred — paid netflow wishlist; OSS policy locked ([PAID_ALTERNATIVES.md](docs/PAID_ALTERNATIVES.md))
- [x] LangGraph paper-tick graph stub — `services/swarm/paper_tick_graph.py` + tests
- [x] LangGraph → Temporal activity bind — `run_paper_tick_graph_activity`, `PaperTickWorkflow(use_swarm_graph=False)` flag, worker registration, `tests/test_swarm_temporal_bind.py`
- [x] HARD-1: PaperTick `continue-as-new` — `should_continue_as_new` (never mid-HITL-wait), `max_ticks_per_run=50` chunking, `tests/test_paper_tick_continue.py`
- [x] WorldMonitor Macro Scout pack — geo provider, FRED sentiment, whale stubs, `/mcp/tools`, skills, TRADE geo-intel
- [x] `feat/ate-local-bridge` merged to `main` (`320e027`)
- [x] HITL e2e — Temporal approve/reject + HTTP `/hitl/signal` (`scripts/hitl-e2e.py`)
- [x] HITL chaos — kill worker mid-wait, resume, approve (`scripts/hitl-chaos.py`)
- [x] Local HITL without bridge token + `in_hitl_wait` unit test; deleted merged feature branch
- [x] Vision lane in TRADE — `packages/vision/score_for_scan.py`, `/vision/score`, site `fetchVisionScore`
- [x] TRADE → real `workflow_id` — `POST /paper/start` + scan/HITL wire (unique `paper-tick-{SYMBOL}-{ts}`)
- [x] TRADE UI `in_hitl_wait` — `GET /paper/status` + site `/api/ate/paper-status` poll

---

### 2026-08-09 Paper Arena — multi-variant comparison harness

Operator asked for a way to run "as many strategy tests with fake money, with
various combinations, then compare and study them live to further improve the
engine." Mapped onto ATE's existing scaffolding: per-Variant deterministic
replay on a shared bar stream (Tier A), per-Variant isolated live-paper
workflow fan-out (Tier B), a five-gate promotion proposal gate (Tier C — does
NOT auto-merge engine defaults), and a Karpathy-style autoresearch loop
reading the prior leaderboard (Tier D). Three of the four tiers ship now;
Tier B ships the workflow + ledger isolation but does **not** yet plumb the
Variant's `CupHandleConfig` / `FusionConfig` / `RiskOfficerConfig` through the
per-tick detector — that is the `ARENA-2-2` follow-up.

The principle behind the harness is the one already documented for RES-4: two
configurations identical in every field produce the same Variant id and the
same equity curve; one differing field produces a different id and (almost
certainly) a different curve. That is the only reliable way to attribute any
PnL difference to a single engine knob, and the only reliable way to claim a
"winning config" deserves a promotion.

- [x] `ARENA-1` · **Tier A** — replay Variant configs on a shared Parquet bar
      stream; Variant id = sha256 of canonical JSON config; per-Variant
      ledger file mirroring RISK-7 id isolation; leaderboard JSON +
      side-by-side HTML report with charted equity curves; `history.jsonl`
      measurement row per run with commit, bar range, cost model, Variant ids.
      `packages/arena/{variant,runner,metrics,comparison}.py` +
      `scripts/paper-arena-run.py` + `arena/control.yaml` +
      `tests/test_arena_{variant,runner,metrics,comparison}.py`. 36/36 tests
      pass via `python scripts/run-arena-tests.py` (pytest collection
      hangs in this sandbox).
- [x] `ARENA-2` · **Tier B** (full) — per-Variant `PaperTickWorkflow` fan-out
      (`scripts/paper-arena-live.py`) with workflow_id and client_order_id
      isolation; **plus** the Variant's `CupHandleConfig` / `FusionConfig` /
      `RiskOfficerConfig` actually plumbed end-to-end so a Variant with
      `min_confidence=0.65` emits fewer signals than the control. Wiring
      surface: `Variant.as_dict()` (canonical transport shape) →
      `PaperTickWorkflow.run` (8th positional arg) → `_continue_as_new_args`
      (carries forward across chunks) → activity kwarg (`variant=` on both
      `paper_tick_activity` and `run_paper_tick_graph_activity`) →
      validate/risk layers (`_variant_config` for swarm, `_validate_with_variant`
      + `_variant_risk_config` for legacy). 8 new tests in
      `tests/test_arena_tier_b.py` pin every layer (transport shape, swarm
      state reader, validate candidate injection, legacy activity kwarg,
      workflow signature, start-time arg position); 45/45 in
      `scripts/run-arena-tests.py`. Today: dry-run prints the plan, real
      launches when `TEMPORAL_ADDRESS` is configured.
- [x] `ARENA-D` · **Tier A `--multi-symbol` + per-row symbol carrier** —
      `scripts/paper-arena-run.py --multi-symbol --symbols SPY,QQQ,DIA,...` pairs each
      variant 1:1 with a distinct instrument and produces one campaign-level
      `leaderboard.json` whose `rows[*].symbol` are pairwise distinct.
      `packages/arena/comparison.py`: `VariantLeaderboardRow.symbol` (per-row),
      `ArenaCampaign.symbols: list[str]` (top-level back-compat carrier —
      populated only in multi mode), `build_leaderboard(..., variant_symbols=..., symbols=...)`
      accepts the per-variant symbol map; HTML report gains a `SYMBOL` column.
      `services/api/routes/paper.py::paper_leaderboard` reads per-row symbol
      and applies `?symbol=` prefix filter per row (so multi-symbol campaigns
      genuinely drop rows); `/paper/arena/campaigns` echoes `symbols[]` for
      the dropdown label. `apps/ate-ui/index.html`: campaign selector shows
      `multi-symbol-smoke — 1d [6 symbols (SPY, QQQ, DIA, IWM, BTC-USD, ETH-USD),
      6 variants]`; post-sort summary reads `5 of 6 Variants in SPY, QQQ, ...
      matching <code>SP</code>` instead of `in —`. `arena/multi-symbol-smoke.yaml`
      six Variant/Symbol pairs; `tests/test_arena_multi_symbol.py` +
      `test_arena_leaderboard_route.py::test_leaderboard_multi_symbol_per_row_filter`
      pin the contract. 60/60 in `scripts/run-arena-tests.py`; live
      Playwright probe (`/tmp/verify_arena_multi_symbol.py`) verified SPY → 1 row,
      BTC → 1 row (BTC-USD), NOPE → 0 rows + correct X-of-Y hint.
- [x] `ARENA-D2` · **Compare Two Variants sub-tab** — new API route
      `GET /paper/arena/campaigns/<campaign>/compare?variant_a=<12-hex>&variant_b=<12-hex>`
      reads `arena_result.json` for both sides' `equity_curve` and
      `trade_logs/<id>.jsonl` for the per-trade P&L list (sorted by
      `exit_bar_index`). Returns per-Variant metrics block +
      `delta: {total_net_pnl_a_minus_b, trades_a_minus_b, wins_a_minus_b}`
      + `bars_in_common` so the UI doesn't have to re-derive. Defends path
      traversal with `[A-Za-z0-9_-]+` × `[a-f0-9]{12}` regex; 400 on
      identical ids / non-hex; 404 on missing campaign or variant;
      `require_bridge_or_local` auth gate (`tests/test_arena_compare_route.py`,
      9 tests). UI (`apps/ate-ui/index.html`): sub-tab pills at the top of
      `#pane-arena`, dedicated Variant A / variant B selects, three
      side-by-side cards (A cyan, Δ amber, B purple), an equity-overlay
      Chart.js line chart (two datasets, cyan + purple, shared x-axis) and
      a per-trade scatter (one dot per closed trade, x = exit bar index,
      y = net PnL USD), plus a      100-row combined trade log table. Initial
      activation lazy-loads the comparison so toggling tabs doesn't pay
      for the second fetch. Verified end-to-end against `autoresearch-eval`:
      rank-1 vs rank-3 Variants; equity chart has 2 datasets, scatter has
      2 datasets, on-screen delta `$2,832` reconciles with route `$2,831.89`
      (rounding). Scripts: `scripts/run-arena-tests.py` → 69/69 PASS.
      Screenshots: `/tmp/arena-panel-screens/{10_compare_initial,
      11_compare_two_specific, 12_compare_two_final}.png`.
- [x] `ARENA-D3` · **Compare per-trade table: research-grade truncation hint + Show-All toggle** —
      follow-up to `ARENA-D2`. The 100-row hard cap silently dropped trades
      on longer campaigns. `services/api/routes/paper.py`: new module
      constants `PER_TRADE_TABLE_DEFAULT_CAP=100`,
      `RESEARCH_GRADE_VARIANT_THRESHOLD=500`,
      `RESEARCH_GRADE_TRADE_THRESHOLD=10_000`; the compare route now
      returns four new fields — `campaign_variant_count` (rows in
      `leaderboard.json`), `campaign_trade_count_total` (sum of
      `arena_result.json::closed_trade_count` across all variants),
      `is_research_grade` (variant_count > 500 or trade_count_total > 10k),
      `truncation_threshold` (the cap). Server still returns the full
      un-truncated trade list — the cap is enforced client-side only.
      `apps/ate-ui/index.html`: `renderCompareTrades` reads
      `body.truncation_threshold` as the single source of truth; renders
      `min(total, threshold)` by default, re-renders the full set when
      `arenaState.compareShowAll` flips. New chrome: an amber count
      badge ("SHOWING 100 OF 400 TRADES") and a `SHOW ALL` / `CAP TO 100`
      toggle button. Both hidden when no cap applies (≤100 trades).
      `tests/test_arena_compare_route.py`: golden-path test now also pins
      `campaign_variant_count/trade_count_total/is_research_grade/truncation_threshold`;
      new `test_arena_compare_metadata_for_research_grade_campaign`
      grows the leaderboard to 501 Variants via 499 filler rows so the
      `is_research_grade` flag flips regardless of pick. Latent-bug-fix
      bundled in: `loadArenaCompare` refreshes the leaderboard cache +
      repopulates variant pickers when `arenaCompareCampaignSelect`
      changes campaign (previously switching campaigns on the Compare
      sub-tab served stale Variant ids from the cached
      `autoresearch-eval` leaderboard, 404'ing the compare fetch).
      Verified end-to-end: truncation-test fixture
      (`~/ate-data/arena/truncation-test`, 200 trades × 2 sides = 400
      total) renders 100 rows + amber badge + SHOW ALL button; clicking
      SHOW ALL expands to 400 + flips button to CAP TO 100; clicking
      again collapses back to 100. `autoresearch-eval` (35 trades) renders
      all 35 with no badge + no buttons. 70/70 in
      `scripts/run-arena-tests.py`. Screenshots:
      `/tmp/arena-panel-screens/{15_compare_default_no_truncation,
      16_compare_truncated_100, 17_compare_show_all_400}.png`.
- [x] `ARENA-3` · **Tier C promotion gate** — five-gate evaluator: sample
      size ≥ 100 trades, deflated Sharpe lower 95% CI > 0
      (Bailey & López de Prado, n_trials-corrected), walk-forward CV
      < 30%, profit factor at 2× costs ≥ 1.4, candidate beats control
      with z > 1. Output: a *draft* ``docs/agent/proposals/variant-<id>-proposal.md``
      with metrics, gate decisions, config diff and a "do not auto-merge"
      instruction. Promotion is a code review.
- [x] `ARENA-4` · **Tier D autoresearch loop** — reads prior leaderboard,
      picks top-K, emits YAML seed spec with K parents (return-to-best) + N
      one-field-one-step children, runs Tier A on the new spec. Honest
      limits: small uniform-step perturbations (legible ablations), not
      Optuna; cost-robustness and walk-forward stay in Tier C.
- [x] `/paper/leaderboard` rewired — reads
      `~/ate-data/arena/leaderboard_latest.json`; the legacy 4-name
      `Joachim/Per/Kris/Baha` stub is gone. Returns ranked variants
      with full metric block (Sharpe / Sortino / MDD / PF / hit rate /
      deflated-SR lower 95%) for the comparator panel, falls back to an
      explicit empty-state note when no campaign exists.

State of the comparator on real SPY 1d (1500 bars, 5 Variant ablation):
**vision-stub** (lane renormalisation with stub 0.5 lane) wins the
short window with Sharpe 0.40 / MDD -0.42% / 15 trades / 60% hit. **A child
variant of looser-freshness with classical_weight perturbed up by 0.10**
ranks 2 by Sharpe but matches the parent's MDD exactly — small-step
perturbation often does not move the equity curve enough to clear the
DATA-7 trade-count floor. The Arena is fast and bias-free; promotion
decisions remain a code review, not a script.

---

## Definition of Done — Project Thesis

We have **not** reinvented connectors, TA, or backtesters. We **have** shipped typed fusion, hybrid memory, durable HITL, MCP ops, and a swarm UI that Freqtrade/Hummingbot/LEAN do not provide — with cup-and-handle as the first proven, ensemble-validated pattern lane.
