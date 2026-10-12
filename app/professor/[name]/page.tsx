"use client";

import { useState, useEffect } from "react";
import { startOfMonth, endOfMonth, addMonths, subMonths } from "date-fns";
import { useParams } from "next/navigation";
import { ScheduleFetcher } from "@/lib/schedule-fetcher";
import type { ScheduleEvent } from "@/lib/schedule-fetcher";
import { PageLayout } from "@/components/page-layout";
import { DetailHeader } from "@/components/detail-header";
import { CalendarView } from "@/components/calendar-view";
import { type Language, useTranslation } from "@/lib/i18n";
import { loadSettings, saveSettings } from "@/lib/settings";

export default function ProfessorCalendar() {
  const params = useParams();
  const rawName = Array.isArray(params.name) ? params.name[0] : (params.name as string);
  let name = rawName;
  try {
    name = decodeURIComponent(rawName);
  } catch {
    // keep the raw segment if it is not valid percent-encoding
  }

  const [profEvents, setProfEvents] = useState<ScheduleEvent[]>([]);
  const [selectedDate, setSelectedDate] = useState<Date>(new Date());
  const [currentMonth, setCurrentMonth] = useState<Date>(new Date());
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);
  const [language, setLanguage] = useState<Language>("en");

  const fetcher = ScheduleFetcher.getInstance();
  const t = useTranslation(language);

  useEffect(() => {
    const loadedSettings = loadSettings();
    setLanguage(loadedSettings.language);
  }, []);

  const loadMonthSchedule = async (month: Date) => {
    setLoading(true);
    setError(null);
    try {
      const startDate = startOfMonth(month);
      const endDate = endOfMonth(month);
      const events = await fetcher.fetchProfSchedule(name, startDate, endDate);
      setProfEvents(events);
      setLastUpdated(new Date());
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
  }, [currentMonth, name]);

  const handleMonthChange = (direction: "prev" | "next") => {
    const newMonth =
      direction === "next"
        ? addMonths(currentMonth, 1)
        : subMonths(currentMonth, 1);
    setCurrentMonth(newMonth);
  };

  const handleRefresh = () => {
    fetcher.clearCache();
    loadMonthSchedule(currentMonth);
  };

  const handleLanguageChange = (newLanguage: Language) => {
    setLanguage(newLanguage);
    const currentSettings = loadSettings();
    saveSettings({ ...currentSettings, language: newLanguage });
  };

  return (
    <PageLayout language={language} onLanguageChange={handleLanguageChange}>
      <div className="container mx-auto p-6 max-w-7xl">
        <DetailHeader
          title={name}
          description={t.viewAvailability}
          eventCount={profEvents.length}
          lastUpdated={lastUpdated}
          loading={loading}
          language={language}
          t={t}
          onRefresh={handleRefresh}
        />

        {error && (
          <div className="mb-6 p-4 rounded-lg bg-destructive/10 border border-destructive/20 text-destructive">
            {error}
          </div>
        )}

        <CalendarView
          events={profEvents}
          selectedDate={selectedDate}
          onSelectDate={setSelectedDate}
          currentMonth={currentMonth}
          onMonthChange={setCurrentMonth}
          onPrevMonth={() => handleMonthChange("prev")}
          onNextMonth={() => handleMonthChange("next")}
          loading={loading}
          language={language}
          t={t}
          showRoomInEvents={true}
          showTeachersInEvents={false}
          emptyStateMessage={t.profNoClassToday}
          failed={Boolean(error)}
        />
      </div>
    </PageLayout>
  );
}
