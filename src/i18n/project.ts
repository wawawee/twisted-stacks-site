/**
 * TwistedStacks i18n — project content localiser.
 *
 * Each project entry carries English content as the default fields
 * (tagline, description, longDescription, faq, telemetry labels) and
 * optional Swedish translations (`taglineSv`, `descriptionSv`,
 * `longDescriptionSv`, `faqSv`, telemetry labels). When a Swedish
 * field is missing we fall back to English so the UI never renders a
 * "missing translation" hole.
 *
 * Brand / proper-noun fields (name, version, href, ctaLabel, status)
 * are language-neutral and returned as-is.
 *
 * `localizeProject` accepts either the full ProjectEntry (from
 * data/projects.ts) or the lighter ShowroomProject shape used by the
 * inline CATALOG_PROJECTS array — both share the surface that the
 * showroom UI cares about.
 */

import type { Lang } from "./types";
import type { ProjectEntry } from "../data/projects";

/**
 * Loose shape of a project record. Both `ProjectEntry` and the inline
 * `ShowroomProject` interface satisfy this. Using `unknown` fallbacks
 * for fields that don't exist on the lighter shape so the localiser
 * stays type-safe.
 */
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
  longDescriptionLang?: "en" | "sv";

  // Optional Swedish localisation
  taglineSv?: string;
  descriptionSv?: string;
  longDescriptionSv?: string;
  faqSv?: { q: string; a: string }[];
  telemetrySv?: { label: string; value: string }[];
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
  /** FAQ items in the active language. */
  faq: ProjectEntry["faq"];
  /** Telemetry rows with the label localised. */
  telemetry: ProjectEntry["telemetry"];
  /** Tech stack chips (language-neutral, proper nouns). */
  stack: string[];
  /** SEO keywords (English baseline). */
  keywords: string[];
  /** Source language for `longDescription`. */
  longDescriptionLang: Lang;
}

export function localizeProject(
  project: LocalizableProject,
  lang: Lang,
): LocalizedProject {
  const p = project;

  const enText = {
    tagline: p.tagline,
    description: p.description,
    longDescription: p.longDescription ?? "",
    faq: p.faq ?? [],
    telemetry: p.telemetry ?? [],
  };
  const svText = lang === "sv"
    ? {
        tagline: p.taglineSv ?? enText.tagline,
        description: p.descriptionSv ?? enText.description,
        longDescription: p.longDescriptionSv ?? enText.longDescription,
        faq: p.faqSv && p.faqSv.length > 0 ? p.faqSv : enText.faq,
        telemetry:
          p.telemetrySv && p.telemetrySv.length > 0
            ? p.telemetrySv
            : enText.telemetry,
      }
    : enText;

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
    tagline: svText.tagline,
    description: svText.description,
    longDescription: svText.longDescription,
    faq: svText.faq,
    telemetry: svText.telemetry,
    stack: p.stack ?? [],
    keywords: p.keywords ?? [],
    longDescriptionLang:
      (p.longDescriptionSv ? "sv" : p.longDescriptionLang ?? "en") as Lang,
  };
}

/**
 * Returns a 1-sentence "hook" suitable for the trimmed showroom card.
 * Currently this is the first sentence of the localised description, with
 * the period preserved. Used when we want a single short line of context
 * under the tagline instead of a multi-paragraph description.
 */
export function projectHook(
  project: LocalizableProject,
  lang: Lang,
): string {
  const description = localizeProject(project, lang).description;
  const trimmed = description.trim();
  if (!trimmed) return "";
  // Split on `. ` but keep things inside parentheses / quotes intact.
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
