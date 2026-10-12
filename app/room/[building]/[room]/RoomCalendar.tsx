"use client";

import { useState, useEffect } from "react";
import { startOfMonth, endOfMonth, addMonths, subMonths } from "date-fns";
import { useParams } from "next/navigation";
import { getBuildingDisplayName } from "@/lib/constants";
import { BuildingHours } from "@/components/building-hours";
import type { ClientEvent } from "@/lib/event-matching";
import { PageLayout } from "@/components/page-layout";
import { DetailHeader } from "@/components/detail-header";
import { CalendarView } from "@/components/calendar-view";
import { type Language, useTranslation } from "@/lib/i18n";
import { getInitialLanguage, loadSettings, saveSettings } from "@/lib/settings";

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

  const [roomEvents, setRoomEvents] = useState<ClientEvent[]>([]);
  const [selectedDate, setSelectedDate] = useState<Date>(new Date());
  const [currentMonth, setCurrentMonth] = useState<Date>(new Date());
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);
  const [language, setLanguage] = useState<Language>(getInitialLanguage);

  const t = useTranslation(language);

  useEffect(() => {
    const loadedSettings = loadSettings();
    setLanguage(loadedSettings.language);
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
      setLastUpdated(new Date());
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
  }, [currentMonth, building, room]);

  const handleMonthChange = (direction: "prev" | "next") => {
    const newMonth =
      direction === "next"
        ? addMonths(currentMonth, 1)
        : subMonths(currentMonth, 1);
    setCurrentMonth(newMonth);
  };

  const handleRefresh = () => {
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
          title={room}
          subtitle={getBuildingDisplayName(building)}
          description={t.viewAvailability}
          eventCount={roomEvents.length}
          lastUpdated={lastUpdated}
          loading={loading}
          language={language}
          t={t}
          onRefresh={handleRefresh}
        />

        <div className="mb-6">
          <BuildingHours
            buildingKey={building}
            buildingName={getBuildingDisplayName(building)}
            date={selectedDate}
            language={language}
            compact
          />
        </div>

        {error && (
          <div className="mb-6 p-4 rounded-lg bg-destructive/10 border border-destructive/20 text-destructive">
            {error}
          </div>
        )}

        <CalendarView
          events={roomEvents}
          selectedDate={selectedDate}
          onSelectDate={setSelectedDate}
          currentMonth={currentMonth}
          onMonthChange={setCurrentMonth}
          onPrevMonth={() => handleMonthChange("prev")}
          onNextMonth={() => handleMonthChange("next")}
          loading={loading}
          language={language}
          t={t}
          showRoomInEvents={false}
          showTeachersInEvents={true}
          emptyStateMessage={t.roomFreeAllDay}
          failed={Boolean(error)}
        />
      </div>
    </PageLayout>
  );
}
