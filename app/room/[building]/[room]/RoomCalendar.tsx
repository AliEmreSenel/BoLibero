"use client";

import { useState, useEffect, useMemo, useRef } from "react";
import { startOfMonth, endOfMonth, addMonths, subMonths, format, isSameMonth } from "date-fns";
import { useParams } from "next/navigation";
import { Link2, RefreshCw, Star } from "lucide-react";
import { getBuildingDisplayName, isFreeTimeEvent } from "@/lib/constants";
import type { ClientEvent } from "@/lib/event-matching";
import { PageLayout } from "@/components/page-layout";
import { DetailHeader, headerActionClass, type BandTone } from "@/components/detail-header";
import { MonthPicker } from "@/components/month-picker";
import { RoomDayView } from "@/components/room-day";
import { StudyIcon } from "@/components/availability";
import { eventCourseTitle } from "@/components/class-item";
import { fill, useTranslation } from "@/lib/i18n";
import { FAVORITE_ROOMS_KEY, safeGetItem, safeSetItem, useLanguage } from "@/lib/settings";
import { roomDayFromEvents } from "@/lib/room-day";
import { formatDuration, formatMinutes, roomStatusAt } from "@/lib/availability";
import { normalizeTime, romeDateKey, romeMinutes } from "@/lib/time";
import { cn } from "@/lib/utils";

export default function RoomCalendar() {
  const params = useParams();
  const rawBuilding = Array.isArray(params.building) ? params.building[0] : (params.building as string);
  const rawRoom = Array.isArray(params.room) ? params.room[0] : (params.room as string);
  const decode = (value: string) => {
    try {
      return decodeURIComponent(value);
    } catch {
      return value;
    }
  };
  const building = decode(rawBuilding);
  const room = decode(rawRoom);
  const favoriteKey = `${building}/${room}`;

  const [roomEvents, setRoomEvents] = useState<ClientEvent[]>([]);
  // Today's events, kept when browsing other months so the status band stays.
  const [todayEvents, setTodayEvents] = useState<ClientEvent[] | null>(null);
  const [selectedDate, setSelectedDate] = useState<Date>(new Date());
  const [currentMonth, setCurrentMonth] = useState<Date>(new Date());
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isFavorite, setIsFavorite] = useState(false);
  const [copied, setCopied] = useState(false);
  const [nowTick, setNowTick] = useState(0);
  const [language, setLanguage] = useLanguage();
  const dayRef = useRef<HTMLDivElement>(null);

  const t = useTranslation(language);

  useEffect(() => {
    try {
      const saved = JSON.parse(safeGetItem(FAVORITE_ROOMS_KEY) || "[]");
      setIsFavorite(Array.isArray(saved) && saved.includes(favoriteKey));
    } catch {
      setIsFavorite(false);
    }
  }, [favoriteKey]);

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
      const query = new URLSearchParams({ room, building, from, to });
      const response = await fetch(`/api/events?${query.toString()}`);
      if (!response.ok) {
        throw new Error(`events API returned ${response.status}`);
      }
      const data = (await response.json()) as { events: ClientEvent[] };
      setRoomEvents(data.events);
      if (isSameMonth(month, new Date())) {
        const todayKey = romeDateKey();
        setTodayEvents(data.events.filter((event) => event.date === todayKey));
      }
    } catch (err) {
      console.error("Error loading room schedule:", err);
      setError(t.error);
      setRoomEvents([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadMonthSchedule(currentMonth);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentMonth, building, room]);

  // On phones the day sits below the calendar; bring it into view on pick.
  const selectDate = (date: Date) => {
    setSelectedDate(date);
    if (typeof window !== "undefined" && window.innerWidth < 1024) {
      requestAnimationFrame(() => dayRef.current?.scrollIntoView({ behavior: "smooth", block: "start" }));
    }
  };

  const toggleFavorite = () => {
    let saved: string[] = [];
    try {
      const parsed = JSON.parse(safeGetItem(FAVORITE_ROOMS_KEY) || "[]");
      if (Array.isArray(parsed)) saved = parsed;
    } catch {
      // Corrupt list: start clean.
    }
    const next = saved.includes(favoriteKey)
      ? saved.filter((key) => key !== favoriteKey)
      : [...saved, favoriteKey];
    safeSetItem(FAVORITE_ROOMS_KEY, JSON.stringify(next));
    setIsFavorite(next.includes(favoriteKey));
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
      // Clipboard blocked: nothing to report beyond the unchanged label.
    }
  };

  const selectedKey = format(selectedDate, "yyyy-MM-dd");
  const isTodaySelected = selectedKey === romeDateKey();
  const now = useMemo(() => {
    void nowTick;
    return romeMinutes();
  }, [nowTick]);

  const selectedDay = useMemo(
    () =>
      roomDayFromEvents(
        roomEvents.filter((event) => event.date === selectedKey),
        building,
        selectedDate
      ),
    [roomEvents, selectedKey, building, selectedDate]
  );

  const daysWithEvents = useMemo(
    () => new Set(roomEvents.filter((event) => !isFreeTimeEvent(event)).map((event) => event.date)),
    [roomEvents]
  );

  const band = useMemo(() => {
    if (!todayEvents) return null;
    const today = roomDayFromEvents(todayEvents, building, new Date());
    if (!today.isOpen) return { tone: "busy" as BandTone, content: <strong>{t.buildingClosedToday}</strong> };
    const status = roomStatusAt(today.windows, now);
    if (status.state === "free" && status.current) {
      const end = status.until;
      const nextClass = today.classes.find((event) => (normalizeTime(event.start) ?? "") >= formatMinutes(end));
      return {
        tone: "free" as BandTone,
        content: (
          <span className="inline-flex items-center gap-1.5">
            {status.current.kind === "study" && <StudyIcon className="h-4 w-4" label={t.studySession} />}
            <span>
              <strong>
                {end >= today.close ? t.freeUntilClosing : fill(t.freeUntil, { time: formatMinutes(end) })}
              </strong>{" "}
              · {fill(t.timeLeft, { d: formatDuration(status.minutes) })}
              {nextClass ? ` · ${fill(t.thenClass, { name: eventCourseTitle(nextClass) })}` : ""}
            </span>
          </span>
        ),
      };
    }
    if (status.state === "soon" && status.upcoming) {
      return {
        tone: "soon" as BandTone,
        content: (
          <span>
            <strong>{fill(t.freeIn, { n: status.minutes })}</strong> ·{" "}
            {fill(t.untilTime, { time: formatMinutes(status.until) })}
          </span>
        ),
      };
    }
    return {
      tone: "busy" as BandTone,
      content: (
        <span>
          <strong>{t.occupied}</strong>
          {status.next ? ` · ${fill(t.freeAt, { time: formatMinutes(status.next.start) })}` : ""}
        </span>
      ),
    };
  }, [todayEvents, building, now, t]);

  return (
    <PageLayout language={language} onLanguageChange={setLanguage}>
      <div className="mx-auto w-full max-w-[1240px] px-3 py-5 sm:px-6">
        <DetailHeader
          backHref="/"
          backLabel={t.backToRooms}
          title={room}
          subtitle={getBuildingDisplayName(building)}
          band={band}
          actions={
            <>
              <button type="button" aria-pressed={isFavorite} onClick={toggleFavorite} className={headerActionClass}>
                <Star
                  className={cn("h-4 w-4", isFavorite ? "fill-amber-400 text-amber-500" : "text-muted-foreground")}
                  aria-hidden="true"
                />
                {isFavorite ? t.favorite : t.addFavorite}
              </button>
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
          <div ref={dayRef} className="flex min-w-0 flex-[999_1_560px] scroll-mt-4">
            <RoomDayView
              day={selectedDay}
              date={selectedDate}
              now={isTodaySelected ? now : null}
              loading={loading}
              failed={Boolean(error)}
              language={language}
              t={t}
            />
          </div>
        </div>
      </div>
    </PageLayout>
  );
}
