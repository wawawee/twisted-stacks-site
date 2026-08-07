import type { VercelRequest, VercelResponse } from "./_lib/session.js";

const routes: Record<string, () => Promise<{ default: (req: VercelRequest, res: VercelResponse) => unknown }>> = {
  auth: () => import("./_handlers/auth.js"),
  project: () => import("./_handlers/project.js"),
  wiki: () => import("./_handlers/wiki.js"),
  chat: () => import("./_handlers/chat.js"),
  ideas: () => import("./_handlers/ideas.js"),
  market: () => import("./_handlers/market.js"),
  scan: () => import("./_handlers/scan.js"),
  macro: () => import("./_handlers/macro.js"),
  "macro-alerts": () => import("./_handlers/macro-alerts.js"),
  "geo-intel": () => import("./_handlers/geo-intel.js"),
  hitl: () => import("./_handlers/hitl.js"),
  "paper-status": () => import("./_handlers/paper-status.js"),
  "paper-start": () => import("./_handlers/paper-start.js"),
  feed: () => import("./_handlers/feed.js"),
  sidebet: () => import("./_handlers/sidebet.js"),
  leaderboard: () => import("./_handlers/leaderboard.js"),
};

export default async function handler(req: VercelRequest, res: VercelResponse) {
  const slugParam = req.query.slug;
  const slug = Array.isArray(slugParam) ? slugParam[0] : slugParam;

  if (!slug || typeof slug !== "string") {
    res.status(404).json({ error: "Not found" });
    return;
  }

  const loader = routes[slug];
  if (!loader) {
    res.status(404).json({ error: "Not found" });
    return;
  }

  const mod = await loader();
  await mod.default(req, res);
}
