"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { PageLayout } from "@/components/page-layout";
import { Button } from "@/components/ui/button";
import { type Language, useTranslation } from "@/lib/i18n";
import { loadSettings, saveSettings } from "@/lib/settings";

export default function NotFound() {
  const [language, setLanguage] = useState<Language>("en");
  const t = useTranslation(language);

  useEffect(() => {
    setLanguage(loadSettings().language);
  }, []);

  const handleLanguageChange = (newLanguage: Language) => {
    setLanguage(newLanguage);
    saveSettings({ ...loadSettings(), language: newLanguage });
  };

  return (
    <PageLayout language={language} onLanguageChange={handleLanguageChange}>
      <div className="container mx-auto flex max-w-2xl flex-col items-center gap-4 p-12 text-center">
        <h1 className="text-3xl font-bold">{t.notFoundTitle}</h1>
        <p className="text-muted-foreground">{t.notFoundDescription}</p>
        <Button asChild>
          <Link href="/">{t.backToRooms}</Link>
        </Button>
      </div>
    </PageLayout>
  );
}
