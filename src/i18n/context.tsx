/**
 * TwistedStacks i18n — context + hook.
 *
 * English-only since 2026-07-08. The provider still exists so call
 * sites can keep using `useTranslation()`, but `lang` is hard-coded
 * to `"en"` and there's no toggle / persistence.
 */

import React, { createContext, useContext, useMemo } from "react";
import type { Dictionary, Lang } from "./types";
import { getDictionary } from "./dictionaries";

interface LanguageContextValue {
  lang: Lang;
  t: Dictionary;
}

const LanguageContext = createContext<LanguageContextValue | null>(null);

interface LanguageProviderProps {
  children: React.ReactNode;
}

export function LanguageProvider({ children }: LanguageProviderProps) {
  const value = useMemo<LanguageContextValue>(
    () => ({
      lang: "en",
      t: getDictionary("en"),
    }),
    [],
  );

  return <LanguageContext.Provider value={value}>{children}</LanguageContext.Provider>;
}

export function useTranslation(): LanguageContextValue {
  const ctx = useContext(LanguageContext);
  if (!ctx) {
    // Fall back to EN when the provider is missing (e.g. unit tests / SSR).
    return {
      lang: "en",
      t: getDictionary("en"),
    };
  }
  return ctx;
}

/** Shorthand for the active dictionary. */
export function useT(): Dictionary {
  return useTranslation().t;
}