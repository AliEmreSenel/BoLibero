"use client";

import { ChevronLeft, ChevronRight } from "lucide-react";
import {
  eachDayOfInterval,
  endOfMonth,
  format,
  getDay,
  isSameDay,
  startOfMonth,
} from "date-fns";
import { it, enUS } from "date-fns/locale";
import type { Language, Translations } from "@/lib/i18n";
import { cn } from "@/lib/utils";

interface MonthPickerProps {
  month: Date;
  selected: Date;
  today: Date;
  // "yyyy-MM-dd" keys of days with at least one event.
  daysWithEvents: Set<string>;
  onSelect: (date: Date) => void;
  onPrev: () => void;
  onNext: () => void;
  onToday: () => void;
  loading: boolean;
  language: Language;
  t: Translations;
  footer?: string;
}

/** Month grid (Monday first) with a dot on days that have events. */
export function MonthPicker({
  month,
  selected,
  today,
  daysWithEvents,
  onSelect,
  onPrev,
  onNext,
  onToday,
  loading,
  language,
  t,
  footer,
}: MonthPickerProps) {
  const locale = language === "it" ? it : enUS;
  const days = eachDayOfInterval({ start: startOfMonth(month), end: endOfMonth(month) });
  const leading = (getDay(days[0]) + 6) % 7;
  const weekdays = Array.from({ length: 7 }, (_, index) =>
    format(new Date(2024, 0, 1 + index), "EEEEEE", { locale })
  );

  return (
    <section aria-label={t.calendar} className="rounded-2xl border bg-card p-3.5">
      <div className="mb-2 flex items-center justify-between gap-2">
        <button
          type="button"
          onClick={onPrev}
          disabled={loading}
          aria-label={t.prevMonth}
          className="inline-flex h-9 w-9 items-center justify-center rounded-lg hover:bg-muted disabled:opacity-50"
        >
          <ChevronLeft className="h-4 w-4" />
        </button>
        <span className="font-bold capitalize">{format(month, "MMMM yyyy", { locale })}</span>
        <div className="flex items-center gap-1">
          <button
            type="button"
            onClick={onToday}
            disabled={loading}
            className="min-h-9 rounded-lg px-2 text-sm font-semibold text-free-soft-foreground hover:bg-muted disabled:opacity-50"
          >
            {t.today}
          </button>
          <button
            type="button"
            onClick={onNext}
            disabled={loading}
            aria-label={t.nextMonth}
            className="inline-flex h-9 w-9 items-center justify-center rounded-lg hover:bg-muted disabled:opacity-50"
          >
            <ChevronRight className="h-4 w-4" />
          </button>
        </div>
      </div>
      <div className="mb-1 grid grid-cols-7 gap-0.5 text-center text-[11px] text-muted-foreground" aria-hidden="true">
        {weekdays.map((day) => (
          <span key={day}>{day}</span>
        ))}
      </div>
      <div className="grid grid-cols-7 gap-0.5">
        {Array.from({ length: leading }).map((_, index) => (
          <span key={`blank-${index}`} />
        ))}
        {days.map((day) => {
          const key = format(day, "yyyy-MM-dd");
          const isSelected = isSameDay(day, selected);
          const isToday = isSameDay(day, today);
          const hasEvents = daysWithEvents.has(key);
          return (
            <button
              key={key}
              type="button"
              aria-pressed={isSelected}
              aria-label={format(day, "EEEE d MMMM", { locale })}
              aria-current={isToday ? "date" : undefined}
              onClick={() => onSelect(day)}
              disabled={loading}
              className={cn(
                "relative h-10 rounded-[9px] text-sm font-semibold tabular-nums disabled:opacity-60",
                isSelected ? "bg-ink text-ink-foreground" : "hover:bg-muted",
                isToday && !isSelected && "ring-2 ring-inset ring-free-bar"
              )}
            >
              {format(day, "d")}
              {hasEvents && (
                <span
                  aria-hidden="true"
                  className={cn(
                    "absolute bottom-1 left-1/2 h-1 w-1 -translate-x-1/2 rounded-full",
                    isSelected ? "bg-ink-foreground" : "bg-free-bar"
                  )}
                />
              )}
            </button>
          );
        })}
      </div>
      {footer && <p className="mt-2 text-xs text-muted-foreground">{footer}</p>}
    </section>
  );
}
