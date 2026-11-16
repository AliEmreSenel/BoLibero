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
    <div className="mb-3.5 flex flex-wrap items-center justify-between gap-x-4 gap-y-2.5">
      <div>
        <h1 className="text-2xl font-extrabold tracking-tight">{t.availableRooms}</h1>
        <p className="text-muted-foreground">{t.appDescription}</p>
      </div>
      <div
        role="group"
        aria-label={t.day}
        className="flex items-center gap-0.5 rounded-xl border bg-card p-[3px]"
      >
        <button
          type="button"
          aria-label={t.previousDay}
          onClick={() => onShiftDay(-1)}
          disabled={dateValue <= minDate}
          className="inline-flex h-10 w-10 items-center justify-center rounded-lg hover:bg-muted disabled:opacity-40"
        >
          <ChevronLeft className="h-4 w-4" />
        </button>
        <label className="relative flex h-10 cursor-pointer items-center px-2 font-bold">
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
          className="inline-flex h-10 w-10 items-center justify-center rounded-lg hover:bg-muted disabled:opacity-40"
        >
          <ChevronRight className="h-4 w-4" />
        </button>
      </div>
    </div>
  );
}
