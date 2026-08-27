# Real Edge — alt-data research track

**Status:** Designed · Tasks 1.1/1.3/1.4 **NO-GO**; Task 1.2 **deferred** (paid data) — 2026-07-16  
**Canonical:** [docs/ATE_Real_Edge_Research.md](../../docs/ATE_Real_Edge_Research.md) · [RESEARCH_AGENT_BRIEF.md](../../docs/RESEARCH_AGENT_BRIEF.md) · [docs/research/README.md](../../docs/research/README.md) · [PAID_ALTERNATIVES.md](../../docs/PAID_ALTERNATIVES.md)

---

## What it is

Context score for “good time to take risk?” — confluence with classical C&H + vision, not a replacement entry trigger.

Macro/on-chain/prediction-market features feed the **blue macro lane** and RegimeGate flags **after** hypothesis validation.

---

## Research tasks (go/no-go before adapter swap)

| Task | Hypothesis | ATE hook |
|------|------------|----------|
| **1.1 Funding** | BTC funding >90th pct → −5% within 7d | **NO-GO** (8.6% hit, 0.42× lift) — [memo](../../docs/research/tasks/task-1-1-memo.md) · do not wire RegimeGate |
| **1.2 Netflow** | 24h outflow >$500M → 30d positive | **DEFERRED** — no free historical API; CryptoQuant/Glassnode on paid wishlist — [memo](../../docs/research/tasks/task-1-2-memo.md) |
| **1.3 DXY** | DXY Δ>0.5% → inverse move >60% | **NO-GO** (47% same-day, 0.93× lift, N=17) — [memo](../../docs/research/tasks/task-1-3-memo.md) |
| **1.4 PM shifts** | Polymarket prob shift >5%/24h → price move | **NO-GO** (41% BTC 1d, 0.91× lift, N=51) — [memo](../../docs/research/tasks/task-1-4-memo.md) |

**Blocked until validated:** `NullOnChainProvider`, `NullSentimentProvider`, `ingest_alt_data_activity` swap — **no Real Edge promotion from 1.1–1.4**.

---

## What’s live today (preview only)

- Polymarket quotes in TRADE (Macro Scout eye-candy)
- PMXT auto-discovery — tier-classified shift alerts, display + cache only (Task 1.4 NO-GO)
- WorldMonitor geo intel — CII / conflicts / economic radar via MCP (mock without key); **context only**
- FRED Fed-funds → `SentimentSnapshot` helper (`FredSentimentProvider`) for RegimeGate flags — not fusion
- Whale strip stubs (`NullWhaleAlertProvider` / mock)
- Fusion macro lane stub (0.15 weight; null alt-data returns empty — **no PM/geo shift wiring**)
- `hybrid-scan` export for regime–macro correlation studies
- `scripts/pmxt-scan.py` + `scripts/worldmonitor-scan.py` in nightly batch
- Skills: `real_edge_walkforward`, `macro_scout_context`, `regime_gate_check`, `distill_research_to_skill`

---

*Paper only until Phase 8. See [TASKLIST.md](../../TASKLIST.md) § Immediate Next Actions.*
