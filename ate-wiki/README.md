# Wiki — ATE scratchpad

**Purpose:** Frictionless place for humans to drop ideas. Agents triage weekly into `by-topic/` and promote actionable items to [TASKLIST.md](../TASKLIST.md).

---

## How it works

```
Human drops bullet in IDEAS.md
         │
         ▼
   Agent triage (weekly)
         │
    ┌────┴────┐
    ▼         ▼
by-topic/  TASKLIST.md
```

### Three states

1. **New** — `IDEAS.md` § New (this week)
2. **In review** — `IDEAS.md` § In review
3. **Sorted** — moved to `by-topic/{topic}.md`

Promoted ideas become Phase tasks in TASKLIST (checkbox items).

---

## How to drop an idea

Add a bullet in [`IDEAS.md`](IDEAS.md):

```markdown
- [Short title] — 1-2 sentences. _@name, YYYY-MM-DD_
```

---

## Categories (`by-topic/`)

| File | Topic |
|------|-------|
| `strategy.md` | Thesis, lanes, fusion weights |
| `data.md` | Feeds, providers, point-in-time |
| `risk.md` | Risk Officer, caps, CVaR |
| `ui-design.md` | TRADE layout, tokens, mobile-first |
| `regime-gate.md` | ADX/ATR regime; C&H gating |
| `vision-dataset.md` | Weak supervision, mplfinance `ate_v1` |
| `macro-scout.md` | PMXT, Polymarket, whale layer, Macro lane |
| `temporal-workflows.md` | ingest → scan → validate → risk → execute |
| `telemetry.md` | Ops log lane (not TRADE) |
| `consensus.md` | Multi-strategy voting, veto chain |
| `real-edge.md` | Alt-data hypotheses (funding, netflow, DXY, PM) — go/no-go before adapter swap |
| `competitors.md` | Freqtrade, Hummingbot, LEAN, … |
| `funding.md` | Grants, investors, budget |
| `use-cases.md` | Operator / investor scenarios |

**Inbox:** `inbox/` — raw drops before triage (e.g. PMXT research 2026-07-14).

**Research specs (full):** [docs/research/README.md](../docs/research/README.md) — task scripts, vision specs, go/no-go artifacts.

**Nightly automation:** [infra/NIGHTLY_AUTOMATION.md](../infra/NIGHTLY_AUTOMATION.md) — launchd + GitHub Actions; hybrid-scan CSV + Real Edge research scripts.

**Promoted:** Research locks also summarized in [TASKLIST.md](../TASKLIST.md) § Research — locked decisions.

---

## Rules

1. Wiki is a scratchpad — edit freely.
2. Public claims → update [TRUTH-STATUS.md](../docs/TRUTH-STATUS.md) first.
3. One-line bullets preferred; link sources when possible.

*Last updated: 2026-07-14*
