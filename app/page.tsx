"use client";

import { useState, useEffect, useMemo } from "react";
import { format } from "date-fns";
import { ScheduleFetcher } from "@/lib/schedule-fetcher";
import type { ScheduleData } from "@/lib/schedule-fetcher";
import { PageLayout } from "@/components/page-layout";
import { PageHeader } from "@/components/page-header";
import { SearchFilters } from "@/components/search-filters";
import { RoomCard } from "@/components/room-card";
import {
  PageHeaderSkeleton,
  SearchFiltersSkeleton,
  RoomGridSkeleton,
} from "@/components/skeletons";
import { type Language, useTranslation } from "@/lib/i18n";
import { loadSettings, saveSettings } from "@/lib/settings";
import { isBuildingOpen } from "@/lib/building-hours";

interface TimeSlot {
  start: string;
  end: string;
}

export default function BSpace() {
  const [scheduleData, setScheduleData] = useState<ScheduleData>({});
  const [loading, setLoading] = useState(true);
  const [selectedBuilding, setSelectedBuilding] = useState<string>("all");
  const [showOnlyAvailable, setShowOnlyAvailable] = useState(false);
  const [showOnlyStudyRooms, setShowOnlyStudyRooms] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [startTime, setStartTime] = useState("");
  const [endTime, setEndTime] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [language, setLanguage] = useState<Language>("en");

  const fetcher = ScheduleFetcher.getInstance();
  const t = useTranslation(language);

  // Load settings on mount
  useEffect(() => {
    const loadedSettings = loadSettings();
    setLanguage(loadedSettings.language);
    setShowOnlyStudyRooms(loadedSettings.showOnlyStudyRooms);
  }, []);

  const loadTodaySchedule = async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await fetcher.fetchTodaySchedule();
      setScheduleData(data);
    } catch (error) {
      console.error("Error loading today schedule:", error);
      setError(t.error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadTodaySchedule();
  }, []);

  const getCurrentTime = () => {
    const now = new Date();
    return format(now, "HH:mm");
  };

  /**
   * Get time slots for a room - if showOnlyStudyRooms is enabled,
   * returns only the official study room time slots
   */
  const getDisplayTimeSlots = (building: string, room: string): TimeSlot[] => {
    if (showOnlyStudyRooms) {
      return fetcher.getStudyRoomTimeSlots(building, room, new Date());
    }
    return fetcher.getFreeTimeSlots(building, room, new Date());
  };

  const getFreeTimeSlots = (building: string, room: string): TimeSlot[] => {
    return fetcher.getFreeTimeSlots(building, room, new Date());
  };

  const isRoomCurrentlyFree = (building: string, room: string) => {
    const today = new Date();

    // Check if building is open today
    if (!isBuildingOpen(building, today)) {
      return false;
    }

    const currentTime = getCurrentTime();
    const [currentHour, currentMin] = currentTime.split(":").map(Number);
    const currentMinutes = currentHour * 60 + currentMin;

    const todayFree = getFreeTimeSlots(building, room);

    return todayFree.some((event) => {
      const [startHour, startMin] = event.start.split(":").map(Number);
      const [endHour, endMin] = event.end.split(":").map(Number);
      const startMinutes = startHour * 60 + startMin;
      const endMinutes = endHour * 60 + endMin;

      // 5-minute tolerance: room is considered occupied 5 minutes before class starts
      return currentMinutes >= startMinutes && currentMinutes <= endMinutes;
    });
  };

  // Filter rooms based on time range
  const isRoomAvailableInTimeRange = (
    building: string,
    room: string
  ): boolean => {
    if (!startTime && !endTime) return true;

    const freeSlots = getFreeTimeSlots(building, room);
    const searchStart = startTime;
    const searchEnd = endTime;

    return freeSlots.some((slot) => {
      return (
        (!searchStart ||
          (slot.start <= searchStart && slot.end >= searchStart)) &&
        (!searchEnd || (slot.start <= searchEnd && slot.end >= searchEnd))
      );
    });
  };

  const visibleBuildings = fetcher.getVisibleBuildings();
  const allRooms = Object.entries(scheduleData).flatMap(([building, rooms]) =>
    Object.keys(rooms).map((room) => ({ building, room }))
  );

  const filteredRooms = useMemo(() => {
    return allRooms.filter(({ building, room }) => {
      const buildingMatch =
        selectedBuilding === "all" || building === selectedBuilding;
      const searchMatch =
        !searchQuery ||
        room.toLowerCase().includes(searchQuery.toLowerCase()) ||
        building.toLowerCase().includes(searchQuery.toLowerCase());
      const availabilityMatch =
        !showOnlyAvailable || isRoomCurrentlyFree(building, room);
      const timeRangeMatch = isRoomAvailableInTimeRange(building, room);
      // Filter by time slots - only show rooms that have study room time slots when enabled
      const studyRoomMatch =
        !showOnlyStudyRooms ||
        fetcher.getStudyRoomTimeSlots(building, room, new Date()).length > 0;

      return (
        buildingMatch &&
        searchMatch &&
        availabilityMatch &&
        timeRangeMatch &&
        studyRoomMatch
      );
    });
  }, [
    allRooms,
    selectedBuilding,
    searchQuery,
    showOnlyAvailable,
    showOnlyStudyRooms,
    startTime,
    endTime,
    scheduleData,
  ]);

  const handleLanguageChange = (newLanguage: Language) => {
    setLanguage(newLanguage);
    const currentSettings = loadSettings();
    saveSettings({ ...currentSettings, language: newLanguage });
  };

  const handleStudyRoomsChange = async (enabled: boolean) => {
    setShowOnlyStudyRooms(enabled);
    const currentSettings = loadSettings();
    saveSettings({ ...currentSettings, showOnlyStudyRooms: enabled });

    // Fetch study room data if enabling the filter
    if (enabled) {
      await fetcher.fetchStudyRooms();
    }
  };

  const handleReset = () => {
    setSearchQuery("");
    setStartTime("");
    setEndTime("");
    setSelectedBuilding("all");
    setShowOnlyAvailable(false);
  };

  if (loading) {
    return (
      <PageLayout language={language} onLanguageChange={handleLanguageChange}>
        <div className="container mx-auto p-6 max-w-7xl">
          <PageHeaderSkeleton />
          <SearchFiltersSkeleton />
          <RoomGridSkeleton count={9} />
        </div>
      </PageLayout>
    );
  }

  return (
    <PageLayout language={language} onLanguageChange={handleLanguageChange}>
      <div className="container mx-auto p-6 max-w-7xl">
        {/* Page Header */}
        <PageHeader language={language} t={t} />

        {/* Search and Filters */}
        <SearchFilters
          searchQuery={searchQuery}
          setSearchQuery={setSearchQuery}
          startTime={startTime}
          setStartTime={setStartTime}
            endTime={endTime}
            setEndTime={setEndTime}
            selectedBuilding={selectedBuilding}
            setSelectedBuilding={setSelectedBuilding}
            showOnlyAvailable={showOnlyAvailable}
            setShowOnlyAvailable={setShowOnlyAvailable}
            showOnlyStudyRooms={showOnlyStudyRooms}
            onStudyRoomsChange={handleStudyRoomsChange}
            visibleBuildings={visibleBuildings}
            filteredCount={filteredRooms.length}
            onReset={handleReset}
            t={t}
          />

          {/* Error Display */}
          {error && (
            <div className="mb-6 p-4 rounded-lg bg-destructive/10 border border-destructive/20 text-destructive">
              {error}
            </div>
          )}

          {/* Room Cards Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredRooms.map(({ building, room }) => (
              <RoomCard
                key={`${building}-${room}`}
                building={building}
                room={room}
                buildingDisplayName={fetcher.getBuildingDisplayName(building)}
                timeSlots={getDisplayTimeSlots(building, room)}
                isFree={isRoomCurrentlyFree(building, room)}
                isOpen={isBuildingOpen(building, new Date())}
                t={t}
              />
            ))}
          </div>

          {/* No Results */}
          {filteredRooms.length === 0 && !loading && (
            <div className="text-center py-12">
              <div className="text-muted-foreground text-lg">
                {showOnlyAvailable ? t.noAvailableRooms : t.noRooms}
              </div>
            </div>
          )}
        </div>
      </PageLayout>
    );
  }
