"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { ArrowRight, Bell, CalendarPlus, Loader2 } from "lucide-react";
import { PageLayout } from "@/components/page-layout";
import { ClassDetails, TimeCell, roomHref, roomLabel } from "@/components/class-item";
import { Button } from "@/components/ui/button";
import type { ClientEvent } from "@/lib/event-matching";
import { romeDateKey, romeMinutes, normalizeTime, toMinutes } from "@/lib/time";
import {
  NOTIFIED_EVENTS_KEY,
  SAVED_CLASSES_KEY,
  SCHEDULE_SNAPSHOT_KEY,
  safeGetItem,
  safeSetItem,
  useLanguage,
} from "@/lib/settings";
import { fill, formatDateFull, useTranslation } from "@/lib/i18n";
import { formatDuration, formatMinutes } from "@/lib/availability";
import { isLinkableRoomName } from "@/lib/constants";
import { cn } from "@/lib/utils";
import { parseISO } from "date-fns";

interface BundleClass {
  id: string;
  title: string;
}

interface RoomChange {
  date: string;
  start: string;
  className: string;
  from: string;
  to: string;
}

const eventIdentity = (event: ClientEvent) =>
  `${event.date}|${event.start}|${event.end}|${event.code}|${event.class}`;

const DAYS_AHEAD = 7;

const notifiedIds = (): string[] => {
  try {
    const saved = JSON.parse(safeGetItem(NOTIFIED_EVENTS_KEY) || "[]");
    return Array.isArray(saved)
      ? saved.filter((id): id is string => typeof id === "string")
      : [];
  } catch {
    return [];
  }
};

export default function ScheduleView() {
  const [language, setLanguage] = useLanguage();
  const [classes, setClasses] = useState<BundleClass[]>([]);
  const [events, setEvents] = useState<ClientEvent[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  const [roomChanges, setRoomChanges] = useState<RoomChange[]>([]);
  const [canNotify, setCanNotify] = useState(false);
  const [notifyOn, setNotifyOn] = useState(false);
  const t = useTranslation(language);
  // "Next", gaps and past classes are relative to now; refresh once a minute.
  const [, setMinuteTick] = useState(0);
  useEffect(() => {
    const id = window.setInterval(() => setMinuteTick((tick) => tick + 1), 60_000);
    return () => window.clearInterval(id);
  }, []);

  useEffect(() => {
    setCanNotify("Notification" in window);
    try {
      const saved = JSON.parse(safeGetItem(SAVED_CLASSES_KEY) || "[]");
      if (Array.isArray(saved)) setClasses(saved);
    } catch {
      // Corrupt bundle: treat as empty.
    }
  }, []);

  useEffect(() => {
    if (classes.length === 0) {
      setLoading(false);
      return;
    }
    const controller = new AbortController();
    const from = new Date();
    const to = new Date(Date.now() + DAYS_AHEAD * 86_400_000);
    const fromKey = romeDateKey(from);
    const toKey = romeDateKey(to);

    (async () => {
      setLoading(true);
      setError(false);
      const results = await Promise.allSettled(
        classes.map(async (item) => {
          const response = await fetch(
            `/api/events?class=${encodeURIComponent(item.id)}&from=${fromKey}&to=${toKey}`,
            { signal: controller.signal }
          );
          if (!response.ok) throw new Error("events request failed");
          return (await response.json()).events as ClientEvent[];
        })
      );
      const merged: ClientEvent[] = [];
      let failed = false;
      for (const result of results) {
        if (result.status === "fulfilled") merged.push(...result.value);
        else if (result.reason?.name !== "AbortError") failed = true;
      }
      if (controller.signal.aborted) return;
      merged.sort(
        (a, b) => a.date.localeCompare(b.date) || a.start.localeCompare(b.start)
      );

      // Room-change detection: diff the bundle's future events against the
      // last-seen snapshot (identity excludes room, as in the ICS UID).
      const todayKey = romeDateKey(new Date());
      const snapshot: Record<string, string> = {};
      for (const event of merged) {
        if (event.date >= todayKey) snapshot[eventIdentity(event)] = event.room_raw;
      }
      let previous: Record<string, string> = {};
      try {
        previous = JSON.parse(safeGetItem(SCHEDULE_SNAPSHOT_KEY) || "{}");
      } catch {
        // Corrupt snapshot: treat as first visit.
      }
      const changes: RoomChange[] = [];
      for (const event of merged) {
        if (event.date < todayKey) continue;
        const before = previous[eventIdentity(event)];
        if (before && before !== event.room_raw) {
          changes.push({
            date: event.date,
            start: event.start,
            className: event.class,
            from: before,
            to: event.room_raw,
          });
        }
      }
      // A partial fetch must not overwrite the snapshot: wiped rooms cause
      // missed room-change diffs and false diffs on later visits.
      if (!failed) {
        safeSetItem(SCHEDULE_SNAPSHOT_KEY, JSON.stringify(snapshot));
      }
      setRoomChanges(changes);

      setEvents(merged);
      setError(failed);
      setLoading(false);
    })();

    return () => controller.abort();
  }, [classes]);

  // All of the next DAYS_AHEAD days, including those without classes.
  const days = useMemo(() => {
    const byDate = new Map<string, ClientEvent[]>();
    for (const event of events) {
      const list = byDate.get(event.date) ?? [];
      list.push(event);
      byDate.set(event.date, list);
    }
    const today = romeDateKey();
    return Array.from({ length: DAYS_AHEAD }, (_, offset) => {
      const date = new Date(`${today}T12:00:00Z`);
      date.setUTCDate(date.getUTCDate() + offset);
      const key = date.toISOString().slice(0, 10);
      return { key, date: parseISO(key), isToday: offset === 0, events: byDate.get(key) ?? [] };
    });
  }, [events]);

  const enableReminders = async () => {
    const permission = await Notification.requestPermission();
    setNotifyOn(permission === "granted");
  };

  useEffect(() => {
    if (!notifyOn) return;
    const check = () => {
      const now = new Date();
      const todayKey = romeDateKey(now);
      const nowMinutes = romeMinutes(now);
      const notified = notifiedIds().filter((id) => id.slice(0, 10) >= todayKey);
      for (const event of events) {
        if (event.date !== todayKey) continue;
        const start = normalizeTime(event.start);
        if (!start) continue;
        const diff = toMinutes(start) - nowMinutes;
        if (diff <= 0 || diff > 15) continue;
        const id = `${event.date}|${event.start}|${event.class}`;
        if (notified.includes(id)) continue;
        notified.push(id);
        safeSetItem(NOTIFIED_EVENTS_KEY, JSON.stringify(notified));
        new Notification(t.reminderTitle, {
          body: `${event.class} · ${event.start} · ${event.room_raw}`,
        });
      }
    };
    check();
    const id = window.setInterval(check, 60_000);
    return () => window.clearInterval(id);
  }, [notifyOn, events, t]);

  const now = romeMinutes();
  const changedIds = new Set(
    roomChanges.map((change) => `${change.date}|${change.start}|${change.className}`)
  );
  const minutesOf = (time: string) => {
    const normalized = normalizeTime(time);
    return normalized ? toMinutes(normalized) : 0;
  };

  return (
    <PageLayout language={language} onLanguageChange={setLanguage}>
      <div className="mx-auto w-full max-w-[960px] px-3 py-5 sm:px-6">
        <div className="mb-3.5 flex flex-wrap items-end justify-between gap-x-4 gap-y-2.5">
          <div>
            <h1 className="text-2xl font-extrabold tracking-tight">{t.myScheduleTitle}</h1>
            <p className="text-muted-foreground">{t.myScheduleDescription}</p>
          </div>
          {classes.length > 0 && (
            <div className="flex flex-wrap gap-2">
              {canNotify && (
                <button
                  type="button"
                  aria-pressed={notifyOn}
                  onClick={notifyOn ? () => setNotifyOn(false) : enableReminders}
                  className={cn(
                    "inline-flex min-h-[38px] items-center gap-1.5 rounded-[10px] border px-3 text-sm font-semibold",
                    notifyOn
                      ? "border-free-bar-muted bg-free-soft text-free-soft-foreground"
                      : "border-input bg-card hover:bg-muted"
                  )}
                >
                  <Bell className="h-4 w-4" aria-hidden="true" />
                  {notifyOn ? t.remindersOn : t.enableReminders}
                </button>
              )}
              <Link
                href="/calendar"
                className="inline-flex min-h-[38px] items-center rounded-[10px] border border-input bg-card px-3 text-sm font-semibold hover:bg-muted"
              >
                {t.editClasses}
              </Link>
            </div>
          )}
        </div>

        {classes.length === 0 ? (
          <div className="rounded-2xl border bg-card py-16 text-center">
            <p className="mb-4 text-muted-foreground">{t.myScheduleEmpty}</p>
            <Button asChild>
              <Link href="/calendar">
                <CalendarPlus className="h-4 w-4" />
                {t.openClassCalendar}
              </Link>
            </Button>
          </div>
        ) : loading ? (
          <div role="status" className="flex items-center justify-center gap-2 py-16 text-muted-foreground">
            <Loader2 className="h-5 w-5 animate-spin" />
            {t.loading}
          </div>
        ) : (
          <div className="flex flex-col gap-3.5">
            {error && (
              <p role="alert" className="rounded-xl border border-destructive/20 bg-destructive/10 p-3 text-sm text-destructive">
                {t.loadEventsError}
              </p>
            )}
            {roomChanges.length > 0 && (
              <div role="status" className="flex items-start gap-2.5 rounded-xl border border-notice-border bg-notice px-3.5 py-2.5 text-notice-foreground">
                <span
                  aria-hidden="true"
                  className="flex h-6 w-6 shrink-0 items-center justify-center rounded-[7px] border-[1.5px] border-warn-border bg-warn font-extrabold text-warn-foreground"
                >
                  !
                </span>
                <div>
                  <p className="font-semibold">{t.roomChangeBanner}</p>
                  <ul className="text-sm">
                    {roomChanges.map((change, index) => (
                      <li key={index}>
                        {formatDateFull(parseISO(change.date), language)} {change.start} —{" "}
                        <strong>{change.className}</strong>: {change.from} → {change.to}
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
            )}
            {events.length === 0 && (
              <p role="status" className="py-2 text-center text-muted-foreground">
                {t.noEventsNextDays}
              </p>
            )}
            {days.map((day) => {
              const sorted = [...day.events].sort((a, b) => minutesOf(a.start) - minutesOf(b.start));
              const nextIndex = day.isToday ? sorted.findIndex((event) => minutesOf(event.start) > now) : -1;
              return (
                <section
                  key={day.key}
                  aria-label={formatDateFull(day.date, language)}
                  className="overflow-hidden rounded-2xl border bg-card"
                >
                  <div
                    className={cn(
                      "flex items-baseline justify-between border-b px-4 py-2.5",
                      day.isToday ? "bg-free-tint" : "bg-muted/50"
                    )}
                  >
                    <h2 className="text-[15px] font-extrabold capitalize">
                      {day.isToday ? `${t.today}, ` : ""}
                      {formatDateFull(day.date, language)}
                    </h2>
                    {sorted.length > 0 && (
                      <span className="text-[13px] text-muted-foreground">
                        {sorted.length} {sorted.length === 1 ? t.classSingular : t.classPlural}
                      </span>
                    )}
                  </div>
                  {sorted.length === 0 && (
                    <p className="px-4 py-3 text-muted-foreground">{t.noClasses}</p>
                  )}
                  {sorted.map((event, index) => {
                    const start = minutesOf(event.start);
                    const end = minutesOf(event.end);
                    const past = day.isToday && end <= now;
                    const previous = sorted[index - 1];
                    const gapStart = previous ? minutesOf(previous.end) : null;
                    const showGap =
                      day.isToday && gapStart !== null && start - gapStart >= 30 && start > now;
                    const inGap = showGap && gapStart !== null && gapStart <= now;
                    const room = event.rooms.find((candidate) => isLinkableRoomName(candidate.roomName));
                    const moved = changedIds.has(`${event.date}|${event.start}|${event.class}`);
                    return (
                      <div key={`${event.date}-${event.start}-${event.class}-${index}`}>
                        {showGap && gapStart !== null && (
                          <Link
                            href="/"
                            className="flex min-h-10 items-center justify-between gap-2.5 border-b bg-free-tint px-4 text-[13px] text-free-soft-foreground"
                          >
                            <span>
                              <strong>
                                {inGap
                                  ? fill(t.youreFreeUntil, { time: formatMinutes(start) })
                                  : fill(t.gapDuration, { d: formatDuration(start - gapStart) })}
                              </strong>{" "}
                              · {t.findARoom}
                            </span>
                            <ArrowRight className="h-3.5 w-3.5" aria-hidden="true" />
                          </Link>
                        )}
                        <div
                          className={cn(
                            "grid grid-cols-[52px_minmax(0,1fr)] items-center gap-3 border-b px-4 py-3 sm:grid-cols-[104px_minmax(0,1fr)_auto]",
                            past && "opacity-55"
                          )}
                        >
                          <TimeCell start={event.start} end={event.end} />
                          <ClassDetails
                            event={event}
                            language={language}
                            showTeachers
                            showRooms={!room}
                            badges={
                              moved ? (
                                <span className="rounded-full bg-notice px-2 text-[11px] font-bold text-notice-foreground">
                                  {t.roomChanged}
                                </span>
                              ) : undefined
                            }
                          />
                          {room && (
                            <Link
                              href={roomHref(room.building, room.roomName)}
                              className="col-start-2 inline-flex min-h-[34px] items-center gap-1.5 justify-self-start whitespace-nowrap rounded-[9px] border px-2.5 text-sm font-semibold hover:bg-muted sm:col-start-auto sm:justify-self-end"
                            >
                              {roomLabel(room)}
                              <ArrowRight className="h-3.5 w-3.5" aria-hidden="true" />
                            </Link>
                          )}
                        </div>
                        {index === nextIndex && (
                          <div className="flex min-h-10 items-center border-b bg-free px-4 text-[13px] text-free-foreground">
                            <strong>{fill(t.nextIn, { d: formatDuration(start - now) })}</strong>
                          </div>
                        )}
                      </div>
                    );
                  })}
                </section>
              );
            })}
          </div>
        )}
      </div>
    </PageLayout>
  );
}
