# TwistedStacks Showroom — TWISTED PONGG

Playable Vite/React/Three.js front door for [twistedstacks.com](https://twistedstacks.com). The homepage is a **4-way tactical Pong duel** with brick typography, racket spin, and an in-game project catalog.

## Local dev

```bash
npm install
npm run dev
```

Open http://localhost:3000.

## Checks

```bash
npm run lint
npm run build
```

## Supabase leaderboard

The browser app uses Supabase directly for the public Twisted Pongg leaderboard, with `localStorage` fallback.

Required Vite env vars:

```bash
VITE_SUPABASE_URL=https://oeppjpbaafjsowecyjho.supabase.co
VITE_SUPABASE_PUBLISHABLE_KEY=sb_publishable_FMyVbwnJdeP0iuL5DY1P0Q_zFYwmggo
```

Run [supabase/leaderboard.sql](./supabase/leaderboard.sql) once in the Supabase SQL Editor.

Do not expose the Supabase secret/service role key in Vite. Only `VITE_` variables are bundled into the browser.

## Deploy (Vercel)

- Repo: [wawawee/twisted-stacks-site](https://github.com/wawawee/twisted-stacks-site) (public)
- Project: `twisted-pongg` → [twistedstacks.com](https://www.twistedstacks.com)
- Build: `npm run build` → `dist`
- SPA rewrites: `vercel.json`

No API keys in the app. Contact: `mailto:hello@twistedstacks.com`.

## Design docs

- [docs/twisted-pongg.md](./docs/twisted-pongg.md) — one-pager (loop, modes, audio, camera)
- [docs/twisted-pongg-game-research.md](./docs/twisted-pongg-game-research.md) — market research
- [docs/twisted-pongg-direction-notes.md](./docs/twisted-pongg-direction-notes.md) — product direction and collaboration notes

## Parallel work

**Codex:** gameplay feel in `src/App.tsx` (spin, Web Audio, camera twist).  
**Docs/metadata only** in this tree when avoiding merge conflicts.
