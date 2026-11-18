"use client";

import { useCallback, useSyncExternalStore } from "react";
import { Moon, Sun } from "lucide-react";

const STORAGE_KEY = "ledgerly-theme";

function applyTheme(theme: "light" | "dark") {
  const root = document.documentElement;
  root.classList.toggle("dark", theme === "dark");
  root.style.colorScheme = theme;
}

export function parseTheme(stored: string | null): "light" | "dark" {
  return stored === "dark" ? "dark" : "light";
}

function readTheme(): "light" | "dark" {
  try {
    return parseTheme(window.localStorage.getItem(STORAGE_KEY));
  } catch {
    return "light";
  }
}

function subscribe(onStoreChange: () => void) {
  window.addEventListener("storage", onStoreChange);
  window.addEventListener("ledgerly-theme", onStoreChange);
  return () => {
    window.removeEventListener("storage", onStoreChange);
    window.removeEventListener("ledgerly-theme", onStoreChange);
  };
}

export function ThemeToggle() {
  const theme = useSyncExternalStore(subscribe, readTheme, () => "light" as const);
  const toggle = useCallback(() => {
    const next = theme === "dark" ? "light" : "dark";
    window.localStorage.setItem(STORAGE_KEY, next);
    applyTheme(next);
    window.dispatchEvent(new Event("ledgerly-theme"));
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
