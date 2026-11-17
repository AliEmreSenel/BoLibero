"use client";

import { useState, useEffect, useMemo, useRef } from "react";
import Link from "next/link";
import { startOfMonth, endOfMonth, addMonths, subMonths, format, parseISO, isSameMonth } from "date-fns";
import { it, enUS } from "date-fns/locale";
import { useParams, useSearchParams } from "next/navigation";
import { ArrowRight, Link2, Loader2, RefreshCw } from "lucide-react";
import type { ClientEvent } from "@/lib/event-matching";
import { PageLayout } from "@/components/page-layout";
import { DetailHeader, headerActionClass } from "@/components/detail-header";
import { MonthPicker } from "@/components/month-picker";
import { ClassDetails, TimeCell, eventCourseTitle, roomHref, roomLabel } from "@/components/class-item";
import { fill, formatDateFull, useTranslation } from "@/lib/i18n";
import { useLanguage } from "@/lib/settings";
import { isFreeTimeEvent, isLinkableRoomName, resolveRoom } from "@/lib/constants";
import { ScheduleFetcher } from "@/lib/schedule-fetcher";
import { buildWindows, formatDuration, formatMinutes, roomStatusAt, type RoomStatus } from "@/lib/availability";
import { normalizeTime, romeDateKey, romeMinutes, toMinutes } from "@/lib/time";
import { cn, decodeRouteParam } from "@/lib/utils";
import { professorInitials, professorsHref } from "@/lib/professor-search";

const fetcher = ScheduleFetcher.getInstance();

const startMinutes = (event: ClientEvent) => {
  const time = normalizeTime(event.start);
  return time ? toMinutes(time) : 0;
};

export default function ProfessorCalendar() {
  const params = useParams();
  const searchParams = useSearchParams();
  const rawName = Array.isArray(params.name) ? params.name[0] : (params.name as string);
  const name = decodeRouteParam(rawName);

  const [profEvents, setProfEvents] = useState<ClientEvent[]>([]);
  const [selectedDate, setSelectedDate] = useState<Date>(new Date());
  const [currentMonth, setCurrentMonth] = useState<Date>(new Date());
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);
  const [nowTick, setNowTick] = useState(0);
  // Live status of rooms, keyed "building/room", for today's classes.
  const [roomStatuses, setRoomStatuses] = useState<Record<string, RoomStatus>>({});
  const [language, setLanguage] = useLanguage();
  const dayRef = useRef<HTMLDivElement>(null);

  const t = useTranslation(language);
  const locale = language === "it" ? it : enUS;

  useEffect(() => {
    const id = setInterval(() => setNowTick((tick) => tick + 1), 60_000);
    return () => clearInterval(id);
  }, []);

  const loadMonthSchedule = async (month: Date) => {
    setLoading(true);
    setError(null);
    try {
      const from = startOfMonth(month).toISOString().split("T")[0];
      const to = endOfMonth(month).toISOString().split("T")[0];
      const query = new URLSearchParams({ prof: name, from, to });
      const response = await fetch(`/api/events?${query.toString()}`);
      if (!response.ok) {
        throw new Error(`events API returned ${response.status}`);
      }
      const data = (await response.json()) as { events: ClientEvent[] };
      setProfEvents(data.events.filter((event) => !isFreeTimeEvent(event)));
    } catch (err) {
      console.error("Error loading professor schedule:", err);
      setError(t.error);
      setProfEvents([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadMonthSchedule(currentMonth);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentMonth, name]);

  const todayKey = romeDateKey();
  const now = useMemo(() => {
    void nowTick;
    return romeMinutes();
  }, [nowTick]);
  const selectedKey = format(selectedDate, "yyyy-MM-dd");
  const isTodaySelected = selectedKey === todayKey;

  const dayEvents = useMemo(
    () =>
      profEvents
        .filter((event) => event.date === selectedKey)
        .sort((a, b) => startMinutes(a) - startMinutes(b)),
    [profEvents, selectedKey]
  );

  // Today's classes show whether their room is free right now.
  useEffect(() => {
    if (!isTodaySelected || dayEvents.length === 0) return;
    let cancelled = false;
    const today = new Date();
    fetcher
      .fetchScheduleForDate(today)
      .then(() => {
        if (cancelled) return;
        const minute = romeMinutes();
        const statuses: Record<string, RoomStatus> = {};
        for (const event of dayEvents) {
          for (const { roomName } of event.rooms) {
            const canonical = resolveRoom(roomName);
            if (!canonical) continue;
            const windows = buildWindows(
              fetcher.getFreeTimeSlots(canonical.building, canonical.room, today),
              fetcher.getStudyRoomTimeSlots(canonical.building, canonical.room, today)
            );
            statuses[`${canonical.building}/${canonical.room}`] = roomStatusAt(windows, minute);
          }
        }
        setRoomStatuses(statuses);
      })
      .catch(() => {
        // Live room status is a bonus; the schedule itself still renders.
      });
    return () => {
      cancelled = true;
    };
  }, [isTodaySelected, dayEvents, nowTick]);

  const daysWithEvents = useMemo(() => new Set(profEvents.map((event) => event.date)), [profEvents]);

  const subjects = useMemo(() => {
    const names = [...new Set(profEvents.map((event) => eventCourseTitle(event)).filter(Boolean))];
    return names.length > 2 ? `${names.slice(0, 2).join(", ")}…` : names.join(", ");
  }, [profEvents]);

  const nextClass = useMemo(() => {
    const nowTime = formatMinutes(now);
    return [...profEvents]
      .filter(
        (event) =>
          event.date > todayKey ||
          (event.date === todayKey && (normalizeTime(event.start) ?? "") > nowTime)
      )
      .sort((a, b) => a.date.localeCompare(b.date) || startMinutes(a) - startMinutes(b))[0];
  }, [profEvents, todayKey, now]);

  const band = useMemo(() => {
    if (!nextClass) return null;
    const isToday = nextClass.date === todayKey;
    const dayLabel = isToday ? t.today : format(parseISO(nextClass.date), "EEE d MMM", { locale });
    const room = nextClass.rooms.find((candidate) => isLinkableRoomName(candidate.roomName));
    const parts = [room ? roomLabel(room) : nextClass.room_raw];
    if (isToday) parts.push(fill(t.inDuration, { d: formatDuration(startMinutes(nextClass) - now) }));
    return {
      tone: "ink" as const,
      href: room ? roomHref(room.building, room.roomName) : undefined,
      content: (
        <span>
          <strong>
            {t.nextClassLabel}: {eventCourseTitle(nextClass)}, {dayLabel} {normalizeTime(nextClass.start) ?? nextClass.start}
          </strong>{" "}
          · {parts.filter(Boolean).join(" · ")}
        </span>
      ),
    };
  }, [nextClass, todayKey, now, t, locale]);

  const selectDate = (date: Date) => {
    setSelectedDate(date);
    if (typeof window !== "undefined" && window.innerWidth < 1024) {
      requestAnimationFrame(() => dayRef.current?.scrollIntoView({ behavior: "smooth", block: "start" }));
    }
  };

  // Keep the selected day inside the visible month: today when it is the
  // current month, else the 1st, so the day view never shows a day whose
  // events were not loaded.
  const moveMonth = (month: Date) => {
    setCurrentMonth(month);
    setSelectedDate(isSameMonth(month, new Date()) ? new Date() : startOfMonth(month));
  };

  const copyLink = async () => {
    try {
      await navigator.clipboard.writeText(window.location.href);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 2500);
    } catch {
      // Clipboard blocked: keep the label unchanged.
    }
  };

  return (
    <PageLayout language={language} onLanguageChange={setLanguage}>
      <div className="mx-auto w-full max-w-[1240px] px-3 py-5 sm:px-6">
        <DetailHeader
          backHref={professorsHref(searchParams.get("q") ?? "")}
          backLabel={t.allProfessors}
          title={name}
          avatar={professorInitials(name)}
          subtitle={
            loading ? undefined : [subjects, fill(t.classesThisMonth, { n: profEvents.length })]
              .filter(Boolean)
              .join(" · ")
          }
          band={band}
          actions={
            <>
              <button type="button" onClick={copyLink} className={headerActionClass}>
                <Link2 className="h-4 w-4" aria-hidden="true" />
                {copied ? t.linkCopied : t.copyLink}
              </button>
              <button
                type="button"
                onClick={() => loadMonthSchedule(currentMonth)}
                disabled={loading}
                aria-label={t.refresh}
                className={headerActionClass}
              >
                <RefreshCw className={cn("h-4 w-4", loading && "animate-spin")} aria-hidden="true" />
              </button>
            </>
          }
        />

        <div className="flex flex-wrap items-start gap-4">
          <div className="flex-[1_1_300px]">
            <MonthPicker
              month={currentMonth}
              selected={selectedDate}
              today={new Date()}
              daysWithEvents={daysWithEvents}
              onSelect={selectDate}
              onPrev={() => moveMonth(subMonths(currentMonth, 1))}
              onNext={() => moveMonth(addMonths(currentMonth, 1))}
              onToday={() => {
                const today = new Date();
                selectDate(today);
                setCurrentMonth(today);
              }}
              loading={loading}
              language={language}
              t={t}
              footer={t.dotHint}
            />
          </div>

          <section
            ref={dayRef}
            aria-label={formatDateFull(selectedDate, language)}
            className="min-w-0 flex-[999_1_560px] scroll-mt-4 rounded-2xl border bg-card p-4 sm:px-[18px]"
          >
            <div className="mb-3 flex flex-wrap items-baseline justify-between gap-x-3 gap-y-1">
              <h2 className="text-lg font-extrabold capitalize">{formatDateFull(selectedDate, language)}</h2>
              {!loading && dayEvents.length > 0 && (
                <span className="text-sm text-muted-foreground">
                  {dayEvents.length} {dayEvents.length === 1 ? t.classSingular : t.classPlural}
                </span>
              )}
            </div>
            {loading ? (
              <div role="status" className="flex items-center justify-center gap-2 py-10 text-muted-foreground">
                <Loader2 className="h-5 w-5 animate-spin" />
                {t.loadingEvents}
              </div>
            ) : error ? (
              <p role="alert" className="rounded-xl bg-destructive/10 p-4 text-destructive">
                {error}
              </p>
            ) : dayEvents.length === 0 ? (
              <p className="rounded-xl bg-muted p-6 text-center text-muted-foreground">{t.noClassesPublishedProf}</p>
            ) : (
              <ol className="flex flex-col gap-2">
                {dayEvents.map((event, index) => (
                  <li
                    key={`${event.start}-${event.code}-${index}`}
                    className="grid grid-cols-[52px_minmax(0,1fr)] gap-3 sm:grid-cols-[104px_minmax(0,1fr)]"
                  >
                    <TimeCell start={event.start} end={event.end} className="pt-3" />
                    <div className="overflow-hidden rounded-xl border">
                      <div className="px-3.5 py-2.5">
                        <ClassDetails event={event} language={language} showTeachers={false} />
                      </div>
                      {event.rooms.map((room, roomIndex) => {
                        const canonical = resolveRoom(room.roomName);
                        const status = canonical
                          ? roomStatuses[`${canonical.building}/${canonical.room}`]
                          : undefined;
                        const freeNow =
                          isTodaySelected && status?.state === "free" && status.current && startMinutes(event) > now;
                        const content = (
                          <>
                            <span>
                              <strong>{roomLabel(room)}</strong>
                              {freeNow && status?.current
                                ? ` · ${fill(t.roomFreeNowUntil, { time: formatMinutes(status.until) })}`
                                : ""}
                            </span>
                            {isLinkableRoomName(room.roomName) && (
                              <ArrowRight className="h-4 w-4 shrink-0" aria-label={t.openRoom} role="img" />
                            )}
                          </>
                        );
                        const className = cn(
                          "flex min-h-10 items-center justify-between gap-2 px-3.5 text-[13px]",
                          freeNow ? "bg-free text-free-foreground" : "bg-busy text-foreground"
                        );
                        return isLinkableRoomName(room.roomName) ? (
                          <Link key={roomIndex} href={roomHref(room.building, room.roomName)} className={className}>
                            {content}
                          </Link>
                        ) : (
                          <div key={roomIndex} className={className}>
                            {content}
                          </div>
                        );
                      })}
                    </div>
                  </li>
                ))}
              </ol>
            )}
          </section>
        </div>
      </div>
    </PageLayout>
  );
}
