/**
 * TwistedStacks i18n dictionaries — English only (since 2026-07-08).
 *
 * Brand language (e.g. "TWISTED PONGG", sensor accent names) is kept
 * English. These are proper nouns / brand terms.
 */

import type { Dictionary, Lang } from "./types";

const en: Dictionary = {
  meta: {
    title: "TwistedStacks | AI systems showroom",
    description:
      "TwistedStacks builds useful AI systems and labs: REVISION, LAGA, TANGLE, Anslag, SUPARAYS, CymWave, Recon Search Assistant, and selected web work.",
    ogDescription:
      "A clean showroom for TwistedStacks projects: legal AI, multi-agent evidence analysis, VR sensor overlays, hydro-wellness research, OSINT/search support, and playable TWISTED PONGG.",
  },
  topbar: {
    languageToggle: "EN",
    languageName: "en",
    switchTo: "en",
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

const DICTIONARY: Dictionary = en;

export function getDictionary(_lang?: Lang): Dictionary {
  return DICTIONARY;
}