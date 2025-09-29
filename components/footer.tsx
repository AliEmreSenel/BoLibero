"use client";
import { Github, ExternalLink } from "lucide-react";
import { type Language, useTranslation } from "@/lib/i18n";

interface FooterProps {
  language: Language;
}

export function Footer({ language }: FooterProps) {
  const t = useTranslation(language);

  return (
    <footer className="border-t bg-muted/50 mt-auto">
      <div className="container mx-auto px-6 py-8">
        <div className="flex flex-col items-center space-y-4 text-center">
          {/* Disclaimer */}
          <div className="max-w-2xl">
            <p className="text-sm text-muted-foreground leading-relaxed">
              {t.disclaimer}
            </p>
          </div>

          {/* Author and GitHub Link */}
          <div className="flex flex-col sm:flex-row items-center gap-4 text-sm">
            <div className="flex items-center gap-2">
              <span className="text-muted-foreground">{t.author}</span>
              <a
                href="https://github.com/AliEmreSenel"
                target="_blank"
                rel="noopener noreferrer"
                className="font-medium hover:underline flex items-center gap-1"
              >
                Ali Emre Senel
                <ExternalLink className="h-3 w-3" />
              </a>
            </div>

            <div className="hidden sm:block text-muted-foreground">•</div>

            <a
              href="https://github.com/AliEmreSenel/BSpace"
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-2 text-muted-foreground hover:text-foreground transition-colors"
            >
              <Github className="h-4 w-4" />
              {t.githubLink}
            </a>
          </div>

          {/* App Name */}
          <div className="text-xs text-muted-foreground">
            {t.appName} © {new Date().getFullYear()}
          </div>
        </div>
      </div>
    </footer>
  );
}
