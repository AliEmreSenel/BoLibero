import type { Theme } from "./theme";
import { type Language, getSystemLanguage } from "./i18n";

export interface Settings {
  theme: Theme;
  language: Language;
  showOnlyStudyRooms: boolean;
}

const SETTINGS_KEY = "bspace-settings";

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
  } catch (error) {
    console.warn("Failed to save settings:", error);
  }
}
