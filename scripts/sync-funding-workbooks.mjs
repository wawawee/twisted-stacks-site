/**
 * Synkar BIZ HTML-arbetsböcker → funding-workbooks/ (ej publikt — serveras via /api/funding/doc)
 */
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const SITE_ROOT = path.resolve(__dirname, "..");
const BIZ_ROOT = path.resolve(SITE_ROOT, "../BIZ/00-MASTER");
const SRC_PROJECTS = path.join(BIZ_ROOT, "projects-html");
const SRC_STUDIO = path.join(BIZ_ROOT, "TwistedStacks-Funding-Workbook.html");
const OUT_DIR = path.join(SITE_ROOT, "funding-workbooks");

const DOC_PREFIX = "/api/funding/doc?file=";

function rewriteLinks(html) {
  let out = html;
  out = out.replace(/href="\.\.\/TwistedStacks-Funding-Workbook\.html"/g, `href="${DOC_PREFIX}studio-workbook.html"`);
  out = out.replace(/href="index\.html"/g, `href="${DOC_PREFIX}index.html"`);
  out = out.replace(/href="([a-z0-9-]+)\.html"/g, `href="${DOC_PREFIX}$1.html"`);
  out = out.replace(/href="\.\.\/projects-html\/index\.html"/g, `href="${DOC_PREFIX}index.html"`);
  return out;
}

function injectToolbar(html) {
  const toolbar = `
<div id="funding-toolbar" style="position:fixed;bottom:12px;right:12px;z-index:9999;display:flex;gap:8px;font-family:system-ui,sans-serif;font-size:13px;">
  <a href="${DOC_PREFIX}index.html" style="background:#1a222d;color:#38bdf8;border:1px solid #334155;padding:6px 12px;border-radius:8px;text-decoration:none;">Alla projekt</a>
  <a href="/funding" style="background:#1a222d;color:#94a3b8;border:1px solid #334155;padding:6px 12px;border-radius:8px;text-decoration:none;">Inlogg</a>
  <button type="button" onclick="logoutFunding()" style="background:#1a222d;color:#fb7185;border:1px solid #334155;padding:6px 12px;border-radius:8px;cursor:pointer;">Logga ut</button>
</div>
<script>
async function logoutFunding() {
  await fetch('/api/funding/auth', { method: 'DELETE', credentials: 'include' });
  location.href = '/funding';
}
</script>`;

  if (html.includes("</body>")) {
    return html.replace("</body>", `${toolbar}\n</body>`);
  }
  return html + toolbar;
}

function processFile(name, content) {
  return injectToolbar(rewriteLinks(content));
}

fs.mkdirSync(OUT_DIR, { recursive: true });

if (!fs.existsSync(SRC_PROJECTS)) {
  console.warn("⚠ BIZ projects-html saknas — behåller befintliga funding-workbooks/ (OK på Vercel).");
  process.exit(0);
}

for (const entry of fs.readdirSync(SRC_PROJECTS)) {
  if (!entry.endsWith(".html")) continue;
  const raw = fs.readFileSync(path.join(SRC_PROJECTS, entry), "utf8");
  fs.writeFileSync(path.join(OUT_DIR, entry), processFile(entry, raw), "utf8");
  console.log("✓", entry);
}

if (fs.existsSync(SRC_STUDIO)) {
  const raw = fs.readFileSync(SRC_STUDIO, "utf8");
  fs.writeFileSync(
    path.join(OUT_DIR, "studio-workbook.html"),
    processFile("studio-workbook.html", raw),
    "utf8"
  );
  console.log("✓ studio-workbook.html");
}

console.log("\nKlart →", OUT_DIR);
