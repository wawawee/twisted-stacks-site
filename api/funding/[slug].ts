import type { VercelRequest, VercelResponse } from "./_lib/session.js";

const routes: Record<string, () => Promise<{ default: (req: VercelRequest, res: VercelResponse) => unknown }>> = {
  auth: () => import("./_handlers/auth.js"),
  doc: () => import("./_handlers/doc.js"),
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
