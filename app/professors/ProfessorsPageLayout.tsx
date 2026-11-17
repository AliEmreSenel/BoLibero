"use client";

import type { ReactNode } from "react";
import { PageLayout } from "@/components/page-layout";
import { PROFESSOR_WINDOW_DAYS } from "@/lib/constants";
import { fill, type Language, useTranslation } from "@/lib/i18n";

export function ProfessorsPageLayout({
  language,
  onLanguageChange,
  children,
}: {
  language: Language;
  onLanguageChange: (language: Language) => void;
  children: ReactNode;
}) {
  const t = useTranslation(language);

  return (
    <PageLayout language={language} onLanguageChange={onLanguageChange}>
      <div className="mx-auto w-full max-w-[1240px] px-3 py-5 sm:px-6">
        <div className="mb-3.5">
          <h1 className="text-2xl font-extrabold tracking-tight">{t.professorsTitle}</h1>
          <p className="text-muted-foreground">{t.professorsDescription}</p>
        </div>
        {children}
        <p className="mt-5 text-[13px] text-muted-foreground">
          {fill(t.professorsCoverage, { days: PROFESSOR_WINDOW_DAYS })}
        </p>
      </div>
    </PageLayout>
  );
}
