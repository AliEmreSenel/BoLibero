"use client";

import { ReactNode } from "react";
import { Navbar } from "@/components/navbar";
import { Footer } from "@/components/footer";
import type { Language } from "@/lib/i18n";

interface PageLayoutProps {
  language: Language;
  onLanguageChange: (language: Language) => void;
  children: ReactNode;
}

export function PageLayout({
  language,
  onLanguageChange,
  children,
}: PageLayoutProps) {
  return (
    <div className="min-h-screen flex flex-col">
      <Navbar language={language} onLanguageChange={onLanguageChange} />
      <main className="flex-1">{children}</main>
      <Footer language={language} />
    </div>
  );
}
