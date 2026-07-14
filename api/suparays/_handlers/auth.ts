import {
  createSessionToken,
  getRoomPassword,
  getSessionFromRequest,
  SESSION_MAX_AGE_SEC,
  verifySessionToken,
  type VercelRequest,
  type VercelResponse,
} from "../_lib/session.js";

const VALID_MEMBERS = new Set(["baha", "kris", "joachim", "per"]);

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

function parseCookieHeader(header: string | string[] | undefined) {
  const raw = Array.isArray(header) ? header[0] : header;
  const map = new Map<string, string>();
  if (!raw) return map;
  for (const part of raw.split(";")) {
    const [key, ...rest] = part.trim().split("=");
    if (!key) continue;
    map.set(key, decodeURIComponent(rest.join("=")));
  }
  return map;
}

function memberCookie(member: string, clear = false) {
  const secure = process.env.NODE_ENV === "production" || process.env.VERCEL === "1";
  const maxAge = clear ? 0 : SESSION_MAX_AGE_SEC;
  const parts = [
    `suparays_member=${clear ? "" : encodeURIComponent(member)}`,
    "Path=/",
    "SameSite=Lax",
    `Max-Age=${maxAge}`,
  ];
  if (secure) parts.push("Secure");
  return parts.join("; ");
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
  res.setHeader("Cache-Control", "no-store");

  if (req.method === "GET") {
    const token = getSessionFromRequest(req);
    const ok = verifySessionToken(token);
    const cookies = parseCookieHeader(req.headers.cookie);
    res.status(200).json({
      authenticated: ok,
      member: ok ? cookies.get("suparays_member") || null : null,
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
      res.status(400).json({ error: "Välj vem du är (Baha, Kris, Joachim eller Per)" });
      return;
    }

    const token = createSessionToken();
    const secure = process.env.NODE_ENV === "production" || process.env.VERCEL === "1";
    const secureFlag = secure ? "; Secure" : "";
    res.setHeader("Set-Cookie", [
      `suparays_session=${encodeURIComponent(token)}; Path=/; HttpOnly; SameSite=Lax; Max-Age=${SESSION_MAX_AGE_SEC}${secureFlag}`,
      memberCookie(member),
    ]);

    res.status(200).json({ ok: true, member });
    return;
  }

  if (req.method === "DELETE") {
    const secure = process.env.NODE_ENV === "production" || process.env.VERCEL === "1";
    const secureFlag = secure ? "; Secure" : "";
    res.setHeader("Set-Cookie", [
      `suparays_session=; Path=/; HttpOnly; SameSite=Lax; Max-Age=0${secureFlag}`,
      memberCookie("", true),
    ]);
    res.status(200).json({ ok: true });
    return;
  }

  res.setHeader("Allow", "GET, POST, DELETE");
  res.status(405).json({ error: "Method not allowed" });
}
