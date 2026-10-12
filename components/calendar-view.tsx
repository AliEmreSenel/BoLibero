"use client";

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
  failed?: boolean;
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
  failed = false,
}: CalendarViewProps) {
  const locale = language === "it" ? it : enUS;

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
                  onClick={onPrevMonth}
                  disabled={loading}
                >
                  ←
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={onNextMonth}
                  disabled={loading}
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
      <div className="lg:col-span-2">
        <Card>
          <CardHeader>
            <CardTitle>
              {t.eventsFor} {format(selectedDate, "EEEE, d MMMM yyyy", { locale })}
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
                  />
                ))
              ) : (
                <div className="text-center py-8">
                  <div className="h-12 w-12 mx-auto mb-4 opacity-50 text-muted-foreground">
                    📅
                  </div>
                  {failed ? (
                    <p className="text-destructive">{t.error}</p>
                  ) : (
                    <>
                      <p className="text-muted-foreground">{t.noEventsScheduled}</p>
                      <p className="text-sm text-muted-foreground">
                        {emptyStateMessage || t.roomFreeAllDay}
                      </p>
                    </>
                  )}
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
