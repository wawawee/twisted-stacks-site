# TWISTED PONGG — competitive research

*Landscape scan for multi-paddle Pong, spin/curve mechanics, Breakout hybrids, solo rally modes, and online multiplayer. Sources: arcade history, itch.io/Github indies, Flash-era successors (2026-06).*

---

## 1. Multi-paddle / four-wall Pong

| Title | Era | Players | Core idea | Notes |
|-------|-----|---------|-----------|-------|
| **Quadrapong** (Atari, 1974) | Arcade | 4 | One goal per side of the screen; competitive ping-pong | Table cabinet, tilted screen per player ([MAME](https://www.arcade-museum.com/Videogame/quadrapong)) |
| **Winner IV** (1973) | Arcade | 2–4 | Licensed Pong; score when ball hits another player’s “side” | Early 4-player commercial variant |
| **Warlords** (Atari, 1980) | Arcade | 1–4 | Defend **castle walls** with shields; catch & **catapult** fireballs | Not pure Pong — brick-wall destruction + shared arena ([MAME](https://www.arcade-museum.com/Videogame/warlords)) |
| **Pong Knock Out** (UNIS, modern) | Arcade | 4 | 3D paddles on square table; **lives/knockout**; power-ups reverse controls / speed ball | Physical 4-way social spectacle |
| **PonGo** ([lguibr/pongo](https://github.com/lguibr/pongo)) | Web/Go | ≤4 | **Square arena**, paddle per edge, **destructible brick grid** center | Closest modern analog to “tactical 4-wall” + bricks; WebSockets + actor model |

**Pattern:** Four-wall games either (a) score on “your edge lost the ball” or (b) treat walls as **destructible objectives** (Warlords, PonGo).

---

## 2. Spin / curve (Curveball lineage)

| Title | Platform | Spin mechanic | Feel |
|-------|----------|---------------|------|
| **Curveball** (Flash classic) | Browser | Paddle **lateral velocity at impact** curves trajectory in 3D tunnel | Skill expression without extra buttons; AI reads spin at higher levels |
| **Curveball 3D** clones | Web | Same + level progression, target score per level | [Kuakua](https://kuakua.app/games/curveball), [Flash Museum](https://flashmuseumgames.com/curveball/) |

**Pattern:** Spin = **vector added at hit** from racket movement (not Magnus physics simulation). Escalating speed + AI adaptation = tension curve.

**TWISTED PONGG alignment:** `interactionRef.spinX/spinY` on paddle hit + decay — same family as Curveball, but on a **flat orthographic** court with four edges.

---

## 3. Pong / Breakout hybrids

| Title | Stack | Hybrid loop |
|-------|-------|-------------|
| **PongOut** ([GitHub](https://github.com/kevin-d-omara/PongOut)) | Unity | Score on opponent’s **table edge**; **brick rows** absorb hits; periodic power-ups |
| **Pong-Breaker** ([GitHub](https://github.com/jgailbreath/Pong-Breaker-retro-arcade-game)) | Unity2D | SP: clear bricks; 2P: Pong + bricks on shared device |
| **BreakPong** ([itch.io](https://tank-king.itch.io/breakpong)) | HTML/JS | Breakout + Pong twist (jam scope) |
| **Pong Breaker** (Game Jolt) | — | Destroy enemy bricks while defending yours; buffs on ball contact |
| **PonGo** | Go + WS | 4 paddles + **central brick grid** + power-ups (mass, velocity, phasing, spawn ball) |

**Pattern:** Bricks = **HP layer** before ball can “score” on you; dual win conditions (brick attrition vs edge leak).

**TWISTED PONGG alignment:** Typography intro + **score bricks** + damaged states already merge **Breakout DNA** with duel scoring (`scorePlayer` / `scoreAI` brick metaphor). Unique vs PonGo: bricks spell **brand/narrative**, not only grid defense.

---

## 4. Solo / self-pass mechanics

| Title | Mechanic | Progression |
|-------|----------|-------------|
| **Solo Pong** (itch / PICO-8) | Rally vs **one wall**; miss = lose life/points | Ball **accelerates per hit**; optional paddle shrink, spin on hit |
| **Solo Pong** (QuickBasic jam 2026) | **Volley for high score** | Extra lives at score milestones |
| **pong_solo_rust** | Wall return; miss behind player ends run | Speed +50 ball / +20 player per point |

**Pattern:** Solo = **juggle + escalation** (speed, paddle size, angle control). “Self-pass” is often **wall + single paddle**, not four-wall autopilot.

**TWISTED PONGG alignment:** `rigStateRef.autopilot` + intro playable typography = **solo-friendly onboarding** without a dedicated “wall mode” yet. Opportunity: **Autopilot rally** as ranked practice mode (keep ball alive, dissonance ramps).

---

## 5. Online multiplayer Pong variants

| Project | Transport | Model |
|---------|-----------|--------|
| [pong-websockets](https://github.com/buchowski/pong-websockets) | Raw WebSockets | Host/join; creator left paddle |
| [Multiplayer-Browser-Pong-Game](https://github.com/sercanbayrambey/Multiplayer-Browser-Pong-Game) | Socket.IO | 2-player lobby, W/S, state sync |
| [pingpong-game](https://github.com/ChetanGuptaMG/pingpong-game) | Socket.IO rooms | 2P + referee role; namespaces |
| [pong-final](https://github.com/anomitroid/pong-final) | Socket.IO | Rooms, client prediction, delta updates |
| [ping-pong-game](https://github.com/sachinks07/ping-pong-game) | FastAPI WS | 2P + **dynamic obstacles** |
| **PonGo** | WebSockets | **4-player**, authoritative server, multiple rooms |

**Pattern:** 2P is commodity; **4P authoritative sim** is rare in open source. Prediction/delta = polish layer for latency.

**TWISTED PONGG today:** Local/single-browser; showroom is **portfolio shell**, not netcode. Future: room-based 2v2 or FFA on square court would differentiate vs generic 2P clones.

---

## What seems unique about TWISTED PONGG (team calibration 2026-06)

| Dimension | Common market | TWISTED PONGG |
|-----------|---------------|---------------|
| **Corners** | Quadrapong: **4 players**, one paddle each | **1 player, 2 paddles** — corners are tense because *you* must cover two walls (self-pass) |
| **Spin** | Curveball: **3D POV**, big pad, tunnel | **Flat court**; spin from **how fast you move** the racket at hit |
| **Bricks** | Arkanoid / hybrids: clearing is the win | Bricks = pressure/intro — **duel + rally** is the game |
| **Showroom** | Landing + text + demo | **No text on canvas** — only playable proof of craft |
| **Audio / camera** | Generic arcade | **Twist escalates** with run length (dissonance, camera) |
| **Future** | 2P browser clones | **Mobile challenge** + **solo endless twisted** |

**Priority:** *It is already fun* > taxonomy. Unique touch = **self-pass + dual-edge control + spin**, not a new genre name.

**Not trying to be:** Quadrapong (4P corners), Curveball (3D lineage), Arkanoid (brick hunter).

---

## Inspiration map (actionable)

1. **Curveball** — spin from paddle velocity; teach in first 30s without tutorial text.
2. **Warlords / PonGo** — four players, center destruction, catapult/capture fantasy (future power-up).
3. **PongOut** — bricks as first line of defense before “goal” damage.
4. **Solo Pong (PICO-8)** — speed ramp per rally for **Autopilot / practice** mode.
5. **pong-final** — networking patterns when adding 2P online (prediction, rooms).
6. **PonGo** — closest **4-player + bricks** reference implementation (Go, not TS).

---

## Gaps to research later

- Mobile touch on four edges (control scheme).
- Accessibility: colorblind palettes (cyan/gold already strong).
- Ranked/autopilot scoring persistence (localStorage vs backend).
- Whether **legal/showroom** modal breaks flow or reinforces “arcade cabinet” metaphor.

---

*Maintained with showroom code in `twisted-stacks-site/src/App.tsx`. Gameplay changes delegated to Codex (spin, Web Audio, camera twist).*
