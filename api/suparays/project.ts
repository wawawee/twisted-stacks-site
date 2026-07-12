import fs from "node:fs/promises";
import path from "node:path";

import { requireSession, type VercelRequest, type VercelResponse } from "./session.js";

const ROOT = path.join(process.cwd(), "suparays-wiki");

async function readJson(name: string) {
  const raw = await fs.readFile(path.join(ROOT, name), "utf8");
  return JSON.parse(raw);
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
  res.setHeader("Cache-Control", "private, no-store");

  if (req.method !== "GET") {
    res.setHeader("Allow", "GET");
    res.status(405).json({ error: "Method not allowed" });
    return;
  }

  if (!requireSession(req, res)) return;

  try {
    const [manifest, tasklist, history] = await Promise.all([
      readJson("manifest.json"),
      readJson("tasklist.json"),
      readJson("history.json"),
    ]);
    res.status(200).json({ manifest, tasklist, history });
  } catch {
    res.status(503).json({ error: "Project not synced — kör npm run sync:wiki" });
  }
}
