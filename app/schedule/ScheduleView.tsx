"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { CalendarPlus, Loader2 } from "lucide-react";
import { PageLayout } from "@/components/page-layout";
import { EventCard } from "@/components/event-card";
import { Button } from "@/components/ui/button";
import type { ClientEvent } from "@/lib/event-matching";
import { romeDateKey, romeMinutes, normalizeTime, toMinutes } from "@/lib/time";
import { SAVED_CLASSES_KEY, SCHEDULE_SNAPSHOT_KEY, getInitialLanguage, loadSettings, saveSettings } from "@/lib/settings";
import { type Language, formatDateFull, useTranslation } from "@/lib/i18n";
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

export default function ScheduleView() {
  const [language, setLanguage] = useState<Language>(getInitialLanguage);
  const [classes, setClasses] = useState<BundleClass[]>([]);
  const [events, setEvents] = useState<ClientEvent[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  const [roomChanges, setRoomChanges] = useState<RoomChange[]>([]);
  const [canNotify, setCanNotify] = useState(false);
  const [notifyOn, setNotifyOn] = useState(false);
  const t = useTranslation(language);

  useEffect(() => {
    setLanguage(loadSettings().language);
    setCanNotify("Notification" in window);
    try {
      const saved = JSON.parse(
        window.localStorage.getItem(SAVED_CLASSES_KEY) || "[]"
      );
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
        previous = JSON.parse(
          window.localStorage.getItem(SCHEDULE_SNAPSHOT_KEY) || "{}"
        );
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
        try {
          window.localStorage.setItem(
            SCHEDULE_SNAPSHOT_KEY,
            JSON.stringify(snapshot)
          );
        } catch {
          // Storage unavailable: skip change detection this visit.
        }
      }
      setRoomChanges(changes);

      setEvents(merged);
      setError(failed);
      setLoading(false);
    })();

    return () => controller.abort();
  }, [classes]);

  const days = useMemo(() => {
    const byDate = new Map<string, ClientEvent[]>();
    for (const event of events) {
      const list = byDate.get(event.date) ?? [];
      list.push(event);
      byDate.set(event.date, list);
    }
    return [...byDate.entries()]
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([date, dayEvents]) => ({ date: parseISO(date), events: dayEvents }));
  }, [events]);

  const handleLanguageChange = (nextLanguage: Language) => {
    setLanguage(nextLanguage);
    saveSettings({ ...loadSettings(), language: nextLanguage });
  };

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
      for (const event of events) {
        if (event.date !== todayKey) continue;
        const start = normalizeTime(event.start);
        if (!start) continue;
        const diff = toMinutes(start) - nowMinutes;
        if (diff <= 0 || diff > 15) continue;
        const key = `bolibero-notified-${event.date}|${event.start}|${event.class}`;
        if (window.localStorage.getItem(key)) continue;
        window.localStorage.setItem(key, "1");
        new Notification(t.reminderTitle, {
          body: `${event.class} · ${event.start} · ${event.room_raw}`,
        });
      }
    };
    check();
    const id = window.setInterval(check, 60_000);
    return () => window.clearInterval(id);
  }, [notifyOn, events, t]);

  return (
    <PageLayout language={language} onLanguageChange={handleLanguageChange}>
      <div className="container mx-auto max-w-4xl p-6">
        <div className="mb-8">
          <h1 className="mb-2 text-3xl font-bold">{t.myScheduleTitle}</h1>
          <p className="text-lg text-muted-foreground">
            {t.myScheduleDescription}
          </p>
        </div>

        {classes.length > 0 && canNotify && (
          <div className="mb-6">
            {notifyOn ? (
              <p className="text-sm text-muted-foreground">
                {t.remindersEnabled}
              </p>
            ) : (
              <Button variant="outline" onClick={enableReminders}>
                {t.enableReminders}
              </Button>
            )}
          </div>
        )}

        {classes.length === 0 ? (
          <div className="rounded-lg border py-16 text-center">
            <p className="mb-4 text-muted-foreground">{t.myScheduleEmpty}</p>
            <Button asChild>
              <Link href="/calendar">
                <CalendarPlus className="h-4 w-4" />
                {t.openClassCalendar}
              </Link>
            </Button>
          </div>
        ) : loading ? (
          <div className="flex items-center justify-center gap-2 py-16 text-muted-foreground">
            <Loader2 className="h-5 w-5 animate-spin" />
            {t.loading}
          </div>
        ) : (
          <div className="space-y-8">
            {error && (
              <p className="rounded-md border border-destructive/20 bg-destructive/10 p-3 text-sm text-destructive">
                {t.loadEventsError}
              </p>
            )}
            {roomChanges.length > 0 && (
              <div className="rounded-md border border-amber-300/50 bg-amber-50/80 px-4 py-3 text-sm text-amber-900 dark:border-amber-800/60 dark:bg-amber-950/50 dark:text-amber-200">
                <p className="mb-1 font-medium">{t.roomChangeBanner}</p>
                <ul className="list-disc space-y-1 pl-5">
                  {roomChanges.map((change, index) => (
                    <li key={index}>
                      {formatDateFull(parseISO(change.date), language)}{" "}
                      {change.start} — {change.className}: {change.from} →{" "}
                      {change.to}
                    </li>
                  ))}
                </ul>
              </div>
            )}
            {days.length === 0 && (
              <p className="py-8 text-center text-muted-foreground">
                {t.noEventsNextDays}
              </p>
            )}
            {days.map((day) => (
              <section key={day.date.toISOString()}>
                <h2 className="mb-3 text-xl font-semibold">
                  {formatDateFull(day.date, language)}
                </h2>
                <div className="space-y-4">
                  {day.events.map((event, index) => (
                    <EventCard
                      key={`${event.date}-${event.start}-${event.class}-${index}`}
                      event={event}
                      showTeachers={false}
                      language={language}
                    />
                  ))}
                </div>
              </section>
            ))}
          </div>
        )}
      </div>
    </PageLayout>
  );
}
