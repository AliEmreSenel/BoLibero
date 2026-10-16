import { afterEach, describe, expect, it, vi } from "vitest";
import {
  getDefaultSettings,
  loadSettings,
  safeGetItem,
  safeRemoveItem,
  safeSetItem,
} from "@/lib/settings";
import { getSystemLanguage } from "@/lib/i18n";

const SETTINGS_KEY = "bspace-settings";

type Storage = Record<string, string>;

function installStorage(items: Storage = {}) {
  (globalThis as Record<string, unknown>).window = globalThis;
  (globalThis as Record<string, unknown>).localStorage = {
    getItem: (key: string) => items[key] ?? null,
    setItem: (key: string, value: string) => {
      items[key] = value;
    },
    removeItem: (key: string) => {
      delete items[key];
    },
  };
  return items;
}

function installThrowingStorage() {
  (globalThis as Record<string, unknown>).window = globalThis;
  const boom = () => {
    throw new Error("SecurityError: storage disabled");
  };
  (globalThis as Record<string, unknown>).localStorage = {
    getItem: boom,
    setItem: boom,
    removeItem: boom,
  };
}

function uninstallStorage() {
  delete (globalThis as Record<string, unknown>).window;
  delete (globalThis as Record<string, unknown>).localStorage;
}

const storedSettings = (settings: Record<string, unknown>) => ({
  [SETTINGS_KEY]: JSON.stringify(settings),
});

afterEach(() => {
  uninstallStorage();
  vi.restoreAllMocks();
});

describe("loadSettings", () => {
  it("returns defaults when nothing is stored", () => {
    installStorage();
    expect(loadSettings()).toEqual(getDefaultSettings());
  });

  it("keeps valid persisted values", () => {
    installStorage(
      storedSettings({
        theme: "dark",
        language: "it",
        showOnlyStudyRooms: true,
      })
    );
    expect(loadSettings()).toEqual({
      theme: "dark",
      language: "it",
      showOnlyStudyRooms: true,
    });
  });

  it("falls back to the system language on a corrupt language", () => {
    installStorage(storedSettings({ language: "fr" }));
    expect(loadSettings().language).toBe(getSystemLanguage());
  });

  it("falls back to the system theme on a corrupt theme", () => {
    installStorage(storedSettings({ theme: "neon" }));
    expect(loadSettings().theme).toBe("system");
  });

  it("coerces non-boolean filters to false", () => {
    installStorage(
      storedSettings({ showOnlyStudyRooms: "yes", language: "it" })
    );
    expect(loadSettings().showOnlyStudyRooms).toBe(false);
  });

  it("defaults on corrupt JSON", () => {
    const warn = vi.spyOn(console, "warn").mockImplementation(() => {});
    installStorage({ [SETTINGS_KEY]: "{not json" });
    expect(loadSettings()).toEqual(getDefaultSettings());
    expect(warn).toHaveBeenCalled();
  });

  it("defaults when storage throws (Safari private mode)", () => {
    installThrowingStorage();
    expect(loadSettings()).toEqual(getDefaultSettings());
  });
});

describe("safe storage helpers", () => {
  it("reads, writes and removes through the whitelist path", () => {
    installStorage();
    safeSetItem("k", "v");
    expect(safeGetItem("k")).toBe("v");
    safeRemoveItem("k");
    expect(safeGetItem("k")).toBeNull();
  });

  it("swallows storage exceptions", () => {
    installThrowingStorage();
    expect(safeGetItem("k")).toBeNull();
    expect(() => safeSetItem("k", "v")).not.toThrow();
    expect(() => safeRemoveItem("k")).not.toThrow();
  });

  it("reads null when storage is unavailable", () => {
    expect(safeGetItem("k")).toBeNull();
  });
});
