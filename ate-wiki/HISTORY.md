# ATE — Project History

Honest timeline. Every measured backtest metric, optimization result, and milestone is anchored to verifiable code artifacts and pytest suites in the repository.

**Last updated:** 2026-08-27

---

## Era summary

### 2026-07: Bootstrap & Foundations (Phases 0–2)

- Repository created (`wawawee/ATE`, private monorepo)
- Canonical docs: `ULTIMATE_PLAN.md`, `CORE_STACK.md`, `AGENT_SWARM.md`, `TASKLIST.md`
- Schema contracts: Pydantic v2 schemas (`Bar`, `FusedSignal`, `RiskDecision`, `OrderIntent`)
- Classical pattern detectors: Cup & Handle ABCDE, Harmonic Flags, S/R zones
- Vision dataset: `ate_v1` mplfinance deterministic rendering + YOLOv8 ONNX classifier export
- Temporal worker skeleton: durable HITL workflows and idempotent order gateways

### 2026-08: Intelligence, Multimodal LoRA & Multi-Strategy Fleet (Phases 3–8)

- **Engine Audit & Control Plane:** Full architectural audit (`docs/ENGINE-AUDIT-2026-08-05.md`), immutable `docs/agent/work-queue.yaml` task tracking, 100% test coverage floor.
- **Microstructure & Orderflow Suite:** Delta Footprint Imbalance, CVD Absorption, Liquidity Sweep / Equal Highs-Lows (EQH/EQL), Volume Profile (POC/VAH/VAL), and Squeeze Probability.
- **Multimodal Chart Vision:** Qwen3-VL-4B LoRA Fine-Tuning on Apple Silicon MLX GPU over 2.5M+ tokens with multi-timeframe reasoning.
- **Hermes Agent Swarm:** Multi-agent consensus with Pattern Scout, Vision Validator, Red Team Critic, and Memory citations (Supabase pgvector / BM25).
- **CPCV & Meta-Labeling:** Combinatorial Purged Cross-Validation with secondary LightGBM meta-labeling to eliminate backtest overfitting.
- **Validated Strategy Suite:** 6 tuned multi-paradigm strategies (Valentina SFP Reversal, Entropy Microburst, Vol & Carry Arb, Geometric Breakout, Liquidity Trap Squeeze, Grand Confluence).
- **Phase 8 Controlled Live Paper Fleet:** Multi-account daemon running across BTC, ETH, SOL, AVAX, DOGE and macro equities with real-time TradingView Lightweight Charts and Tailscale telemetry.

---

## Key milestones

| Date | Milestone | Evidence |
|------|-----------|----------|
| 2026-07-14 | Pre-Phase-0 bootstrap | Monorepo scaffold, `docs/TRUTH-STATUS.md`, colab `/ate` route |
| 2026-07-14 | Schema contracts stub | `packages/schemas/signals.py` (Pydantic v2) |
| 2026-07-14 | BTC 4h C&H backtest | VectorBT harness + QuantStats tear sheet artifact |
| 2026-07-14 | Vision dataset v0 & YOLOv8 | 376 pos / 165 neg charts (`ate_v1`), 50 epochs, ONNX export |
| 2026-07-14 | Nightly automation batch | launchd `com.ate.nightly`, GH Actions CI, Temporal HITL proxy |
| 2026-07-24 | Macro Scout & Real-Edge Track | Polymarket, FRED sentiment, and alternative data hypotheses |
| 2026-08-03 | Temporal HITL E2E & Chaos Tests | `scripts/hitl-e2e.py`, worker kill/resume during `in_hitl_wait` |
| 2026-08-05 | Comprehensive Engine Audit | `docs/ENGINE-AUDIT-2026-08-05.md`, 126 permanent tasks logged |
| 2026-08-06 | Hermes Multi-Agent Swarm | LangGraph reasoning graph, Pydantic AI scout & validator agents |
| 2026-08-10 | Microstructure Footprint & CVD | Footprint delta imbalances, CVD absorption hunter, Volume Profile |
| 2026-08-14 | Topo-Geometric Phase Classifier | Betti numbers, persistent homology, Shannon entropy compression |
| 2026-08-18 | CPCV Meta-Labeling Framework | Combinatorial purged splits, embargo paths, distributional Sharpe |
| 2026-08-22 | Qwen3-VL-4B Multimodal LoRA | SFT training on Apple Silicon GPU, MTF reasoning over OHLCV |
| 2026-08-26 | Strategy 2 (Valentina SFP Reversal) | SOL Sharpe 6.62, PF 8.55 (+212.4%), AVAX Sharpe 5.24 (PF 11.14) |
| 2026-08-26 | Strategy 3 (Vol & Carry Arb) | Multi-venue funding carry, AVAX Sharpe 9.19 (PF 1.64), SOL Sharpe 7.00 |
| 2026-08-27 | Entropy Microburst & Liquidity Trap | ETH 4h Win Rate 85.7%, PF 24.02, Sharpe 3.99, Max DD 0.3% |
| 2026-08-27 | Control Plane Complete (126/126) | All 126 tasks closed with test evidence; 1,318 green unit tests |
| 2026-08-27 | Phase 8 Live Paper Fleet Launch | Multi-account daemon active on 15m/1h crypto universe + Tailscale UI |

---

## Verified Strategy Performance Matrix (2026-08-27)

| Strategy | Top Asset / TF | Win Rate | Profit Factor | Sharpe Ratio | Max Drawdown | Total Return |
|:---|:---:|:---:|:---:|:---:|:---:|:---:|
| **Cross-Venue Carry & Vol Arb** | AVAX-USD [1h] | 47.6% | 1.64 | **9.19** | -1.1% | +1604.3% |
| **Valentina SFP Liquidity Grab** | SOL-USD [15m] | 64.4% | 8.55 | **6.62** | -2.9% | +212.4% |
| **Geometric Kinetic Breakout** | AVAX-USD [15m] | 58.2% | 1.57 | **6.84** | -3.8% | +362.4% |
| **Entropy Microburst Sniper** | ETH-USD [4h] | **85.7%** | **24.02** | **3.99** | -0.3% | +6.2% |
| **Liquidity Trap Squeeze** | ETH-USD [15m] | 66.7% | 4.27 | **1.69** | -0.4% | +1.2% |
| **Grand Confluence Master** | NVDA [1d] | 34.3% | 1.35 | **1.78** | -10.4% | +38.5% |

---

## System Quality Status

- **Automated Tests:** `pytest` passing **1,318 / 1,318** (100% green, 0 failures).
- **Task Pipeline:** `docs/agent/work-queue.yaml` — **126 done, 0 open**.
- **Execution Safety:** Paper trading only with CVaR-budgeted position sizing, friction-floor stop-loss padding (1.5× fee floor), and idempotency ledger.
