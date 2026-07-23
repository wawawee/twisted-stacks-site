import { useCallback, useEffect, useState } from "react";

export type Theme = "light" | "dark";

/** v2 resets stale dark prefs so investor landing opens bright. */
const STORAGE_KEY = "suparays-theme-v2";

/**
 * Bright by default. Saved preference still wins after the user toggles.
 */
export function useTheme() {
  const [theme, setThemeState] = useState<Theme>(() => {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved === "dark" || saved === "light") return saved;
    return "light";
  });

  const setTheme = useCallback((next: Theme) => {
    setThemeState(next);
    localStorage.setItem(STORAGE_KEY, next);
  }, []);

  const toggleTheme = useCallback(() => {
    setTheme(theme === "dark" ? "light" : "dark");
  }, [theme, setTheme]);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, theme);
  }, [theme]);

  return { theme, setTheme, toggleTheme, isDark: theme === "dark" };
}
