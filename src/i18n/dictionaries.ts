/**
 * TwistedStacks i18n dictionaries — EN and SV.
 *
 * Everything that lands in the user-facing UI lives here. Project
 * content (tagline, description, longDescription, FAQ) lives in
 * projects.ts and is selected at render time via pickProjectStrings().
 *
 * Brand language (e.g. "TWISTED PONGG", sensor accent names) is kept
 * English in both languages — these are proper nouns / brand terms.
 */

import type { Dictionary, Lang } from "./types";

const en: Dictionary = {
  meta: {
    title: "TwistedStacks | AI systems showroom",
    description:
      "TwistedStacks builds useful AI systems and labs: REVISION, LAGA, TANGLE, SUPARAYS, CymWave, Recon Search Assistant, and selected web work.",
    ogDescription:
      "A clean showroom for TwistedStacks projects: legal AI, multi-agent evidence analysis, VR sensor overlays, hydro-wellness research, OSINT/search support, and playable TWISTED PONGG.",
  },
  topbar: {
    languageToggle: "EN",
    languageName: "en",
    switchTo: "sv",
  },
  hero: {
    kicker: "TWISTEDSTACKS // SANDVIKEN AI LAB",
    titleLine1: "Useful systems.",
    titleLine2: "TWISTED edge.",
    titleAccent: "Twisted edge.",
    lede:
      "Local AI, legal workflows, voice-first interfaces, defensive research, and small polished sites. Built by Per Brinell as a practical showroom rather than a pitch deck.",
    actions: {
      playPongg: "Play Pongg",
      bookDemo: "Book Demo",
      contact: "Contact",
      github: "GitHub",
    },
  },
  showcase: {
    ariaLabel: "TwistedStacks projects",
    readMore: "Read more",
    hideDetails: "Hide details",
    stackKicker: "Stack",
    topicsKicker: "Topics",
    faqKicker: "FAQ",
    sourceNotes: "Source notes",
    openDemo: "Open",
    contactCta: "Contact",
    backToShowroom: "← Back to showroom",
    detailAriaLabel: (name) => `${name} details`,
    projectAriaLabel: (name, action) => `${name}: ${action}`,
    statusLine: (status, version) => `${status} · ${version}`,
  },
  contact: {
    fabTitle: "Contact hello@twistedstacks.com",
    fabAria: "Contact TwistedStacks",
    intent: {
      demo: "DEMO",
      query: "QUERY",
      bug: "BUG",
      feedback: "FEEDBACK",
    },
    contextLabel: "Subject",
    fields: {
      name: "Name *",
      email: "Email *",
      company: "Company / organisation (optional)",
      companyPlaceholder: "E.g. audit firm, hotel, studio",
      namePlaceholder: "First and last name",
      emailPlaceholder: "we@reply.here",
      messagePlaceholder: "What's it about — demo, question, collab, bug report…",
    },
    requiredHint: "*",
    fineprint:
      "We save your name and email in the studio queue and use them only to reply. No newsletter, no tracking.",
    sendAria: "Send",
    closeAria: "Close",
    errors: {
      missingName: "Type your name first.",
      missingEmail: "Type your email so we can reply.",
      badEmail: "That email does not look right — check the spelling.",
      missingMessage: "Write something first.",
      network: (err) =>
        `Network did not answer: ${err}. Email hello@twistedstacks.com directly if it keeps happening.`,
      generic: "Could not send the message. Try again or email hello@twistedstacks.com directly.",
      fallback:
        "Could not send the message. Email hello@twistedstacks.com directly.",
    },
    success: {
      title: (name) => `Thanks, ${name || "we're listening"}!`,
      lede: (email) =>
        `Your message is saved and we will reply within 1–2 business days to ${email}.`,
      forwarded:
        "Sent to hello@twistedstacks.com and a confirmation is on its way to your inbox.",
      stored:
        "Saved to the studio queue. We reply manually — if you have not heard from us within 2 business days, email hello@twistedstacks.com directly.",
      close: "Close",
    },
  },
  easter: {
    vaultKicker: "TWISTED PONGG // CLASSIFIED",
    vaultTitle: "STACK MASTER VAULT",
    vaultLede:
      "You cleared all 9 levels. The court opens a hidden thread — the autopilot rig spins, the ball turns gold, and the archive unlocks for you.",
    vaultHint: (champion) =>
      champion
        ? "Press P for the archive catalogue whenever you want."
        : "",
    transmitVictory: "Transmit Victory",
    playAgain: "Play Again",
    openArchive: "Open Archive",
  },
  page: {
    notFound: "Page not found.",
    notFoundBack: "← Back to showroom",
  },
};

const sv: Dictionary = {
  meta: {
    title: "TwistedStacks | AI-system showroom",
    description:
      "TwistedStacks bygger användbara AI-system och labb: REVISION, LAGA, TANGLE, SUPARAYS, CymWave, Recon Search Assistant och utvalda webbprojekt.",
    ogDescription:
      "En ren showroom för TwistedStacks-projekt: juridisk AI, multi-agent-bevisanalys, VR-sensoroverlay, hydro-wellness-forskning, OSINT/search-stöd och spelbara TWISTED PONGG.",
  },
  topbar: {
    languageToggle: "SV",
    languageName: "sv",
    switchTo: "en",
  },
  hero: {
    kicker: "TWISTEDSTACKS // SANDVIKEN AI-LABB",
    titleLine1: "Användbara system.",
    titleLine2: "TWISTED kant.",
    titleAccent: "Twistad kant.",
    lede:
      "Lokal AI, juridiska workflows, röst-först-gränssnitt, defensiv forskning och små polerade siter. Byggt av Per Brinell som en praktisk showroom — inte en pitch-deck.",
    actions: {
      playPongg: "Spela Pongg",
      bookDemo: "Boka demo",
      contact: "Kontakt",
      github: "GitHub",
    },
  },
  showcase: {
    ariaLabel: "TwistedStacks-projekt",
    readMore: "Läs mer",
    hideDetails: "Stäng",
    stackKicker: "Stack",
    topicsKicker: "Ämnen",
    faqKicker: "FAQ",
    sourceNotes: "Källnotiser",
    openDemo: "Öppna",
    contactCta: "Kontakt",
    backToShowroom: "← Tillbaka till showroom",
    detailAriaLabel: (name) => `${name} — detaljer`,
    projectAriaLabel: (name, action) => `${name}: ${action}`,
    statusLine: (status, version) => `${status} · ${version}`,
  },
  contact: {
    fabTitle: "Kontakta hello@twistedstacks.com",
    fabAria: "Kontakta TwistedStacks",
    intent: {
      demo: "DEMO",
      query: "FRÅGA",
      bug: "BUGG",
      feedback: "FEEDBACK",
    },
    contextLabel: "Ämne",
    fields: {
      name: "Namn *",
      email: "E-post *",
      company: "Företag / organisation (valfritt)",
      companyPlaceholder: "T.ex. revisionsbyrå, hotell, studio",
      namePlaceholder: "För- och efternamn",
      emailPlaceholder: "vi@svarar.här",
      messagePlaceholder: "Vad gäller det — demo, fråga, samarbete, felrapport…",
    },
    requiredHint: "*",
    fineprint:
      "Vi sparar ditt namn och e-post i studions kö och använder dem bara för att svara dig. Inga nyhetsbrev, inga spårningar.",
    sendAria: "Skicka",
    closeAria: "Stäng",
    errors: {
      missingName: "Skriv ditt namn först.",
      missingEmail: "Skriv din e-post så vi kan svara dig.",
      badEmail: "Den e-posten ser inte rätt ut — kolla stavningen.",
      missingMessage: "Skriv något först.",
      network: (err) =>
        `Nätverket svarade inte: ${err}. Maila hello@twistedstacks.com direkt om det fortsätter.`,
      generic:
        "Kunde inte skicka meddelandet. Försök igen eller maila hello@twistedstacks.com direkt.",
      fallback:
        "Kunde inte skicka meddelandet. Maila hello@twistedstacks.com direkt.",
    },
    success: {
      title: (name) => `Tack, ${name || "vi hörs"}!`,
      lede: (email) =>
        `Ditt meddelande är sparat och vi svarar inom 1–2 arbetsdagar till ${email}.`,
      forwarded:
        "Skickat till hello@twistedstacks.com och en bekräftelse är på väg till din inbox.",
      stored:
        "Sparat i studions kö. Vi svarar manuellt — om du inte hört av oss inom 2 arbetsdagar, maila hello@twistedstacks.com direkt.",
      close: "Stäng",
    },
  },
  easter: {
    vaultKicker: "TWISTED PONGG // KLASSIFICERAD",
    vaultTitle: "STACK MASTER-VALVET",
    vaultLede:
      "Du klarade alla 9 nivåer. Courtet öppnar en dold tråd — autopilot-riggen spinner, bollen blir guld och arkivet låser upp sig för dig.",
    vaultHint: (champion) =>
      champion ? "Tryck P för arkivkatalogen när du vill." : "",
    transmitVictory: "Sänd seger",
    playAgain: "Spela igen",
    openArchive: "Öppna arkiv",
  },
  page: {
    notFound: "Sidan finns inte.",
    notFoundBack: "← Tillbaka till showroom",
  },
};

export const DICTIONARIES: Record<Lang, Dictionary> = { en, sv };

export function getDictionary(lang: Lang): Dictionary {
  return DICTIONARIES[lang] ?? DICTIONARIES.en;
}
