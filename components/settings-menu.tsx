"use client";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Settings, Moon, Sun, Globe, Monitor } from "lucide-react";
import { type Language, useTranslation } from "@/lib/i18n";
import { useTheme } from "next-themes";
import type { Theme } from "@/lib/theme";

interface SettingsMenuProps {
  language: Language;
  onLanguageChange: (language: Language) => void;
}

export function SettingsMenu({
  language,
  onLanguageChange,
}: SettingsMenuProps) {
  const t = useTranslation(language);
  const { theme, setTheme } = useTheme();

  const handleThemeChange = (newTheme: Theme) => {
    setTheme(newTheme);
  };

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" size="sm" className="h-9 w-9 min-h-11 p-0">
          <Settings className="h-4 w-4" />
          <span className="sr-only">{t.settings}</span>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-56">
        <DropdownMenuLabel>{t.settings}</DropdownMenuLabel>
        <DropdownMenuSeparator />

        <DropdownMenuLabel className="text-xs font-medium text-muted-foreground">
          {t.theme}
        </DropdownMenuLabel>
        <DropdownMenuItem onClick={() => handleThemeChange("light")}>
          <Sun className="h-4 w-4 mr-2" />
          {t.light}
          {theme === "light" && <span className="ml-auto">✓</span>}
        </DropdownMenuItem>
        <DropdownMenuItem onClick={() => handleThemeChange("dark")}>
          <Moon className="h-4 w-4 mr-2" />
          {t.dark}
          {theme === "dark" && <span className="ml-auto">✓</span>}
        </DropdownMenuItem>
        <DropdownMenuItem onClick={() => handleThemeChange("system")}>
          <Monitor className="h-4 w-4 mr-2" />
          {t.system}
          {theme === "system" && <span className="ml-auto">✓</span>}
        </DropdownMenuItem>

        <DropdownMenuSeparator />

        <DropdownMenuLabel className="text-xs font-medium text-muted-foreground">
          {t.language}
        </DropdownMenuLabel>
        <DropdownMenuItem onClick={() => onLanguageChange("en")}>
          <Globe className="h-4 w-4 mr-2" />
          {t.english}
          {language === "en" && <span className="ml-auto">✓</span>}
        </DropdownMenuItem>
        <DropdownMenuItem onClick={() => onLanguageChange("it")}>
          <Globe className="h-4 w-4 mr-2" />
          {t.italian}
          {language === "it" && <span className="ml-auto">✓</span>}
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
