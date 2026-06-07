# Twisted Pongg Direction Notes

## Core direction

Twisted Pongg should be a fun, polished, low-friction game first. The TwistedStacks showroom value should come from the quality, feel, and personality of the playable experience, not from ads, pop-ups, or heavy promotional copy.

## Product principles

- Keep gameplay buggfree, responsive, and readable before adding more features.
- Do not interrupt gameplay with marketing popups.
- Use block text only when it feels native to the arcade/Arkanoid material: level names, end states, challenge names, short glitch messages, or destructible typography.
- Keep TwistedStacks branding subtle: title, visual identity, leaderboard, end screen, and optional showroom/contact paths outside active play.
- Treat the game as a small IP, not a brochure.

## Visual and gameplay feel

- The 3D camera twist is a strength and should stay.
- Early levels should stay readable and fair.
- Higher levels can introduce more depth, camera roll, labyrinth feeling, and visual pressure.
- Difficulty should feel like the world starts twisting, not only that the ball gets faster.
- Racket collision, ball physics, hit glints, haptics, and audio feedback matter more than extra modes.

## Current web role

The public site keeps the 1-player version as the showroom experience. It should remain playable immediately and prove craft without requiring accounts, onboarding, or explanation.

Near-term web priorities:

- Global Supabase leaderboard.
- Better mobile touch controls.
- Daily seed or daily challenge.
- Ghost/challenge runs before live multiplayer.
- Continued polish of ball/racket physics and level identity.

## Multiplayer direction

Live network play is possible, but should not be the first multiplayer step.

Preferred progression:

1. Ghost challenge: play against another player's recorded run or seed.
2. Casual live 1v1: WebSocket room with authoritative match state.
3. Ranked/live competitive: region-aware matchmaking, server-authoritative physics, anti-cheat.

Vercel can keep hosting the frontend, but live WebSocket game rooms should use a dedicated realtime layer such as Cloudflare Durable Objects or a small Node WebSocket server. Supabase remains good for leaderboard, profiles, and match history.

## Mobile and iOS direction

Start with web/PWA polish before a native app.

PWA step:

- Fullscreen mobile play.
- Touch zones that feel natural.
- Offline shell/cache.
- Supabase leaderboard.
- Shareable challenge links.

iOS step, if the loop proves itself:

- Build native in Swift with SpriteKit rather than porting React directly.
- Use native touch, haptics, Game Center leaderboard, and daily challenge.
- Release free first as TwistedStacks craft/visibility, not a monetization-first app.
- Optional later monetization: cosmetic themes or a small support/founder purchase.

## Collaboration note

When working across Codex and Cursor, keep changes scoped:

- Codex can own gameplay feel, physics, leaderboard plumbing, and docs.
- Cursor can take narrow UI/CSS/mobile-control tasks when context is tight.
- Avoid parallel edits to `src/App.tsx` unless the exact section is agreed first.
- Prefer small verified batches over large feature piles when token budget is tight.
