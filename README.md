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

## Deploy (Vercel)

- Repo: [wawawee/twisted-stacks-site](https://github.com/wawawee/twisted-stacks-site) (public)
- Project: `twisted-pongg` → [twistedstacks.com](https://www.twistedstacks.com)
- Build: `npm run build` → `dist`
- SPA rewrites: `vercel.json`

No API keys in the app. Contact: `mailto:hello@twistedstacks.com`.

## Design docs

- [docs/twisted-pongg.md](./docs/twisted-pongg.md) — one-pager (loop, modes, audio, camera)
- [docs/twisted-pongg-game-research.md](./docs/twisted-pongg-game-research.md) — market research

## Parallel work

**Codex:** gameplay feel in `src/App.tsx` (spin, Web Audio, camera twist).  
**Docs/metadata only** in this tree when avoiding merge conflicts.
