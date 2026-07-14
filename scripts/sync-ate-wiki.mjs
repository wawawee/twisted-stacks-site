#!/usr/bin/env node
/**
 * Sync ATE project surface: wiki/, TASKLIST.md, HISTORY.md → ate-wiki/
 */

import fs from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { buildGraph, parseHistory, parseTasklist } from "./parse-ate-tasklist.mjs";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, "..");
const OUT_DIR = path.join(ROOT, "ate-wiki");

const GITHUB = { owner: "wawawee", repo: "ATE", branch: "main" };

const TOPIC_LABELS = {
  strategy: "Strategi & thesis",
  data: "Data & providers",
  risk: "Risk Officer",
  competitors: "Konkurrenter",
  funding: "Finansiering",
  "use-cases": "Användningsfall",
  "real-edge": "Real Edge · alt-data",
};

function localRepoRoot() {
  const fromEnv = process.env.ATE_REPO_LOCAL?.trim();
  if (fromEnv) return path.resolve(fromEnv);
  return path.resolve(ROOT, "../ATE");
}

async function pathExists(p) {
  try {
    await fs.access(p);
    return true;
  } catch {
    return false;
  }
}

async function writeFile(rel, content) {
  const dest = path.join(OUT_DIR, rel);
  await fs.mkdir(path.dirname(dest), { recursive: true });
  await fs.writeFile(dest, content, "utf8");
  return rel;
}

async function copyIfExists(srcRoot, rel) {
  const src = path.join(srcRoot, rel);
  if (!(await pathExists(src))) return null;
  await writeFile(rel, await fs.readFile(src, "utf8"));
  return rel;
}

function githubToken() {
  return process.env.GITHUB_TOKEN_WAWAWEE || process.env.GITHUB_TOKEN || process.env.GH_TOKEN || "";
}

function githubHeaders() {
  const headers = {
    Accept: "application/vnd.github+json",
    "User-Agent": "ate-sync",
    "X-GitHub-Api-Version": "2022-11-28",
  };
  const token = githubToken();
  if (token) headers.Authorization = `Bearer ${token}`;
  return headers;
}

async function fetchRepoFile(repoPath) {
  const token = githubToken();
  if (token) {
    const url = `https://api.github.com/repos/${GITHUB.owner}/${GITHUB.repo}/contents/${repoPath}?ref=${GITHUB.branch}`;
    const res = await fetch(url, { headers: githubHeaders() });
    if (res.ok) {
      const data = await res.json();
      if (data.content && data.encoding === "base64") {
        return Buffer.from(data.content, "base64").toString("utf8");
      }
    }
    if (res.status !== 404) {
      throw new Error(`${repoPath}: GitHub API ${res.status}`);
    }
  }

  const url = `https://raw.githubusercontent.com/${GITHUB.owner}/${GITHUB.repo}/${GITHUB.branch}/${repoPath}`;
  const res = await fetch(url);
  if (!res.ok) {
    throw new Error(
      `${repoPath}: ${res.status}${token ? "" : " (private repo? set GITHUB_TOKEN_WAWAWEE for Vercel build)"}`,
    );
  }
  return res.text();
}

async function syncWiki(repoRoot, fromGitHub) {
  const copied = [];
  for (const rel of ["README.md", "IDEAS.md", "COLLAB-CHAT.md"]) {
    const c = fromGitHub
      ? await writeFile(rel, await fetchRepoFile(`wiki/${rel}`)).catch(() => null)
      : await copyIfExists(path.join(repoRoot, "wiki"), rel);
    if (c) copied.push(c);
  }

  const topicDir = fromGitHub ? null : path.join(repoRoot, "wiki/by-topic");
  let topicNames = [];
  if (topicDir && (await pathExists(topicDir))) {
    topicNames = (await fs.readdir(topicDir)).filter((n) => n.endsWith(".md") && n !== "README.md");
  } else if (fromGitHub) {
    const res = await fetch(
      `https://api.github.com/repos/${GITHUB.owner}/${GITHUB.repo}/contents/wiki/by-topic?ref=${GITHUB.branch}`,
      { headers: githubHeaders() },
    );
    if (res.ok) {
      topicNames = (await res.json())
        .filter((i) => i.type === "file" && i.name.endsWith(".md") && i.name !== "README.md")
        .map((i) => i.name);
    }
  }

  for (const name of topicNames) {
    const rel = `by-topic/${name}`;
    if (fromGitHub) {
      await writeFile(rel, await fetchRepoFile(`wiki/${rel}`));
    } else {
      await copyIfExists(path.join(repoRoot, "wiki"), rel);
    }
    copied.push(rel);
  }

  return copied;
}

function buildPages(copied) {
  const pages = [];
  if (copied.includes("IDEAS.md")) {
    pages.push({
      id: "ideas",
      slug: "ideas",
      title: "Idéer & förslag",
      description: "Drop zone",
      path: "IDEAS.md",
      category: "ideas",
      icon: "💡",
    });
  }
  if (copied.includes("COLLAB-CHAT.md")) {
    pages.push({
      id: "collab-chat",
      slug: "collab-chat",
      title: "Colab chat (logg)",
      description: "Teamchat logg",
      path: "COLLAB-CHAT.md",
      category: "progress",
      icon: "💬",
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
  return pages;
}

async function main() {
  await fs.rm(OUT_DIR, { recursive: true, force: true });
  await fs.mkdir(OUT_DIR, { recursive: true });

  const repoRoot = localRepoRoot();
  const fromGitHub = !(await pathExists(repoRoot));
  const source = fromGitHub ? `github:${GITHUB.owner}/${GITHUB.repo}` : repoRoot;

  console.log(fromGitHub ? `Fetching from GitHub ${GITHUB.owner}/${GITHUB.repo}` : `Syncing from ${repoRoot}`);

  const wikiCopied = await syncWiki(repoRoot, fromGitHub);

  let tasklistMd;
  let historyMd;
  if (fromGitHub) {
    tasklistMd = await fetchRepoFile("TASKLIST.md");
    historyMd = await fetchRepoFile("docs/HISTORY.md");
  } else {
    tasklistMd = await fs.readFile(path.join(repoRoot, "TASKLIST.md"), "utf8");
    historyMd = await fs.readFile(path.join(repoRoot, "docs/HISTORY.md"), "utf8");
  }
  await writeFile("TASKLIST.md", tasklistMd);
  await writeFile("HISTORY.md", historyMd);

  const tasklist = parseTasklist(tasklistMd);
  const history = parseHistory(historyMd);
  const pages = buildPages(wikiCopied);
  const graph = buildGraph(pages, tasklist, history);

  await writeFile("tasklist.json", JSON.stringify(tasklist, null, 2));
  await writeFile("history.json", JSON.stringify(history, null, 2));

  const manifest = {
    syncedAt: new Date().toISOString(),
    source,
    currentFocus: tasklist.currentFocus,
    stats: tasklist.stats,
    pages,
    graph,
  };
  await writeFile("manifest.json", JSON.stringify(manifest, null, 2));

  console.log(
    `Synced wiki: ${wikiCopied.length} files, ${pages.length} pages, ${tasklist.tasks.length} tasks, ${history.milestones.length} milestones`,
  );
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
