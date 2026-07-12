#!/usr/bin/env node
/**
 * One-off: sync an existing idébox row to wiki/IDEAS.md.
 * Usage: node scripts/backfill-idea-wiki.mjs <id> [--env-file .env.production]
 */
import { readFileSync } from "node:fs";
import { resolve } from "node:path";

const args = process.argv.slice(2);
const idArg = args.find((a) => !a.startsWith("--"));
const envFileArg = args.find((a) => a.startsWith("--env-file="))?.split("=")[1]
  || (args.includes("--env-file") ? args[args.indexOf("--env-file") + 1] : ".env.production");

if (!idArg) {
  console.error("Usage: node scripts/backfill-idea-wiki.mjs <id> [--env-file path]");
  process.exit(1);
}

const ideaId = Number.parseInt(idArg, 10);
if (!Number.isFinite(ideaId)) {
  console.error("Invalid id:", idArg);
  process.exit(1);
}

for (const file of [".env.production", ".env", envFileArg].filter(Boolean)) {
  try {
    for (const line of readFileSync(resolve(file), "utf8").split("\n")) {
      const m = line.match(/^([A-Z0-9_]+)=(.*)$/);
      if (m) process.env[m[1]] = m[2].replace(/^"|"$/g, "");
    }
  } catch {
    /* optional env file */
  }
}

const { createClient } = await import("@supabase/supabase-js");
const { syncIdeaToWiki } = await import("../api/suparays/sync-idea-wiki.ts");

const url = process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL;
const key =
  process.env.SUPABASE_SERVICE_ROLE_KEY ||
  process.env.SUPABASE_SERVICE_KEY ||
  process.env.SUPABASE_SECRET_KEY;
if (!url || !key) {
  console.error("Missing SUPABASE_URL / SUPABASE_SERVICE_ROLE_KEY in", envFileArg);
  process.exit(1);
}

const supabase = createClient(url, key, {
  auth: { autoRefreshToken: false, persistSession: false },
});

const { data, error } = await supabase
  .from("suparays_ideas")
  .select("id, member, body, created_at")
  .eq("id", ideaId)
  .single();

if (error || !data) {
  console.error("Idea not found:", error?.message || ideaId);
  process.exit(1);
}

const idea = {
  id: data.id,
  member: data.member,
  body: data.body,
  createdAt: data.created_at,
};

console.log("Syncing idébox #" + idea.id, "(@" + idea.member + ")…");
const wiki = await syncIdeaToWiki(idea);
console.log(JSON.stringify(wiki, null, 2));

if (wiki.synced && !wiki.skipped) {
  const { error: upErr } = await supabase
    .from("suparays_ideas")
    .update({ wiki_synced_at: new Date().toISOString(), wiki_sync_error: null })
    .eq("id", idea.id);
  if (upErr) console.warn("Could not update wiki_synced_at:", upErr.message);
}

process.exit(wiki.synced ? 0 : 1);
