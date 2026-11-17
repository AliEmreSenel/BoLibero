"use client";

import { useId, useState } from "react";
import { CalendarDays, ChevronLeft, ChevronRight } from "lucide-react";
import {
  addDays,
  eachDayOfInterval,
  endOfMonth,
  format,
  getDay,
  isSameDay,
  startOfMonth,
  startOfWeek,
} from "date-fns";
import { it, enUS } from "date-fns/locale";
import type { Language, Translations } from "@/lib/i18n";
import { cn } from "@/lib/utils";

interface MonthPickerProps {
  month: Date;
  selected: Date;
  today: Date;
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

/** One date selection: a week/month switch on mobile, a month on desktop. */
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
  const [expanded, setExpanded] = useState(false);
  const monthId = useId();
  const locale = language === "it" ? it : enUS;
  const days = eachDayOfInterval({ start: startOfMonth(month), end: endOfMonth(month) });
  const leading = (getDay(days[0]) + 6) % 7;
  const weekStart = startOfWeek(selected, { weekStartsOn: 1 });
  const week = Array.from({ length: 7 }, (_, index) => addDays(weekStart, index));
  const weekdays = week.map((day) => format(day, "EEEEEE", { locale }));

  const dateButton = (day: Date, compact: boolean) => {
    const key = format(day, "yyyy-MM-dd");
    const isSelected = isSameDay(day, selected);
    const isToday = isSameDay(day, today);
    const hasEvents = daysWithEvents.has(key);
    return (
      <button
        key={key}
        type="button"
        aria-pressed={isSelected}
        aria-label={`${format(day, "EEEE d MMMM yyyy", { locale })}${hasEvents ? ` · ${t.classPlural}` : ""}`}
        aria-current={isToday ? "date" : undefined}
        onClick={() => onSelect(day)}
        disabled={loading}
        className={cn(
          "relative min-h-11 rounded-lg text-sm font-semibold tabular-nums disabled:opacity-60",
          compact && "flex min-w-0 flex-col items-center justify-center border pb-2 pt-1",
          isSelected ? "border-ink bg-ink text-ink-foreground" : "border-border hover:bg-muted",
          isToday && !isSelected && "ring-2 ring-inset ring-free-bar",
        )}
      >
        {compact && (
          <span className="text-[10px] font-medium">{format(day, "EEE", { locale })}</span>
        )}
        <span>{format(day, "d")}</span>
        {hasEvents && (
          <span
            aria-hidden="true"
            className={cn(
              "absolute bottom-1 left-1/2 h-1 w-1 -translate-x-1/2 rounded-full",
              isSelected ? "bg-ink-foreground" : "bg-free-bar",
            )}
          />
        )}
      </button>
    );
  };

  return (
    <section
      aria-label={t.calendar}
      aria-busy={loading}
      className="border-y bg-card px-3 py-2 sm:rounded-xl sm:border sm:p-3.5 lg:rounded-2xl"
    >
      <div className="mb-2 flex items-center justify-between gap-1">
        <div className="flex min-w-0 items-center">
          <button
            type="button"
            onClick={onPrev}
            disabled={loading}
            aria-label={t.prevMonth}
            className={cn(
              "h-11 w-9 items-center justify-center rounded-lg hover:bg-muted disabled:opacity-50",
              expanded ? "inline-flex" : "hidden lg:inline-flex",
            )}
          >
            <ChevronLeft className="h-4 w-4" aria-hidden="true" />
          </button>
          <button
            type="button"
            onClick={() => onSelect(addDays(selected, -7))}
            disabled={loading}
            aria-label={t.previousWeek}
            className={cn(
              "inline-flex h-11 w-9 items-center justify-center rounded-lg hover:bg-muted disabled:opacity-50 lg:hidden",
              expanded && "hidden",
            )}
          >
            <ChevronLeft className="h-4 w-4" aria-hidden="true" />
          </button>
          <span className="text-[13px] font-bold capitalize sm:text-sm lg:text-base">
            {format(month, "MMMM yyyy", { locale })}
          </span>
        </div>
        <div className="flex items-center">
          <button
            type="button"
            onClick={onToday}
            disabled={loading}
            className="min-h-11 rounded-lg px-2 text-xs font-semibold text-free-soft-foreground hover:bg-muted disabled:opacity-50 lg:text-sm"
          >
            {t.today}
          </button>
          <button
            type="button"
            aria-expanded={expanded}
            aria-controls={monthId}
            onClick={() => setExpanded(!expanded)}
            className="inline-flex min-h-11 items-center gap-1 rounded-lg px-2 text-xs font-semibold hover:bg-muted lg:hidden"
          >
            <CalendarDays className="h-4 w-4" aria-hidden="true" />
            {expanded ? t.weekView : t.monthView}
          </button>
          <button
            type="button"
            onClick={onNext}
            disabled={loading}
            aria-label={t.nextMonth}
            className={cn(
              "h-11 w-9 items-center justify-center rounded-lg hover:bg-muted disabled:opacity-50",
              expanded ? "inline-flex" : "hidden lg:inline-flex",
            )}
          >
            <ChevronRight className="h-4 w-4" aria-hidden="true" />
          </button>
          <button
            type="button"
            onClick={() => onSelect(addDays(selected, 7))}
            disabled={loading}
            aria-label={t.nextWeek}
            className={cn(
              "inline-flex h-11 w-9 items-center justify-center rounded-lg hover:bg-muted disabled:opacity-50 lg:hidden",
              expanded && "hidden",
            )}
          >
            <ChevronRight className="h-4 w-4" aria-hidden="true" />
          </button>
        </div>
      </div>
      <div className={cn("grid grid-cols-7 gap-1 lg:hidden", expanded && "hidden")}>
        {week.map((day) => dateButton(day, true))}
      </div>
      <div id={monthId} className={cn(expanded ? "block" : "hidden", "lg:block")}>
        <div
          className="mb-1 grid grid-cols-7 gap-0.5 text-center text-[11px] text-muted-foreground"
          aria-hidden="true"
        >
          {weekdays.map((day) => (
            <span key={day}>{day}</span>
          ))}
        </div>
        <div className="grid grid-cols-7 gap-0.5">
          {Array.from({ length: leading }).map((_, index) => (
            <span key={`blank-${index}`} />
          ))}
          {days.map((day) => dateButton(day, false))}
        </div>
        {footer && <p className="mt-2 text-xs text-muted-foreground">{footer}</p>}
      </div>
    </section>
  );
}
