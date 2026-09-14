"use client";
import { BookOpen, CalendarPlus } from "lucide-react";
import { SettingsMenu } from "@/components/settings-menu";
import { type Language, useTranslation } from "@/lib/i18n";
import Link from "next/link";
import { usePathname } from "next/navigation";

interface NavbarProps {
  language: Language;
  onLanguageChange: (language: Language) => void;
}

export function Navbar({ language, onLanguageChange }: NavbarProps) {
  const t = useTranslation(language);
  const pathname = usePathname();

  return (
    <header className="border-b">
      <div className="container mx-auto px-6 py-4">
        <div className="flex items-center justify-between gap-3">
          <Link
            href="/"
            className="flex items-center gap-3 hover:opacity-80 transition-opacity"
          >
            <BookOpen className="h-8 w-8" />
            <h1 className="hidden text-2xl font-bold sm:block">{t.appName}</h1>
          </Link>
          <div className="flex items-center gap-1 sm:gap-3">
            <nav aria-label={t.navigation}>
              <Link
                href="/calendar"
                aria-current={pathname === "/calendar" ? "page" : undefined}
                className={`inline-flex h-9 items-center gap-2 rounded-md px-3 text-sm font-medium transition-colors hover:bg-accent hover:text-accent-foreground ${
                  pathname === "/calendar"
                    ? "bg-accent text-accent-foreground"
                    : "text-muted-foreground"
                }`}
              >
                <CalendarPlus className="h-4 w-4" />
                <span>{t.classCalendarNav}</span>
              </Link>
            </nav>
            <SettingsMenu language={language} onLanguageChange={onLanguageChange} />
          </div>
        </div>
      </div>
    </header>
  );
}
