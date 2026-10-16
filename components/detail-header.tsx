"use client";

import Link from "next/link";
import { ArrowLeft, RefreshCw } from "lucide-react";
import { format } from "date-fns";
import { it, enUS } from "date-fns/locale";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import type { Language, Translations } from "@/lib/i18n";

interface DetailHeaderProps {
  title: string;
  subtitle?: string;
  description?: string;
  eventCount: number;
  lastUpdated: Date | null;
  loading: boolean;
  language: Language;
  t: Translations;
  onRefresh: () => void;
}

export function DetailHeader({
  title,
  subtitle,
  description,
  eventCount,
  lastUpdated,
  loading,
  language,
  t,
  onRefresh,
}: DetailHeaderProps) {
  const locale = language === "it" ? it : enUS;

  return (
    <>
      {/* Back Button */}
      <div className="mb-6 flex items-center justify-between">
        <Button asChild variant="outline">
          <Link href="/">
            <ArrowLeft className="h-4 w-4 mr-2" />
            {t.backToOverview}
          </Link>
        </Button>
        <Button
          onClick={onRefresh}
          variant="outline"
          size="sm"
          disabled={loading}
        >
          <RefreshCw className={`h-4 w-4 mr-2 ${loading ? "animate-spin" : ""}`} />
          {t.refresh}
        </Button>
      </div>

      {/* Page Header */}
      <div className="mb-8 text-center">
        <h1 className="text-3xl font-bold mb-2">{title}</h1>
        {subtitle && (
          <p className="text-muted-foreground text-lg">{subtitle}</p>
        )}
        {description && (
          <p className="text-muted-foreground text-sm mt-2">{description}</p>
        )}
        <div className="mt-4 flex items-center justify-center gap-4">
          <Badge variant="outline" className="text-sm">
            {eventCount}{" "}
            {eventCount === 1 ? t.eventThisMonth : t.eventsThisMonth}
          </Badge>
          {lastUpdated && (
            <div className="text-sm text-muted-foreground">
              {t.updated}: {format(lastUpdated, "HH:mm", { locale })}
            </div>
          )}
        </div>
      </div>
    </>
  );
}
