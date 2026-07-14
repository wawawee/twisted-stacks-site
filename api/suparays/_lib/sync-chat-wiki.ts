import { readEnv } from "./session.js";

const GITHUB_OWNER = "wawawee";
const GITHUB_REPO = "VR-SuperPowers";
const CHAT_PATH = "wiki/COLLAB-CHAT.md";
const INBOX_DIR = "wiki/inbox";
const LONG_BODY_CHARS = 420;
const MARKER_PREFIX = "chat #";
const HEADER = "## Senaste meddelanden";

export interface ChatWikiSyncInput {
  id: number;
  member: string;
  body: string;
  createdAt: string;
}

export interface ChatWikiSyncResult {
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

function isoDateTime(iso: string) {
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return new Date().toISOString().slice(0, 16).replace("T", " ");
  return d.toISOString().slice(0, 16).replace("T", " ");
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
  const line = body.split("\n").map((l) => l.trim()).find(Boolean) || "Meddelande";
  return line.slice(0, 120);
}

function summaryOneLine(body: string) {
  return body.replace(/\s+/g, " ").trim().slice(0, 280);
}

function defaultChatMd() {
  return `# Colab chat — teamlogg

Auto-sync från SUPARAYS colab (\`twistedstacks.com/suparays\`).
Investerare, teknik, design, marknad och dev — korta diskussioner och beslut.

${HEADER}

*(Tomt — skriv första meddelandet i Chat i colab-rummet.)*
`;
}

function insertEntry(chatMd: string, entry: string, marker: string) {
  if (chatMd.includes(marker)) {
    return { content: chatMd, inserted: false };
  }

  const idx = chatMd.indexOf(HEADER);
  if (idx === -1) {
    throw new Error("wiki/COLLAB-CHAT.md saknar sektionen ## Senaste meddelanden");
  }

  const afterHeader = idx + HEADER.length;
  const lineEnd = chatMd.indexOf("\n", afterHeader);
  const insertAt = lineEnd === -1 ? chatMd.length : lineEnd + 1;
  const before = chatMd.slice(0, insertAt);
  const after = chatMd.slice(insertAt).replace(/^\n*\*\(Tomt[^*]*\)\*\n?/, "\n");
  return { content: `${before}\n${entry}\n${after}`, inserted: true };
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

  return res.json() as Promise<{ sha?: string; content?: string; encoding?: string }>;
}

async function readRepoFile(path: string) {
  try {
    const meta = await ghFetch(`/contents/${path}?ref=main`);
    if (!meta.content || meta.encoding !== "base64") {
      throw new Error(`Kunde inte läsa ${path}`);
    }
    const content = Buffer.from(meta.content, "base64").toString("utf8");
    return { sha: meta.sha as string, content };
  } catch (err) {
    if (path === CHAT_PATH) {
      return { sha: null as string | null, content: defaultChatMd() };
    }
    throw err;
  }
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

function inboxMarkdown(input: ChatWikiSyncInput, title: string) {
  const date = isoDate(input.createdAt);
  return `# Chat: ${title}

**Status:** auto-sync från colab chat  
**Author:** @${input.member}  
**Date:** ${date}  
**Chat:** #${input.id}

---

${input.body.trim()}
`;
}

export async function syncChatToWiki(input: ChatWikiSyncInput): Promise<ChatWikiSyncResult> {
  const token = githubToken();
  if (!token) {
    return { synced: false, skipped: true, reason: "GITHUB_TOKEN not configured" };
  }

  const marker = `${MARKER_PREFIX}${input.id}`;
  const date = isoDate(input.createdAt);
  const when = isoDateTime(input.createdAt);
  const title = firstLine(input.body);
  const longForm = input.body.length > LONG_BODY_CHARS || input.body.split("\n").length > 4;

  try {
    let inboxPath: string | undefined;
    let entry: string;

    if (longForm) {
      inboxPath = `${INBOX_DIR}/${date}-chat-${input.id}-${slugify(title) || "note"}.md`;
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
            `chat #${input.id}: sync inbox (@${input.member})`,
          );
        }
      } catch {
        await writeRepoFile(
          inboxPath,
          inboxFile,
          null,
          `chat #${input.id}: add inbox (@${input.member})`,
        );
      }

      entry = `- **${when}** @${input.member} · ${marker} — [${title}](inbox/${inboxPath.split("/").pop()})`;
    } else {
      entry = `- **${when}** @${input.member} · ${marker} — ${summaryOneLine(input.body)}`;
    }

    const chatFile = await readRepoFile(CHAT_PATH);
    const { content, inserted } = insertEntry(chatFile.content, entry, marker);
    if (!inserted) {
      return { synced: true, skipped: true, reason: "already in COLLAB-CHAT.md", inboxPath };
    }

    await writeRepoFile(
      CHAT_PATH,
      content,
      chatFile.sha,
      `chat #${input.id}: @${input.member} — ${title}`,
    );

    return { synced: true, inboxPath };
  } catch (err) {
    return {
      synced: false,
      reason: err instanceof Error ? err.message : "wiki sync failed",
    };
  }
}
