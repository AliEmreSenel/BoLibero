"use client";

import { useState, useEffect, useMemo, useRef } from "react";
import { Loader2 } from "lucide-react";
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
import { getInitialLanguage, loadSettings, saveSettings } from "@/lib/settings";
import { isBuildingOpen } from "@/lib/building-hours";
import { getBuildingDisplayName } from "@/lib/constants";
import { romeDateKey, romeMinutes } from "@/lib/time";

interface TimeSlot {
  start: string;
  end: string;
}

const MAX_RANGE_DAYS = 90;

const getTodayDateValue = () => romeDateKey();

// Computed once at module load; the picker window slides with page loads,
// which is precise enough for a 90-day horizon.
const MAX_DATE_VALUE = romeDateKey(
  new Date(Date.now() + MAX_RANGE_DAYS * 86_400_000)
);

const parseDateValue = (dateValue: string): Date => {
  const [year, month, day] = dateValue.split("-").map(Number);

  if (!year || !month || !day) {
    return new Date();
  }

  return new Date(year, month - 1, day);
};

export default function BSpace() {
  const [scheduleData, setScheduleData] = useState<ScheduleData>({});
  const [isInitialLoading, setIsInitialLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [selectedDate, setSelectedDate] = useState(getTodayDateValue);
  const [selectedBuilding, setSelectedBuilding] = useState<string>("all");
  const [showOnlyAvailable, setShowOnlyAvailable] = useState(false);
  const [showOnlyStudyRooms, setShowOnlyStudyRooms] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [startTime, setStartTime] = useState("");
  const [endTime, setEndTime] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [language, setLanguage] = useState<Language>(getInitialLanguage);
  // Status badges are present-tense; re-render once a minute so "now" stays true.
  const [nowTick, setNowTick] = useState(0);

  const fetcher = ScheduleFetcher.getInstance();
  const hasLoadedOnceRef = useRef(false);
  const t = useTranslation(language);
  const todayDateValue = getTodayDateValue();
  const isSelectedDateToday = selectedDate === todayDateValue;
  const isFutureDate = selectedDate > todayDateValue;
  const isPastDate = selectedDate < todayDateValue;
  // Present-tense availability only describes today; on other dates the card
  // badges would assert a "now" that is already fixed in the past.
  const showAvailabilityFilter = isSelectedDateToday;
  const availabilityFilterLabel = isSelectedDateToday
    ? t.availableNow
    : t.availableAtSelectedTime;
  const availabilityStatusLabel = isSelectedDateToday
    ? t.availableNow
    : t.availableAtThisTime;
  const occupiedLabel = isSelectedDateToday
    ? t.occupiedNow
    : t.occupiedAtThisTime;
  const buildingClosedMessage = isSelectedDateToday
    ? t.buildingClosedToday
    : t.buildingClosedOnSelectedDate;
  const noAvailabilityMessage = isSelectedDateToday
    ? t.noAvailableRooms
    : t.noRoomsAvailableAtThisTime;
  const selectedDateObj = useMemo(
    () => parseDateValue(selectedDate),
    [selectedDate]
  );
  const allBuildingsClosed = useMemo(
    () => {
      const keys = Object.keys(fetcher.getVisibleBuildings());
      return keys.length > 0 && keys.every((key) => !isBuildingOpen(key, selectedDateObj));
    },
    [selectedDateObj]
  );

  // Load settings on mount
  useEffect(() => {
    const loadedSettings = loadSettings();
    setLanguage(loadedSettings.language);
    setShowOnlyStudyRooms(loadedSettings.showOnlyStudyRooms);
  }, []);

  useEffect(() => {
    const id = setInterval(() => setNowTick((tick) => tick + 1), 60_000);
    return () => clearInterval(id);
  }, []);

  useEffect(() => {
    let cancelled = false;
    const isInitialRequest = !hasLoadedOnceRef.current;

    const loadScheduleForSelectedDate = async () => {
      if (!cancelled) {
        setError(null);

        if (isInitialRequest) {
          setIsInitialLoading(true);
        } else {
          // Hide stale cards while the selected-date refresh is in flight.
          setScheduleData({});
          setIsRefreshing(true);
        }
      }

      try {
        const data = await fetcher.fetchScheduleForDate(selectedDateObj);
        if (!cancelled) {
          setScheduleData(data);
          hasLoadedOnceRef.current = true;
        }
      } catch (error) {
        console.error("Error loading selected date schedule:", error);
        if (!cancelled) {
          setError(t.error);
        }
      } finally {
        if (!cancelled) {
          if (isInitialRequest) {
            setIsInitialLoading(false);
          }
          setIsRefreshing(false);
        }
      }
    };

    loadScheduleForSelectedDate();

    return () => {
      cancelled = true;
    };
  }, [fetcher, selectedDateObj]);

  /**
   * Get time slots for a room - if showOnlyStudyRooms is enabled,
   * returns only the official study room time slots
   */
  const getDisplayTimeSlots = (building: string, room: string): TimeSlot[] => {
    if (showOnlyStudyRooms) {
      return fetcher.getStudyRoomTimeSlots(building, room, selectedDateObj);
    }
    return fetcher.getFreeTimeSlots(building, room, selectedDateObj);
  };

  const isRoomCurrentlyFree = (building: string, room: string) => {
    // Check if building is open on selected date
    if (!isBuildingOpen(building, selectedDateObj)) {
      return false;
    }

    const currentMinutes = romeMinutes();

    const todayFree = getDisplayTimeSlots(building, room);

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

    const freeSlots = getDisplayTimeSlots(building, room);
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
        building.toLowerCase().includes(searchQuery.toLowerCase()) ||
        // Students search "Leoni"/"Velodromo", not the internal building keys.
        getBuildingDisplayName(building)
          .toLowerCase()
          .includes(searchQuery.toLowerCase());
      const availabilityMatch =
        !showAvailabilityFilter ||
        !showOnlyAvailable ||
        isRoomCurrentlyFree(building, room);
      const timeRangeMatch = isRoomAvailableInTimeRange(building, room);
      // Filter by time slots - only show rooms that have study room time slots when enabled
      const studyRoomMatch =
        !showOnlyStudyRooms ||
        fetcher.getStudyRoomTimeSlots(building, room, selectedDateObj).length >
          0;

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
    showAvailabilityFilter,
    showOnlyStudyRooms,
    startTime,
    endTime,
    selectedDate,
    scheduleData,
    nowTick,
  ]);

  const displayedFilteredCount = isRefreshing ? 0 : filteredRooms.length;

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

  const hasActiveFilters =
    searchQuery !== "" ||
    selectedDate !== todayDateValue ||
    selectedBuilding !== "all" ||
    showOnlyAvailable ||
    showOnlyStudyRooms ||
    startTime !== "" ||
    endTime !== "";

  const handleReset = () => {
    setSearchQuery("");
    setStartTime("");
    setEndTime("");
    setSelectedDate(getTodayDateValue());
    setSelectedBuilding("all");
    setShowOnlyAvailable(false);
    setShowOnlyStudyRooms(false);
    const currentSettings = loadSettings();
    saveSettings({ ...currentSettings, showOnlyStudyRooms: false });
  };

  if (isInitialLoading) {
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
        <PageHeader language={language} selectedDate={selectedDateObj} t={t} />

        {/* Search and Filters */}
        <SearchFilters
          searchQuery={searchQuery}
          setSearchQuery={setSearchQuery}
          selectedDate={selectedDate}
          setSelectedDate={setSelectedDate}
          startTime={startTime}
          setStartTime={setStartTime}
          endTime={endTime}
          setEndTime={setEndTime}
          selectedBuilding={selectedBuilding}
          setSelectedBuilding={setSelectedBuilding}
          showOnlyAvailable={showOnlyAvailable}
          setShowOnlyAvailable={setShowOnlyAvailable}
          showAvailabilityFilter={showAvailabilityFilter}
          availabilityFilterLabel={availabilityFilterLabel}
          showOnlyStudyRooms={showOnlyStudyRooms}
          onStudyRoomsChange={handleStudyRoomsChange}
          visibleBuildings={visibleBuildings}
          filteredCount={displayedFilteredCount}
          minDate={todayDateValue}
          maxDate={MAX_DATE_VALUE}
          onReset={handleReset}
          resetDisabled={!hasActiveFilters}
          t={t}
        />

        {isRefreshing && (
          <div className="mb-6 rounded-lg border border-primary/30 bg-primary/5 p-4 text-primary">
            <div className="flex items-center gap-2 font-medium">
              <Loader2 className="h-4 w-4 animate-spin" />
              <span>{t.loading}</span>
            </div>
          </div>
        )}

        {allBuildingsClosed && (
          <div className="mb-6 rounded-md border border-destructive/30 bg-destructive/5 px-4 py-3 text-sm text-destructive">
            {t.allBuildingsClosed}
          </div>
        )}

        {isFutureDate && (
          <div className="mb-6 rounded-md border border-amber-300/50 bg-amber-50/80 px-4 py-3 text-sm text-amber-900">
            {t.futureDatesNotice}
          </div>
        )}

        {/* Error Display */}
        {error && (
          <div className="mb-6 p-4 rounded-lg bg-destructive/10 border border-destructive/20 text-destructive">
            {error}
          </div>
        )}

        {/* Room Cards Grid */}
        {isRefreshing ? (
          <RoomGridSkeleton count={9} />
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredRooms.map(({ building, room }) => (
              <RoomCard
                key={`${building}-${room}`}
                building={building}
                room={room}
                buildingDisplayName={fetcher.getBuildingDisplayName(building)}
                timeSlots={getDisplayTimeSlots(building, room)}
                isFree={isRoomCurrentlyFree(building, room)}
                isOpen={isBuildingOpen(building, selectedDateObj)}
                availableStatusLabel={availabilityStatusLabel}
                occupiedStatusLabel={occupiedLabel}
                buildingClosedMessage={buildingClosedMessage}
                showStatus={!isPastDate}
                t={t}
              />
            ))}
          </div>
        )}

        {/* No Results */}
        {filteredRooms.length === 0 && !isInitialLoading && !isRefreshing && (
          <div className="text-center py-12">
            <div className="text-muted-foreground text-lg">
              {showOnlyAvailable && showAvailabilityFilter
                ? noAvailabilityMessage
                : t.noRooms}
            </div>
          </div>
        )}
      </div>
      </PageLayout>
    );
  }
