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

## Contact form (`/api/contact`)

The in-app "Book Demo" / "Contact" / per-project CTAs / easter-vault "Transmit Victory" buttons all POST to `/api/contact`. The endpoint:

1. Validates the shape (name + email + topic + intent + message; required, length-bounded, regex-checked email).
2. Checks a hidden honeypot field (`website`); bots fill it, real users never see it.
3. Rate-limits per client IP (3 writes / minute).
4. Stores the row in Supabase (`contact_submissions` table; PII stays server-side, RLS on, no anon policies).
5. If `RESEND_API_KEY` is set, forwards the message to `hello@twistedstacks.com` (BCC `dev@twistedstacks.com`) and sends an auto-reply to the submitter.
6. Without the key, the row is still stored and the form returns success — submissions are triaged in Supabase Studio.

Required Vercel env (in addition to the Supabase vars above):

```bash
# Optional — turn on email forwarding. Without these, the form stores
# submissions in Supabase and the operator triages them manually.
RESEND_API_KEY=re_...
CONTACT_FROM_EMAIL=TwistedStacks <hello@twistedstacks.com>
CONTACT_TO_EMAIL=hello@twistedstacks.com
CONTACT_NOTIFY_EMAIL=dev@twistedstacks.com
```

The Resend domain for `twistedstacks.com` must be verified at
[resend.com/domains](https://resend.com/domains) before the first send
succeeds. Free tier: 100 emails/day, 3000/month — more than enough for
this site.

Run [supabase/contact.sql](./supabase/contact.sql) once in the Supabase
SQL Editor.

## SUPARAYS team room (`/suparays`)

Password-protected project room: wiki (ideas + by-topic from
[wawawee/VR-SuperPowers](https://github.com/wawawee/VR-SuperPowers) `wiki/`),
team chat, and shared files.

| URL | Purpose |
| --- | --- |
| [twistedstacks.com/suparays](https://www.twistedstacks.com/suparays) | Login + wiki + chat + idébox + files |

Run in Supabase SQL Editor (same project as contact/leaderboard):

- [supabase/suparays-chat.sql](./supabase/suparays-chat.sql)
- [supabase/suparays-ideas.sql](./supabase/suparays-ideas.sql)
- [supabase/suparays-files.sql](./supabase/suparays-files.sql)

Build runs `npm run sync:wiki` before Vite — pulls `wiki/IDEAS.md` and
`wiki/by-topic/*.md` into `suparays-wiki/` (gitignored, server-only).

Vercel env:

```bash
SUPARAYS_ROOM_PASSWORD=baha123   # team shared password
GITHUB_TOKEN_WAWAWEE=...         # idébox/chat → wiki sync + Vercel build wiki pull (needs repo read)
# SUPARAYS_ROOM_SECRET=...       # optional HMAC override
```

Auto-update: push to `VR-SuperPowers` `wiki/**` on `main` triggers a Vercel
deploy hook (see `.github/workflows/sync-wiki-room.yml` in that repo). Set
secret `VERCEL_DEPLOY_HOOK_URL` on the VR-SuperPowers GitHub repo.

Local full stack (API routes): `npm run dev:suparays` → http://localhost:3010/suparays  
See [docs/suparays-local-dev.md](./docs/suparays-local-dev.md). Plain `npm run dev` (port 3000) does **not** serve `/api/suparays/*`.

## ATE investor room (`/ate`)

Password-protected trading colab: wiki, team chat, and TRADE workspace (paper only).

Local full stack: `npm run dev:ate` → http://localhost:3010/ate (`predev:ate` syncs wiki before start; use `npm run dev:ate:fresh` for an explicit re-sync).

## Deploy (Vercel)

- Repo: [wawawee/twisted-stacks-site](https://github.com/wawawee/twisted-stacks-site) (public)
- Project: `twisted-pongg` → [twistedstacks.com](https://www.twistedstacks.com)
- Build: `npm run build` → `dist`
- SPA rewrites and `/api/leaderboard`, `/api/contact`: `vercel.json`

No API keys in the app. Contact: `mailto:hello@twistedstacks.com`.

## Design docs

- [docs/twisted-pongg.md](./docs/twisted-pongg.md) — one-pager (loop, modes, audio, camera)
- [docs/twisted-pongg-game-research.md](./docs/twisted-pongg-game-research.md) — market research
- [docs/twisted-pongg-direction-notes.md](./docs/twisted-pongg-direction-notes.md) — product direction and collaboration notes

## Parallel work

**Codex:** gameplay feel in `src/App.tsx` (spin, Web Audio, camera twist).  
**Docs/metadata only** in this tree when avoiding merge conflicts.
