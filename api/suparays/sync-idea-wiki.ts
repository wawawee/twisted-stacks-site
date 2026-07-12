import { readEnv } from "./session.js";

const GITHUB_OWNER = "wawawee";
const GITHUB_REPO = "VR-SuperPowers";
const IDEAS_PATH = "wiki/IDEAS.md";
const INBOX_DIR = "wiki/inbox";
const LONG_BODY_CHARS = 420;
const MARKER_PREFIX = "idébox #";

export interface IdeaWikiSyncInput {
  id: number;
  member: string;
  body: string;
  createdAt: string;
}

export interface IdeaWikiSyncResult {
  synced: boolean;
  skipped?: boolean;
  reason?: string;
  inboxPath?: string;
}

function githubToken() {
  return readEnv("GITHUB_TOKEN_WAWAWEE") || readEnv("GITHUB_TOKEN") || readEnv("GH_TOKEN");
}

function isoDate(iso: string) {
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return new Date().toISOString().slice(0, 10);
  return d.toISOString().slice(0, 10);
}

function slugify(text: string) {
  return text
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 48);
}

function firstLine(body: string) {
  const line = body.split("\n").map((l) => l.trim()).find(Boolean) || "Idé";
  return line.replace(/^\[([^\]]+)\]\s*/, (_, t) => t).slice(0, 120);
}

function summaryOneLine(body: string) {
  return body.replace(/\s+/g, " ").trim().slice(0, 280);
}

function insertBullet(ideasMd: string, bullet: string, marker: string) {
  if (ideasMd.includes(marker)) {
    return { content: ideasMd, inserted: false };
  }

  const header = "## New (this week)";
  const idx = ideasMd.indexOf(header);
  if (idx === -1) {
    throw new Error("wiki/IDEAS.md saknar sektionen ## New (this week)");
  }

  const afterHeader = idx + header.length;
  const lineEnd = ideasMd.indexOf("\n", afterHeader);
  const insertAt = lineEnd === -1 ? ideasMd.length : lineEnd + 1;
  const before = ideasMd.slice(0, insertAt);
  const after = ideasMd.slice(insertAt);
  const block = `${before}\n${bullet}\n${after}`;
  return { content: block, inserted: true };
}

async function ghFetch(path: string, init?: RequestInit) {
  const token = githubToken();
  if (!token) throw new Error("GITHUB_TOKEN saknas");

  const url = path.startsWith("http")
    ? path
    : `https://api.github.com/repos/${GITHUB_OWNER}/${GITHUB_REPO}${path}`;

  const res = await fetch(url, {
    ...init,
    headers: {
      Accept: "application/vnd.github+json",
      Authorization: `Bearer ${token}`,
      "X-GitHub-Api-Version": "2022-11-28",
      ...(init?.headers || {}),
    },
  });

  if (!res.ok) {
    const text = await res.text();
    throw new Error(`GitHub API ${res.status}: ${text.slice(0, 240)}`);
  }

  return res.json() as Promise<{
    sha?: string;
    content?: string;
    encoding?: string;
  }>;
}

async function readRepoFile(path: string) {
  const meta = await ghFetch(`/contents/${path}?ref=main`);
  if (!meta.content || meta.encoding !== "base64") {
    throw new Error(`Kunde inte läsa ${path}`);
  }
  const content = Buffer.from(meta.content, "base64").toString("utf8");
  return { sha: meta.sha as string, content };
}

async function writeRepoFile(path: string, content: string, sha: string | null, message: string) {
  await ghFetch(`/contents/${path}`, {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      message,
      content: Buffer.from(content, "utf8").toString("base64"),
      branch: "main",
      ...(sha ? { sha } : {}),
    }),
  });
}

function inboxMarkdown(input: IdeaWikiSyncInput, title: string) {
  const date = isoDate(input.createdAt);
  return `# ${title}

**Status:** new (auto-sync från idébox)  
**Author:** @${input.member}  
**Date:** ${date}  
**Idébox:** #${input.id}

---

${input.body.trim()}
`;
}

export async function syncIdeaToWiki(input: IdeaWikiSyncInput): Promise<IdeaWikiSyncResult> {
  const token = githubToken();
  if (!token) {
    return { synced: false, skipped: true, reason: "GITHUB_TOKEN not configured" };
  }

  const marker = `${MARKER_PREFIX}${input.id}`;
  const date = isoDate(input.createdAt);
  const title = firstLine(input.body);
  const longForm = input.body.length > LONG_BODY_CHARS || input.body.split("\n").length > 4;

  try {
    let inboxPath: string | undefined;
    let bullet: string;

    if (longForm) {
      inboxPath = `${INBOX_DIR}/${date}-idea-${input.id}-${slugify(title) || "note"}.md`;
      const inboxFile = inboxMarkdown(input, title);
      let inboxSha: string | null = null;
      try {
        const existing = await readRepoFile(inboxPath);
        inboxSha = existing.sha;
        if (existing.content.includes(marker)) {
          inboxPath = undefined;
        } else {
          await writeRepoFile(
            inboxPath,
            inboxFile,
            inboxSha,
            `idébox #${input.id}: sync inbox (${input.member})`,
          );
        }
      } catch {
        await writeRepoFile(
          inboxPath,
          inboxFile,
          null,
          `idébox #${input.id}: add inbox (${input.member})`,
        );
      }

      bullet = `- [${title}] — se [inbox/${inboxPath.split("/").pop()}](inbox/${inboxPath.split("/").pop()}). _@${input.member}, ${date} · ${marker}_`;
    } else {
      bullet = `- [${title}] — ${summaryOneLine(input.body)} _@${input.member}, ${date} · ${marker}_`;
    }

    const ideasFile = await readRepoFile(IDEAS_PATH);
    const { content, inserted } = insertBullet(ideasFile.content, bullet, marker);
    if (!inserted) {
      return { synced: true, skipped: true, reason: "already in IDEAS.md", inboxPath };
    }

    await writeRepoFile(
      IDEAS_PATH,
      content,
      ideasFile.sha,
      `idébox #${input.id}: ${title} (@${input.member})`,
    );

    return { synced: true, inboxPath };
  } catch (err) {
    return {
      synced: false,
      reason: err instanceof Error ? err.message : "wiki sync failed",
    };
  }
}
