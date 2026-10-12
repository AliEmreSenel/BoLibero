"use client";

import { useEffect, useRef } from "react";
import { parseISO, isSameDay } from "date-fns";
import { format } from "date-fns";
import { it, enUS } from "date-fns/locale";
import { Calendar } from "@/components/ui/calendar";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { EventCard } from "@/components/event-card";
import type { ScheduleEvent } from "@/lib/schedule-fetcher";
import type { Language, Translations } from "@/lib/i18n";
import { formatDateFull } from "@/lib/i18n";

interface CalendarViewProps {
  events: ScheduleEvent[];
  selectedDate: Date;
  onSelectDate: (date: Date) => void;
  currentMonth: Date;
  onMonthChange: (month: Date) => void;
  onPrevMonth: () => void;
  onNextMonth: () => void;
  loading: boolean;
  language: Language;
  t: Translations;
  showRoomInEvents?: boolean;
  showTeachersInEvents?: boolean;
  emptyStateMessage?: string;
}

export function CalendarView({
  events,
  selectedDate,
  onSelectDate,
  currentMonth,
  onMonthChange,
  onPrevMonth,
  onNextMonth,
  loading,
  language,
  t,
  showRoomInEvents = true,
  showTeachersInEvents = true,
  emptyStateMessage,
}: CalendarViewProps) {
  const locale = language === "it" ? it : enUS;
  const eventsRef = useRef<HTMLDivElement>(null);

  // On phones the event list sits below the calendar; after picking a day,
  // bring the list into view so the selection visibly does something.
  useEffect(() => {
    if (typeof window !== "undefined" && window.innerWidth < 1024) {
      eventsRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
    }
  }, [selectedDate]);

  const getEventsForDate = (date: Date) => {
    return events
      .filter((event) => {
        const eventDate = parseISO(event.date);
        return isSameDay(eventDate, date);
      })
      .sort((a, b) => a.start.localeCompare(b.start));
  };

  const getDatesWithEvents = () => {
    return events.map((event) => parseISO(event.date));
  };

  const eventsForSelectedDate = getEventsForDate(selectedDate);
  const datesWithEvents = getDatesWithEvents();

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
      {/* Calendar */}
      <div className="lg:col-span-1">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center justify-between">
              <span>{t.calendar}</span>
              <div className="flex items-center gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    const today = new Date();
                    onSelectDate(today);
                    onMonthChange(today);
                  }}
                  disabled={loading}
                >
                  {t.today}
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={onPrevMonth}
                  disabled={loading}
                  aria-label={t.prevMonth}
                >
                  ←
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={onNextMonth}
                  disabled={loading}
                  aria-label={t.nextMonth}
                >
                  →
                </Button>
              </div>
            </CardTitle>
            <CardDescription>
              {format(currentMonth, "MMMM yyyy", { locale })}
              <br />
              {t.selectDateToView}
            </CardDescription>
          </CardHeader>
          <CardContent className="flex justify-center">
            <Calendar
              mode="single"
              selected={selectedDate}
              onSelect={(date) => date && onSelectDate(date)}
              month={currentMonth}
              onMonthChange={onMonthChange}
              hideNavigation
              classNames={{
                day: "size-11",
                day_selected:
                  "bg-primary text-primary-foreground ring-2 ring-ring hover:bg-primary hover:text-primary-foreground",
              }}
              modifiers={{
                hasEvents: datesWithEvents,
              }}
              modifiersStyles={{
                hasEvents: {
                  backgroundColor: "hsl(var(--primary))",
                  color: "hsl(var(--primary-foreground))",
                  fontWeight: "bold",
                },
              }}
              locale={locale}
              className="rounded-md border w-fit"
              disabled={loading}
            />
          </CardContent>
        </Card>
      </div>

      {/* Events for selected date */}
      <div className="lg:col-span-2" ref={eventsRef}>
        <Card>
          <CardHeader>
            <CardTitle>
              {t.eventsFor} {formatDateFull(selectedDate, language)}
            </CardTitle>
            <CardDescription>
              {loading
                ? t.loadingEvents
                : eventsForSelectedDate.length === 0
                  ? t.noEventsScheduled
                  : `${eventsForSelectedDate.length} ${
                      eventsForSelectedDate.length === 1
                        ? t.eventScheduled
                        : t.eventsScheduled
                    }`}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {loading ? (
                <div className="text-center py-8">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
                  <p className="mt-2 text-muted-foreground">{t.loadingEvents}</p>
                </div>
              ) : eventsForSelectedDate.length > 0 ? (
                eventsForSelectedDate.map((event, index) => (
                  <EventCard
                    key={index}
                    event={event}
                    showRoom={showRoomInEvents}
                    showTeachers={showTeachersInEvents}
                    language={language}
                  />
                ))
              ) : (
                <div className="text-center py-8">
                  <div className="h-12 w-12 mx-auto mb-4 opacity-50 text-muted-foreground">
                    📅
                  </div>
                  <p className="text-muted-foreground">{t.noEventsScheduled}</p>
                  <p className="text-sm text-muted-foreground">
                    {emptyStateMessage || t.roomFreeAllDay}
                  </p>
                  <p className="text-xs text-muted-foreground mt-4">
                    {t.scheduleUpdatedRegularly}
                  </p>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
