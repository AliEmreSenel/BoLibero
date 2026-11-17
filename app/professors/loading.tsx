"use client";

import { useLanguage } from "@/lib/settings";
import { useTranslation } from "@/lib/i18n";
import { ProfessorsPageLayout } from "./ProfessorsPageLayout";

export default function ProfessorsLoading() {
  const [language, setLanguage] = useLanguage();
  const t = useTranslation(language);

  return (
    <ProfessorsPageLayout language={language} onLanguageChange={setLanguage}>
      <div role="status" aria-busy="true">
        <span className="sr-only">{t.loadingProfessors}</span>
        <div aria-hidden="true">
          <div className="mb-4 rounded-2xl border bg-card">
            <div className="p-3">
              <div className="h-[42px] animate-pulse rounded-[10px] bg-muted" />
            </div>
            <div className="border-t px-3 py-2.5">
              <div className="h-5 w-32 animate-pulse rounded bg-muted" />
            </div>
          </div>
          <div className="grid grid-cols-1 gap-3.5 sm:grid-cols-2 lg:grid-cols-3">
            {Array.from({ length: 9 }, (_, index) => (
              <div key={index} className="overflow-hidden rounded-2xl border bg-card">
                <div className="flex items-center gap-3 p-4">
                  <div className="h-11 w-11 shrink-0 animate-pulse rounded-full bg-muted" />
                  <div className="h-5 w-36 max-w-[60%] animate-pulse rounded bg-muted" />
                </div>
                <div className="border-t bg-free-tint px-4 py-3">
                  <div className="h-5 w-28 animate-pulse rounded bg-muted" />
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </ProfessorsPageLayout>
  );
}
