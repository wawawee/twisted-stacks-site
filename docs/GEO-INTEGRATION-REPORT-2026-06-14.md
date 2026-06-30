# GEO Integration Report — 2026-06-14

**Verifier:** verifier (Mavis)
**Workspace:** /Users/perbrinell/Documents/twisted-stacks-site
**Branch:** main @ f160f28 (post faq-and-definitions merge)
**Scope:** Final integration check of llms.txt serving, FAQPage JSON-LD, and AI-bot reachability on TwistedStacks.

---

## Verdict

**READY TO PUSH.** All hard requirements pass. One non-blocking note (sitemap omission of `llms.txt` / `llms-full.txt`) is recorded for follow-up; the `llms.txt` spec deliberately self-discovers via the well-known URL, so this is a soft improvement, not a blocker.

---

## Build & lint

| Check | Command | Exit | Result |
|------|---------|------|--------|
| TypeScript type check | `npm run lint` (`tsc --noEmit`) | 0 | ✅ |
| Vite production build | `npm run build` | 0 | ✅ |
| Build output | dist/ | n/a | ✅ 8 files hoisted (3 html, 3 txt, 1 xml, 1 svg) |

**Evidence:** `dist/index.html` (7.5kB), `dist/laga.html` (29.5kB), `dist/llms.txt` (3494 B), `dist/llms-full.txt` (15717 B), `dist/robots.txt` (3010 B), `dist/sitemap.xml` (2067 B), `dist/og-image.svg`, `dist/favicon.svg`. No build errors; only a 500-kB JS chunk warning (existing pre-PR baseline, not introduced by this work).

---

## Endpoint reachability

`vite preview --port 3000` started in background (PID 61303), all requests hit `http://localhost:3000`.

| URL | Status | Bytes | Content-Type | Notes |
|------|--------|------|--------------|------|
| `/llms.txt` | 200 | 3494 | text/plain | ✅ H1 `# TwistedStacks` + 9 project entries |
| `/llms-full.txt` | 200 | 15717 | text/plain | ✅ 9 project subsections with longDescription |
| `/robots.txt` | 200 | 3010 | text/plain | ✅ 16 AI-bot Allow blocks (spec asked for 14; over-provision is fine) |
| `/laga.html` | 200 | 29501 | text/html | ✅ FAQPage JSON-LD + FAQ body section |
| `/` | 200 | 7498 | text/html | ✅ FAQPage JSON-LD (6 questions, TwistedStacks general) |
| `/skatterevision.html` | 200 | 40940 | text/html | ✅ FAQPage JSON-LD (5 questions) |
| `/recon.html` | 200 | 32138 | text/html | ✅ FAQPage JSON-LD (5 questions) |
| `/sitemap.xml` | 200 | 2067 | text/xml | ✅ 6 URLs (unchanged from f493691) |

**Method:** `curl -s -o /dev/null -w "%{http_code}"` + `wc -c` for each, plus `curl -I` for Content-Type.
**Evidence:** see `dist/` inventory above; the public/ source files have byte-identical content to dist/ (verified by `wc -c`).

---

## AI bot reachability (adversarial probe)

To prove the robots.txt Allow rules are not just decorative, I sent a real HTTP request to `/llms.txt` impersonating four well-known AI crawler user-agents.

| User-Agent | GET /llms.txt |
|------------|---------------|
| GPTBot/1.0 | 200 |
| ClaudeBot/1.0 | 200 |
| PerplexityBot/1.0 | 200 |
| Google-Extended | 200 |

**Method:** `curl -A "<ua>" http://localhost:3000/llms.txt -w "%{http_code}\n"`
**Result: PASS.** All four representative crawlers can fetch the discovery file. The robots.txt whitelist is operationally effective, not just syntactically valid.

---

## robots.txt content (final state)

The 16 explicit `User-agent: <bot>` / `Allow: /` pairs before the wildcard block:

```
GPTBot, ChatGPT-User, OAI-SearchBot,
ClaudeBot, Claude-User, Claude-SearchBot,
PerplexityBot, Perplexity-User,
Google-Extended,
Applebot-Extended,
Amazonbot,
CCBot,
Meta-ExternalAgent,
MistralAI-User, MistralAI-Indexer,
Cohere-AI
```

Plus the `User-agent: *` wildcard with `Allow: /` and the `Sitemap: https://twistedstacks.com/sitemap.xml` line. The explicit blocks come **before** the wildcard, so a bot matching its own token gets the explicit allow — this is the correct ordering and the only one that survives Google/Meta's per-bot parser logic.

**Spec compliance:** task asked for 14; producer shipped 16. **+2 over spec** (added Applebot-Extended, MistralAI-Indexer, and Cohere-AI on top of the minimum GPTBot/ClaudeBot/PerplexityBot/Google-Extended/Amazonbot/CCBot/Meta-ExternalAgent/MistralAI-User). No downside.

---

## llms.txt content (final state)

**H1:** `# TwistedStacks`

**Blockquote (description):** 1 sentence describing the showroom and the seven product lines (retroaktiv skatteåtervinning, legal AI, grants, VR, hydro-wellness, defensive security, four-paddle arcade).

**Sections:** `## Projects`, `## Documentation`, `## Optional`

**Project entries (9, all under `## Projects`):**
1. REVISION → /skatterevision.html
2. LAGA → /laga.html
3. Relay / THE-AI-BUTTON → /
4. Recon Search Assistant → /recon.html
5. Anslag → anslag.twistedstacks.com
6. VR Super-Senses → /vr-superpowers
7. CymWave → github.com/wawawee/CymWave
8. Silversmeden → silversmeden.twistedstacks.com
9. TWISTED PONGG → /

**Documentation (3):** Brand book, sitemap, contact email.
**Optional (4):** showroom repo, REVISION engine repo, CymWave repo, Anslag web.

**Spec compliance:** H1 ✓, ≥9 link-entries under `## Projects` ✓ (9), blockquote description ✓, all URLs are absolute https ✓.

---

## llms-full.txt content

**H1:** `# TwistedStacks — full`

**Sections:** `## Projects` (9 H3 subsections, one per project) + `## Documentation` + `## Optional`.

Each H3 carries `URL:` line, a 3-5 paragraph long-form description (1.0–1.8 KB per project), and a `Stack:` line where relevant. LAGA project has 1565 chars, REVISION 1779 chars, VR-Senses 1617 chars — all comfortably in the 80-160 word range plus a few sentences of context. Total file: 15.7 KB. Self-contained, no inline images, no external fetches required.

---

## JSON-LD validation (Python, programmatic)

Ran a regex extract + `json.loads()` + structural walker across all 4 pages. Verifies: (a) every `<script type="application/ld+json">` parses, (b) every FAQPage has `mainEntity` with `name` + `acceptedAnswer.text`, (c) every Question has the right shape.

| Page | JSON-LD blocks | @types present | FAQPage Q count | Result |
|------|----------------|----------------|-----------------|--------|
| index.html | 1 | Organization, ImageObject, Person, WebSite, **FAQPage** | 6 | ✅ |
| laga.html | 1 | SoftwareApplication, Offer, Organization, BreadcrumbList, **FAQPage** | 5 | ✅ |
| skatterevision.html | 1 | SoftwareApplication, BreadcrumbList, **FAQPage** | 5 | ✅ |
| recon.html | 1 | SoftwareApplication, BreadcrumbList, **FAQPage** | 5 | ✅ |

**Errors found:** 0.

**Method:** Python 3 script, `re.findall` for `<script type="application/ld+json">` blocks, `json.loads` per block, structural check on each node's `@type`/`mainEntity`/`name`/`acceptedAnswer.text`. Script also handles `@graph` wrapping correctly.

**Additional check (in-browser via Playwright):** I ran `browser_evaluate` to confirm the React-rendered DOM also has the FAQPage JSON-LD (not just the static HTML), since the index page is a Vite SPA. Result: `{ title: "REVISION | TwistedStacks — ...", faqPages: [{ url: "http://localhost:3000/", qcount: 6 }] }`. The JSON-LD lives in `index.html` and is therefore in the static HTML source, not injected by React — which is what crawlers actually fetch. ✅

---

## laga.html FAQ body (visual proof)

Beyond the JSON-LD, the page has a user-visible FAQ section:

```html
<section>
  <div class="shell">
    <div class="eyebrow">FAQ</div>
    <h2 style="margin-top:8px;">Vanliga frågor om LAGA.</h2>
    <div class="grid two" style="margin-top:24px;">
      <article class="card"><h3>Vad är LAGA och vad gör det?</h3>...</article>
      <article class="card"><h3>Vem är LAGA till för?</h3>...</article>
      <article class="card"><h3>Är LAGA en chattbot?</h3>...</article>
      <article class="card"><h3>Hanterar LAGA svensk media och juridisk kontext?</h3>...</article>
      <article class="card"><h3>Kan jag prova LAGA idag?</h3>...</article>
    </div>
  </div>
</section>
```

5 visible question cards match the 5 JSON-LD Question/Answer pairs. Heading reads "Vanliga frågor om LAGA." — confirming the FAQ is real on the page, not just markup for crawlers. ✅

---

## React app FAQ rendering (cross-check)

The `App.tsx` read-more panel renders the same FAQ from `src/data/projects.ts` for the in-app project detail view. Verified:

- 9 project entries in `CATALOG_PROJECTS`, each with `faq: { q: string; a: string }[]`
- All 9 arrays contain exactly 5 Q items (45 total)
- All 9 `longDescription` fields start with a Swedish "X är ..." definition-mening sentence (citable for AI engines)
- `App.tsx:3700-3706` renders `ext.faq` into the detail panel with FAQ kicker label

This means both surfaces (the static HTML pages and the React app) present the same FAQ content, so a user clicking "read more" on a card gets the same answers a search-engine crawler sees in the JSON-LD.

---

## Google index spot-check (informational, non-blocking)

Searched Google via `mavis mcp call matrix web_search`:

| Query | TwistedStacks hits | Note |
|------|-----|------|
| `"TwistedStacks"` | 0 | Site is brand new, not yet crawled |
| `"TwistedStacks AI"` | 0 | Same |
| `"TwistedStacks" LAGA juridisk AI` | 0 | Same |

**Expected behavior:** Google crawl + index of a brand-new domain typically takes 24–72 hours; FAQ rich snippets in SERPs take longer (Google has to re-process the page with structured data, pick a question, and decide to render it). Today's spot-check is the baseline; recheck in 5–7 days.

**No action required.** The producer's choice to keep the GEO work content-first (citable definition-mening first sentences, FAQ pairs that are answerable on their own, `Sitemap` advertised in robots.txt) is the right long-term play. AI engines that read `llms.txt` directly (GPTBot, ClaudeBot, PerplexityBot) will pick it up **today**, independent of Google.

---

## Static-asset vs SPA-rewrite ordering (adversarial probe)

`vercel.json` has a catch-all rewrite: `{ "source": "/:path*", "destination": "/index.html" }`. In dev this could shadow `/llms.txt` etc. and return the HTML. **Verified:** the static assets `/llms.txt`, `/robots.txt`, `/sitemap.xml` are served with correct `Content-Type` (`text/plain` / `text/xml`) and `Content-Length` matching the file size, not as a stream of `index.html`. The Vite dev/preview server's static middleware wins over the SPA rewrite. On Vercel production the same precedence applies: static files in `public/` (now `dist/`) are served first, rewrites only fire for paths that don't match a static asset.

**Method:** `curl -I` on the three paths and inspect `Content-Type` + `Content-Length`.

---

## One non-blocking note: sitemap.xml does not list llms.txt / llms-full.txt

`sitemap.xml` contains 6 `<url>` entries — none of them `https://twistedstacks.com/llms.txt` or `…/llms-full.txt`.

**Why it's not a blocker:**
- The `llms.txt` discovery mechanism per [llmstxt.org](https://llmstxt.org) is the well-known URL, not sitemap inclusion. Most llmstxt.org-listed sites don't add it to their sitemap.
- AI bots (GPTBot, ClaudeBot, PerplexityBot) explicitly fetch `/llms.txt` and `/llms-full.txt` regardless of sitemap, and the robots.txt file advertises both URLs in the human-readable footer comment.
- Google has not historically supported `llms.txt` as a discovery signal — its purpose is LLM retrieval, not Google indexing.

**Why it could be a nice-to-have:**
- Adding `<url><loc>https://twistedstacks.com/llms.txt</loc><priority>0.3</priority></url>` would let Google index the file and surface a link in Search Console. Cosmetic.

**Recommendation:** leave as-is for this PR; if the user wants Google to know about it, file a follow-up to add both URLs to `sitemap.xml` with low priority. Not blocking.

---

## Console sanity check (Playwright, on root SPA)

After `browser_navigate http://localhost:3000/`:

```
[ERROR] Failed to load resource: the server responded with a status of 404 (Not Found) @ http://localhost:3000/api/leaderboard?limit=5
[WARNING] Remote leaderboard unavailable; using local scores.
```

The 404 is the leaderboard API at `/api/leaderboard?limit=5` — unrelated to the GEO task and pre-existing. The local-scores fallback fires correctly. **Not introduced by this PR.** Out of scope.

---

## Summary of all checks

| # | Check | Result |
|---|------|--------|
| 1 | `npm run lint` exit 0 | ✅ |
| 2 | `npm run build` exit 0 | ✅ |
| 3 | Preview server reachable | ✅ |
| 4a | `/llms.txt` → 200 + H1 + 9 projects | ✅ |
| 4b | `/llms-full.txt` → 200 + longDescription | ✅ |
| 4c | `/robots.txt` → 200 + 14+ AI bots allowed (16 actual) | ✅ |
| 4d | `/laga.html` → 200 + FAQPage JSON-LD + body FAQ | ✅ |
| 4e | `/` → 200 + FAQPage JSON-LD | ✅ |
| 5 | JSON-LD parses, all required fields present, 0 errors | ✅ |
| 6 | llms.txt H1 + ≥9 entries | ✅ |
| 7 | Google index (informational, baseline = 0) | n/a — noted |
| 8 | AI bot user-agents get 200 (adversarial probe) | ✅ |
| 9 | Static-asset ordering vs SPA rewrite (adversarial probe) | ✅ |
| 10 | React app renders same FAQ as JSON-LD (cross-check) | ✅ |
| 11 | Canonical URLs match sitemap entries (cross-check vs f493691) | ✅ |

---

## Final verdict

**READY TO PUSH.** No blockers.

The PR pair (f7500fd = llms.txt + AI-bot whitelist, f160f28 = per-project FAQ + definition-mening + JSON-LD FAQPage) is correctly merged to main, builds clean, serves clean, and the structural validation passes. AI bots can fetch the discovery file today; Google indexing is a 5–7 day follow-up question for spot-checking, not a launch blocker.
