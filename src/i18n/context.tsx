/**
 * TwistedStacks i18n — React context, provider, and `useTranslation()` hook.
 *
 * The provider wraps the whole app in main.tsx. The hook is consumed by
 * every component that renders user-facing strings. Language is read from
 * localStorage on first render, with a navigator-language fallback, and
 * persisted on every switch.
 */

import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react";
import { DEFAULT_LANG, detectLang, type Dictionary, type Lang } from "./types";
import { getDictionary } from "./dictionaries";

const STORAGE_KEY = "twistedstacks:lang";

interface LanguageContextValue {
  lang: Lang;
  setLang: (next: Lang) => void;
  toggle: () => void;
  t: Dictionary;
}

const LanguageContext = createContext<LanguageContextValue | null>(null);

function readPersistedLang(): Lang | null {
  if (typeof window === "undefined") return null;
  try {
    const stored = window.localStorage.getItem(STORAGE_KEY);
    if (stored === "en" || stored === "sv") return stored;
  } catch {
    /* private mode / quota — fall through */
  }
  return null;
}

function writePersistedLang(lang: Lang) {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.setItem(STORAGE_KEY, lang);
  } catch {
    /* ignore */
  }
}

interface LanguageProviderProps {
  children: React.ReactNode;
}

export function LanguageProvider({ children }: LanguageProviderProps) {
  const [lang, setLangState] = useState<Lang>(() => {
    return readPersistedLang() ?? detectLang(typeof navigator !== "undefined" ? navigator.language : undefined);
  });

  const setLang = useCallback((next: Lang) => {
    setLangState(next);
    writePersistedLang(next);
  }, []);

  const toggle = useCallback(() => {
    setLangState((prev) => {
      const next: Lang = prev === "en" ? "sv" : "en";
      writePersistedLang(next);
      return next;
    });
  }, []);

  // Keep <html lang> in sync so screen readers and CSS :lang() selectors
  // see the active language.
  useEffect(() => {
    if (typeof document === "undefined") return;
    if (document.documentElement.lang !== lang) {
      document.documentElement.lang = lang;
    }
  }, [lang]);

  const value = useMemo<LanguageContextValue>(
    () => ({
      lang,
      setLang,
      toggle,
      t: getDictionary(lang),
    }),
    [lang, setLang, toggle],
  );

  return <LanguageContext.Provider value={value}>{children}</LanguageContext.Provider>;
}

export function useTranslation(): LanguageContextValue {
  const ctx = useContext(LanguageContext);
  if (!ctx) {
    // Fall back to EN when the provider is missing (e.g. unit tests / SSR).
    // Avoids a hard crash for components rendered outside the provider tree.
    return {
      lang: DEFAULT_LANG,
      setLang: () => {},
      toggle: () => {},
      t: getDictionary(DEFAULT_LANG),
    };
  }
  return ctx;
}

/** Shorthand for the active dictionary. */
export function useT(): Dictionary {
  return useTranslation().t;
}
