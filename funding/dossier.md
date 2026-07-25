# TwistedStacks — Studio Dossier: Narrative & Economics

**Entity:** TWISTEDSTACKS AB (Sandviken, Gävleborg) · **Prepared:** 2026-07-25 · **Author:** Atlas
**What this is:** the studio-level economic case — how a **non-dilutive grant stack + shared platform** compounds across the portfolio, an **illustrative 24-month studio cost model**, **portfolio ROI logic** (per-product grant capture × N products) at **three funding levels**, and an **honest focus-risk** treatment.

> ⚠️ **All figures below are modelled illustrations, not forecasts or commitments.** Verified grant *ceilings/deadlines* come from official sources (`funding-plan.md`); how many are *won* and *when* is assumed. See `sources.md` assumptions 5–7.

---

## 1. Studio narrative in one paragraph

TwistedStacks runs a **portfolio of AI-native vertical products** (SUPARAYS, ATE, SkatteRevision, CymWave) on **one shared platform** — a single backend/infra, one brand + showroom (twistedstacks.com), one GTM/contact pipeline, and one **grant-and-delivery motion**. The studio's economic edge is that the **cost of building and funding** is largely fixed and shared, while **non-dilutive capital is captured per product**. Each product is a separately-eligible Swedish AB that can draw Vinnova, Region Gävleborg, and Almi support; the platform amortises the eng, design, and paperwork across all of them. The cap table stays clean until one vertical earns the right to scale.

---

## 2. How the compounding works (mechanics)

### 2.1 Shared platform = fixed cost spread over N products
Third-party studio analyses put shared-service savings at **30–40% lower burn per company** and **~40% less capital to reach milestones** (M Accelerator; La Boétie). The mechanism, applied to TwistedStacks:

| Shared layer | Built once | Reused by | Marginal cost of +1 product |
|---|---|---|---|
| Backend / infra (Supabase, auth, data) | ✔ (in repo) | all products & rooms | near-zero |
| Brand + showroom (site, subdomains, PONGG proof layer) | ✔ (in repo) | all products | low (a page + subdomain) |
| GTM / contact pipeline (`/api/contact`, Resend, CTAs) | ✔ (in repo) | all products | near-zero |
| Grant-writing & reporting templates | to build | all products | **declining** (template reuse) |
| Core engineering / design team | ongoing | flagship + spillover | the real constraint (§5) |

**Key point:** the first three layers already exist in the codebase. The fourth (grant motion) is the compounding lever — the **10th application is far cheaper than the 1st**.

### 2.2 Non-dilutive stack = capital without cap-table cost
Per product, per cycle, the **verified** ceilings (`funding-plan.md`):
- **Vinnova Innovativa Startups:** ≤ **500 000 SEK** (grant). `[VERIFIED:2026-07-25]`
- **Almi Innovationslån:** **50k–500k SEK** (debt, ~50% co-fund). `[VERIFIED:2026-07-25]`
- **Region Gävleborg innovationsstöd** (w/ Almi + Movexum) + mikro/konsultstöd (≤60k / ≤70k). `[VERIFIED:2026-07-25]`
- **Vinnova Applied-AI (consortium):** **2–10 MSEK @ ≤50%** — for SUPARAYS (edge) / ATE (decision support). `[VERIFIED:2026-07-25]`

Stacked across the portfolio, this funds a lean shared team **without a priced round** — the essence of the thesis.

---

## 3. Illustrative 24-month studio-level cost model

Assumes a **small studio**: 2 founders + 2–3 shared hires (eng/design), remote-augmented, Gävleborg cost base. SEK.

| Cost line | Basis | 24-mo total (SEK) |
|---|---|---|
| Core team (2 founders lean + 2.5 FTE avg blended ~55k/mo loaded) | shared across products | **3,300,000** |
| Cloud / infra / tooling (Supabase, Vercel, LLM API, domains) | shared | **240,000** |
| Brand / showroom / design upkeep | shared | **180,000** |
| Grant admin + accounting/legal (studio + per-product ABs) | shared, scales slowly | **360,000** |
| Per-product prototype/GTM spend (4 products × ~150k) | per product | **600,000** |
| Contingency (~10%) | — | **470,000** |
| **Total 24-mo studio cost** | | **≈ 5,150,000 SEK** |

This is the number the non-dilutive stack must cover to keep the studio equity-free.

---

## 4. Portfolio ROI logic — three funding levels

**Method:** per-product grant capture × N products, minus co-financing, with a **win-rate haircut** (grants are competitive). Debt (Almi) is capital-in but must be repaid, so it is shown separately as *bridge*, not *return*.

**Building blocks (per product, verified ceilings):**
- Vinnova IS grant: 500k · Region innovationsstöd: ~150k (modelled) · Almi debt bridge: up to 500k · Vinnova Applied-AI: 2–10 MSEK @ 50% (consortium only).

### Level 1 — Conservative ("grant-lean," ~40% win rate, no big consortium)
| Item | Assumption | Non-dilutive captured (SEK) |
|---|---|---|
| Vinnova IS | 4 products × 500k × 40% win | 800,000 |
| Region innovationsstöd/mikro/konsult | ~2 awards × ~120k | 240,000 |
| Almi Innovationslån (debt bridge) | 2 × 300k | 600,000 (repayable) |
| **Non-dilutive grants (excl. debt)** | | **≈ 1,040,000** |
| **+ debt bridge** | | **≈ 600,000** |
| **Cost coverage** | vs 5.15M cost | **~20% grant-covered; runway extended, gap = equity/revenue** |
**Read:** grants alone don't cover a 4-product studio at low win rates → **must narrow focus** or raise a small round. Validates sequencing.

### Level 2 — Base ("one flagship consortium wins," ~50% win rate)
| Item | Assumption | Non-dilutive captured (SEK) |
|---|---|---|
| Vinnova IS | 4 × 500k × 50% | 1,000,000 |
| Region innovationsstöd | ~3 × 150k | 450,000 |
| **Vinnova Applied-AI (flagship, e.g. SUPARAYS edge)** | 1 project 4 MSEK @ 50% grant | 2,000,000 |
| Almi debt bridge | 3 × 350k | 1,050,000 (repayable) |
| **Non-dilutive grants (excl. debt)** | | **≈ 3,450,000** |
| **+ debt bridge** | | **≈ 1,050,000** |
| **Cost coverage** | vs 5.15M cost | **~67% grant-covered; ~87% incl. debt → near cash-neutral** |
**Read:** the flagship consortium grant (Applied-AI 2–10M @ 50%) is the swing factor. **One** such win moves the studio from "gap" to "near-covered." This is the target case.

### Level 3 — Ambitious ("multi-win + EU," ~60% win rate, Year-2 EU)
| Item | Assumption | Non-dilutive captured (SEK) |
|---|---|---|
| Vinnova IS | 4 × 500k × 60% | 1,200,000 |
| Region innovationsstöd | ~3 × 150k | 450,000 |
| **Vinnova Applied-AI ×1–2** | 1×4M + 1×3M @ 50% grant | 3,500,000 |
| **Eurostars (flagship, national grant)** | modelled ~2–3 MSEK Swedish share | ~2,500,000 |
| Almi debt bridge | 4 × 400k | 1,600,000 (repayable) |
| **Non-dilutive grants (excl. debt)** | | **≈ 7,650,000** |
| **+ debt bridge** | | **≈ 1,600,000** |
| **Cost coverage** | vs 5.15M cost | **>100% grant-covered → self-funded search + reinvestment** |
**Read:** upside case fully self-funds the studio *and* the flagship's push toward TRL 6+ / EIC. Requires strong win rates, a consortium, and an international partner — **optimistic**, not a plan of record. (EIC Accelerator, grant <€2.5M + equity, sits beyond this window and is **dilutive** — excluded from "non-dilutive" totals.)

### Summary
| Level | Win rate | Non-dilutive grants | Debt bridge | Cost coverage |
|---|---|---|---|---|
| **1 Conservative** | ~40% | ~1.0 MSEK | ~0.6 MSEK | ~20% (+debt ~32%) |
| **2 Base** | ~50% | ~3.5 MSEK | ~1.1 MSEK | ~67% (+debt ~87%) |
| **3 Ambitious** | ~60% | ~7.7 MSEK | ~1.6 MSEK | >100% |

**The ROI logic in one line:** non-dilutive return scales with **(win rate) × (N products) × (whether a consortium Applied-AI grant lands)** — and the platform makes each additional application cheap, so the marginal ROI of one more well-targeted application is high. But coverage below Level 2 forces a focus decision.

---

## 5. Focus & execution risk — the honest section

**This is the studio's dominant risk, and the model above quietly assumes it away by "capturing" grants across 4 products. In reality:**

1. **A small team cannot ship 4 verticals well.** Hexa needed **~30 specialists** to run many verticals; a 4–5 person studio attempting SUPARAYS *and* ATE *and* SkatteRevision *and* CymWave risks **four half-products**. The grant stack can *fund* four searches; it cannot *staff* four builds.
2. **Grant-chasing can distort the roadmap.** Optimising for what's fundable (edge AI because Vinnova has a call) rather than what customers pay for is a real failure mode. Grants should **follow** conviction, not create it.
3. **Application + reporting overhead multiplies.** N products = N sets of eligibility checks, budgets, and progress reports. This is the *cost side* of "stack per-product grants" and it lands on the same tiny team.
4. **Shared-GTM synergy is weak.** Sensor-mesh buyers, trading-infra buyers, tax-audit buyers, and wellness-hardware buyers **do not overlap**. The platform saves on build and brand, **not on selling**. Do not model cross-sell.
5. **Cash-flow timing.** Grants pay **in arrears** with co-financing (50% Applied-AI, 40% ERUF). Without Almi debt as a bridge, a "won" grant can still cause a liquidity crunch.

**Mitigations (the plan of record):**
- **Sequence hard.** One flagship (likely **SUPARAYS** — cleanest Vinnova edge-AI fit — or **ATE**) gets the majority of eng cycles. The other three stay in **grant-funded validation** (Vinnova IS + Movexum) until the flagship throws off cash or is acquired.
- **Grant-as-follower.** Only pursue a call when it maps to a product the studio would build anyway.
- **Debt-bridge discipline.** Keep Almi Innovationslån available specifically to cover arrears; never fund a *new* product on debt.
- **Kill criteria.** Pre-commit to pausing any non-flagship product that fails its validation milestone, freeing the team.

---

## 6. Bottom line

The studio economics **work at the Base level** — one flagship consortium grant plus the per-product Vinnova/Region stack gets TwistedStacks to **~87% cost coverage (incl. debt) without dilution** over 24 months. The Conservative level exposes the truth that **breadth without focus underfunds everything**, and the Ambitious level is real but optimistic. The deciding variable is **not** the size of any single grant — it is whether the studio **concentrates execution on one flagship** while using the non-dilutive stack to keep the other bets alive cheaply. Studio structure is a **funding and platform advantage**; it is **not** a substitute for focus.

*See `market-research.md` (thesis + comparables), `competitors.md` (positioning), `funding-plan.md` (verified stack + calendar), `sources.md` (citations + numbered assumptions).*
