"use client";

import { Loader2 } from "lucide-react";
import { DayBar, LockedMark, SlotChips, StudyIcon } from "@/components/availability";
import { ClassDetails, TimeCell } from "@/components/class-item";
import {
  formatDuration,
  formatMinutes,
  roomStatusAt,
  type RoomWindow,
} from "@/lib/availability";
import type { RoomDay } from "@/lib/room-day";
import { fill, formatDateFull, type Language, type Translations } from "@/lib/i18n";
import type { ClientEvent } from "@/lib/event-matching";
import { cn } from "@/lib/utils";

interface RoomDayViewProps {
  day: RoomDay;
  date: Date;
  // Minute of "now" when the selected day is today, else null.
  now: number | null;
  loading: boolean;
  failed: boolean;
  language: Language;
  t: Translations;
}

type Row =
  | { kind: "class"; start: number; event: ClientEvent }
  | { kind: "window"; start: number; window: RoomWindow };

const parseStart = (time: string) => {
  const [hours, minutes] = time.split(":").map(Number);
  return (hours || 0) * 60 + (minutes || 0);
};

export function RoomDayView({ day, date, now, loading, failed, language, t }: RoomDayViewProps) {
  const status = now !== null ? roomStatusAt(day.windows, now) : null;
  const freeTotal = day.windows.reduce((sum, window) => sum + window.end - window.start, 0);
  const classCount = day.classes.length;
  const rows: Row[] = [
    ...day.classes.map((event) => ({ kind: "class" as const, start: parseStart(event.start), event })),
    ...day.windows.map((window) => ({ kind: "window" as const, start: window.start, window })),
  ].sort((a, b) => a.start - b.start);
  const noClasses = day.isOpen && classCount === 0 && !day.windows.some((w) => w.kind === "study");

  return (
    <section aria-label={formatDateFull(date, language)} className="min-w-0 flex-[999_1_560px] rounded-2xl border bg-card p-4 sm:px-[18px]">
      <div className="mb-3 flex flex-wrap items-baseline justify-between gap-x-3 gap-y-1">
        <h2 className="text-lg font-extrabold capitalize">{formatDateFull(date, language)}</h2>
        {!loading && day.isOpen && (
          <span className="text-sm text-muted-foreground">
            {classCount} {classCount === 1 ? t.classSingular : t.classPlural} ·{" "}
            {fill(t.freeTotal, { d: formatDuration(freeTotal) })}
          </span>
        )}
      </div>

      {loading ? (
        <div role="status" className="flex items-center justify-center gap-2 py-10 text-muted-foreground">
          <Loader2 className="h-5 w-5 animate-spin" />
          {t.loadingEvents}
        </div>
      ) : failed ? (
        <p role="alert" className="rounded-xl bg-destructive/10 p-4 text-destructive">
          {t.error}
        </p>
      ) : !day.isOpen ? (
        <p className="rounded-xl bg-muted p-6 text-center text-muted-foreground">{t.buildingClosed}</p>
      ) : (
        <div className="flex flex-col gap-3.5">
          <SlotChips windows={day.windows} status={status} studyLabel={t.studySession} />
          <DayBar
            windows={day.windows}
            status={status}
            open={day.open}
            close={day.close}
            marker={now}
            barClassName="h-[18px]"
          />
          {noClasses && (
            <p className="flex items-center gap-2 text-sm text-warn-foreground">
              <LockedMark label={t.noClassesMayBeLocked} />
              {t.noClassesMayBeLocked}
            </p>
          )}
          <ol className="flex flex-col gap-2">
            {rows.map((row) => {
              if (row.kind === "class") {
                return (
                  <li
                    key={`c-${row.event.start}-${row.event.code}-${row.event.class}`}
                    className="grid grid-cols-[52px_minmax(0,1fr)] gap-3 sm:grid-cols-[104px_minmax(0,1fr)]"
                  >
                    <TimeCell start={row.event.start} end={row.event.end} className="pt-2.5" />
                    <div className="rounded-xl border bg-card px-3.5 py-2.5">
                      <ClassDetails event={row.event} language={language} showTeachers />
                    </div>
                  </li>
                );
              }
              const { window } = row;
              const isNow = status?.current === window;
              const isStudy = window.kind === "study";
              return (
                <li
                  key={`w-${window.start}-${window.kind}`}
                  className="grid grid-cols-[52px_minmax(0,1fr)] gap-3 sm:grid-cols-[104px_minmax(0,1fr)]"
                >
                  <TimeCell
                    start={formatMinutes(window.start)}
                    end={formatMinutes(window.end)}
                    className={cn("pt-2.5", isStudy ? "text-study-soft-foreground" : "text-free-soft-foreground")}
                  />
                  <div
                    className={cn(
                      "flex items-center gap-1.5 rounded-xl border px-3.5 py-2.5 font-bold",
                      isNow
                        ? isStudy
                          ? "border-study bg-study text-study-foreground"
                          : "border-free bg-free text-free-foreground"
                        : isStudy
                          ? "border-study-border bg-study-soft text-study-soft-foreground"
                          : "border-free-tint-border bg-free-tint text-free-soft-foreground"
                    )}
                  >
                    {isStudy && <StudyIcon className="h-4 w-4" label={t.studySession} />}
                    {fill(isNow ? t.freeNowDuration : t.freeDuration, {
                      d: formatDuration(window.end - window.start),
                    })}
                  </div>
                </li>
              );
            })}
          </ol>
          {rows.length === 0 && (
            <p className="py-6 text-center text-muted-foreground">{t.noEventsScheduled}</p>
          )}
        </div>
      )}
    </section>
  );
}
