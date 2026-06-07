# TwistedStacks Showroom — TWISTED PONGG

Playable Vite/React/Three.js front door for [twistedstacks.com](https://twistedstacks.com). The landing page is a **project showroom**; TWISTED PONGG is the playable proof layer behind it.

## Showroom routing

| Pattern | Example | Where it lives |
| --- | --- | --- |
| Main showroom + game | [twistedstacks.com](https://www.twistedstacks.com) | This repo (`twisted-pongg` on Vercel) |
| Info-only HTML/PDF | [skatterevision.twistedstacks.com](https://skatterevision.twistedstacks.com) | `public/skatterevision.html` via host rewrite in `middleware.ts` + `vercel.json` |
| Info-only project page | [twistedstacks.com/laga.html](https://www.twistedstacks.com/laga.html) | `public/laga.html` on the main showroom site |
| Runnable demo/app | [anslag.twistedstacks.com](https://anslag.twistedstacks.com) | Separate Vercel project: [wawawee/AnslagSITK](https://github.com/wawawee/AnslagSITK) |
| Client site | [silversmeden.twistedstacks.com](https://silversmeden.twistedstacks.com) | Separate Vercel project |

DNS notes: [docs/namecheap-dns.md](./docs/namecheap-dns.md)

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

The browser app uses `/api/leaderboard` for the public Twisted Pongg leaderboard, with `localStorage` fallback if the API is unavailable.

Required Vercel env vars:

```bash
SUPABASE_URL=https://oeppjpbaafjsowecyjho.supabase.co
SUPABASE_SERVICE_ROLE_KEY=...
```

Run [supabase/leaderboard.sql](./supabase/leaderboard.sql) once in the Supabase SQL Editor.

Do not expose the Supabase secret/service role key in Vite. Anything with a `VITE_` prefix is bundled into the browser.

## Deploy (Vercel)

- Repo: [wawawee/twisted-stacks-site](https://github.com/wawawee/twisted-stacks-site) (public)
- Project: `twisted-pongg` → [twistedstacks.com](https://www.twistedstacks.com)
- Build: `npm run build` → `dist`
- SPA rewrites and `/api/leaderboard`: `vercel.json`

No API keys in the app. Contact: `mailto:hello@twistedstacks.com`.

## Design docs

- [docs/twisted-pongg.md](./docs/twisted-pongg.md) — one-pager (loop, modes, audio, camera)
- [docs/twisted-pongg-game-research.md](./docs/twisted-pongg-game-research.md) — market research
- [docs/twisted-pongg-direction-notes.md](./docs/twisted-pongg-direction-notes.md) — product direction and collaboration notes

## Parallel work

**Codex:** gameplay feel in `src/App.tsx` (spin, Web Audio, camera twist).  
**Docs/metadata only** in this tree when avoiding merge conflicts.
