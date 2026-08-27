# RegimeGate v1 — locked (research 2026-07-14)

Cup-and-handle is a **continuation** pattern — it fails in ranging/chop. RegimeGate gates all classical lanes before fusion.

---

## Labels

| Label | Meaning | C&H allowed? |
|-------|---------|------------|
| `trending` | ADX + slope + vol OK | Yes (confidence ≥ 0.6) |
| `ranging` | ADX &lt; 20 | No |
| `chop` | Mixed / whipsaw | No |
| `crisis` | ATR percentile &gt; 0.90 | Veto all (optional override) |

Contract: `RegimeState` in `packages/schemas/signals.py`.

---

## v1 inputs (price-only first)

| Input | Default | Notes |
|-------|---------|-------|
| ADX | min 25 (SPY), 20 (BTC) | Per-lane thresholds in config |
| ATR percentile | max 0.80 | vs 90-day history |
| MA slope | &gt; 0 for trend_up | Simple stack OK for v1 |
| Macro flags | **Phase 3+** | PMXT / FRED via Macro Scout |

**Phase 3+ macro:** Polymarket implied prob shifts feed `macro_flags` (e.g. `fed_cut_expected`) — see [macro-scout.md](macro-scout.md).

---

## UI (TRADE / Phase 6)

| Regime | UI |
|--------|-----|
| `ranging` / `chop` | **Yellow banner** — "C&H paused — not trending" |
| `crisis` | Yellow + size cap hint |
| `trending` | No banner; fusion proceeds |

---

## Open questions (not blocking v1)

- Bollinger bandwidth vs ATR-only for vol filter?
- Separate ADX thresholds per asset class — **locked yes** for SPY vs BTC.

*Promoted to Phase 3 in [TASKLIST.md](../../TASKLIST.md).*
