"use client";

import { useCallback, useSyncExternalStore } from "react";
import { Moon, Sun } from "lucide-react";

export const THEME_STORAGE_KEY = "ledgerly-theme";

export function readStoredTheme(): "light" | "dark" {
  try {
    return window.localStorage.getItem(THEME_STORAGE_KEY) === "dark" ? "dark" : "light";
  } catch {
    return "light";
  }
}

export function applyDocumentTheme(theme: "light" | "dark") {
  const root = document.documentElement;
  root.classList.toggle("dark", theme === "dark");
  root.style.colorScheme = theme;
}

export function subscribeToTheme(onStoreChange: () => void) {
  window.addEventListener("storage", onStoreChange);
  window.addEventListener("ledgerly-theme", onStoreChange);
  return () => {
    window.removeEventListener("storage", onStoreChange);
    window.removeEventListener("ledgerly-theme", onStoreChange);
  };
}

/** Persist a theme and tell other tabs and this tab's toggle to re-read it. */
export function commitTheme(theme: "light" | "dark") {
  window.localStorage.setItem(THEME_STORAGE_KEY, theme);
  applyDocumentTheme(theme);
  window.dispatchEvent(new Event("ledgerly-theme"));
}

export function ThemeToggle() {
  const theme = useSyncExternalStore(subscribeToTheme, readStoredTheme, () => "light" as const);
  const toggle = useCallback(() => {
    commitTheme(theme === "dark" ? "light" : "dark");
  }, [theme]);

  return (
    <button
      type="button"
      onClick={toggle}
      className="rounded-full p-2 text-muted-foreground hover:bg-muted hover:text-foreground"
      aria-label={theme === "dark" ? "Switch to light mode" : "Switch to dark mode"}
      title={theme === "dark" ? "Light mode" : "Dark mode"}
    >
      {theme === "dark" ? <Sun className="size-5" /> : <Moon className="size-5" />}
    </button>
  );
}
