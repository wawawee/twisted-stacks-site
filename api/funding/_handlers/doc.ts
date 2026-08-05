import fs from "node:fs";
import path from "node:path";
import {
  requireSession,
  type VercelRequest,
  type VercelResponse,
} from "../_lib/session.js";

const WORKBOOKS_DIR = path.join(process.cwd(), "funding-workbooks");

const FILE_RE = /^[a-z0-9-]+\.html$/;

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== "GET") {
    res.setHeader("Allow", "GET");
    res.status(405).json({ error: "Method not allowed" });
    return;
  }

  if (!requireSession(req, res)) return;

  const fileParam = req.query.file;
  const file = Array.isArray(fileParam) ? fileParam[0] : fileParam;
  const name = typeof file === "string" && file.trim() ? file.trim() : "index.html";

  if (!FILE_RE.test(name)) {
    res.status(400).json({ error: "Invalid file" });
    return;
  }

  const fullPath = path.join(WORKBOOKS_DIR, name);
  if (!fullPath.startsWith(WORKBOOKS_DIR + path.sep) && fullPath !== path.join(WORKBOOKS_DIR, name)) {
    res.status(400).json({ error: "Invalid path" });
    return;
  }

  if (!fs.existsSync(fullPath)) {
    res.status(404).json({ error: "Not found" });
    return;
  }

  const html = fs.readFileSync(fullPath, "utf8");
  res.setHeader("Content-Type", "text/html; charset=utf-8");
  res.setHeader("Cache-Control", "private, no-store");
  res.status(200).end(html);
}
