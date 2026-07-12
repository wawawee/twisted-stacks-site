# SUPARAYS team room — local dev

Works in **normal Chrome** — no special browser.

```bash
cd twisted-stacks-site
npm run dev:suparays
```

Open: **http://localhost:3010/suparays**  
Password: `baha123`

Stop any old `vercel dev` on port 3010 first (Ctrl+C in that terminal).

## How it works

| Process | Port | Role |
| --- | --- | --- |
| Vite | 3010 | React UI (Chrome hits this) |
| `suparays-api-dev.mts` | 3011 | `/api/suparays/*` handlers |

Vite proxies API calls to the local Node server. Production still uses Vercel
serverless — this is dev-only.

## vs showroom

| Command | URL | SUPARAYS room |
| --- | --- | --- |
| `npm run dev` | :3000 | No API — login fails |
| `npm run dev:suparays` | :3010 | Full room |

## Environment (`.env`)

Login + wiki: nothing extra (password defaults to `baha123`).

Chat + files:

```bash
SUPABASE_URL=...
SUPABASE_SERVICE_ROLE_KEY=...
```

Run once in Supabase: `supabase/suparays-chat.sql`, `supabase/suparays-files.sql`.

## Wiki edits

Edit `VR-SuperPowers/wiki/`, then `npm run sync:wiki` and refresh.
