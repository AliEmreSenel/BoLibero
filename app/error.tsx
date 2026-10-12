"use client";

import * as Sentry from "@sentry/nextjs";
import Link from "next/link";
import { useEffect, useState } from "react";
import { PageLayout } from "@/components/page-layout";
import { Button } from "@/components/ui/button";
import { type Language, useTranslation } from "@/lib/i18n";
import { loadSettings, saveSettings } from "@/lib/settings";

export default function ErrorPage({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  const [language, setLanguage] = useState<Language>("en");
  const t = useTranslation(language);

  useEffect(() => {
    Sentry.captureException(error);
    setLanguage(loadSettings().language);
  }, [error]);

  const handleLanguageChange = (newLanguage: Language) => {
    setLanguage(newLanguage);
    saveSettings({ ...loadSettings(), language: newLanguage });
  };

  return (
    <PageLayout language={language} onLanguageChange={handleLanguageChange}>
      <div className="container mx-auto flex max-w-2xl flex-col items-center gap-4 p-12 text-center">
        <h1 className="text-3xl font-bold">{t.error}</h1>
        <div className="flex gap-3">
          <Button onClick={reset}>{t.refresh}</Button>
          <Button asChild variant="outline">
            <Link href="/">{t.backToRooms}</Link>
          </Button>
        </div>
      </div>
    </PageLayout>
  );
}
