import { useCallback, useEffect, useState } from "react";
import type { Theme } from "./theme";
import { type Language, getSystemLanguage } from "./i18n";

export interface Settings {
  theme: Theme;
  language: Language;
  showOnlyStudyRooms: boolean;
}

const SETTINGS_KEY = "bspace-settings";

const THEMES: Theme[] = ["dark", "light", "system"];
const LANGUAGES: Language[] = ["en", "it"];

// The language cookie is rendered server-side (layout lang attr), so a
// returning Italian student never sees an English flash on load.
const LANGUAGE_COOKIE = "bolibero_lang";

// localStorage key for the calendar-builder class bundle, shared by the
// builder, the My Schedule page and the class-list share link.
export const SAVED_CLASSES_KEY = "bolibero-calendar-classes";

// Room favorites for the home grid ("Leoni/Aula 1" keys).
export const FAVORITE_ROOMS_KEY = "bolibero-favorite-rooms";

// Last-seen "identity -> room" snapshot of the user's bundle, used to detect
// room reassignments between visits (room-change banner).
export const SCHEDULE_SNAPSHOT_KEY = "bolibero-schedule-snapshot";

// Local exams/deadlines tracker entries (device-only, exportable to ICS).
export const EXAMS_KEY = "bolibero-exams";

// Single key holding a JSON array of "date|start|class" ids the reminders
// already fired for; past-date ids are pruned on every write so the key
// cannot exhaust the storage quota.
export const NOTIFIED_EVENTS_KEY = "bolibero-notified-events";

export function safeGetItem(key: string): string | null {
  try {
    return localStorage.getItem(key);
  } catch {
    return null;
  }
}

export function safeSetItem(key: string, value: string): void {
  try {
    localStorage.setItem(key, value);
  } catch {
    // Storage unavailable (Safari private mode, quota): keep in memory only.
  }
}

export function safeRemoveItem(key: string): void {
  try {
    localStorage.removeItem(key);
  } catch {
    // Storage unavailable: nothing to remove.
  }
}

export function getDefaultSettings(): Settings {
  return {
    theme: "system",
    language: getSystemLanguage(),
    showOnlyStudyRooms: false,
  };
}

export function loadSettings(): Settings {
  if (typeof window === "undefined") return getDefaultSettings();

  try {
    const stored = safeGetItem(SETTINGS_KEY);
    if (stored) {
      const parsed = JSON.parse(stored);
      return {
        theme: THEMES.includes(parsed.theme) ? parsed.theme : "system",
        language: LANGUAGES.includes(parsed.language)
          ? parsed.language
          : getSystemLanguage(),
        showOnlyStudyRooms: parsed.showOnlyStudyRooms === true,
      };
    }
  } catch (error) {
    console.warn("Failed to load settings:", error);
  }

  return getDefaultSettings();
}

export function saveSettings(settings: Settings) {
  if (typeof window === "undefined") return;

  try {
    safeSetItem(SETTINGS_KEY, JSON.stringify(settings));
    document.cookie = `${LANGUAGE_COOKIE}=${settings.language}; path=/; max-age=31536000; samesite=lax`;
  } catch (error) {
    console.warn("Failed to save settings:", error);
  }
}

// Server snapshot is always "en" (persisted value applied post-mount), so SSR
// HTML and the first client render match; the change to the saved language is
// a plain client-side update. Persists on every change.
export function useLanguage(): [Language, (language: Language) => void] {
  const [language, setLanguageState] = useState<Language>("en");

  useEffect(() => {
    setLanguageState(loadSettings().language);
  }, []);

  const setLanguage = useCallback((nextLanguage: Language) => {
    setLanguageState(nextLanguage);
    saveSettings({ ...loadSettings(), language: nextLanguage });
  }, []);

  return [language, setLanguage];
}
