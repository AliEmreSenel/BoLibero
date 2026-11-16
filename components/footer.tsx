"use client";
import { type Language, useTranslation } from "@/lib/i18n";

interface FooterProps {
  language: Language;
}

export function Footer({ language }: FooterProps) {
  const t = useTranslation(language);

  return (
    <footer className="mt-auto border-t bg-card pb-[env(safe-area-inset-bottom)]">
      <div className="mx-auto flex w-full max-w-[1240px] flex-wrap items-center justify-between gap-x-6 gap-y-2 px-4 py-5 text-[13px] text-muted-foreground sm:px-6">
        <p className="max-w-2xl">{t.disclaimer}</p>
        <div className="flex flex-wrap items-center gap-x-4 gap-y-1">
          <span>
            {t.author}{" "}
            <a
              href="https://github.com/AliEmreSenel"
              target="_blank"
              rel="noopener noreferrer"
              className="font-medium text-foreground hover:underline"
            >
              Ali Emre Senel
            </a>
          </span>
          <a href="/privacy-policy" className="hover:text-foreground">
            {t.privacy}
          </a>
          <a
            href="https://github.com/AliEmreSenel/BSpace/issues"
            target="_blank"
            rel="noopener noreferrer"
            className="hover:text-foreground"
          >
            {t.contact}
          </a>
          <a
            href="https://github.com/AliEmreSenel/BSpace"
            target="_blank"
            rel="noopener noreferrer"
            className="hover:text-foreground"
          >
            GitHub
          </a>
        </div>
      </div>
    </footer>
  );
}
