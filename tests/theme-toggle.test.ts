import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { afterEach, describe, expect, it, vi } from "vitest";
import {
  THEME_STORAGE_KEY,
  ThemeToggle,
  commitTheme,
  readStoredTheme,
  subscribeToTheme,
} from "@/components/theme-toggle";

type Listener = () => void;

function installBrowser() {
  const storage = new Map<string, string>();
  const listeners = new Map<string, Set<Listener>>();
  const root = {
    classList: {
      dark: false,
      toggle(name: string, force?: boolean) {
        if (name !== "dark") return false;
        this.dark = force ?? !this.dark;
        return this.dark;
      },
    },
    style: { colorScheme: "" },
  };
  const localStorage = {
    getItem(key: string) {
      return storage.has(key) ? storage.get(key)! : null;
    },
    setItem(key: string, value: string) {
      storage.set(key, value);
    },
  };
  vi.stubGlobal("document", { documentElement: root });
  vi.stubGlobal("window", {
    localStorage,
    addEventListener(type: string, listener: Listener) {
      const set = listeners.get(type) ?? new Set<Listener>();
      set.add(listener);
      listeners.set(type, set);
    },
    removeEventListener(type: string, listener: Listener) {
      listeners.get(type)?.delete(listener);
    },
    dispatchEvent(event: Event) {
      for (const listener of listeners.get(event.type) ?? []) listener();
      return true;
    },
  });
  return { storage, listeners, root, localStorage };
}

afterEach(() => {
  vi.unstubAllGlobals();
});

describe("theme persistence", () => {
  it("reads dark only from the stored value and falls back to light when storage throws", () => {
    const browser = installBrowser();
    expect(readStoredTheme()).toBe("light");

    browser.storage.set(THEME_STORAGE_KEY, "dark");
    expect(readStoredTheme()).toBe("dark");

    browser.storage.set(THEME_STORAGE_KEY, "DARK");
    expect(readStoredTheme()).toBe("light");
    browser.storage.set(THEME_STORAGE_KEY, "light");
    expect(readStoredTheme()).toBe("light");

    browser.localStorage.getItem = () => {
      throw new Error("storage blocked");
    };
    expect(readStoredTheme()).toBe("light");
  });

  it("persists the next theme on the document and drops the subscription on cleanup", () => {
    const browser = installBrowser();
    const seen: string[] = [];
    const unsubscribe = subscribeToTheme(() => {
      seen.push(readStoredTheme());
    });

    commitTheme("dark");
    expect(browser.storage.get(THEME_STORAGE_KEY)).toBe("dark");
    expect(browser.root.classList.dark).toBe(true);
    expect(browser.root.style.colorScheme).toBe("dark");
    expect(seen).toEqual(["dark"]);

    commitTheme("light");
    expect(browser.root.classList.dark).toBe(false);
    expect(browser.root.style.colorScheme).toBe("light");
    expect(seen).toEqual(["dark", "light"]);

    unsubscribe();
    commitTheme("dark");
    expect(seen).toEqual(["dark", "light"]);
    expect(browser.listeners.get("storage")?.size ?? 0).toBe(0);
    expect(browser.listeners.get("ledgerly-theme")?.size ?? 0).toBe(0);
  });

  it("renders the light-mode control before the browser snapshot", () => {
    const html = renderToStaticMarkup(createElement(ThemeToggle));
    expect(html).toContain('aria-label="Switch to dark mode"');
    expect(html).toContain('title="Dark mode"');
    expect(html).not.toContain("Switch to light mode");
  });
});
