#!/usr/bin/env node
/**
 * Sync SUPARAYS team wiki (wiki/ only — ideas + by-topic) into suparays-wiki/
 * for the password-protected room on twistedstacks.com/suparays.
 *
 * Sources (first match wins):
 *   1. SUPARAYS_WIKI_LOCAL env or ../VR-SuperPowers/wiki
 *   2. GitHub raw (wawawee/VR-SuperPowers@main)
 */

import fs from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, "..");
const OUT_DIR = path.join(ROOT, "suparays-wiki");

const GITHUB = {
  owner: "wawawee",
  repo: "VR-SuperPowers",
  branch: "main",
};

const TOPIC_LABELS = {
  sensors: "Sensorer & hårdvara",
  "use-cases": "Användningsfall & kunder",
  funding: "Finansiering & anslag",
  partnerships: "Partnerskap",
  "ux-ui": "UX, produkt & demo",
  "tech-debt": "Teknik & infrastruktur",
  misc: "Övrigt",
};

async function pathExists(p) {
  try {
    await fs.access(p);
    return true;
  } catch {
    return false;
  }
}

function localWikiRoot() {
  const fromEnv = process.env.SUPARAYS_WIKI_LOCAL?.trim();
  if (fromEnv) return path.resolve(fromEnv);
  return path.resolve(ROOT, "../VR-SuperPowers/wiki");
}

async function copyLocalFile(srcRoot, rel, destRoot) {
  const src = path.join(srcRoot, rel);
  const dest = path.join(destRoot, rel);
  await fs.mkdir(path.dirname(dest), { recursive: true });
  await fs.copyFile(src, dest);
  return rel;
}

async function syncFromLocal(srcRoot) {
  const copied = [];
  for (const rel of ["README.md", "IDEAS.md"]) {
    if (await pathExists(path.join(srcRoot, rel))) {
      copied.push(await copyLocalFile(srcRoot, rel, OUT_DIR));
    }
  }

  const topicDir = path.join(srcRoot, "by-topic");
  if (await pathExists(topicDir)) {
    const entries = await fs.readdir(topicDir);
    for (const name of entries) {
      if (!name.endsWith(".md") || name === "README.md") continue;
      copied.push(await copyLocalFile(srcRoot, path.join("by-topic", name), OUT_DIR));
    }
  }

  return copied;
}

async function fetchRaw(rel) {
  const url = `https://raw.githubusercontent.com/${GITHUB.owner}/${GITHUB.repo}/${GITHUB.branch}/wiki/${rel}`;
  const res = await fetch(url);
  if (!res.ok) throw new Error(`GitHub raw ${rel}: ${res.status}`);
  return res.text();
}

async function writeRemote(rel, content) {
  const dest = path.join(OUT_DIR, rel);
  await fs.mkdir(path.dirname(dest), { recursive: true });
  await fs.writeFile(dest, content, "utf8");
  return rel;
}

async function listRemoteTopicFiles() {
  const url = `https://api.github.com/repos/${GITHUB.owner}/${GITHUB.repo}/contents/wiki/by-topic?ref=${GITHUB.branch}`;
  const res = await fetch(url, {
    headers: { Accept: "application/vnd.github+json", "User-Agent": "twisted-stacks-wiki-sync" },
  });
  if (!res.ok) throw new Error(`GitHub API by-topic: ${res.status}`);
  const items = await res.json();
  return items
    .filter((item) => item.type === "file" && item.name.endsWith(".md") && item.name !== "README.md")
    .map((item) => item.name);
}

async function syncFromGitHub() {
  const copied = [];
  for (const rel of ["README.md", "IDEAS.md"]) {
    try {
      const content = await fetchRaw(rel);
      copied.push(await writeRemote(rel, content));
    } catch (err) {
      console.warn(`  skip ${rel}:`, err.message);
    }
  }

  const topicNames = await listRemoteTopicFiles();
  for (const name of topicNames) {
    const rel = `by-topic/${name}`;
    const content = await fetchRaw(rel);
    copied.push(await writeRemote(rel, content));
  }

  return copied;
}

function buildManifest(copied) {
  const pages = [];

  if (copied.includes("IDEAS.md")) {
    pages.push({
      id: "ideas",
      slug: "ideas",
      title: "Idéer & förslag",
      description: "Drop zone — nya idéer och förslag till projektet",
      path: "IDEAS.md",
      category: "ideas",
      icon: "💡",
    });
  }

  for (const rel of copied) {
    if (!rel.startsWith("by-topic/") || !rel.endsWith(".md")) continue;
    const base = rel.replace("by-topic/", "").replace(/\.md$/, "");
    pages.push({
      id: base,
      slug: base,
      title: TOPIC_LABELS[base] || base.replace(/-/g, " "),
      description: "",
      path: rel,
      category: "topic",
      icon: "◈",
    });
  }

  return {
    syncedAt: new Date().toISOString(),
    source: "wawawee/VR-SuperPowers/wiki",
    pages,
  };
}

async function main() {
  await fs.rm(OUT_DIR, { recursive: true, force: true });
  await fs.mkdir(OUT_DIR, { recursive: true });

  const localRoot = localWikiRoot();
  let copied;
  let source;

  if (await pathExists(localRoot)) {
    console.log(`Syncing wiki from local: ${localRoot}`);
    copied = await syncFromLocal(localRoot);
    source = localRoot;
  } else {
    console.log(`Local wiki not found — fetching from GitHub ${GITHUB.owner}/${GITHUB.repo}`);
    copied = await syncFromGitHub();
    source = `github:${GITHUB.owner}/${GITHUB.repo}@${GITHUB.branch}`;
  }

  const manifest = buildManifest(copied);
  manifest.source = source;
  await fs.writeFile(path.join(OUT_DIR, "manifest.json"), JSON.stringify(manifest, null, 2), "utf8");

  console.log(`Synced ${copied.length} wiki files → ${OUT_DIR}`);
  console.log(`Manifest: ${manifest.pages.length} pages`);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
