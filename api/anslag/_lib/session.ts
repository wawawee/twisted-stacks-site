import { createHmac, timingSafeEqual } from "node:crypto";

export const COOKIE_NAME = "anslag_session";
export const MEMBER_COOKIE = "anslag_member";
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
  end(body?: string): void;
};

export function readEnv(name: string) {
  const value = process.env[name]?.trim();
  return value?.replace(/^['"]|['"]$/g, "");
}

export function getRoomPassword() {
  return (
    readEnv("ANSLAG_ROOM_PASSWORD") ||
    readEnv("ADMIN_PASSWORD") ||
    readEnv("FUNDING_ROOM_PASSWORD") ||
    "baha123"
  );
}

function getSessionSecret() {
  return readEnv("ANSLAG_ROOM_SECRET") || getRoomPassword();
}

function cookieDomainPart() {
  if (process.env.VERCEL === "1" || process.env.NODE_ENV === "production") {
    return "Domain=.twistedstacks.com";
  }
  return "";
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
    if (a.length !== b.length || !timingSafeEqual(a, b)) return false;
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
  return parseCookieHeader(req.headers.cookie).get(COOKIE_NAME);
}

function cookieParts(name: string, value: string, maxAge: number) {
  const secure = process.env.NODE_ENV === "production" || process.env.VERCEL === "1";
  const parts = [
    `${name}=${value}`,
    "Path=/",
    "SameSite=Lax",
    `Max-Age=${maxAge}`,
    cookieDomainPart(),
  ].filter(Boolean);
  if (name === COOKIE_NAME) parts.push("HttpOnly");
  if (secure) parts.push("Secure");
  return parts.join("; ");
}

export function setSessionCookies(res: VercelResponse, token: string, member: string) {
  res.setHeader("Set-Cookie", [
    cookieParts(COOKIE_NAME, encodeURIComponent(token), SESSION_MAX_AGE_SEC),
    cookieParts(MEMBER_COOKIE, encodeURIComponent(member), SESSION_MAX_AGE_SEC),
  ]);
}

export function clearSessionCookies(res: VercelResponse) {
  res.setHeader("Set-Cookie", [
    cookieParts(COOKIE_NAME, "", 0),
    cookieParts(MEMBER_COOKIE, "", 0),
  ]);
}

export function devAuthSkipped() {
  const v = readEnv("ANSLAG_DEV_SKIP_AUTH");
  return v === "1" || v === "true";
}
