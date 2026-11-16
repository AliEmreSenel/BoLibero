"use client";
import { BookOpen, Building2, CalendarPlus, CalendarDays } from "lucide-react";
import { SettingsMenu } from "@/components/settings-menu";
import { type Language, useTranslation } from "@/lib/i18n";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";

interface NavbarProps {
  language: Language;
  onLanguageChange: (language: Language) => void;
}

export function Navbar({ language, onLanguageChange }: NavbarProps) {
  const t = useTranslation(language);
  const pathname = usePathname();

  const links = [
    {
      href: "/",
      label: t.roomsNav,
      icon: Building2,
      active: pathname === "/" || pathname.startsWith("/room/"),
    },
    {
      href: "/calendar",
      label: t.classCalendarNav,
      icon: CalendarPlus,
      active: pathname === "/calendar",
    },
    {
      href: "/schedule",
      label: t.mySchedule,
      icon: CalendarDays,
      active: pathname === "/schedule",
    },
  ];

  return (
    <header className="border-b bg-card pt-[env(safe-area-inset-top)]">
      <div className="mx-auto flex min-h-14 w-full max-w-[1240px] items-center gap-2 px-4 sm:min-h-[60px] sm:gap-6 sm:px-6">
        <Link href="/" className="flex items-center gap-2.5 text-lg font-extrabold hover:opacity-80">
          <BookOpen className="h-7 w-7" aria-hidden="true" />
          {t.appName}
        </Link>
        <nav aria-label={t.navigation} className="ml-auto flex items-center sm:ml-0 sm:flex-1 sm:gap-1">
          {links.map(({ href, label, icon: Icon, active }) => (
            <Link
              key={href}
              href={href}
              aria-current={active ? "page" : undefined}
              aria-label={label}
              className={cn(
                "inline-flex h-11 min-w-11 items-center justify-center gap-2 rounded-lg px-2 text-sm transition-colors sm:h-10 sm:rounded-none sm:px-3",
                active
                  ? "bg-free-soft text-free-soft-foreground sm:bg-transparent sm:font-bold sm:text-foreground sm:shadow-[inset_0_-2px_0_var(--free-bar)]"
                  : "text-muted-foreground hover:text-foreground"
              )}
            >
              <Icon className="h-5 w-5 sm:hidden" aria-hidden="true" />
              <span className="hidden sm:inline">{label}</span>
            </Link>
          ))}
        </nav>
        <SettingsMenu language={language} onLanguageChange={onLanguageChange} />
      </div>
    </header>
  );
}
