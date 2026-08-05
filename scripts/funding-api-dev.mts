/**
 * Local API for funding room during `npm run dev:funding`.
 */
import fs from "node:fs";
import http from "node:http";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, "..");
const PORT = Number(process.env.FUNDING_API_PORT || 3014);

function loadEnvFile(name: string) {
  const file = path.join(ROOT, name);
  if (!fs.existsSync(file)) return;
  for (const line of fs.readFileSync(file, "utf8").split("\n")) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith("#")) continue;
    const eq = trimmed.indexOf("=");
    if (eq <= 0) continue;
    const key = trimmed.slice(0, eq).trim();
    let val = trimmed.slice(eq + 1).trim();
    if ((val.startsWith('"') && val.endsWith('"')) || (val.startsWith("'") && val.endsWith("'"))) {
      val = val.slice(1, -1);
    }
    if (!(key in process.env)) process.env[key] = val;
  }
}

loadEnvFile(".env");
loadEnvFile(".env.local");
process.env.FUNDING_DEV_SKIP_AUTH = process.env.FUNDING_DEV_SKIP_AUTH || "1";

const routes: Record<string, () => Promise<{ default: (req: unknown, res: unknown) => unknown }>> = {
  "/api/funding/auth": () => import("../api/funding/_handlers/auth.ts"),
  "/api/funding/doc": () => import("../api/funding/_handlers/doc.ts"),
};

async function readBody(req: http.IncomingMessage) {
  const chunks: Buffer[] = [];
  for await (const chunk of req) chunks.push(Buffer.from(chunk));
  const raw = Buffer.concat(chunks).toString("utf8");
  return raw || undefined;
}

function toVercelRequest(req: http.IncomingMessage, body: string | undefined, search: string) {
  const query: Record<string, string | string[]> = {};
  for (const [key, value] of new URLSearchParams(search)) {
    if (key in query) {
      const prev = query[key];
      query[key] = Array.isArray(prev) ? [...prev, value] : [prev, value];
    } else {
      query[key] = value;
    }
  }
  return {
    method: req.method,
    query,
    body,
    headers: req.headers as Record<string, string | string[] | undefined>,
  };
}

function toVercelResponse(res: http.ServerResponse) {
  return {
    setHeader(name: string, value: string | string[]) {
      if (name.toLowerCase() === "set-cookie") {
        res.setHeader("Set-Cookie", Array.isArray(value) ? value : [value]);
        return;
      }
      if (Array.isArray(value)) {
        for (const v of value) res.setHeader(name, v);
      } else {
        res.setHeader(name, value);
      }
    },
    status(code: number) {
      res.statusCode = code;
      return this;
    },
    json(body: unknown) {
      res.setHeader("Content-Type", "application/json");
      res.end(JSON.stringify(body));
    },
    end(chunk?: string) {
      res.end(chunk);
    },
  };
}

const server = http.createServer(async (req, res) => {
  const url = new URL(req.url || "/", `http://127.0.0.1:${PORT}`);
  const pathname = url.pathname.replace(/\/+$/, "") || "/";

  let routePath = pathname;
  if (pathname.startsWith("/api/funding/")) {
    const slug = pathname.slice("/api/funding/".length);
    if (slug === "auth" || slug === "doc") {
      routePath = `/api/funding/${slug}`;
    }
  }

  const loader = routes[routePath];
  if (!loader) {
    res.statusCode = 404;
    res.end("Not found");
    return;
  }

  try {
    const body = req.method === "POST" ? await readBody(req) : undefined;
    const mod = await loader();
    await mod.default(toVercelRequest(req, body, url.search), toVercelResponse(res));
  } catch (err) {
    console.error(err);
    if (!res.headersSent) {
      res.statusCode = 500;
      res.end("Internal error");
    }
  }
});

server.listen(PORT, "127.0.0.1", () => {
  console.log(`Funding API dev http://127.0.0.1:${PORT}`);
});
