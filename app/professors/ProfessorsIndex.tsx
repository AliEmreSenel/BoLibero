"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { Search } from "lucide-react";
import { PageLayout } from "@/components/page-layout";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import { getInitialLanguage, loadSettings, saveSettings } from "@/lib/settings";
import { type Language, useTranslation } from "@/lib/i18n";

interface ProfessorsIndexProps {
  professors: string[];
}

export function ProfessorsIndex({ professors }: ProfessorsIndexProps) {
  const [language, setLanguage] = useState<Language>(getInitialLanguage);
  const [query, setQuery] = useState("");
  const t = useTranslation(language);

  const visible = useMemo(() => {
    const term = query.trim().toLowerCase();
    if (!term) return professors;
    return professors.filter((name) => name.toLowerCase().includes(term));
  }, [professors, query]);

  const handleLanguageChange = (nextLanguage: Language) => {
    setLanguage(nextLanguage);
    saveSettings({ ...loadSettings(), language: nextLanguage });
  };

  return (
    <PageLayout language={language} onLanguageChange={handleLanguageChange}>
      <div className="container mx-auto max-w-5xl p-6">
        <div className="mb-8">
          <h1 className="mb-2 text-3xl font-bold">{t.professorsTitle}</h1>
          <p className="text-lg text-muted-foreground">
            {t.professorsDescription}
          </p>
        </div>

        <div className="relative mb-6">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder={t.professorSearchPlaceholder}
            className="h-11 pl-10"
          />
        </div>

        {visible.length === 0 ? (
          <p className="py-12 text-center text-muted-foreground">
            {t.professorsEmpty}
          </p>
        ) : (
          <>
            <p className="mb-3 text-xs text-muted-foreground">
              {visible.length} {t.professorsLoadedSuffix}
            </p>
            <div className="grid grid-cols-1 gap-2 sm:grid-cols-2 lg:grid-cols-3">
              {visible.map((name) => (
                <Link
                  key={name}
                  href={`/professor/${encodeURIComponent(name)}`}
                >
                  <Card className="transition-colors hover:bg-accent">
                    <CardContent className="truncate p-3 text-sm font-medium">
                      {name}
                    </CardContent>
                  </Card>
                </Link>
              ))}
            </div>
          </>
        )}
      </div>
    </PageLayout>
  );
}
