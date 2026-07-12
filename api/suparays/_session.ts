import { createHmac, timingSafeEqual } from "node:crypto";

export const COOKIE_NAME = "suparays_session";
export const SESSION_MAX_AGE_SEC = 7 * 24 * 60 * 60;

export type VercelRequest = {
  method?: string;
  query: Record<string, string | string[] | undefined>;
  body?: unknown;
  headers: Record<string, string | string[] | undefined>;
};

export type VercelResponse = {
  setHeader(name: string, value: string | string[]): void;
  status(code: number): VercelResponse;
  json(body: unknown): void;
  end(): void;
};

export function readEnv(name: string) {
  const value = process.env[name]?.trim();
  return value?.replace(/^['"]|['"]$/g, "");
}

export function getRoomPassword() {
  return readEnv("SUPARAYS_ROOM_PASSWORD") || "baha123";
}

function getSessionSecret() {
  return readEnv("SUPARAYS_ROOM_SECRET") || getRoomPassword();
}

export function createSessionToken() {
  const expiresAt = Math.floor(Date.now() / 1000) + SESSION_MAX_AGE_SEC;
  const payload = String(expiresAt);
  const sig = createHmac("sha256", getSessionSecret()).update(payload).digest("hex");
  return `${payload}.${sig}`;
}

export function verifySessionToken(token: string | undefined) {
  if (!token) return false;
  const [payload, sig] = token.split(".");
  if (!payload || !sig || !/^\d+$/.test(payload) || !/^[a-f0-9]+$/.test(sig)) return false;

  const expected = createHmac("sha256", getSessionSecret()).update(payload).digest("hex");
  try {
    const a = Buffer.from(sig, "hex");
    const b = Buffer.from(expected, "hex");
    if (a.length !== b.length) return false;
    if (!timingSafeEqual(a, b)) return false;
  } catch {
    return false;
  }

  const expiresAt = Number.parseInt(payload, 10);
  return Number.isFinite(expiresAt) && expiresAt > Math.floor(Date.now() / 1000);
}

export function parseCookieHeader(header: string | string[] | undefined) {
  const raw = Array.isArray(header) ? header[0] : header;
  if (!raw) return new Map<string, string>();
  const map = new Map<string, string>();
  for (const part of raw.split(";")) {
    const [key, ...rest] = part.trim().split("=");
    if (!key) continue;
    map.set(key, decodeURIComponent(rest.join("=")));
  }
  return map;
}

export function getSessionFromRequest(req: VercelRequest) {
  const cookies = parseCookieHeader(req.headers.cookie);
  return cookies.get(COOKIE_NAME);
}

export function setSessionCookie(res: VercelResponse, token: string) {
  const secure = process.env.NODE_ENV === "production" || process.env.VERCEL === "1";
  const parts = [
    `${COOKIE_NAME}=${encodeURIComponent(token)}`,
    "Path=/",
    "HttpOnly",
    "SameSite=Lax",
    `Max-Age=${SESSION_MAX_AGE_SEC}`,
  ];
  if (secure) parts.push("Secure");
  res.setHeader("Set-Cookie", parts.join("; "));
}

export function clearSessionCookie(res: VercelResponse) {
  const secure = process.env.NODE_ENV === "production" || process.env.VERCEL === "1";
  const parts = [`${COOKIE_NAME}=`, "Path=/", "HttpOnly", "SameSite=Lax", "Max-Age=0"];
  if (secure) parts.push("Secure");
  res.setHeader("Set-Cookie", parts.join("; "));
}

export function requireSession(req: VercelRequest, res: VercelResponse) {
  const token = getSessionFromRequest(req);
  if (!verifySessionToken(token)) {
    res.status(401).json({ error: "Unauthorized" });
    return false;
  }
  return true;
}
