"use client";

import { Card, CardContent } from "@/components/ui/card";
import { PageLayout } from "@/components/page-layout";
import { useTranslation } from "@/lib/i18n";
import { useLanguage } from "@/lib/settings";

const SECTIONS = [
  ["privacyScrapedTitle", "privacyScraped"],
  ["privacyLocalStorageTitle", "privacyLocalStorage"],
  ["privacySentryTitle", "privacySentry"],
  ["privacyContactTitle", "privacyContact"],
] as const;

export default function PrivacyPolicyPage() {
  const [language, setLanguage] = useLanguage();
  const t = useTranslation(language);

  return (
    <PageLayout language={language} onLanguageChange={setLanguage}>
      <div className="container mx-auto max-w-3xl p-6">
        <h1 className="mb-2 text-3xl font-bold">{t.privacyTitle}</h1>
        <p className="mb-6 text-sm text-muted-foreground">{t.privacyUpdated}</p>
        <p className="mb-6 leading-relaxed text-muted-foreground">
          {t.privacyIntro}
        </p>
        <div className="space-y-4">
          {SECTIONS.map(([titleKey, bodyKey]) => (
            <Card key={titleKey}>
              <CardContent className="p-4">
                <h2 className="mb-1 font-semibold">{t[titleKey]}</h2>
                <p className="text-sm leading-relaxed text-muted-foreground">
                  {t[bodyKey]}
                </p>
              </CardContent>
            </Card>
          ))}
        </div>
        <p className="mt-6 text-xs text-muted-foreground">{t.disclaimer}</p>
      </div>
    </PageLayout>
  );
}
