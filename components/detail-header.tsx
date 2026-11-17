"use client";

import type { ReactNode } from "react";
import Link from "next/link";
import { ArrowRight, ChevronLeft } from "lucide-react";
import { cn } from "@/lib/utils";

export type BandTone = "free" | "soon" | "busy" | "ink";

const toneClass: Record<BandTone, string> = {
  free: "bg-free text-free-foreground",
  soon: "bg-soon text-soon-foreground",
  busy: "bg-busy text-busy-foreground",
  ink: "bg-ink text-ink-foreground",
};

const borderClass: Record<BandTone, string> = {
  free: "border-free-border",
  soon: "border-soon-border",
  busy: "border-border",
  ink: "border-border",
};

interface DetailHeaderProps {
  mobileTitle: string;
  backHref: string;
  backLabel: string;
  title: string;
  subtitle?: ReactNode;
  avatar?: string;
  actions?: ReactNode;
  band?: { tone: BandTone; content: ReactNode; href?: string } | null;
}

/** Back link plus the title card with an optional status band underneath. */
export function DetailHeader({
  mobileTitle,
  backHref,
  backLabel,
  title,
  subtitle,
  avatar,
  actions,
  band,
}: DetailHeaderProps) {
  const bandBody = band && (
    <span
      className={cn(
        "flex min-h-10 items-center justify-between gap-3 px-3 py-2 text-xs sm:min-h-[46px] sm:px-[18px] sm:text-sm",
        toneClass[band.tone],
      )}
    >
      <span>{band.content}</span>
      {band.href && <ArrowRight className="h-4 w-4 shrink-0" aria-hidden="true" />}
    </span>
  );
  return (
    <div className="-mx-3 mb-0 flex flex-col bg-card sm:mx-0 sm:mb-4 sm:gap-4 sm:bg-transparent">
      <div className="grid min-h-12 grid-cols-[1fr_auto_1fr] items-center border-b px-1 pt-[env(safe-area-inset-top)] sm:hidden">
        <Link
          href={backHref}
          aria-label={backLabel}
          className="inline-flex h-11 w-11 items-center justify-center rounded-lg hover:bg-muted"
        >
          <ChevronLeft className="h-4 w-4" aria-hidden="true" />
        </Link>
        <span className="text-xs font-bold">{mobileTitle}</span>
        <div className="flex justify-end">{actions}</div>
      </div>
      <Link
        href={backHref}
        className="hidden min-h-8 items-center gap-1.5 self-start font-semibold text-muted-foreground hover:text-foreground sm:inline-flex"
      >
        <ChevronLeft className="h-4 w-4" aria-hidden="true" />
        {backLabel}
      </Link>
      <section
        className={cn(
          "overflow-hidden bg-card sm:rounded-2xl sm:border",
          borderClass[band?.tone ?? "busy"],
        )}
      >
        <div className="flex flex-wrap items-center justify-between gap-x-4 gap-y-3 px-3 py-4 sm:p-4 sm:px-[18px]">
          <div className="flex min-w-0 items-center gap-2.5 sm:gap-3.5">
            {avatar && (
              <span
                aria-hidden="true"
                className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-free-soft text-sm font-extrabold text-free-soft-foreground sm:h-12 sm:w-12 sm:text-[17px]"
              >
                {avatar}
              </span>
            )}
            <div className="min-w-0">
              <h1 className="break-words text-xl font-extrabold tracking-tight sm:text-[26px]">
                {title}
              </h1>
              {subtitle && (
                <div className="mt-0.5 text-xs text-muted-foreground sm:text-base">{subtitle}</div>
              )}
            </div>
          </div>
          {actions && <div className="hidden flex-wrap gap-2 sm:flex">{actions}</div>}
        </div>
        {band &&
          (band.href ? (
            <Link href={band.href} className="block">
              {bandBody}
            </Link>
          ) : (
            bandBody
          ))}
      </section>
    </div>
  );
}

export const headerActionClass =
  "inline-flex h-11 w-10 shrink-0 items-center justify-center gap-1.5 rounded-lg bg-card text-sm font-semibold hover:bg-muted disabled:opacity-50 sm:h-auto sm:min-h-[38px] sm:w-auto sm:rounded-[10px] sm:border sm:border-input sm:px-3";
