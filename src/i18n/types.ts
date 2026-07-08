/**
 * TwistedStacks i18n — language + dictionary types.
 *
 * Two languages ship in the bundle (en, sv). The language toggle is a
 * pure UI switch — both dictionaries are always present so we never
 * lazy-load and never fall back to a "wrong" language mid-render.
 */

export type Lang = "en" | "sv";

export const SUPPORTED_LANGS: readonly Lang[] = ["en", "sv"] as const;
export const DEFAULT_LANG: Lang = "en";

/**
 * Best-effort mapping from a BCP-47 navigator language to our short codes.
 * Anything starting with `sv` becomes Swedish; everything else English.
 * The user can always override with the in-app toggle.
 */
export function detectLang(navigatorLang: string | undefined): Lang {
  if (!navigatorLang) return DEFAULT_LANG;
  const lower = navigatorLang.toLowerCase();
  if (lower.startsWith("sv")) return "sv";
  return DEFAULT_LANG;
}

export interface Dictionary {
  /** Fixed set of keys — see dictionaries.ts for the actual strings. */
  meta: {
    title: string;
    description: string;
    ogDescription: string;
  };
  topbar: {
    languageToggle: string;
    languageName: Lang;
    switchTo: Lang;
  };
  hero: {
    kicker: string;
    titleLine1: string;
    titleLine2: string;
    titleAccent: string;
    lede: string;
    actions: {
      playPongg: string;
      bookDemo: string;
      contact: string;
      github: string;
    };
  };
  showcase: {
    ariaLabel: string;
    readMore: string;
    hideDetails: string;
    stackKicker: string;
    topicsKicker: string;
    faqKicker: string;
    sourceNotes: string;
    openDemo: string;
    contactCta: string;
    backToShowroom: string;
    detailAriaLabel: (name: string) => string;
    projectAriaLabel: (name: string, action: string) => string;
    statusLine: (status: string, version: string) => string;
  };
  contact: {
    fabTitle: string;
    fabAria: string;
    intent: { demo: string; query: string; bug: string; feedback: string };
    contextLabel: string;
    fields: {
      name: string;
      email: string;
      company: string;
      companyPlaceholder: string;
      namePlaceholder: string;
      emailPlaceholder: string;
      messagePlaceholder: string;
    };
    requiredHint: string;
    fineprint: string;
    sendAria: string;
    closeAria: string;
    errors: {
      missingName: string;
      missingEmail: string;
      badEmail: string;
      missingMessage: string;
      network: (err: string) => string;
      generic: string;
      fallback: string;
    };
    success: {
      title: (name: string) => string;
      lede: (email: string) => string;
      forwarded: string;
      stored: string;
      close: string;
    };
  };
  easter: {
    vaultKicker: string;
    vaultTitle: string;
    vaultLede: string;
    vaultHint: (champion: boolean) => string;
    transmitVictory: string;
    playAgain: string;
    openArchive: string;
  };
  page: {
    notFound: string;
    notFoundBack: string;
  };
}

export type DictKey = keyof Dictionary;
