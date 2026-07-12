/**
 * Local API server for SUPARAYS room during `npm run dev:suparays`.
 * Vite proxies /api/suparays/* here — works in normal Chrome without vercel dev.
 */
import fs from "node:fs";
import http from "node:http";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, "..");
const PORT = Number(process.env.SUPARAYS_API_PORT || 3011);

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
process.env.SUPARAYS_DEV_SKIP_AUTH = process.env.SUPARAYS_DEV_SKIP_AUTH || "1";

const routes: Record<string, () => Promise<{ default: (req: unknown, res: unknown) => unknown }>> = {
  "/api/suparays/auth": () => import("../api/suparays/auth.ts"),
  "/api/suparays/project": () => import("../api/suparays/project.ts"),
  "/api/suparays/wiki": () => import("../api/suparays/wiki.ts"),
  "/api/suparays/chat": () => import("../api/suparays/chat.ts"),
  "/api/suparays/ideas": () => import("../api/suparays/ideas.ts"),
  "/api/suparays/files": () => import("../api/suparays/files.ts"),
};

async function readBody(req: http.IncomingMessage) {
  const chunks: Buffer[] = [];
  for await (const chunk of req) chunks.push(Buffer.from(chunk));
  const raw = Buffer.concat(chunks).toString("utf8");
  return raw || undefined;
}

function toVercelRequest(req: http.IncomingMessage, body: string | undefined, pathname: string, search: string) {
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
        const values = Array.isArray(value) ? value : [value];
        res.setHeader("Set-Cookie", values);
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
    json(payload: unknown) {
      if (!res.headersSent) res.setHeader("Content-Type", "application/json; charset=utf-8");
      res.end(JSON.stringify(payload));
    },
    end() {
      res.end();
    },
  };
}

const server = http.createServer(async (req, res) => {
  try {
    const host = req.headers.host || "localhost";
    const url = new URL(req.url || "/", `http://${host}`);
    const pathname = url.pathname;

    if (req.method === "OPTIONS") {
      res.writeHead(204);
      res.end();
      return;
    }

    const loader = routes[pathname];
    if (!loader) {
      res.writeHead(404, { "Content-Type": "application/json" });
      res.end(JSON.stringify({ error: "Not found" }));
      return;
    }

    const body = req.method === "GET" || req.method === "DELETE" ? undefined : await readBody(req);
    const handler = (await loader()).default;
    await handler(toVercelRequest(req, body, pathname, url.search), toVercelResponse(res));
  } catch (err) {
    console.error("[suparays-api]", err);
    if (!res.headersSent) {
      res.writeHead(500, { "Content-Type": "application/json" });
      res.end(JSON.stringify({ error: "Internal server error" }));
    }
  }
});

server.listen(PORT, "127.0.0.1", () => {
  console.log(`SUPARAYS API → http://127.0.0.1:${PORT}/api/suparays/*`);
});
