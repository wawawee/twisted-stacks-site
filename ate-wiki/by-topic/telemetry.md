# Telemetry lane (early — not "Terminal")

**Naming:** UI uses **TRADE** for the investor trading view. **Telemetry** = durable ops log (workflow steps, agent decisions, API health). Reserved name — do not call TRADE "Terminal".

---

## Why early?

Replay and trust beat features. Investors and devs should see *what the system did* before we add more lanes. Cheap to stub in colab; pays off when Temporal workflows multiply.

---

## v0 (colab — Phase 1+)

| Signal | Source | Display |
|--------|--------|---------|
| Last scan | `/api/ate/scan` | `SPY · 1 signal · 273 bars` |
| Last market fetch | `/api/ate/market` | timestamp + symbol |
| Lane status | static config | Classical live, Vision/Macro soon |
| Paper mode | env | `PAPER` badge |
| Nightly scan CSV | `~/ate-data/scan/nightly-YYYY-MM-DD.csv` | hybrid-scan batch (launchd 06:00 local) |

**Where:** TRADE sidopanel → **Lanes** section; expand to **Telemetry** subsection (Phase 1 wiki task).

**Ops schedule:** [infra/NIGHTLY_AUTOMATION.md](../../infra/NIGHTLY_AUTOMATION.md) — launchd + GitHub Actions research cron; logs in `~/ate-data/logs/nightly-*.log`.

---

## v1 (Phase 5 — Temporal)

| Event | Fields |
|-------|--------|
| `workflow_started` | workflow_id, symbol, tf |
| `activity_completed` | step, duration_ms, result summary |
| `risk_veto` | reason, ticker, adjusted_frac |
| `hitl_pending` | notional_usd, expires_at |

Storage: episodic table + optional SSE to colab.

---

## UI tokens

| State | Color |
|-------|-------|
| OK / completed | Green |
| Running | Amber pulse |
| Veto / error | Red |
| HITL waiting | Amber blink |

Same signal-colored rules as [ui-design.md](ui-design.md).

---

## Not in scope v0

- Full distributed trace (Logfire/LangSmith) — Phase 4 agent runtime
- React Flow swarm map — Phase 6

*Tracked in [TASKLIST.md](../../TASKLIST.md) under Colab / TRADE polish.*
