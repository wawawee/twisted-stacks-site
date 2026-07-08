/**
 * TwistedStacks i18n — project content localiser.
 *
 * English-only since 2026-07-08. `localizeProject` returns the
 * English fields directly. The Swedish localisation hooks
 * (`taglineSv`, `descriptionSv`, `longDescriptionSv`, `faqSv`,
 * `telemetrySv`) were stripped from `data/projects.ts`; this file
 * keeps the surface clean so the call sites in App.tsx don't need
 * to change.
 */

import type { Lang } from "./types";
import type { ProjectEntry } from "../data/projects";

type LocalizableProject = {
  id: ProjectEntry["id"] | string;
  name: string;
  version: string;
  status: string;
  href?: string | null;
  ctaLabel?: string;
  brandColor?: ProjectEntry["brandColor"];
  featured?: boolean;
  lastUpdated?: string;
  contactMessage?: string;
  tagline: string;
  description: string;
  longDescription?: string;
  faq?: ProjectEntry["faq"];
  telemetry?: ProjectEntry["telemetry"];
  stack?: string[];
  keywords?: string[];
};

export interface LocalizedProject {
  id: ProjectEntry["id"] | string;
  name: string;
  version: string;
  status: string;
  href: string | null;
  ctaLabel: string;
  brandColor: ProjectEntry["brandColor"];
  featured: boolean;
  lastUpdated: string;
  contactMessage?: string;
  /** 1–2 sentence pitch. Shown on the showroom card. */
  tagline: string;
  /** Short card description (1 short sentence for the showroom card). */
  description: string;
  /** Long-form description paragraphs. Shown on the dedicated page. */
  longDescription: string;
  /** FAQ items. */
  faq: ProjectEntry["faq"];
  /** Telemetry rows. */
  telemetry: ProjectEntry["telemetry"];
  /** Tech stack chips (language-neutral, proper nouns). */
  stack: string[];
  /** SEO keywords (English baseline). */
  keywords: string[];
  /** Source language for `longDescription`. Always "en". */
  longDescriptionLang: Lang;
}

export function localizeProject(
  project: LocalizableProject,
  _lang?: Lang,
): LocalizedProject {
  const p = project;
  return {
    id: p.id,
    name: p.name,
    version: p.version,
    status: p.status,
    href: p.href ?? null,
    ctaLabel: p.ctaLabel ?? "Open",
    brandColor: p.brandColor ?? "accent",
    featured: p.featured ?? false,
    lastUpdated: p.lastUpdated ?? "",
    contactMessage: p.contactMessage,
    tagline: p.tagline,
    description: p.description,
    longDescription: p.longDescription ?? "",
    faq: p.faq ?? [],
    telemetry: p.telemetry ?? [],
    stack: p.stack ?? [],
    keywords: p.keywords ?? [],
    longDescriptionLang: "en",
  };
}

/**
 * Returns a 1-sentence "hook" suitable for the trimmed showroom card.
 */
export function projectHook(
  project: LocalizableProject,
  _lang?: Lang,
): string {
  const description = localizeProject(project).description;
  const trimmed = description.trim();
  if (!trimmed) return "";
  const firstSentenceEnd = (() => {
    let inParens = 0;
    let inQuotes = false;
    for (let i = 0; i < trimmed.length; i += 1) {
      const ch = trimmed[i];
      if (ch === "(") inParens += 1;
      else if (ch === ")") inParens = Math.max(0, inParens - 1);
      else if (ch === "\u201C" || ch === "\u201D" || ch === '"') inQuotes = !inQuotes;
      else if (!inParens && !inQuotes && (ch === "." || ch === "!" || ch === "?")) {
        return i + 1;
      }
    }
    return Math.min(trimmed.length, 200);
  })();
  return trimmed.slice(0, firstSentenceEnd).trim();
}