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
