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
  backHref,
  backLabel,
  title,
  subtitle,
  avatar,
  actions,
  band,
}: DetailHeaderProps) {
  const bandBody = band && (
    <span className={cn("flex min-h-[46px] items-center justify-between gap-3 px-4 text-sm sm:px-[18px]", toneClass[band.tone])}>
      <span>{band.content}</span>
      {band.href && <ArrowRight className="h-4 w-4 shrink-0" aria-hidden="true" />}
    </span>
  );
  return (
    <div className="mb-4 flex flex-col gap-4">
      <Link
        href={backHref}
        className="inline-flex min-h-8 items-center gap-1.5 self-start font-semibold text-muted-foreground hover:text-foreground"
      >
        <ChevronLeft className="h-4 w-4" aria-hidden="true" />
        {backLabel}
      </Link>
      <section className={cn("overflow-hidden rounded-2xl border bg-card", borderClass[band?.tone ?? "busy"])}>
        <div className="flex flex-wrap items-center justify-between gap-x-4 gap-y-3 p-4 sm:px-[18px]">
          <div className="flex min-w-0 items-center gap-3.5">
            {avatar && (
              <span
                aria-hidden="true"
                className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-free-soft text-[17px] font-extrabold text-free-soft-foreground"
              >
                {avatar}
              </span>
            )}
            <div className="min-w-0">
              <h1 className="break-words text-2xl font-extrabold tracking-tight sm:text-[26px]">{title}</h1>
              {subtitle && <div className="text-muted-foreground">{subtitle}</div>}
            </div>
          </div>
          {actions && <div className="flex flex-wrap gap-2">{actions}</div>}
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
  "inline-flex min-h-[38px] items-center gap-1.5 rounded-[10px] border border-input bg-card px-3 text-sm font-semibold hover:bg-muted disabled:opacity-50";
