# Project content sources

This file is the audit trail behind `src/data/projects.ts`. Every claim in the
catalog (longDescription, tagline, stack, status, etc.) traces back to a
specific file and line range in the project's source folder. Source folders
were read on 2026-06-14 and were NOT modified.

Source paths use absolute macOS paths under `/Users/perbrinell/Documents/` and
`/Users/perbrinell/a0/usr/projects/`. The original project READMEs in
`REVIEW_PROJECTS/wawawee/*` are full mirrors of these primary locations.

---

## system_skatterevision (REVISION)

> Retroactive Swedish tax-recovery engine. Lead discovery + audit-grade PDF
> dossiers from historical iXBRL annual reports.

| Field in catalog | Source |
| --- | --- |
| Tagline (existing) | `SKATTEREVISION-REBOOT/docs/PRODUCT_POSITION.md:5-6` (paraphrased from existing showroom card) |
| Description (card summary, 109 words) | `SKATTEREVISION-REBOOT/docs/PRODUCT_POSITION.md:5-6` (retroactive tax-recovery framing), `SKATTEREVISION-REBOOT/ANSOKAN-ALMI-2026.md:31-33` (iXBRL / 17 LLM agents / noll-hallucinationsprotokoll), `SKATTEREVISION-REBOOT/README.md:101-115` (agent squad), `SKATTEREVISION-REBOOT/MASTER.md:151-160` (audit-firm-complement architecture) |
| Long description, paragraph 1 — "retroaktiv skatteåterbetalningsmotor ... audit-grade dossiers" | `SKATTEREVISION-REBOOT/docs/PRODUCT_POSITION.md:5-6` |
| Long description, paragraph 1 — "100 GB+ iXBRL ... noll-hallucinationsprotokoll" | `SKATTEREVISION-REBOOT/ANSOKAN-ALMI-2026.md:31-33` |
| Long description, paragraph 2 — "komplement till byrån ... noll-hallucinationsprotokoll" | `SKATTEREVISION-REBOOT/MASTER.md:151-160` (architecture principles) and `README.md:120-126` (regler att komma ihåg) |
| Long description, paragraph 3 — "17 specialiserade LLM-agenter" | `SKATTEREVISION-REBOOT/README.md:101-115` (agent-squad table) and `docs/SYSTEM_OVERVIEW.md:9-13` |
| Long description, paragraph 3 — "Gemini 3.5 Flash som frontier-klass" | `SKATTEREVISION-REBOOT/README.md:121` |
| Long description, paragraph 4 — "framgångsarvode 20–35% ... Gävleborg/Dalarna" | `SKATTEREVISION-REBOOT/docs/KONCEPT.md:92-93` (business model) and `MASTER.md:24-40` (pilot region) |
| Stack: "TypeScript, Express, iXBRL pipeline, 17 LLM agents, OpenRouter, SQLite + Qdrant, PDF dossiers" | `SKATTEREVISION-REBOOT/package.json:74` (dependencies) and `README.md:101-115` (agent-squad) |
| Status: PRODUCTION | existing showroom card; corroborates `MASTER.md:24-40` (active pilot, R3-pitch ready) |
| Keywords: "Swedish tax recovery", "retroactive tax", "iXBRL annual reports" | `SKATTEREVISION-REBOOT/docs/PRODUCT_POSITION.md:5-6` |
| Keywords: "R&D deductions Sweden" | `SKATTEREVISION-REBOOT/README.md:107` (fou-agent → SFL 16 kap. 4 §) |
| Keywords: "energy tax HFD 2022 ref. 38" | `SKATTEREVISION-REBOOT/README.md:108` (energirevision-spearhead) |
| Keywords: "Almi verifieringsmedel" | `SKATTEREVISION-REBOOT/ANSOKAN-ALMI-2026.md:5-8` |
| `href: /skatterevision.html` | existing showroom card |
| `ctaLabel: "Deep View"` | existing showroom card |
| `brandColor: cherry` | cherry is the Twisted Stacks "state" colour per `VR-SuperPowers/docs/BRAND.md:80-92` (production system → state colour) |
| `contactMessage` | existing showroom card |

---

## system_laga (LAGA)

> Swedish legal-AI workflow platform: MLX transcription, contradiction
> analysis, OpenRouter review.

| Field in catalog | Source |
| --- | --- |
| Tagline (existing) | `LAGA/README.md:3` (paraphrased from existing card) |
| Description (card summary, 117 words) | `LAGA/README.md:3,17` (workflow-platform framing + 4-node MVP), `LAGA/README.md:22-29` (MLX duty budget), `LAGA/README.md:55` (Contradictions panel, intra/inter-speaker filter) |
| Long description, paragraph 1 — "experimental Swedish legal workflow platform" | `LAGA/README.md:3` |
| Long description, paragraph 1 — "v0.1 MVP is a four-node graph" | `LAGA/README.md:17` ("Kör MVP — fyra noder") and `docs/node-compound-research.md:5` |
| Long description, paragraph 1 — "transcribe, contradiction detection, statutes" | `LAGA/ANSOKAN-ALMI-2026.md:16` (sammanfattning) |
| Long description, paragraph 2 — "not a generic chatbot" | `LAGA/README.md:3` (paraphrased contrast with chat UX) |
| Long description, paragraph 2 — "Contradictions panel filters by speaker" | `LAGA/README.md:55` (filtering instructions) |
| Long description, paragraph 3 — "MLX duty-budgeted" | `LAGA/README.md:22-29` (MLX_GPU_DUTY_TARGET=0.8, MAX_CONCURRENT_MLX=1, etc.) |
| Long description, paragraph 4 — "Almi Verifieringsmedel, Vinnova Innovativa Startups 2026" | `LAGA/ANSOKAN-ALMI-2026.md:5-8` and `docs/ANSLAG_TWISTEDSTACKS_2026.md:5-13` |
| Stack: "Vite, React Flow, Hono, MLX Whisper, OpenRouter, pnpm monorepo" | `LAGA/package.json:16` and `apps/web/package.json:25`, `apps/api/package.json:24` |
| Status: LAB / PAUSED | existing showroom card; corroborated by `LAGA/README.md:17` (live MVP, paused macOS shell) |
| Keywords: "Swedish legal AI" | `LAGA/ANSOKAN-ALMI-2026.md:29-32` |
| Keywords: "MLX Whisper Swedish" | `LAGA/README.md:22-29` (mlx-whisper, Apple Silicon) |
| Keywords: "contradiction analysis" | `LAGA/README.md:55` (Contradictions panel) |
| Keywords: "React Flow pipeline" | `LAGA/apps/web/package.json:25` (React Flow 12.6) |
| `href: /laga.html` | existing showroom card |
| `ctaLabel: "Deep View"` | existing showroom card |
| `brandColor: pearl` | pearl is the "mature" / "research" colour per `VR-SuperPowers/docs/BRAND.md:98-122` |
| `contactMessage` | existing showroom card |

---

## system_relay (Relay / THE-AI-BUTTON)

> Voice-first iOS relay for sending spoken tasks to reminders, mail, n8n,
> or AI agents without living inside a chat window.

| Field in catalog | Source |
| --- | --- |
| Tagline (existing) | `THE-AI-BUTTON/README.md:3,5` ("Note to AI. Note to Self." / "Voice-first iOS relay — say it, your agent does the rest.") |
| Description (card summary, 143 words) | `THE-AI-BUTTON/README.md:5,12-18` (skip-the-chat + two commands), `THE-AI-BUTTON/docs/VOICE-CONTROL-SETUP.md:60` (Apple pieces integration: Hey Siri, Action Button, Voice Control, App Intents), `THE-AI-BUTTON/Relay/project.yml:1-40` (Swift + SwiftUI, iOS 18+), `THE-AI-BUTTON/docs/SETUP-GUIDE.md:3` (TTS confirmation) |
| Long description, paragraph 1 — "skip the chat window" | `THE-AI-BUTTON/README.md:5` |
| Long description, paragraph 1 — "TTS confirmation" | `THE-AI-BUTTON/docs/SETUP-GUIDE.md:3` (pipeline ending in TTS confirmation) |
| Long description, paragraph 2 — "two commands" | `THE-AI-BUTTON/README.md:12-18` (table of two commands) |
| Long description, paragraph 2 — "Note to AI / Note to Self" | `THE-AI-BUTTON/README.md:14-17` |
| Long description, paragraph 2 — "tradesman / construction site" | `THE-AI-BUTTON/ANSOKAN-ALMI-2026.md:24-25` ("bygg, altan, trädäck") |
| Long description, paragraph 3 — "Hey Siri, Action Button, Voice Control, App Intents" | `THE-AI-BUTTON/docs/VOICE-CONTROL-SETUP.md:60` ("Apple exposes the pieces ... never connects them ... Relay is the installer + config layer") |
| Long description, paragraph 3 — "Swedish on-device STT (sv-SE)" | `THE-AI-BUTTON/Relay/project.yml:55-65` (permissions) and `docs/README.md:50-60` (sv-SE default) |
| Long description, paragraph 3 — "n8n Intent Parser, Airtable, 46elks SMS" | `THE-AI-BUTTON/docs/SETUP-GUIDE.md:131` (4-second pipeline) |
| Long description, paragraph 4 — "Swift + SwiftUI, iOS 18+, Xcodegen, bundle id" | `THE-AI-BUTTON/Relay/project.yml:1-40` (Xcodegen spec) |
| Long description, paragraph 4 — "Almi Verifieringsmedel, Vinnova" | `THE-AI-BUTTON/ANSOKAN-ALMI-2026.md:5-8` and `docs/ANSLAG_TWISTEDSTACKS_2026.md:5-13` |
| Stack: "Swift, SwiftUI, iOS 18, Hey Siri, n8n webhook, Airtable" | `THE-AI-BUTTON/Relay/project.yml:1-40` and `docs/SETUP-GUIDE.md:3` |
| Status: ACTIVE DEMO | existing showroom card; corroborated by `THE-AI-BUTTON/README.md:21` (working v0.1 prototype) |
| Keywords: "voice-first iOS" | `THE-AI-BUTTON/README.md:5` |
| Keywords: "Siri shortcut, Action Button" | `THE-AI-BUTTON/docs/VOICE-CONTROL-SETUP.md:60` |
| Keywords: "tradesman AI" | `THE-AI-BUTTON/ANSOKAN-ALMI-2026.md:24-25` |
| Keywords: "n8n webhook" | `THE-AI-BUTTON/docs/SETUP-GUIDE.md:3` |
| Keywords: "Swedish on-device STT" | `THE-AI-BUTTON/docs/README.md:50-60` (sv-SE on-device) |
| Keywords: "anti-subscription app" | `THE-AI-BUTTON/ANSOKAN-ALMI-2026.md:26` ("Engångsköp ~10 kr/app (ej prenumeration)") |
| `href: null` (no public page) | existing showroom card; `ctaLabel: "Private"` is intentional |
| `brandColor: accent` | accent (baby blue) is the active / interactive state per `VR-SuperPowers/docs/BRAND.md:62-74` |

---

## system_recon (Recon Search Assistant)

> Authorized recon and triage — not a public demo yet.

| Field in catalog | Source |
| --- | --- |
| Tagline (existing) | `Recon-Search-Assistant/README.md:3,5` (paraphrased; existing card already framing) |
| Description (card summary, 125 words) | `Recon-Search-Assistant/README.md:1,11-28` (defensive security framing, 115+ dorks, AI triage, Supabase), `Recon-Search-Assistant/README.md:62-65` (GitHub Pages static deploy → Vercel env migration), `Recon-Search-Assistant/README.md:95-96` (legitimate-research disclaimer) |
| Long description, paragraph 1 — "defensive security research workbench" | `Recon-Search-Assistant/README.md:95-96` (disclaimer: "legitimate security research and bug bounty hunting purposes only") |
| Long description, paragraph 1 — "115+ Google dorks" | `Recon-Search-Assistant/README.md:21-28` (dork categories) |
| Long description, paragraph 1 — "SerpAPI in-app search, OpenRouter AI triage" | `Recon-Search-Assistant/README.md:13-14` |
| Long description, paragraph 2 — "paused from public showroom" | `Recon-Search-Assistant/README.md:62-65` (GitHub Pages static deploy) and existing showroom card "Vercel env / API keys" |
| Long description, paragraph 2 — "user-account, dashboard, history, saved-search" | `Recon-Search-Assistant/README.md:11-19` |
| Long description, paragraph 3 — "lab for authorized bug-bounty and defensive research" | `Recon-Search-Assistant/README.md:95-96` (disclaimer) |
| Stack: "Static SPA, SerpAPI, OpenRouter, Supabase, Bug-bounty dorks" | `Recon-Search-Assistant/README.md:30-52` (file structure) and `41-45` (js modules) |
| Status: LAB / PAUSED | existing showroom card |
| Keywords: "defensive security" | `Recon-Search-Assistant/README.md:1,95-96` (defensive framing) |
| Keywords: "bug bounty dorks" | `Recon-Search-Assistant/README.md:21-28` |
| Keywords: "OSINT triage" | `Recon-Search-Assistant/README.md:11-19` (AI vulnerability analysis) |
| Keywords: "SerpAPI" | `Recon-Search-Assistant/README.md:13` |
| Keywords: "OpenRouter findings" | `Recon-Search-Assistant/README.md:14` (AI Vulnerability Analysis) |
| `href: /recon.html` | existing showroom card |
| `ctaLabel: "Deep View"` | existing showroom card |
| `brandColor: emf` | EMF is the "behind-the-walls / sensing" sensor accent per `VR-SuperPowers/docs/BRAND.md:131-145` (sensor accents) |
| `contactMessage` | existing showroom card |

---

## system_anslag (Anslag)

> Hitta fonder, stipendier och andra anslag till ditt projekt.

| Field in catalog | Source |
| --- | --- |
| Tagline (existing) | `REVIEW_PROJECTS/wawawee/AnslagSITK/README.md:3` and `info.md:3` (existing card is already in Swedish) |
| Description (card summary, 116 words, Swedish) | `REVIEW_PROJECTS/wawawee/AnslagSITK/README.md:60-90` (Vinnova/Formas/Forte/VR + EU + Almi + stiftelser; bred/smal search), `REVIEW_PROJECTS/wawawee/AnslagSITK/info.md:3` (Vite 7 / Tailwind v3 stack), `REVIEW_PROJECTS/wawawee/AnslagSITK/README.md:60-80` (multi-account OpenRouter gateway, 7 keys), `CymWave/docs/ANSLAGSITK_INTEGRATION.md:5-27` (sister-project usage) |
| Long description, paragraph 1 — "free Swedish grant-discovery and draft-writing app" | `REVIEW_PROJECTS/wawawee/AnslagSITK/README.md:3` and AnslagSITK live site |
| Long description, paragraph 1 — "Vinnova, Formas, Forte, VR, Tillväxtverket, EU, Almi, stiftelser" | `REVIEW_PROJECTS/wawawee/AnslagSITK/README.md:60-90` (sources and discovery flow) |
| Long description, paragraph 2 — "Vite 7, Tailwind v3, shadcn/ui, Node 20" | `REVIEW_PROJECTS/wawawee/AnslagSITK/info.md:3` (Vite v7.2.4, Tailwind v3.4.19) |
| Long description, paragraph 2 — "multi-account OpenRouter gateway, 7 keys" | `REVIEW_PROJECTS/wawawee/AnslagSITK/README.md:60-80` (failover) |
| Long description, paragraph 2 — "gemini-2.5-flash-lite best free model" | `REVIEW_PROJECTS/wawawee/AnslagSITK/README.md:60-80` (free models section) |
| Long description, paragraph 3 — "bred / narrow search modes, model-tier selector" | `REVIEW_PROJECTS/wawawee/AnslagSITK/README.md:50-70` (model tier selector) |
| Long description, paragraph 3 — "open and free" | AnslagSITK live site positioning |
| Stack: "Vite, Tailwind, shadcn/ui, OpenRouter, Exa, Node 20" | `REVIEW_PROJECTS/wawawee/AnslagSITK/info.md:3` and `package.json` |
| Status: SHIPPED | existing showroom card; site is live at `anslag.twistedstacks.com` |
| Keywords: "Swedish grants, Vinnova, Formas, Almi, stipendier" | `REVIEW_PROJECTS/wawawee/AnslagSITK/README.md:60-90` (sources) |
| `href: https://anslag.twistedstacks.com/` | existing showroom card |
| `ctaLabel: "Live Demo"` | existing showroom card |
| `brandColor: accent` | accent (baby blue) is the active / interactive state |
| `longDescriptionLang: sv` | public site is Swedish-first |

---

## system_vr_superpowers (VR Super-Senses / Twisted SuperSenses)

> See the invisible world: WiFi, heat, RF, and EMF in passthrough VR.

| Field in catalog | Source |
| --- | --- |
| Tagline (existing) | `VR-SuperPowers/README.md:3` ("See the invisible world in VR") |
| Description (card summary, 148 words) | `VR-SuperPowers/README.md:1-13` (architecture diagram: ESP32 → Python hub → Unity/Quest/iOS), `VR-SuperPowers/README.md:16-32` (capability matrix honest framing), `VR-SuperPowers/README.md:203` + `docs/WIFI-CSI-WALL-MESH.md:5` (privacy posture, receive-only by default), `VR-SuperPowers/docs/MODULAR-PLATFORM.md:11-31` (6 sensor layers + fusion + stimulus) |
| Long description, paragraph 1 — "open sensor mesh" | `VR-SuperPowers/README.md:1-13` and `docs/MODULAR-PLATFORM.md:1-3` |
| Long description, paragraph 1 — "RF auroras, thermal, WiFi, EMF, AC, CSI" | `VR-SuperPowers/README.md:3` (tagline layers) |
| Long description, paragraph 1 — "tagline: See the invisible world in VR" | `VR-SuperPowers/README.md:3` |
| Long description, paragraph 2 — "tiered architecture, ESP32-S3, Python WebSocket hub" | `VR-SuperPowers/README.md:7-13` and `docs/MODULAR-PLATFORM.md:11-31` |
| Long description, paragraph 2 — "v1.0 / v1.1 / v1.2 protocol" | `VR-SuperPowers/docs/PROTOCOL.md:1-50` and `docs/PROTOCOL-v1.1.md:1-50` |
| Long description, paragraph 2 — "Unity 6 + URP + Meta XR SDK, ARKit + LiDAR" | `VR-SuperPowers/unity/README.md:1-20` and `ios/README.md:1-20` |
| Long description, paragraph 3 — "capability matrix, AR live, others partial" | `VR-SuperPowers/README.md:16-32` (capability matrix) |
| Long description, paragraph 3 — "privacy posture, receive-only by default" | `VR-SuperPowers/README.md:203` and `docs/WIFI-CSI-WALL-MESH.md:5` |
| Long description, paragraph 4 — "Flipper Zero + AIO Multiboard v1.4" | `VR-SuperPowers/docs/FLIPPER-MULTIBOARD.md:1-30` |
| Long description, paragraph 4 — "brand quote: Materially warm, technically cool" | `VR-SuperPowers/docs/BRAND.md:12-13` |
| Stack: "Unity 6, Meta XR SDK, Meta Quest, ESP32-S3, Python WebSocket hub, ARKit + LiDAR" | `VR-SuperPowers/README.md:7-13` and `unity/README.md:1-20`, `ios/README.md:1-20` |
| Status: HARDWARE LAB | existing showroom card; matches `VR-SuperPowers/README.md:16-32` capability matrix |
| Keywords: "VR sensor mesh" | `VR-SuperPowers/README.md:1-13` |
| Keywords: "Meta Quest passthrough" | `VR-SuperPowers/README.md:3` and `unity/README.md:1-20` |
| Keywords: "ESP32 sensor network" | `VR-SuperPowers/README.md:7-13` |
| Keywords: "RF visualisation" | `VR-SuperPowers/docs/MODULAR-PLATFORM.md:11-31` |
| Keywords: "WiFi CSI motion" | `VR-SuperPowers/docs/WIFI-CSI-WALL-MESH.md:1-10` |
| Keywords: "thermal heat vision AR" | `VR-SuperPowers/README.md:3` and `docs/SENSOR-ROADMAP.md:40-48` |
| Keywords: "Twisted SuperSenses" | `VR-SuperPowers/docs/BRAND.md:1-7` (brand source-of-truth) |
| `href: /vr-superpowers` | existing showroom card |
| `ctaLabel: "Visualize"` | existing showroom card |
| `brandColor: rf` | RF is one of the six sensor accents per `VR-SuperPowers/docs/BRAND.md:131-145` |

---

## system_cymwave (CymWave)

> Programmable water, sound, light, and guided relaxation journeys.

| Field in catalog | Source |
| --- | --- |
| Tagline (existing) | `CymWave/README.md:3,44` (preferred language: "A programmable immersive hydro-wellness experience for deep relaxation and memorable spa journeys") |
| Description (card summary, 143 words) | `CymWave/README.md:3,11-19` (immersive bath / float framing + 6 components), `CymWave/README.md:5,48` (do-not-overclaim-medical-effects), `CymWave/README.md:7` (aviation vibration-testing specialist), `CymWave/docs/PRODUCT_ROADMAP.md:5-50` (Phase 0 / Phase 1), `CymWave/docs/GRANT_STRATEGY.md:5-50` (Vinnova Test och Demo, Almi Verifieringsmedel) |
| Long description, paragraph 1 — "early-stage Swedish wellness-technology project" | `CymWave/README.md:3` |
| Long description, paragraph 1 — "warm water, controlled massage / vibration, audio, light, guided journeys" | `CymWave/README.md:11-19` |
| Long description, paragraph 2 — "not overclaim medical effects" | `CymWave/README.md:5` |
| Long description, paragraph 2 — "avoid claims: treats anxiety, depression, chronic pain" | `CymWave/README.md:48` |
| Long description, paragraph 2 — "boutique hotels, destination spas, retreat centres" | `CymWave/README.md:22-27` and `docs/RESEARCH_BRIEF.md:14-56` |
| Long description, paragraph 3 — "aviation vibration-testing specialist" | `CymWave/README.md:7` |
| Long description, paragraph 3 — "Phase 0, Phase 1" | `CymWave/docs/PRODUCT_ROADMAP.md:5-50` |
| Long description, paragraph 4 — "Vinnova Test och Demo, Almi Verifieringsmedel, AnslagSITK" | `CymWave/docs/GRANT_STRATEGY.md:5-50` and `docs/ANSLAGSITK_INTEGRATION.md:1-30` |
| Long description, paragraph 4 — "cymatic visualisation, 'pieces for the body'" | `CymWave/docs/LEGACY_CONCEPT_NOTES.md:8-15` |
| Stack: "Hydrotherapy, Vibration R&D, Spatial audio, Light scenes, Grant-funded prototype" | `CymWave/README.md:11-19` and `docs/PRODUCT_ROADMAP.md:5-50` |
| Status: ACTIVE DEMO | existing showroom card; matches `CymWave/README.md:22-27` (active Phase 0) |
| Keywords: "hydro-wellness" | `CymWave/README.md:3` |
| Keywords: "spa journey" | `CymWave/README.md:3,44` |
| Keywords: "cymatic water" | `CymWave/docs/LEGACY_CONCEPT_NOTES.md:8-15` |
| Keywords: "immersive bath" | `CymWave/README.md:3,11-19` |
| Keywords: "Swedish wellness tech" | `CymWave/README.md:3` |
| Keywords: "Vinnova Test och Demo" | `CymWave/docs/GRANT_STRATEGY.md:5-50` |
| `href: https://github.com/wawawee/CymWave` | existing showroom card |
| `ctaLabel: "GitHub"` | existing showroom card |
| `brandColor: thermal` | thermal is the warm/heat sensor accent per `VR-SuperPowers/docs/BRAND.md:131-145` |

---

## system_silversmeden (Silversmeden)

> Clean craft site for a working silversmith.

| Field in catalog | Source |
| --- | --- |
| Tagline (existing) | `SILVERSMEDEN/index.html` and live site (existing card) |
| Description (card summary, 147 words) | Live site `silversmeden.twistedstacks.com` (layout, product list depth, photography-as-hero), `SILVERSMEDEN/package.json` + `SILVERSMEDEN/vite.config.ts` (Vite + Vercel stack), user_profile (Per's framing: "How do you sell hand-made silver without a 'buy now' shop that overwhelms an older customer?"). See `projects-audit.md` §1 — long description is paraphrased from the live site because the project README is an AI-Studio template. |
| Long description, paragraph 1 — "quiet public site for a working silversmith" | `SILVERSMEDEN/index.html` (live site) |
| Long description, paragraph 1 — "intentionally not a portfolio-app showcase" | inferred from live site structure and existing showroom card ("TEXTURE: CLEAN") |
| Long description, paragraph 2 — "first shipped TwistedStacks client engagement" | user profile context (Per's own description in user_profile) and live site |
| Long description, paragraph 2 — "Vite, Vercel, operated by the silversmith" | `SILVERSMEDEN/package.json` (Vite config + vercel.json in repo) |
| Long description, paragraph 2 — "restrained design, photography is the hero" | live site observation; matches user_profile design preference for clean landing surfaces |
| Stack: "Vite, Vercel, Hand-tuned CSS, Static-first, Client" | `SILVERSMEDEN/package.json` and `SILVERSMEDEN/vite.config.ts` |
| Status: SHIPPED | existing showroom card; matches live site |
| Keywords: "silversmith site" | `SILVERSMEDEN/index.html` and live site |
| Keywords: "craft e-commerce" | inferred from live site + user profile |
| Keywords: "restrained design" | user profile design preference |
| `href: https://silversmeden.twistedstacks.com/` | existing showroom card |
| `ctaLabel: "Live"` | existing showroom card |
| `brandColor: pearl` | pearl is the "mature craft" colour per `VR-SuperPowers/docs/BRAND.md:98-122` |

> **Note**: the existing `SILVERSMEDEN/README.md` is a generic AI-Studio template (boilerplate). Long descriptions for this project come from the live site (`silversmeden.twistedstacks.com`) and from user_profile context. See `projects-audit.md` for the gap.

---

## system_arena (TWISTED PONGG)

> Self-pass square court with spin. The homepage itself is playable.

| Field in catalog | Source |
| --- | --- |
| Tagline (existing) | existing showroom card |
| Description (card summary, 156 words) | `src/App.tsx:1-100` (existing imports and game-engine state vault), `src/brand/twisted-stacks.css:7-50` + `VR-SuperPowers/docs/BRAND.md:1-160` (warm-brown / baby-blue / cherry / pearl brand language), `src/leaderboard.ts` + `src/App.tsx:374-407` (Supabase global / local scoreboard fallback), `src/App.tsx:518-520` + `3796-3812` (difficulty picker) |
| Long description, paragraph 1 — "playable front door of the TwistedStacks showroom" | existing showroom card + the showroom grid that lives in this same App.tsx |
| Long description, paragraph 1 — "portfolio sits on top of a working four-paddle arcade game" | existing showroom card ("Self-pass square court with spin") |
| Long description, paragraph 2 — "physics, spin, curve, corner-combo, monster bricks, centre motif, audio engine" | `src/App.tsx:1-100` (existing imports and game-engine state vault) and `src/ballPhysics.ts`, `src/monsters.ts`, `src/centerMotif.ts`, `src/gameplayMusic.ts` |
| Long description, paragraph 2 — "hand-rolled" | `src/App.tsx` (single-file game engine, no wrapper library) |
| Long description, paragraph 2 — "casual / hardcore / impossible difficulty picker" | `src/App.tsx:518-520` and `3796-3812` (difficulty-dock UI) |
| Long description, paragraph 2 — "Supabase global / local scoreboard" | `src/leaderboard.ts` and `src/App.tsx:374-407` (remote leaderboard fallback) |
| Long description, paragraph 3 — "showroom grid, scoreboard, contact FAB, easter-vault cabinet" | `src/index.css:520-700` and `src/App.tsx:3900-4010` (showroom modal) |
| Long description, paragraph 3 — "warm-brown ramp, baby-blue accent, cherry state, pearl primary" | `src/brand/twisted-stacks.css:7-50` and `VR-SuperPowers/docs/BRAND.md:1-160` (full brand book) |
| Long description, paragraph 3 — "vault opens; cabinet is the dev-mode architecture directory" | `src/App.tsx:3830-3898` (easter-vault panel) and `3883-3894` (Open Archive button) |
| Long description, paragraph 4 — "the actual systems live behind the cards" | inferred from showroom section / the dev-only modal |
| Stack: "React, Three.js, WebGL, Vite, Supabase" | `package.json:15-21` (deps) and `src/App.tsx:6-7` (React + THREE imports) |
| Status: ACTIVE DEMO | existing showroom card |
| Keywords: "playable portfolio, Twisted Pongg, Three.js arcade, WebGL four-paddle, supabase leaderboard, ambient landing" | `package.json:3` and existing showroom card |
| `href: null` | existing showroom card (no separate page; it IS the page) |
| `ctaLabel: "Play"` | existing showroom card |
| `brandColor: accent` | accent (baby blue) is the primary interactive accent |

---

## Cross-project sources

The following cross-project sources were used to inform field values:

- **Brand colour tokens** (cherry, pearl, accent, sensor accents): `VR-SuperPowers/docs/BRAND.md:19-160` (palette origin, accent, cherry, pearl, sensor accents, status)
- **Twisted Stacks naming + showroom domain**: `VR-SuperPowers/docs/BRAND.md:1-7,366-383` (brand source-of-truth, Twisted Pongg exception)
- **Company info** (TWISTEDSTACKS AB, Sandviken, dev@twistedstacks.com): `SKATTEREVISION-REBOOT/ANSOKAN-ALMI-2026.md:10-25`, `LAGA/ANSOKAN-ALMI-2026.md:10-15`, `THE-AI-BUTTON/ANSOKAN-ALMI-2026.md:10-15`
- **Sister-project relationships** (AnslagSITK shared engine, shared Vinnova pipeline): `CymWave/docs/ANSLAGSITK_INTEGRATION.md:5-27`, `LAGA/docs/ANSLAG_TWISTEDSTACKS_2026.md:5-13`, `THE-AI-BUTTON/docs/ANSLAG_TWISTEDSTACKS_2026.md:5-13`

---

## What was NOT read (per global rules)

- `SKATTEREVISION-REBOOT/.env` (8.5 KB) — secrets
- `SKATTEREVISION-REBOOT/TASKLIST.md` (164 KB) — too large
- `SKATTEREVISION-REBOOT/data_index_master.sqlite.moved_local_backup` (13.4 GB) — binary
- `SKATTEREVISION-REBOOT/server.ts` (63 KB) — already covered by `MASTER.md`
- `THE-AI-BUTTON/possible_passwords.log` (125 bytes) — per global rule
- All `node_modules/`, `dist/`, `.git/`, and other build/cache directories
- All media files (PNG/JPG/MP4/MOV) — only their filenames referenced
- `REVIEW_PROJECTS/_review_inventory.json` (1152 lines) — internal review-bucket inventory, not relevant to public catalog
- `REVIEW_PROJECTS/Untitled-1.yml` — contains GitHub account tokens
