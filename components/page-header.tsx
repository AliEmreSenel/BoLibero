"use client";

import { Calendar } from "lucide-react";
import { format } from "date-fns";
import { it, enUS } from "date-fns/locale";
import type { Language, Translations } from "@/lib/i18n";

interface PageHeaderProps {
  language: Language;
  t: Translations;
}

export function PageHeader({ language, t }: PageHeaderProps) {
  return (
    <div className="mb-8">
      <h2 className="text-3xl font-bold mb-2">{t.availableRooms}</h2>
      <p className="text-muted-foreground text-lg">{t.appDescription}</p>
      <div className="mt-4 flex items-center gap-2">
        <Calendar className="h-4 w-4 text-muted-foreground" />
        <span>
          {format(new Date(), "EEEE, MMMM do, yyyy", {
            locale: language === "it" ? it : enUS,
          })}
        </span>
      </div>
    </div>
  );
}
