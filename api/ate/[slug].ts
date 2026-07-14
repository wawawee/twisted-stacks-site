import type { VercelRequest, VercelResponse } from "./_lib/session.js";

const routes: Record<string, () => Promise<{ default: (req: VercelRequest, res: VercelResponse) => unknown }>> = {
  auth: () => import("./_handlers/auth.js"),
  project: () => import("./_handlers/project.js"),
  wiki: () => import("./_handlers/wiki.js"),
  chat: () => import("./_handlers/chat.js"),
  ideas: () => import("./_handlers/ideas.js"),
  market: () => import("./_handlers/market.js"),
  scan: () => import("./_handlers/scan.js"),
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
