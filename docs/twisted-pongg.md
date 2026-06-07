# TWISTED PONGG — game design one-pager

**Working title:** TWISTED PONGG  
**Platform now:** Web (Vite + React + Three.js)  
**Platform later:** iOS + Google Play (async/sync challenge + solo)  
**Showroom rule:** **No marketing copy on the canvas** — only the game. Proof that TwistedStacks can ship feel, not a brochure with a minigame.

---

## Elevator pitch

**Pass against yourself** on a square court while steering **two edges at once** (not four strangers in four corners). **Racket speed at impact = spin** — old Pong timing, new curvature. The longer you survive solo, the more **twisted** the run gets (speed, audio, camera). Multiplayer later: **challenge a friend** on the same ruleset.

**Fun first.** Uniqueness is the combo (self-pass + dual control + spin decay), not reinventing the genre name.

---

## Core loop (30–120 s)

1. **Intro bricks** — Type `TWISTED` / `STACKS` as breakable voxel letters; player paddle live (skip explodes letters → gameplay).
2. **Difficulty pick** — Casual / Hardcore / Impossible (speed ramp & AI aggression).
3. **Duel** — Keep ball in play on a **square court**; you steer **left + bottom** rackets; AI holds **top + right**.
4. **Brick scoring** — Hit opponent **score bricks** (cyan/gold); drain yours to lose. Ball **accelerates** over time; **spin** bends path after impacts.
5. **End / retry** — Minimal chrome only (no project catalog on the playfield). Optional deep link to TwistedStacks **outside** the game layer.

**Win condition (current):** Opponent brick column depleted / score threshold (see live `App.tsx` constants).  
**Fail state:** Player bricks destroyed or ball escapes your edges too often → `END_SCREEN`.

### What makes it *ours* (vs research comps)

| Reference | Why it is not us |
|-----------|------------------|
| **Quadrapong** | Four *players* at four sides — we are **one player, two rackets**, corners matter because *you* cover two walls |
| **Curveball** | POV 3D tunnel + giant pad — we are **flat tactical**, spin from paddle velocity |
| **Arkanoid / Pong-Breaker** | Brick clearing is the game — our bricks are **intro/pressure**, duel is **self-rally + spin** |

---

## Controls

| Context | Input | Action |
|---------|--------|--------|
| Intro / gameplay | **Mouse Y** (implied axis) | Move **left** racket |
| Gameplay | **Mouse X** (implied axis) | Move **bottom** racket |
| Intro | Click / skip | Explode intro bricks → difficulty |
| UI overlay | Click | Open showroom, contact, copy email |
| Future | Touch | Edge zones per racket (TBD) |

**Spin (Codex):** Racket **movement speed at contact** adds to `spinX` / `spinY`; decays over ~300 ms — skill shots without extra buttons.

**Autopilot (`rigState: autopilot`):** AI assists movement — onboarding / AFK showroom mode.

---

## Modes (now vs next)

| Mode | Status | Description |
|------|--------|-------------|
| **Solo twisted run** | 🎯 North star | Self-pass; difficulty compounds (speed, spin chaos, audio/camera) — “how long can you stay sane?” |
| **Showroom (web)** | ✅ | Text-free play; same core |
| **Intro typography** | ✅ / 🔲 trim? | Brand moment — keep only if it stays wordless on court |
| **Difficulty tiers** | ✅ | casual / hardcore / impossible |
| **Autopilot** | ✅ | Onboarding / AFK kiosk |
| **Challenge (online)** | 🔲 Mobile | Invite friend; same physics; async or live room |
| **2P local** | 🔲 | Split edges for couch test |
| **Power-ups** | 🔲 | Only if they amplify *twist*, not Arkanoid clutter |

---

## Audio concept (Codex lane)

- **Harmony axis:** Pentatonic / major layer at low ball speed.
- **Tension axis:** Add **dissonant intervals** (tritone, minor 2nd) as `ballSpeed` crosses thresholds.
- **Event stingers:** Brick damage tier, score brick hit, near-miss wall, win/loss.
- **No licensed tracks** — procedural Web Audio oscillators + short noise bursts (arcade cabinet).

**Design rule:** Audio tells you speed danger before you read HUD.

---

## Visual twist & level progression

| Layer | Behavior |
|-------|----------|
| **Base** | Orthographic pixel court; neon purple intro, gold player, cyan AI |
| **Camera twist** | Roll / parallax / shake on high spin or brick cascades (Codex) |
| **Brick states** | active → damaged1 → damaged2 → dead + crack lines |
| **Speed tiers** | Exponential ramp per difficulty; “impossible” caps human reaction |
| **Showroom** | Modal “architecture directory” — meta progression is **discovery**, not level 2 map |

**Progression fantasy:** Each visit peels one **catalog tile** (tax, legal audio, iOS, arena) after you survive longer.

---

## Non-goals (this sprint)

- Showroom copy / catalog modal **on the play surface** (move any “who we are” off-canvas or to post-run screen).
- Backend multiplayer infrastructure (until mobile spec is frozen).
- Monetization / accounts.
- Chasing “unique genre label” — polish **feel** (spin + self-pass + escalation).

---

## Technical anchors (read-only for designers)

- State machine: `GameState` intro → `GAMEPLAY` → `END_SCREEN`.
- Physics: AABB ball vs rackets & bricks; spin injection on paddle resolve.
- Render: Three.js `OrthographicCamera`, 1 unit = 1 px.

*Do not edit gameplay in `App.tsx` in parallel doc/metadata PRs — Codex owns feel pass.*

---

## Success metrics (experiment phase)

- Median session **> 45 s** on first visit.
- **> 30%** open showroom modal after one game.
- Contact click / email copy from end card.
- Qualitative: “I thought it was a game site, not a PDF agency.”

---

## Related docs

- [twisted-pongg-game-research.md](./twisted-pongg-game-research.md) — market & inspiration
- [../README.md](../README.md) — dev & deploy
