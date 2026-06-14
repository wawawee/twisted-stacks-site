/**
 * TwistedStacks — extended project catalog
 *
 * Each entry extends the `ShowroomProject` shape already used in App.tsx
 * (name, version, tagline, description, status, techStack, telemetry,
 *  href, actionLabel, contactMessage) with the SEO/long-form fields used
 * by the read-more panel and the standalone HTML pages.
 *
 * All facts here were extracted from the per-project source folders on
 * 2026-06-14. See `docs/projects/README-sources.md` for the file and
 * line-number trail behind every claim, and `docs/projects/projects-audit.md`
 * for projects that need Per-input before they can be expanded further.
 *
 * This module is the single source of truth that both the React showroom
 * (App.tsx) and the static HTML pages (laga.html, skatterevision.html,
 * recon.html) read from at build time / hand-curation time.
 */

export type ProjectStatus =
  | "live"
  | "info"
  | "pending"
  | "private"
  | "paused"
  | "demo";

export type SensorAccent =
  | "rf"
  | "wifi"
  | "thermal"
  | "emf"
  | "ac"
  | "presence"
  | "cherry"
  | "pearl"
  | "accent"
  | "none";

/**
 * Maps the showroom `status` field (already in App.tsx) to a small,
 * URL-friendly slug used by the read-more panel and the audit doc.
 */
export type ProjectId =
  | "system_skatterevision"
  | "system_laga"
  | "system_relay"
  | "system_recon"
  | "system_anslag"
  | "system_vr_superpowers"
  | "system_cymwave"
  | "system_silversmeden"
  | "system_arena";

export interface ProjectEntry {
  id: ProjectId;
  /** Display name shown on the card and HTML hero. */
  name: string;
  /** Short headline shown next to the name. */
  version: string;
  /** One-sentence pitch (the line under the name). */
  tagline: string;
  /** Short card description — already shown in the existing UI. */
  description: string;
  /** Long-form description for the expanded read-more panel (3-5 paragraphs). */
  longDescription: string;
  /** Tech stack chips. */
  stack: string[];
  /** Status badge — maps to one of the existing showroom values. */
  status: string;
  /** Public URL or local HTML page. `null` for projects without one. */
  href: string | null;
  /** CTA button label. */
  ctaLabel: string;
  /** Accent to highlight the card with (for sensor-themed projects). */
  brandColor: SensorAccent;
  /** True for the 5-6 hero projects; controls ordering. */
  featured: boolean;
  /** SEO keywords — natural, not stuffed. */
  keywords: string[];
  /** ISO date of the last meaningful source-document update. */
  lastUpdated: string;
  /** Pre-filled contact form message, when no public destination exists. */
  contactMessage?: string;
  /** Optional list of 2-4 KPIs shown in the existing telemetry strip. */
  telemetry: { label: string; value: string }[];
  /** Language for the long-form description. */
  longDescriptionLang: "en" | "sv";
}

/* ---------------------------------------------------------------------------
   Projects
   --------------------------------------------------------------------------- */

export const PROJECTS: ProjectEntry[] = [
  /* ---------- 1. REVISION / SkatteRevision ---------- */
  {
    id: "system_skatterevision",
    name: "REVISION",
    version: "working product / private demo",
    status: "PRODUCTION",
    tagline:
      "Lead discovery for retroactive Swedish tax recovery — not org-number lookup.",
    description:
      "REVISION is a retroactive Swedish tax-recovery engine that turns historical iXBRL annual reports (2019–2025) into audit-grade dossiers with full source citations. It identifies missed positions in R&D deductions, industrial energy tax, vehicle-leasing VAT and property VAT, anchored to relevant HFD precedents. The system is built as a complement to the audit firm, not a replacement: the byrå keeps customer, attestation and final responsibility while REVISION delivers ready-mined intelligence. A squad of seventeen specialised LLM agents — including a dual-critic gate (kritikern red-team, verifikator positive-evidence) and a zero-hallucination protocol — runs the analysis. The moat is finding the right leads, then building sourced dossiers that hold up to professional scrutiny.",
    longDescription:
      "REVISION — internally SkatteRevision / Anlagstavlan — is a retroactive Swedish tax-recovery engine. It analyses historical iXBRL annual reports (2019–2025) from Bolagsverket to identify missed tax positions in R&D deductions (FoU-avdrag), industrial energy tax (energiskatt), vehicle-leasing VAT (leasingmoms) and property VAT (fastighetsmoms). The output is audit-grade PDF dossiers where every number carries a source citation, anchored to the relevant HFD precedent.\n\nThe system is a complement to the audit firm, not a replacement. The byrå keeps the customer relationship, the attestation and the final responsibility; REVISION delivers ready-mined intelligence with the legal reasoning attached. The product thesis is direct: 'Nothing is Done until Proven' — every claim has a `source` field, and the system returns `INSUFFICIENT_DATA` rather than estimate.\n\nA squad of seventeen specialised LLM agents runs the analysis: fou-agent for R&D, energirevision-spearhead for industrial energy tax, leasing-auditoren for K3 leasing, fastighetsmomsaren for property VAT, kritikern (red-team) and verifikator (positive-evidence) as a dual-critic gate, mimir for live web/SKV intelligence, plus orchestrator, risk, sentinel, pitch and code-review agents. Models are routed through OpenRouter with Gemini 3.5 Flash as frontier-class for synthesis and lead work.\n\nThe business model is success-fee: 20–35% of actually recovered tax, split with the byrå. The customer pays nothing if nothing is recovered. The current pitch focus is Gävleborg/Dalarna manufacturing SMEs, 10–250 anställda, with active Almi, ERUF and Vinnova applications in flight.",
    stack: [
      "TypeScript",
      "Express",
      "iXBRL pipeline",
      "17 LLM agents",
      "OpenRouter",
      "SQLite + Qdrant",
      "PDF dossiers",
    ],
    href: "/skatterevision.html",
    ctaLabel: "Deep View",
    brandColor: "cherry",
    featured: true,
    keywords: [
      "Swedish tax recovery",
      "retroactive tax",
      "iXBRL annual reports",
      "R&D deductions Sweden",
      "energy tax HFD 2022 ref. 38",
      "audit dossiers",
      "Swedish SME tax",
      "Almi verifieringsmedel",
    ],
    lastUpdated: "2026-06-14",
    contactMessage:
      "Hej Per,\n\nJag vill boka en full demonstration av REVISION-systemet.\n\n",
    telemetry: [
      { label: "MODE", value: "DOSSIERS" },
      { label: "DATA", value: "HISTORIC" },
      { label: "STATUS", value: "DEMO" },
    ],
    longDescriptionLang: "en",
  },

  /* ---------- 2. LAGA ---------- */
  {
    id: "system_laga",
    name: "LAGA",
    version: "legal workflow / paused lab",
    status: "LAB / PAUSED",
    tagline:
      "Swedish legal media to structured review — workflow, not chat.",
    description:
      "LAGA is an experimental Swedish legal-AI workflow platform for turning long-form legal media into structured review material. Audio and video flow through a four-node React Flow graph — Media, Transcribe, Analyze, Eval — with a run monitor and traceable artifacts under each run folder. Local MLX Whisper handles Swedish speech-to-text on Apple Silicon with a duty-budgeted GPU profile; OpenRouter serves as the fallback path for text and multimodal review. The point is workflow, not chat: a lawyer can see exactly what was transcribed, what was claimed and what was contradicted, with a Contradictions panel that filters by intra-speaker and inter-speaker relationships. No live public demo right now; the latest macOS Swift build stays on a private iMac.",
    longDescription:
      "LAGA — Legal AI Gateway Architecture — is an experimental Swedish legal workflow platform. Audio and video come in, local MLX transcription runs on Apple Silicon, the system detects inter- and intra-speaker contradictions, and OpenRouter-based review attaches Swedish statutes. The v0.1 MVP is a four-node graph: Media → Transcribe → Analyze → Eval, built in a pnpm monorepo with Vite + React Flow on the web side and Hono on the API side.\n\nThe point is not a generic chatbot. Cases move through explicit nodes with a run monitor and traceable artifacts, so a lawyer can see exactly what was transcribed, what was claimed and what was contradicted. The demo audio is a Swedish interrogation clip with intra- and inter-speaker contradictions built in, and the Contradictions panel filters by speaker relationship.\n\nThe MLX integration is treated as a duty-budgeted citizen: MLX_GPU_DUTY_TARGET=0.8, MAX_CONCURRENT_MLX=1 and MLX_CHUNK_COOLDOWN_MS keep the GPU cool under sustained loads. OpenRouter is the fallback path for text and multimodal review when local MLX is not enough.\n\nThe latest macOS Swift shell lives on a private iMac and is not publicly deployable today. An Almi Verifieringsmedel application is in flight; the primary long-term funding target is Vinnova Innovativa Startups 2026. Future nodes include a Legal RAG layer with source IDs, a Praxis web-browser agent, and a synced macOS shell sharing the same workflow JSON.",
    stack: [
      "Vite",
      "React Flow",
      "Hono",
      "MLX Whisper",
      "OpenRouter",
      "pnpm monorepo",
    ],
    href: "/laga.html",
    ctaLabel: "Deep View",
    brandColor: "pearl",
    featured: true,
    keywords: [
      "Swedish legal AI",
      "legal workflow platform",
      "MLX Whisper Swedish",
      "contradiction analysis",
      "React Flow pipeline",
      "OpenRouter gateway",
      "forensic transcription",
    ],
    lastUpdated: "2026-06-14",
    contactMessage:
      "Hej Per,\n\nJag vill veta mer om LAGA workflow-labbet och om det kan bli relevant för vårt case.\n\n",
    telemetry: [
      { label: "NODES", value: "4 MVP" },
      { label: "DEMO", value: "INFO ONLY" },
      { label: "STATUS", value: "PAUSED" },
    ],
    longDescriptionLang: "en",
  },

  /* ---------- 3. Relay / THE-AI-BUTTON ---------- */
  {
    id: "system_relay",
    name: "Relay / THE-AI-BUTTON",
    version: "voice-first iOS",
    status: "ACTIVE DEMO",
    tagline: "Say it once. Let the agent do the rest.",
    description:
      "Relay is a voice-first iOS app for sending spoken tasks to reminders, mail, n8n workflows, or AI agents without ever opening a chat window. The whole point is to skip the friction of launching an app and typing — instead, a single phrase (via Hey Siri, the Action Button, or Voice Control) triggers Note to AI or Note to Self. Note to AI POSTs the transcript to a user-owned webhook, runs the agent, and speaks the result back via TTS; Note to Self saves to a Reminders list or to email. The integration is the part nobody else assembles: Apple already exposes Siri, the Action Button, Voice Control and App Intents, but never connects them — Relay wires them into one installable flow. Swedish on-device STT (sv-SE, no cloud upload) keeps the privacy story clean. Built in Swift + SwiftUI on iOS 18+.",
    longDescription:
      "Relay is a voice-first iOS relay — speak a task, your agent does the rest. The whole point is to skip the chat window: instead of opening an app, composing a message and waiting for a reply, you trigger the agent with a single phrase and hear the answer back via TTS. No subscription, no chat, no copy-paste into a different tool.\n\nThe product exposes exactly two commands. Note to AI POSTs the transcript to your own webhook — typically an n8n workflow — which runs the agent and returns a short reply that Relay speaks back. Note to Self saves the same transcript to a Reminders list or to email. Both paths are designed for one-handed use on a construction site, in a workshop, or wherever a Swedish tradesman (hantverkare) is doing real work and shouldn't be fumbling with a chat app.\n\nThe integration layer is the part nobody else assembles. Relay connects Apple's own pieces — Hey Siri, the Action Button, Voice Control, and App Intents — into a single installable flow. The setup wizard wires up the webhook URL, the reminders destination and the Swedish STT locale (sv-SE on-device, no cloud upload). The reference n8n workflow pipes the spoken task through an Intent Parser, writes a row to Airtable, and can fan out to 46elks SMS for an acknowledgement.\n\nThe build is Swift + SwiftUI on iOS 18+, generated with Xcodegen, bundle id com.perbrinell.relay. Planned monetisation is a one-time purchase (~$0.99) — explicitly anti-subscription. The current funding track is Almi Verifieringsmedel, with Vinnova Innovativa Startups 2026 as the longer-term target.",
    stack: [
      "Swift",
      "SwiftUI",
      "iOS 18",
      "Hey Siri",
      "n8n webhook",
      "Airtable",
    ],
    href: null,
    ctaLabel: "Private",
    brandColor: "accent",
    featured: true,
    keywords: [
      "voice-first iOS",
      "Siri shortcut",
      "Action Button",
      "tradesman AI",
      "n8n webhook",
      "Swedish on-device STT",
      "anti-subscription app",
    ],
    lastUpdated: "2026-06-14",
    telemetry: [
      { label: "PLATFORM", value: "iOS" },
      { label: "INPUT", value: "VOICE" },
      { label: "STATUS", value: "PRIVATE" },
    ],
    longDescriptionLang: "en",
  },

  /* ---------- 4. Recon Search Assistant ---------- */
  {
    id: "system_recon",
    name: "Recon Search Assistant",
    version: "defensive cyber / security review",
    status: "LAB / PAUSED",
    tagline: "Authorized recon and triage — not a public demo yet.",
    description:
      "Recon Search Assistant is a defensive security research workbench, not a public hacking tool or offensive framework. The original prototype bundles 115+ Google dorks across file discovery, web application discovery, information gathering, cloud and infrastructure, and crypto/OSINT, with a SerpAPI-backed in-app search and OpenRouter AI triage that flags critical, high, medium, low and info findings automatically. User accounts, dashboard, history, saved searches and findings management are wired through Supabase. The project is currently paused from the public showroom: the static GitHub Pages deploy is being retired and the API keys need to move into the Vercel environment before it is shown again. The framing is explicit — legitimate security research and bug-bounty hunting on systems the operator owns or has permission to test, nothing else.",
    longDescription:
      "Recon Search Assistant is a defensive security research workbench — not a public hacking tool, not an offensive framework. The original prototype is a static web app that bundles 115+ Google dorks across file discovery, web application discovery, information gathering, cloud and infrastructure, API and development, and crypto/OSINT, with a SerpAPI-backed in-app search and OpenRouter AI triage for findings.\n\nThe current state is paused from the public showroom. The static GitHub Pages deploy is being retired, and the API keys need to move into the Vercel environment before the project is shown again. The user-account layer, dashboard, history and saved-search features from the original prototype remain in the codebase but are not the active product focus.\n\nThe framing matters. This is a lab for authorized bug-bounty and defensive research — dork search, target triage, finding tracking — not a tool for use against systems the operator does not own or have permission to test. The Almi/Vinnova sister-project line for the TwistedStacks stack treats Recon as a defensive-cyber companion, not a customer-facing product.\n\nUntil the env migration lands, the showroom entry is informational only. For collaboration or research conversations, reach out via the TwistedStacks contact channel.",
    stack: [
      "Static SPA",
      "SerpAPI",
      "OpenRouter",
      "Supabase",
      "Bug-bounty dorks",
    ],
    href: "/recon.html",
    ctaLabel: "Deep View",
    brandColor: "emf",
    featured: false,
    keywords: [
      "defensive security",
      "bug bounty dorks",
      "OSINT triage",
      "SerpAPI",
      "OpenRouter findings",
      "authorized recon",
    ],
    lastUpdated: "2026-06-14",
    contactMessage:
      "Hej Per,\n\nJag vill veta mer om Recon Search Assistant och eventuell defensiv användning.\n\n",
    telemetry: [
      { label: "MODE", value: "DEFENSIVE" },
      { label: "SECRETS", value: "VERCEL" },
      { label: "STATUS", value: "REVIEW" },
    ],
    longDescriptionLang: "en",
  },

  /* ---------- 5. Anslag ---------- */
  {
    id: "system_anslag",
    name: "Anslag",
    version: "gratis fonder & stipendier",
    status: "SHIPPED",
    tagline:
      "Hitta fonder, stipendier och andra anslag till ditt projekt.",
    description:
      "Anslag är en fri svensk anslagssöknings- och utkaststjänst som hittar utlysningar, stipendier och stiftelser åt dig. Tjänsten söker över Vinnova, Formas, Forte, VR, Tillväxtverket, EU-program, Almi och svenska stiftelser via Exa och de officiella källorna, och hjälper dig sedan att skriva själva ansökan på svenska. Det finns två söklägen (bred och smal) och en modell-tier-väljare (auto / gratis / betald) så att en liten förening kan köra på gratis-modeller medan en konsult med deadline väljer en betald modell utan att byta arbetsflöde. Motorn är samma OpenRouter-gateway med sju nycklar som TwistedStacks själva använder för att skriva Almi-, ERUF- och Vinnova-ansökningar — men den publika appen är öppen och gratis för alla svenska projekt som söker finansiering.",
    longDescription:
      "Anslag (SITK) is a free Swedish grant-discovery and draft-writing app. It searches across Vinnova, Formas, Forte, VR, Tillväxtverket, EU programmes, Almi and Swedish stiftelser via Exa and the official sources, then helps draft the actual application in Swedish.\n\nThe frontend is Vite 7 + Tailwind v3 + shadcn/ui, the backend is Node 20 with an API on port 3001 and Vercel serverless. A multi-account OpenRouter gateway round-robins across up to seven keys for resilience, with `google/gemini-2.5-flash-lite` as the current best free model for structured output.\n\nThere are two search modes — bred (wide) and narrow — and a model-tier selector (auto/free/paid) so a small NGO can run on free models while a consultant on a deadline picks a paid model without changing the workflow. An optional Qdrant layer adds vector memory across past searches.\n\nThe tool is open and free. It is the same engine used internally to draft the Almi, ERUF and Vinnova applications across REVISION, LAGA, CymWave and Relay, but the public app is open to any Swedish project looking for funding.",
    stack: ["Vite", "Tailwind", "shadcn/ui", "OpenRouter", "Exa", "Node 20"],
    href: "https://anslag.twistedstacks.com/",
    ctaLabel: "Live Demo",
    brandColor: "accent",
    featured: true,
    keywords: [
      "Swedish grants",
      "Vinnova",
      "Formas",
      "Almi",
      "stipendier",
      "ansökningsutkast",
      "free grant search",
    ],
    lastUpdated: "2026-06-14",
    telemetry: [
      { label: "SÖK", value: "FONDER" },
      { label: "UTKAST", value: "ANSÖKAN" },
      { label: "STATUS", value: "LIVE" },
    ],
    longDescriptionLang: "sv",
  },

  /* ---------- 6. VR Super-Senses ---------- */
  {
    id: "system_vr_superpowers",
    name: "VR Super-Senses",
    version: "Meta Quest / sensor array",
    status: "HARDWARE LAB",
    tagline:
      "See the invisible world: WiFi, heat, RF, and EMF in passthrough VR.",
    description:
      "VR Super-Senses — Twisted SuperSenses under the brand book — is an open sensor mesh for VR and iOS AR passthrough that surfaces the normally invisible radio, thermal and electromagnetic world around the wearer. ESP32-S3 nodes with NRF24, CC1101, MLX90640 and 50 Hz coil sensors stream into a Python WebSocket hub on port 81; Unity 6 + URP + Meta XR SDK renders the scene on Meta Quest, and an ARKit / RealityKit client runs on iPhone 13 Pro+ with LiDAR. The capability matrix is intentionally honest: AR passthrough and LiDAR mesh are live, WiFi / RF / thermal / EMF / AC layers are partial, and CSI presence plus the Flipper bridge are stubs. Privacy posture is receive-only by default — no TX in any uncontrolled context, no CSI on other people's networks, no X-ray claims. Six sensor layers plus a fusion layer and gated stimulus modules.",
    longDescription:
      "VR Super-Senses — Twisted SuperSenses under the brand book — is an open sensor mesh for VR and iOS AR passthrough. The product surfaces the normally invisible radio, thermal and electromagnetic world around the wearer: RF auroras, thermal heat-vision, WiFi towers, EMF field lines, AC live-wire hints, and CSI presence/motion ghosts. The tagline is 'See the invisible world in VR'.\n\nThe system is built as a tiered architecture. ESP32-S3 nodes with NRF24, CC1101, MLX90640, HMC5883L and 50 Hz coil sensors stream into a Python WebSocket hub on port 81. The hub speaks a documented JSON protocol (v1.0 / v1.1 / v1.2) with node roles (wearable / probe / stimulus), position messages, fusion results and gated stimulus states. On the rendering side, Unity 6 + URP + Meta XR SDK paints the scene on Meta Quest, and an ARKit / RealityKit client runs on iPhone 13 Pro+ with LiDAR.\n\nThe capability matrix in the project README is intentionally honest: AR passthrough and LiDAR mesh are live; WiFi, RF, thermal, EMF and AC layers are partial (code exists, gaps remain); CSI presence and Flipper bridge are stubs. The privacy posture is receive-only by default — no TX in any uncontrolled context, no CSI on other people's networks, no X-ray claims.\n\nA Flipper Zero with an AIO Multiboard v1.4 acts as the Field Commander for one radio at a time. The funding story (Almi, Vinnova) ties this together with the spatial-computing thesis: 'Materially warm, technically cool. Built for heads-up displays that have to stay readable while you're wearing them.'",
    stack: [
      "Unity 6",
      "Meta XR SDK",
      "Meta Quest",
      "ESP32-S3",
      "Python WebSocket hub",
      "ARKit + LiDAR",
    ],
    href: "/vr-superpowers",
    ctaLabel: "Visualize",
    brandColor: "rf",
    featured: true,
    keywords: [
      "VR sensor mesh",
      "Meta Quest passthrough",
      "ESP32 sensor network",
      "RF visualisation",
      "WiFi CSI motion",
      "thermal heat vision AR",
      "Twisted SuperSenses",
    ],
    lastUpdated: "2026-06-14",
    telemetry: [
      { label: "LAYERS", value: "6" },
      { label: "SIGNAL", value: "PASSIVE" },
      { label: "STATUS", value: "PUBLIC" },
    ],
    longDescriptionLang: "en",
  },

  /* ---------- 7. CymWave ---------- */
  {
    id: "system_cymwave",
    name: "CymWave",
    version: "hydro-wellness / prototype planning",
    status: "ACTIVE DEMO",
    tagline:
      "Programmable water, sound, light, and guided relaxation journeys.",
    description:
      "CymWave is an early-stage Swedish wellness-technology project for immersive bath and float experiences — warm water, controlled massage or low-frequency vibration, spatial or underwater-safe audio, chromotherapy-style light scenes, and guided journeys for calm, sleep preparation, recovery, romance, seasonal rituals, or premium hotel experiences. The current goal is explicitly not to overclaim medical effects: the first version is a premium B2B wellness installation for boutique hotels, destination spas, retreat centres and premium wellness studios, focused on relaxation, perceived stress, sleep readiness, comfort and memorable guest experience. The technical track is moving toward measured pressure and vibration design, with an aviation vibration-testing specialist supporting actuator and motor-side development. Phase 0 covers concept recovery, IP mapping and 10–15 customer interviews; Phase 1 is the proof-of-experience prototype on safe, off-the-shelf components. Funding runs through the Vinnova Test och Demo track with Almi Verifieringsmedel as the rolling alternative.",
    longDescription:
      "CymWave is an early-stage Swedish wellness-technology project for immersive bath and float experiences. The combination is warm water, carefully controlled massage or low-frequency vibration, spatial or underwater-safe audio, chromotherapy-style light scenes, and guided journeys for calm, sleep preparation, recovery, romance, seasonal rituals, or premium hotel experiences.\n\nThe current goal is explicitly not to overclaim medical effects. The first version is a premium B2B wellness installation for boutique hotels, destination spas, retreat centres and premium wellness studios — focused on relaxation, perceived stress, sleep readiness, comfort and a memorable guest experience. Claims like 'treats anxiety / depression / chronic pain / insomnia / trauma' are deliberately avoided until clinical and regulatory work would justify them.\n\nThe technical track is now moving toward measured pressure and vibration design. An aviation vibration-testing specialist is expected to support actuator and motor-side development, so wave intensity, pressure transfer and timing precision can be tuned before publishing deeper technical data. Phase 0 is concept recovery (one-pager, competitive map, IP scan, 10–15 customer interviews). Phase 1 is the proof-of-experience prototype on safe, off-the-shelf components.\n\nFunding is via the Vinnova Test och Demo track (closes 2026-09-08) with Almi Verifieringsmedel as the rolling alternative, all routed through the AnslagSITK engine. The legacy 2020 concept — water as the carrier medium, cymatic visualisation as the design method, 'composed pieces for the body rather than music for the ear' — is the brand hook, but the modern claim set is restricted to wellbeing, not therapy.",
    stack: [
      "Hydrotherapy",
      "Vibration R&D",
      "Spatial audio",
      "Light scenes",
      "Grant-funded prototype",
    ],
    href: "https://github.com/wawawee/CymWave",
    ctaLabel: "GitHub",
    brandColor: "thermal",
    featured: true,
    keywords: [
      "hydro-wellness",
      "spa journey",
      "cymatic water",
      "immersive bath",
      "Swedish wellness tech",
      "Vinnova Test och Demo",
    ],
    lastUpdated: "2026-06-14",
    telemetry: [
      { label: "MODE", value: "WELLNESS" },
      { label: "REPO", value: "PUBLIC" },
      { label: "ADDED", value: "2026-06-07" },
    ],
    longDescriptionLang: "en",
  },

  /* ---------- 8. Silversmeden ---------- */
  {
    id: "system_silversmeden",
    name: "Silversmeden",
    version: "client site",
    status: "SHIPPED",
    tagline: "Clean craft site for a working silversmith.",
    description:
      "Silversmeden is a quiet public site for a working silversmith — intentionally not a portfolio-app showcase and not a WordPress build. The design language is restrained, the work is the work, and the framework noise is kept out of the way of the customer. The page layout favours large product imagery, clean typography and minimal chrome, with a shallow product list and a checkout that is not bolted on as a feature. The brand-voice work is the more interesting part of the engagement: how do you sell hand-made silver online without falling into a 'buy now' shop interface that overwhelms an older customer? The site is the first shipped TwistedStacks client engagement — built on Vite, deployed on Vercel, structured to be operated by the silversmith himself after handover. It serves as a reference for the type of restrained, customer-respecting site TwistedStacks will build for craft businesses.",
    longDescription:
      "Silversmeden is a quiet public site for a working silversmith. It is intentionally not a portfolio-app showcase and not a WordPress build — the design language is restrained, the work is the work, and the framework noise is kept out of the way of the customer.\n\nThe site is the first shipped TwistedStacks client engagement: built on Vite, deployed on Vercel, and structured to be operated by the silversmith himself after handover. The page layout favours large product imagery, clean typography and minimal chrome. The brand-voice work is the more interesting part: how do you sell hand-made silver online without falling into a 'buy now' shop interface that overwhelms an older customer?\n\nThat trade-off drove the layout decisions: the product list is shallow, the photography is the hero, and the checkout is not bolted on as a feature. The site is live at silversmeden.twistedstacks.com and serves as a reference for the type of restrained, customer-respecting site TwistedStacks will build for craft businesses.",
    stack: ["Vite", "Vercel", "Hand-tuned CSS", "Static-first", "Client"],
    href: "https://silversmeden.twistedstacks.com/",
    ctaLabel: "Live",
    brandColor: "pearl",
    featured: false,
    keywords: [
      "silversmith site",
      "craft e-commerce",
      "restrained design",
      "Vercel static",
      "TwistedStacks client work",
    ],
    lastUpdated: "2026-06-14",
    telemetry: [
      { label: "MODE", value: "CRAFT" },
      { label: "STATUS", value: "LIVE" },
      { label: "TEXTURE", value: "CLEAN" },
    ],
    longDescriptionLang: "en",
  },

  /* ---------- 9. Twisted Pongg ---------- */
  {
    id: "system_arena",
    name: "TWISTED PONGG",
    version: "playable site",
    status: "ACTIVE DEMO",
    tagline: "Self-pass square court with spin.",
    description:
      "Twisted Pongg is the playable front door of the TwistedStacks showroom — the portfolio sits on top of a working four-paddle arcade game (left, right, top, bottom) running on React, Three.js and WebGL. The game runs in ambient mode by default, so the visitor lands on a live scene before they realise it is interactive. The physics, spin, curve, corner-combo system, monster bricks, centre motif and audio engine are all hand-rolled — no wrapper around another library. A hardcore arcade boot path skips the intro straight into the court; a casual / hardcore / impossible difficulty picker is held behind the D key. A global top-5 leaderboard syncs through Supabase when configured and falls back to a local scoreboard otherwise. Pongg is also the testbed for the brand system: the warm-brown ramp, baby-blue accent, cherry state, and pearl primary-button language are all carried by the showroom grid, the scoreboard, the contact FAB and the level badges.",
    longDescription:
      "Twisted Pongg is the playable front door of the TwistedStacks showroom. The portfolio sits on top of a working four-paddle arcade game — left, right, top, bottom — running on React, Three.js and WebGL. The game runs in ambient mode by default, so the visitor lands on a live scene before they realise it is interactive.\n\nThe game itself is not a wrapper around another library. The physics, the spin, the curve, the corner-combo system, the monster bricks, the centre motif and the audio engine are all hand-rolled. A hardcore arcade boot path skips the intro straight into the court; a casual / hardcore / impossible difficulty picker is held behind the D key. A global top-5 leaderboard syncs through Supabase when configured and falls back to a local scoreboard otherwise.\n\nPongg is also the testbed for the brand. The showroom grid, the scoreboard, the contact FAB, the easter-vault cabinet and the level badges all share the same warm-brown ramp, baby-blue accent, cherry state, and pearl primary-button language. Cleared all nine levels and the vault opens; the cabin is the dev-mode architecture directory.\n\nThe point is not 'look at our game'. The point is 'the front door is the product — quiet, technical, with personality, and the actual systems live behind the cards.'",
    stack: ["React", "Three.js", "WebGL", "Vite", "Supabase"],
    href: null,
    ctaLabel: "Play",
    brandColor: "accent",
    featured: true,
    keywords: [
      "playable portfolio",
      "Twisted Pongg",
      "Three.js arcade",
      "WebGL four-paddle",
      "supabase leaderboard",
      "ambient landing",
    ],
    lastUpdated: "2026-06-14",
    telemetry: [
      { label: "BALL SPEED", value: "DYNAMIC" },
      { label: "RENDER RATE", value: "60 FPS" },
      { label: "PADDLE MULTI", value: "4 ACTIVE" },
    ],
    longDescriptionLang: "en",
  },
];

/* ---------------------------------------------------------------------------
   Lookup helpers
   --------------------------------------------------------------------------- */

export function getProjectById(id: ProjectId | string): ProjectEntry | undefined {
  return PROJECTS.find((p) => p.id === id);
}

export function getProjectByHref(href: string): ProjectEntry | undefined {
  return PROJECTS.find((p) => p.href === href);
}

/**
 * Returns the projects in the order they should appear in the showroom grid.
 * Featured projects come first, the rest in the order they were declared.
 */
export function getProjectsForShowroom(): ProjectEntry[] {
  return [...PROJECTS].sort((a, b) => {
    if (a.featured && !b.featured) return -1;
    if (!a.featured && b.featured) return 1;
    return 0;
  });
}
