---
name: suparays-collab
description: >-
  SUPARAYS investor collaboration room on twistedstacks.com/suparays
  (repo twisted-stacks-site). Use when editing Start/Företag/Dev view modes,
  StartBareView, mobile colab UI, wiki sync, or deploying the room.
---

# SUPARAYS collab room

## Where the code lives

| What | Path |
|------|------|
| **Live site** | [twistedstacks.com/suparays](https://www.twistedstacks.com/suparays) |
| **Repo** | `~/Documents/twisted-stacks-site` → `wawawee/twisted-stacks-site` |
| **Room UI** | `src/suparays/` |
| **API** | `api/suparays/` (Vercel serverless) |
| **Wiki sync** | `npm run sync:wiki` from VR-SuperPowers wiki → `suparays-wiki/` |

Do **not** edit iOS in VR-SuperPowers for colab UI changes.

Sandbox experiments (GIT4DUMMIES / AI Studio) are **not** production — port carefully.

## View modes (T-054)

| Mode | Who | Shows |
|------|-----|-------|
| **`start`** (default) | BAHA / first look / mobile | Progress map only — no T-IDs, P0, hub jargon |
| **`company`** | External / Företag | Overview + market + progress |
| **`dev`** | Team | Full TASKLIST, activity, files, tech wiki |

Default: `useState<ViewMode>("start")` in `SuparaysRoom.tsx`.

Start home = `StartBareView` alone (no ProjectGrid dump). Launchers → `progress-summary`, `use-cases`, `chat`, `ideabox`.

## No tech babble (Start)

Forbidden in Start copy: T-###, P0, Investor-safe, hub/WS, ESP32, PROTOCOL, DEMO mode labels as sales claim.

Allowed: fas %, “klart”, “nästa”, plain-language tagline.

## Mobile

Primary design width ~390px. Three-way toggle must fit. Touch targets ≥ ~44px on launchers.

## Deploy & secrets

- Push to `main` on `twisted-stacks-site` → Vercel project for twistedstacks.com.
- Env keys (**must** live in Vercel for cloud agents): `SUPARAYS_ROOM_PASSWORD`, `SUPARAYS_ROOM_SECRET`, `SUPABASE_URL`, `SUPABASE_SERVICE_ROLE_KEY`, optional `GITHUB_TOKEN` / wiki tokens.
- HyperAgent cloud cannot deploy if secrets are only local `.env` — document missing keys; do not invent values.

## ATE / Space rooms

They reuse `SideMenu` with `availableModes={["company","dev"]}` — do not force Start onto ATE.
