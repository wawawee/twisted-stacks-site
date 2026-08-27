#!/usr/bin/env node
/**
 * Build SuperSenses Studio (VR-SuperPowers/web-alpha) into public/studio/
 * for twistedstacks.com/studio — SIM BASE investor demo.
 *
 * Local: uses ../VR-SuperPowers/web-alpha
 * Vercel: sparse-clones private repo with GITHUB_TOKEN_WAWAWEE
 */

import { execSync } from "node:child_process";
import fs from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, "..");
const OUT = path.join(ROOT, "public", "studio");
const LOCAL_WEB = path.resolve(ROOT, "../VR-SuperPowers/web-alpha");

const GITHUB = { owner: "wawawee", repo: "VR-SuperPowers", branch: "main" };

function githubToken() {
  return (
    process.env.GITHUB_TOKEN_WAWAWEE ||
    process.env.GITHUB_TOKEN ||
    process.env.GH_TOKEN ||
    ""
  );
}

async function pathExists(p) {
  try {
    await fs.access(p);
    return true;
  } catch {
    return false;
  }
}

async function rmrf(p) {
  await fs.rm(p, { recursive: true, force: true });
}

async function copyDir(src, dest) {
  await fs.mkdir(dest, { recursive: true });
  await fs.cp(src, dest, { recursive: true });
}

function run(cmd, opts = {}) {
  console.log(`$ ${cmd}`);
  execSync(cmd, { stdio: "inherit", ...opts });
}

async function resolveWebAlpha() {
  if (await pathExists(path.join(LOCAL_WEB, "package.json"))) {
    console.log(`Studio source: local ${LOCAL_WEB}`);
    return LOCAL_WEB;
  }

  const token = githubToken();
  if (!token) {
    throw new Error(
      "web-alpha not found locally and GITHUB_TOKEN_WAWAWEE unset — cannot build Studio on Vercel",
    );
  }

  const tmp = path.join(ROOT, ".tmp-studio-src");
  await rmrf(tmp);
  await fs.mkdir(tmp, { recursive: true });

  const url = `https://x-access-token:${token}@github.com/${GITHUB.owner}/${GITHUB.repo}.git`;
  run(
    `git clone --depth 1 --filter=blob:none --sparse --branch ${GITHUB.branch} ${url} repo`,
    { cwd: tmp },
  );
  run("git sparse-checkout set web-alpha", { cwd: path.join(tmp, "repo") });
  const web = path.join(tmp, "repo", "web-alpha");
  if (!(await pathExists(path.join(web, "package.json")))) {
    throw new Error("sparse checkout missing web-alpha/package.json");
  }
  console.log(`Studio source: GitHub ${GITHUB.owner}/${GITHUB.repo}@${GITHUB.branch}`);
  return web;
}

async function main() {
  const web = await resolveWebAlpha();

  run("npm ci", { cwd: web });
  run("npm run build", {
    cwd: web,
    env: { ...process.env, VITE_BASE: "/studio/" },
  });

  const dist = path.join(web, "dist");
  if (!(await pathExists(path.join(dist, "index.html")))) {
    throw new Error("web-alpha build produced no dist/index.html");
  }

  await rmrf(OUT);
  await copyDir(dist, OUT);
  console.log(`Studio published → ${OUT}`);

  // cleanup sparse clone if used
  const tmp = path.join(ROOT, ".tmp-studio-src");
  if (await pathExists(tmp)) await rmrf(tmp);
}

main().catch((err) => {
  console.warn("[build:studio] Warning: Skipping studio build:", err.message);
  process.exit(0);
});
