# Macro Scout — prediction markets & whale layer

Investor-facing **slight edge** lane. Eye-candy on `/ate` TRADE sidopanel before full PMXT runtime (Phase 3+ data, Phase 5 execution).

---

## Investor pitch (short)

> We read the market's collective intelligence. When Polymarket implies ~72% for a Fed cut and a top wallet (lifetime PnL +$4.7M) adds $1.2M on BTC $100K — Macro Scout flags **trending**, not ranging. RegimeGate adjusts. Fusion macro lane boosts. Agents trade with context, not price alone.

Tagline for marketing only (not UI chrome): *"Eats patterns for breakfast."* — see [ui-design.md](ui-design.md).

---

## Data stack

| Layer | Tool | Phase |
|-------|------|-------|
| Unified API | **[PMXT](https://pmxt.dev)** — OSS, MIT, "CCXT for prediction markets" | 3+ adapter, 5 MCP |
| Auto-discovery | `packages/data/pmxt_discovery.py` — tier 1–4 keyword scan, 24h shift alerts | 3 **context-only** |
| Platforms | Polymarket, Kalshi, Limitless, Opinion (+ 10 via PMXT) | 3+ |
| Whale alerts | `polymarket-whales` (OSS, no API key) | 3+ UI, 5 enrich |
| Entity intel | Arkham (PnL, win rate) — optional key | 5+ |
| On-chain verify | Polygonscan / explorers | manual |

**Cross-venue edge:** Polymarket vs Kalshi divergence → explicit `cross_divergence` signal, never silent override.

---

## Fusion lane — Macro (blue)

| Lane | Color | Weight (default) | Phase |
|------|-------|------------------|-------|
| Classical | Amber | 0.35 | 1 live |
| Vision | Purple | 0.35 | 2 |
| Sequence | Green | 0.15 | 3 |
| **Macro** | **Blue** `#3b82f6` | 0.15 | 3 preview → 5 full |

v1 classical-only uses amber only; macro bar shows `—` until feeds live.

---

## UI eye-candy (colab TRADE)

| Element | Example |
|---------|---------|
| Sidopanel badges | `Fed cut 72%` · `BTC $100K Dec` |
| Whale strip | `$1.2M YES · wallet +$4.7M lifetime` |
| Regime hint | "Macro: trending bias" → yellow banner off |
| Fusion strip | 4th bar **Macro** (blue) |

Target: static/mock quotes from Vercel API first; PMXT worker later.

**PMXT auto-discovery (2026-07-15):** `PmxtDiscovery` scans tier 1–4 markets, flags >5% / 24h shifts with >$10K volume. Output feeds TRADE sidopanel + nightly cache (`scripts/pmxt-scan.py --json`). **Context-only** — Task 1.4 NO-GO; do **not** wire into `macro_score_from_alt_data()` fusion weights.

**WorldMonitor (2026-07-24):** `WorldMonitorProvider` → country risk / conflicts / economic radar via MCP (`WORLDMONITOR_API_KEY`). TRADE: `GET /api/ate/geo-intel`. Nightly: `scripts/worldmonitor-scan.py --json`. AGPL upstream — API/MCP only. Same context-only policy.

| CLI / API | Purpose |
|-----------|---------|
| `scripts/pmxt-scan.py` | Top 10 alerts; `--json` → `~/ate-data/scan/pmxt-alerts-YYYY-MM-DD.json` |
| `scripts/worldmonitor-scan.py` | Geo intel; `--json` → `~/ate-data/scan/worldmonitor-YYYY-MM-DD.json` |
| `GET /api/ate/macro-alerts` | Vercel — PM shift badges |
| `GET /api/ate/geo-intel` | Vercel — WorldMonitor geo strip (mock without key) |
| `GET /mcp/tools` (ATE API) | ATE signals MCP stub |

Whale strip: `MockWhaleAlertProvider` / `NullWhaleAlertProvider` in `packages/data/whale_alerts.py` — live polymarket-whales wiring later.
---

## Schemas (Phase 5 lock — extend stubs in Phase 3)

Existing: `PredictionMarketQuote` in `packages/data/types.py`.

Planned extensions:

```python
# Phase 5 — packages/data/types.py or packages/schemas/macro.py

class WhaleAlert(BaseModel):
    wallet: str
    market_id: str
    side: Literal["yes", "no"]
    amount_usd: float
    price: float
    wallet_pnl_lifetime: float | None = None
    wallet_win_rate: float | None = None
    timestamp: datetime

class MacroSignal(BaseModel):
    signal_type: Literal[
        "probability_shift", "whale_move",
        "cross_divergence", "regime_hint",
    ]
    confidence: float
    direction: Literal["bullish", "bearish", "neutral"]
    source_quotes: list[PredictionMarketQuote]
    whale_alerts: list[WhaleAlert] | None = None
    regime_hint: RegimeState | None = None
```

Agent: **Macro Scout** (Pydantic AI) — Phase 5; colab display Phase 3 preview.

---

## Risks

1. Thin markets — require `volume_24h` / liquidity floors.
2. Latency — macro is confluence, not sole entry trigger.
3. Regulatory — paper/research until Phase 8; no auto-exec on prediction venues.
4. Keys — `.env` only; `NullDataProvider` when unset.

Full table: [docs/ALTERNATIVE_DATA.md](../../docs/ALTERNATIVE_DATA.md) · Inbox: [idea #2](../inbox/2026-07-14-idea-2-alternative-data-sources-prediction-market-resea.md).
