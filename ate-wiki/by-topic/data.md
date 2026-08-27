# Data sources

Research target for `DataProvider` implementations.

---

## v1 universe

| Symbol | TF | Provider (target) | Status |
|--------|-----|-------------------|--------|
| SPY | 1d | yfinance → OpenBB → Alpaca | Stub |
| BTC | 4h | CCXT (Binance/Kraken) | Planned |

## Storage

- Parquet + QuestDB (or Timescale) for point-in-time bars — QuestDB deferred to Phase 1 or Docker `questdb-only` profile
- No lookahead in backtests
- Phase 0 default: native dev stack ([infra/NATIVE_DEV.md](../../infra/NATIVE_DEV.md)); no Docker required

## Interface

```python
# packages/data/provider.py
async def get_bars(symbol, timeframe, start, end) -> list[Bar]
```

Fallback when unconfigured: `NullDataProvider` (`latency_class="eod"`, empty bars).

---

## Alternative data (Kimi research — stubs)

Full notes: [docs/ALTERNATIVE_DATA.md](../../docs/ALTERNATIVE_DATA.md) · Macro lane design: [macro-scout.md](macro-scout.md)

### Prediction markets (PMXT)

**PMXT** — open-source "CCXT for prediction markets." Unified adapters for Polymarket, Kalshi, Limitless, Opinion.

| Platform | Edge | ATE role |
|----------|------|----------|
| Polymarket | On-chain, whale-trackable | RegimeGate macro probabilities |
| Kalshi | CFTC-regulated | Cross-validate Polymarket; divergence signal |
| Limitless | Fast crypto-macro settlement | Short-horizon event checks |

Contract: `PredictionMarketQuote`, `WhaleAlert`, `MacroSignal` · Protocol: `PredictionMarketProvider`  
Target phase: **3+** (Macro fusion lane + RegimeGate; colab mock OK first)

```bash
pip install -e ".[alt-data]"   # optional pmxt dependency group
```

### On-chain signals

> Watch the object (whale wallets), not only the shadow (price).

| Signal | Source | ATE role |
|--------|--------|----------|
| Whale exchange outflow | Whale Alert / Glassnode | Fusion boost with C&H |
| Funding rate extreme | Coinglass / CryptoQuant | RegimeGate size reduction |
| Liquidation cluster | Coinglass | Breakout confirmation |
| Dormant wallet wake | Arkham / Nansen | Risk Officer veto |

Contract: `OnChainSignal` · Protocol: `OnChainProvider`  
Target phase: **3+** (BTC lane confluence)

### Sentiment & macro

| Source | Latency | ATE role |
|--------|---------|----------|
| LunarCrush | ~15 min | Sentiment Scout (Phase 7+) |
| Santiment | ~1 h | Social dominance gate |
| FRED | Daily | RegimeGate macro |
| OpenBB | Varies | Already in core stack plan |

Contract: `SentimentSnapshot` · Protocol: `SentimentProvider`  
Target phase: **7+** (veto layer, not entry)

---

## Open questions

- Finnhub vs OpenBB for equities fundamentals?
- Databento for production-grade ticks (Phase 8)?
- PMXT volume thresholds for thin Polymarket contracts?
- Polymarket vs Kalshi divergence feature design for RegimeGate?

*Update [TRUTH-STATUS.md](../../docs/TRUTH-STATUS.md) when a feed goes Live.*
