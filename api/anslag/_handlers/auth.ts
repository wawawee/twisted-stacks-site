import {
  clearSessionCookies,
  createSessionToken,
  getRoomPassword,
  getSessionFromRequest,
  parseCookieHeader,
  MEMBER_COOKIE,
  setSessionCookies,
  verifySessionToken,
  type VercelRequest,
  type VercelResponse,
} from "../_lib/session.js";

const VALID_MEMBERS = new Set(["per", "joachim", "tony"]);

function parseBody(body: unknown) {
  if (typeof body !== "string") return body as Record<string, unknown>;
  try {
    return JSON.parse(body) as Record<string, unknown>;
  } catch {
    return null;
  }
}

function normalizeMember(value: unknown) {
  const raw = String(value ?? "")
    .trim()
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "");
  return VALID_MEMBERS.has(raw) ? raw : "";
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
  res.setHeader("Cache-Control", "no-store");

  if (req.method === "GET") {
    const token = getSessionFromRequest(req);
    const ok = verifySessionToken(token);
    const cookies = parseCookieHeader(req.headers.cookie);
    res.status(200).json({
      authenticated: ok,
      member: ok ? cookies.get(MEMBER_COOKIE) || null : null,
    });
    return;
  }

  if (req.method === "POST") {
    const body = parseBody(req.body);
    if (!body || typeof body !== "object") {
      res.status(400).json({ error: "Invalid body" });
      return;
    }

    const password = String(body.password ?? "");
    const member = normalizeMember(body.member);

    if (!password || password !== getRoomPassword()) {
      res.status(401).json({ error: "Fel lösenord" });
      return;
    }

    if (!member) {
      res.status(400).json({ error: "Välj vem du är (Per, Joachim eller Tony)" });
      return;
    }

    const token = createSessionToken();
    setSessionCookies(res, token, member);
    res.status(200).json({ ok: true, member });
    return;
  }

  if (req.method === "DELETE") {
    clearSessionCookies(res);
    res.status(200).json({ ok: true });
    return;
  }

  res.setHeader("Allow", "GET, POST, DELETE");
  res.status(405).json({ error: "Method not allowed" });
}
