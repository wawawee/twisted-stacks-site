# Vision dataset — weak supervision (research lock)

500+ cup-and-handle charts for Phase 2. **Weak supervision** — not manual annotation for v1.

---

## Pipeline

```text
SPY 10y daily + BTC 2y 4H
    → classical C&H detect
    → WeakLabeler (forward 20 bars)
    → ChartRenderer (locked style)
    → train / val split
```

---

## Locked decisions (2026-07-14)

| Decision | Choice |
|----------|--------|
| Renderer | **mplfinance** (determinism &gt; speed) |
| BBox | Whole pattern (cup + handle) |
| Uncertain labels | **Discard** — model must be decisive |
| Volume in chart | **Yes** — critical for handle dry-up |
| Window | **100 bars** normalized zoom (all TFs) |
| Style | Versioned hash `ate_v1` — change = retrain |

---

## Label rules

| Class | Count target | Rule |
|-------|--------------|------|
| Positive | ~300 | C&H detected + breakout within 20 bars |
| Negative | ~200 | C&H detected + failed breakout (invalidation) |
| Uncertain | 0 | Dropped |

---

## Training notes (Phase 2)

- YOLOv8 fine-tune; **no HSV color aug** (style locked)
- Output: `VisionScore` — reject &lt; 0.6, flag 0.6–0.8, pass &gt; 0.8

*Tasks in [TASKLIST.md](../../TASKLIST.md) Phase 2.*
