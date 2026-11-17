"use client";

import { useEffect } from "react";
import Link from "next/link";
import * as Sentry from "@sentry/nextjs";
import { RefreshCw, TriangleAlert } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useLanguage } from "@/lib/settings";
import { useTranslation } from "@/lib/i18n";
import { ProfessorsPageLayout } from "./ProfessorsPageLayout";

export default function ProfessorsError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  const [language, setLanguage] = useLanguage();
  const t = useTranslation(language);

  useEffect(() => {
    Sentry.captureException(error);
  }, [error]);

  return (
    <ProfessorsPageLayout language={language} onLanguageChange={setLanguage}>
      <section className="rounded-2xl border bg-card px-5 py-12 text-center">
        <div role="alert">
          <TriangleAlert className="mx-auto mb-3 h-8 w-8 text-muted-foreground" aria-hidden="true" />
          <h2 className="text-lg font-bold">{t.professorsLoadError}</h2>
          <p className="mt-1 text-sm text-muted-foreground">{t.professorsLoadErrorHint}</p>
        </div>
        <div className="mt-5 flex flex-wrap justify-center gap-3">
          <Button onClick={reset} className="min-h-11 rounded-[10px]">
            <RefreshCw className="mr-2 h-4 w-4" aria-hidden="true" />
            {t.tryAgain}
          </Button>
          <Button asChild variant="outline" className="min-h-11 rounded-[10px]">
            <Link href="/">{t.backToRooms}</Link>
          </Button>
        </div>
      </section>
    </ProfessorsPageLayout>
  );
}
