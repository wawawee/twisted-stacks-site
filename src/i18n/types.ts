/**
 * TwistedStacks i18n — language + dictionary types.
 *
 * The showroom is English-only as of 2026-07-08. `Lang` is kept as a
 * type alias so the rest of the code can keep using `t.*` access
 * patterns, but the runtime always resolves to English.
 */

export type Lang = "en";

/**
 * Resolve the active language. Currently a hard-coded English.
 * Kept as a function so call sites don't need to know the wiring
 * has been simplified.
 */
export function detectLang(_navigatorLang?: string): Lang {
  return "en";
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