import fs from "node:fs/promises";
import path from "node:path";

import {
  requireSession,
  type VercelRequest,
  type VercelResponse,
} from "./_session";

const WIKI_ROOT = path.join(process.cwd(), "suparays-wiki");
const ALLOWED = /^[a-zA-Z0-9/_-]+\.md$/;

interface WikiPage {
  id: string;
  slug: string;
  title: string;
  description: string;
  path: string;
  category: string;
  icon: string;
}

interface WikiManifest {
  syncedAt: string;
  source: string;
  pages: WikiPage[];
}

async function readManifest(): Promise<WikiManifest | null> {
  try {
    const raw = await fs.readFile(path.join(WIKI_ROOT, "manifest.json"), "utf8");
    return JSON.parse(raw) as WikiManifest;
  } catch {
    return null;
  }
}

function safeWikiPath(rel: string) {
  const normalized = rel.replace(/\\/g, "/").replace(/^\/+/, "");
  if (!ALLOWED.test(normalized)) return null;
  if (normalized.includes("..")) return null;
  return normalized;
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
  res.setHeader("Cache-Control", "private, no-store");

  if (req.method !== "GET") {
    res.setHeader("Allow", "GET");
    res.status(405).json({ error: "Method not allowed" });
    return;
  }

  if (!requireSession(req, res)) return;

  const manifest = await readManifest();
  if (!manifest) {
    res.status(503).json({ error: "Wiki not synced yet" });
    return;
  }

  const pageParam = req.query.page;
  const pagePath = Array.isArray(pageParam) ? pageParam[0] : pageParam;

  if (!pagePath) {
    res.status(200).json(manifest);
    return;
  }

  const entry = manifest.pages.find((p) => p.slug === pagePath || p.path === pagePath);
  const rel = safeWikiPath(entry?.path || pagePath);
  if (!rel) {
    res.status(400).json({ error: "Invalid page" });
    return;
  }

  try {
    const content = await fs.readFile(path.join(WIKI_ROOT, rel), "utf8");
    res.status(200).json({
      ...entry,
      path: rel,
      content,
      syncedAt: manifest.syncedAt,
    });
  } catch {
    res.status(404).json({ error: "Page not found" });
  }
}
