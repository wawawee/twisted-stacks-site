# ATE Visual Design System

Locked for colab (`/ate`) and future ops terminal. Extends the SUPARAYS brutalist room shell — **not** the TwistedStacks showroom brown/blue brand.

## Identity

| Element | Value |
|---------|--------|
| Name | **ATE** |
| Tagline | Agentic Trading Engine |
| Tone | B/W brutalist, high contrast, hard borders, offset shadows |
| Optional tagline joke | "Eats patterns for breakfast." — marketing only, not in UI chrome |

## Color tokens

Same tokens in investor colab and trading terminal (`src/ate/ate.css`).

| Token | Light | Dark | Meaning |
|-------|-------|------|---------|
| `--accent` / `--warn` | `#c9a227` | `#c9a227` | Brand amber — actions, PAPER badge, invalidation lines, classical lane |
| `--bull` / `--success` | `#2d6a4f` | `#3d9968` | Up candles, positive P&L, approved |
| `--bear` | `#b83b2e` | `#e85d4c` | Down candles, negative P&L, veto |
| `--agent` | `#6b4c9a` | `#9b7ed9` | Vision / AI lane (Phase 2+) |
| `--macro` | `#2563eb` | `#60a5fa` | Macro / prediction-market lane (Phase 3+) |
| `--bg` / `--fg` / `--border` | from `suparays.css` | inverted | Structure |

**Rule:** Color means action. Green = bullish/win/approve. Red = bearish/loss/veto. Amber = brand + warn + HITL pending. Purple = agent/AI. Blue = macro / crowd probability.

## Typography

- UI: Inter (inherited from room shell)
- Numbers / ticks / signals: JetBrains Mono (`.mono`)

## Trading charts

- **TRADE (live):** [TradingView Lightweight Charts](https://github.com/tradingview/lightweight-charts) — Apache 2.0, reads CSS tokens for bull/bear/grid
- **ML training export (Phase 2):** mplfinance locked style — separate from terminal theme; see vision dataset research

## Layout (TRADE v2 — colab-embedded)

**TRADE** (not "Terminal" — that name is reserved for future telemetry logs).

Single-page with **left menu always visible** on desktop:

1. **Left** — colab menu + **TRADE** button in footer (next to Light/Dark, Synka, Logga ut)
2. **Center** — chart, quote, fusion strip when TRADE is open; project grid otherwise
3. **Right** — watchlist + signals when TRADE is open; wiki/detail panels otherwise

Mobile: bottom nav **TRADE** + header **TRADE** next to theme/logout; chart/signaler/lista tabs in main column.

## Mobile-first (investor + colab)

Primary audience includes investors on phone only — `/ate` is **mobile-first**:

| Pattern | Implementation |
|---------|----------------|
| Bottom nav | Hem · TRADE · Chat · Idéer — fixed, safe-area aware |
| Investor grid | **TRADE** card in Fokus (company view) |
| TRADE tabs | Chart · Signaler · Watchlist — no cramped sidebar |
| Symbol pills | Horizontal scroll SPY / QQQ / BTC / ETH |
| Touch targets | min 44px buttons, 16px inputs on login |
| View modes | Investor / Dev / TRADE open (menu stays visible) |

Desktop: unchanged side menu + resizable panel.

## Phase 6 expansion

| View | Status |
|------|--------|
| TRADE (chart + signals) | **v1 live** on Vercel |
| Telemetry lane v0 | Phase 1 — [telemetry.md](telemetry.md) |
| Macro Scout badges | Phase 3 preview — [macro-scout.md](macro-scout.md) |
| Agent Swarm Map | React Flow — Phase 6 |
| Memory Explorer | Phase 4+ |
| Risk & Position Monitor | Phase 3+ |
| HITL modal | Phase 5 — amber blink + approve/reject |

## State (future)

- Zustand — UI chrome (theme, panels, selected agent)
- TanStack Query — server state (prices, signals, trades)

## References

- Colab: https://www.twistedstacks.com/ate
- RegimeGate v1 — [regime-gate.md](regime-gate.md)
- Macro Scout / PMXT — [macro-scout.md](macro-scout.md)
- Telemetry lane — [telemetry.md](telemetry.md)
- Fusion weights — `docs/ULTIMATE_PLAN.md` §3
