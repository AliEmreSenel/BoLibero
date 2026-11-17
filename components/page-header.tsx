"use client";

import { ChevronLeft, ChevronRight } from "lucide-react";
import { format } from "date-fns";
import { it, enUS } from "date-fns/locale";
import type { Language, Translations } from "@/lib/i18n";

interface PageHeaderProps {
  language: Language;
  selectedDate: Date;
  dateValue: string;
  minDate: string;
  maxDate: string;
  isToday: boolean;
  onDateChange: (value: string) => void;
  onShiftDay: (days: number) => void;
  t: Translations;
}

export function PageHeader({
  language,
  selectedDate,
  dateValue,
  minDate,
  maxDate,
  isToday,
  onDateChange,
  onShiftDay,
  t,
}: PageHeaderProps) {
  const label = format(selectedDate, "EEE d MMM", {
    locale: language === "it" ? it : enUS,
  });
  return (
    <div className="mb-3 flex flex-wrap items-center justify-between gap-x-4 gap-y-2 sm:mb-3.5">
      <div>
        <h1 className="text-xl font-extrabold tracking-tight sm:text-2xl">{t.availableRooms}</h1>
        <p className="hidden text-muted-foreground sm:block">{t.appDescription}</p>
      </div>
      <div
        role="group"
        aria-label={t.day}
        className="flex items-center gap-0.5 rounded-lg border bg-card p-px text-xs sm:rounded-xl sm:p-[3px] sm:text-base"
      >
        <button
          type="button"
          aria-label={t.previousDay}
          onClick={() => onShiftDay(-1)}
          disabled={dateValue <= minDate}
          className="inline-flex h-11 w-8 items-center justify-center rounded-lg hover:bg-muted disabled:opacity-40 sm:h-10 sm:w-10"
        >
          <ChevronLeft className="h-4 w-4" />
        </button>
        <label className="relative flex h-11 cursor-pointer items-center px-1 font-bold sm:h-10 sm:px-2">
          <span aria-hidden="true">
            {isToday ? `${t.today} · ${label}` : label}
          </span>
          <input
            type="date"
            aria-label={t.day}
            value={dateValue}
            min={minDate}
            max={maxDate}
            onChange={(e) => e.target.value && onDateChange(e.target.value)}
            onClick={(e) => {
              // Some browsers only open the picker from the calendar icon.
              try {
                e.currentTarget.showPicker();
              } catch {
                // Not supported or not allowed: the native input still works.
              }
            }}
            className="absolute inset-0 cursor-pointer opacity-0"
          />
        </label>
        <button
          type="button"
          aria-label={t.nextDay}
          onClick={() => onShiftDay(1)}
          disabled={dateValue >= maxDate}
          className="inline-flex h-11 w-8 items-center justify-center rounded-lg hover:bg-muted disabled:opacity-40 sm:h-10 sm:w-10"
        >
          <ChevronRight className="h-4 w-4" />
        </button>
      </div>
    </div>
  );
}
