"use client";

import { ReactNode } from "react";
import { Navbar } from "@/components/navbar";
import { Footer } from "@/components/footer";
import type { Language } from "@/lib/i18n";

interface PageLayoutProps {
  language: Language;
  onLanguageChange: (language: Language) => void;
  children: ReactNode;
  bottomDock?: ReactNode;
}

export function PageLayout({
  language,
  onLanguageChange,
  children,
  bottomDock,
}: PageLayoutProps) {
  return (
    <div className="relative min-h-dvh flex flex-col">
      <a
        href="#main"
        className="sr-only focus:not-sr-only focus:absolute focus:left-4 focus:top-4 focus:z-50 focus:rounded-md focus:bg-background focus:px-4 focus:py-2 focus:text-foreground"
      >
        Skip to content
      </a>
      <Navbar language={language} onLanguageChange={onLanguageChange} />
      <main id="main" className="flex-1">{children}</main>
      <Footer language={language} />
      {bottomDock && <div aria-hidden="true" className="h-[calc(7rem+env(safe-area-inset-bottom))] shrink-0 lg:hidden" />}
      {bottomDock}
    </div>
  );
}
