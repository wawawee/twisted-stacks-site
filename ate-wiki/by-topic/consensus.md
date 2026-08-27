# Multi-strategy consensus (Phase 7 — research sketch)

When ≥3 pattern lanes run (C&H, bull flag, VCP, …), how do agents agree?

---

## Voting models (evaluate in Phase 7)

| Model | Pros | Cons |
|-------|------|------|
| Simple majority | Easy | Ignores lane quality |
| Weighted by walk-forward win rate | Adaptive | Needs history |
| **Veto chain** | Risk Officer always wins | Can stall |
| Quorum (2/3 lanes + risk) | Balanced | Tune per strategy |

**Default hypothesis:** quorum + **Risk Officer veto** (hybrid model already in [risk.md](risk.md)).

---

## UI

- Fusion strip expands to N lanes
- Swarm Map shows ballot edges (Phase 6–7)

*Deferred until Phase 1 C&H proven. Track in [TASKLIST.md](../../TASKLIST.md) Phase 7.*
