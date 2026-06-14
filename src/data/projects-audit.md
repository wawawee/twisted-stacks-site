# Project content audit — gaps that need Per-input

The catalog in `src/data/projects.ts` was built by reading existing source
folders and pulling long-form descriptions out of the documents that are
already there. This file lists the cases where the source folder did not
give us enough material to fill the longDescription, the keywords, or the
brandColor with confidence.

Anything listed here is **deliberately short in the catalog** until Per
adds the missing context. The catalog has not invented any of these facts.

---

## High-priority gaps (directly visible to the visitor)

### 1. Silversmeden — no project README
**Status**: shipped client site, but `/Users/perbrinell/Documents/SILVERSMEDEN/README.md`
is a generic "Run and deploy your AI Studio app" boilerplate (20 lines,
Gemini template). The real product story is in the live site
(`silversmeden.twistedstacks.com`).

**Current state in catalog**:
- longDescription is 1 paragraph, paraphrased from the live site + the
  user_profile design preference
- stack is `["Vite", "Vercel", "Hand-tuned CSS", "Static-first", "Client"]`
- brandColor is `pearl` (mature craft)

**What's missing**:
- Per's actual narrative: is Silversmeden the first client engagement in a
  line of craft-business sites, or a one-off?
- Real features: is there a shop, or just a portfolio? What's the
  maintenance story?
- Photo/visual language: does the site carry the Twisted palette
  (warm brown / baby blue / cherry / pearl), or does it follow the
  silversmith's own brand?
- Customer / case-study anecdote Per is willing to publish

**Why it matters**: the showroom card promises a "restrained craft site",
which is honest but thin. Per-input would let us write a stronger
narrative without overclaiming.

### 2. Recon Search Assistant — paused, scope unclear
**Status**: lab / paused. The original repo's README is detailed (110 lines,
lists 115+ dorks, dork categories, monetization tiers), but the TwistedStacks
positioning is different from the original author's framing.

**Current state in catalog**:
- longDescription is 3 paragraphs, framed as "defensive security research
  workbench" with explicit "not offensive" disclaimer
- stack is `["Static SPA", "SerpAPI", "OpenRouter", "Supabase", "Bug-bounty dorks"]`
- brandColor is `emf` (behind-the-walls sensing)

**What's missing**:
- TwistedStacks' specific stake in the project: is it a sister product
  in the Vinnova pipeline, or a side-quest that has stalled?
- Should it stay in the showroom at all while paused, or be hidden until
  the env migration lands?
- If kept: do we want a more focused TwistedStacks readme alongside the
  original 110-line one, so the showroom card doesn't have to summarise
  the dork-list?

**Why it matters**: the user_profile notes that this is one of the
showroom entries Per has personally tied to sister-product grant work.
The card should reflect that, not just "defensive dork engine".

### 3. VR-SuperPowers / Twisted SuperSenses — many sub-stories, hard to pick one
**Status**: the source folder has 13+ docs (`BRAND.md`, `MODULAR-PLATFORM.md`,
`PROTOCOL.md`, `SENSOR-ROADMAP.md`, `WIFI-CSI-WALL-MESH.md`, `iOS_AR_RESEARCH.md`,
`FLIPPER-MULTIBOARD.md`, `SHOPPING-LIST.md`, `firmware/README.md`,
`ios/README.md`, `unity/README.md`, `hub/README.md`).

**Current state in catalog**:
- longDescription is 4 paragraphs covering tiered architecture, capability
  matrix, privacy posture, and the brand voice
- stack is `["Unity 6", "Meta XR SDK", "Meta Quest", "ESP32-S3",
  "Python WebSocket hub", "ARKit + LiDAR"]`
- brandColor is `rf` (one of the six sensor accents)

**What's missing**:
- A single sentence Per is willing to put in front of a grant reviewer
  that captures the *thesis* of the project (the "corporate cyberpunk 700
  years later" angle is in the brand book but the public tagline "See the
  invisible world in VR" doesn't land the same way to a non-VR reader)
- Which sensor layer Per considers the killer demo right now (RF auroras?
  CSI presence ghosts? AC live-wire? Thermal?) — the long description
  lists all six but doesn't pick
- Pitch line for the Almi / Vinnova angle — currently the catalog carries
  the brand book and the technical capability but not the funding story
  (the Vinnova ansökan lives in the SkatteRevision/LAGA sister-project
  structure, not in the VR folder)

**Why it matters**: the VR project is the most "showroom-worthy" of the
lot, but the catalog currently treats it the same as CymWave (one
paragraph per topic). Per could make the VR card the lead in the
"what TwistedStacks actually ships" narrative.

---

## Lower-priority gaps

### 4. AnslagSITK — longDescription is in Swedish, but the catalog is otherwise English
**Status**: Anslag is the only project whose `longDescription` is in Swedish
(language set in `longDescriptionLang: "sv"`). This is correct because the
public site is Swedish-first and the user is Swedish.

**What's missing**:
- An English version of the long description, for the (smaller)
  international grant-discovery audience
- Real customer metrics: number of grants searched / drafts generated /
  organisations using the tool
- A specific case study (e.g. "CymWave used AnslagSITK to draft its Vinnova
  Test och Demo application in N days")

**Why it matters**: low. The card works as-is. English version is nice-to-have.

### 5. Relay (THE-AI-BUTTON) — pricing is undecided
**Status**: v0.1 prototype, working code, Almi application in flight.
The "one-time purchase ~$0.99 / ~10 SEK" pricing is in the Almi
ansökan, not in the README.

**Current state in catalog**:
- longDescription is 4 paragraphs covering skip-the-chat, two commands,
  Apple-pieces integration, and build stack
- stack is `["Swift", "SwiftUI", "iOS 18", "Hey Siri", "n8n webhook",
  "Airtable"]`
- brandColor is `accent`

**What's missing**:
- Confirmation of pricing model ("one-time purchase, anti-subscription"
  is in the Almi ansökan, not yet a public commitment)
- Any demo video / screenshot of the setup wizard (would help the
  showroom card a lot)
- TestFlight / beta signup link, if one exists

**Why it matters**: the card is honest about "no public demo yet" but
Per's own user_profile calls Relay a "consumer-facing" project, so the
showroom entry may be underselling it.

### 6. CymWave — phase is "0 (concept recovery)" but card says "active demo"
**Status**: existing showroom card says `ACTIVE DEMO`, but CymWave is at
Phase 0 (concept recovery, customer interviews) per `PRODUCT_ROADMAP.md`.

**What's missing**:
- Should the showroom card status be downgraded to `LAB / PAUSED` or
  `INFO` until Phase 1 starts? The catalog currently inherits the
  existing card's `ACTIVE DEMO` status, but the source folder says
  Phase 0.
- Confirmation that the "active demo" framing is the public stance
  (i.e. CymWave is being pitched as an active concept, not a paused
  project)

**Why it matters**: small. The card works either way, but a 1-2
sentence Per-input on the phase question would let us align the
status badge with the roadmap.

---

## What we are NOT missing

For each of the following, the source folders gave us enough material to
write a confident 3-4 paragraph long description:

- **REVISION (SkatteRevision)**: `MASTER.md`, `CLAUDE.md`, `AGENTS.md`,
  `ANSOKAN-ALMI-2026.md`, `KONCEPT.md`, `SYSTEM_OVERVIEW.md` — rich.
- **LAGA**: `README.md`, `ANSOKAN-ALMI-2026.md`, `docs/*.md` — sufficient.
- **TWISTED PONGG**: lives in this same repo. The long description is
  derived from `App.tsx`, `brand/twisted-stacks.css`, and `BRAND.md` —
  no gap.

---

## How Per should provide input

For each gap, one of the following is enough:

1. A 1-2 sentence comment in the showroom back-channel (Discord / mail /
   in-person), then a 5-minute edit of `src/data/projects.ts` by the
   next agent that touches the catalog.
2. A short paragraph Per drops into the relevant source folder
   (e.g. an `ABOUT.md` in `SILVERSMEDEN/`, a `TWISTEDSTACKS_POSITION.md`
   in `VR-SuperPowers/`), which the next catalog pass picks up.
3. A direct update of the `longDescription`, `tagline`, or `ctaLabel`
   field in `src/data/projects.ts` — Per has full edit access.

The catalog is structured to be re-extendable; new fields can be added
later without breaking the existing UI. See `src/data/projects.ts` for
the current `ProjectEntry` shape.
