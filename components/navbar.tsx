"use client";
import { BookOpen, Building2, CalendarPlus, CalendarDays, Users } from "lucide-react";
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
  const isDetail = pathname.startsWith("/room/") || pathname.startsWith("/professor/");

  const links = [
    {
      href: "/",
      label: t.roomsNav,
      icon: Building2,
      active: pathname === "/" || pathname.startsWith("/room/"),
    },
    {
      href: "/professors",
      label: t.professorsTitle,
      icon: Users,
      active: pathname === "/professors" || pathname.startsWith("/professor/"),
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
    <header className={cn("border-b bg-card pt-[env(safe-area-inset-top)]", isDetail && "hidden sm:block")}>
      <div className="mx-auto flex min-h-12 w-full max-w-[1240px] flex-wrap items-center px-2 sm:min-h-[60px] sm:gap-3 sm:px-6 lg:gap-6">
        <Link href="/" aria-label={t.appName} className="flex min-h-11 shrink-0 items-center gap-1.5 text-xs font-extrabold hover:opacity-80 min-[360px]:gap-2.5 min-[360px]:text-lg">
          <BookOpen className="h-5 w-5 shrink-0 min-[360px]:h-7 min-[360px]:w-7" aria-hidden="true" />
          <span>{t.appName}</span>
        </Link>
        <nav aria-label={t.navigation} className="ml-auto flex items-center sm:ml-0 sm:flex-1">
          {links.map(({ href, label, icon: Icon, active }) => (
            <Link
              key={href}
              href={href}
              aria-current={active ? "page" : undefined}
              aria-label={label}
              className={cn(
                "inline-flex h-11 min-w-11 items-center justify-center gap-2 rounded-lg px-2 text-sm transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring sm:h-10 md:rounded-none lg:px-3",
                active
                  ? "bg-free-soft text-free-soft-foreground md:bg-transparent md:font-bold md:text-foreground md:shadow-[inset_0_-2px_0_var(--free-bar)]"
                  : "text-muted-foreground hover:text-foreground"
              )}
            >
              <Icon className="h-5 w-5 md:hidden" aria-hidden="true" />
              <span className="hidden md:inline">{label}</span>
            </Link>
          ))}
        </nav>
        <SettingsMenu language={language} onLanguageChange={onLanguageChange} />
      </div>
    </header>
  );
}
