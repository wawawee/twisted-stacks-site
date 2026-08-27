# Risk

---

## Risk Officer model (hybrid)

| Mode | When | Output |
|------|------|--------|
| **Veto** | Breach hard cap, stale data, circuit breaker | `approved=false` |
| **Sizing** | Within budget | `adjusted_notional_frac` |
| **HITL** | Notional > threshold | Temporal pause signal |

## Hard caps (defaults — tune in Phase 3)

- Max single-name notional: 5% equity
- Max daily loss: configurable circuit
- Paper only until Phase 8

## Tools

- PyPortfolioOpt / CVaR
- Pydantic `RiskDecision` contract

---

*Skill: [skills/risk_cvar_check.md](../../skills/risk_cvar_check.md)*
