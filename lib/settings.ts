import type { Theme } from "./theme";
import { type Language, getSystemLanguage } from "./i18n";

export interface Settings {
  theme: Theme;
  language: Language;
  showOnlyStudyRooms: boolean;
}

const SETTINGS_KEY = "bspace-settings";

// The language cookie is rendered before hydration (layout lang attr and
// initial React state), so a returning Italian student never sees an English
// flash on load.
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

export function getInitialLanguage(): Language {
  if (typeof document === "undefined") return "en";
  const match = document.cookie.match(/(?:^|;\s*)bolibero_lang=(en|it)(?:;|$)/);
  return match ? (match[1] as Language) : "en";
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
    const stored = localStorage.getItem(SETTINGS_KEY);
    if (stored) {
      const parsed = JSON.parse(stored);
      return {
        theme: parsed.theme || "system",
        language: parsed.language || getSystemLanguage(),
        showOnlyStudyRooms: parsed.showOnlyStudyRooms ?? false,
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
    localStorage.setItem(SETTINGS_KEY, JSON.stringify(settings));
    document.cookie = `${LANGUAGE_COOKIE}=${settings.language}; path=/; max-age=31536000; samesite=lax`;
  } catch (error) {
    console.warn("Failed to save settings:", error);
  }
}
