"use client";

import { useState, useEffect, useMemo, useRef } from "react";
import { Loader2 } from "lucide-react";
import { ScheduleFetcher } from "@/lib/schedule-fetcher";
import type { ScheduleData } from "@/lib/schedule-fetcher";
import { PageLayout } from "@/components/page-layout";
import { PageHeader } from "@/components/page-header";
import { SearchFilters } from "@/components/search-filters";
import { RoomCard } from "@/components/room-card";
import { Button } from "@/components/ui/button";
import {
  PageHeaderSkeleton,
  SearchFiltersSkeleton,
  RoomGridSkeleton,
} from "@/components/skeletons";
import { type Language, useTranslation } from "@/lib/i18n";
import {
  FAVORITE_ROOMS_KEY,
  getInitialLanguage,
  loadSettings,
  saveSettings,
} from "@/lib/settings";
import {
  isBuildingOpen,
  getBuildingOpeningTime,
  getBuildingClosingTime,
} from "@/lib/building-hours";
import { getBuildingDisplayName } from "@/lib/constants";
import { romeDateKey, romeMinutes, toMinutes } from "@/lib/time";

interface TimeSlot {
  start: string;
  end: string;
}

const MAX_RANGE_DAYS = 90;

// "Available now" must be usable: a room counts as free only while it stays
// free for at least this many more minutes.
const MIN_FREE_NOW_MINUTES = 15;

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
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);
  const [isInitialLoading, setIsInitialLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [selectedDate, setSelectedDate] = useState(getTodayDateValue);
  const [selectedBuilding, setSelectedBuilding] = useState<string>("all");
  // Availability-first is the home-grid default: students open the app to
  // find a room now. "All rooms" (and Reset) opt out for the session.
  const [showOnlyAvailable, setShowOnlyAvailable] = useState(true);
  const [showOnlyStudyRooms, setShowOnlyStudyRooms] = useState(false);
  const [showOnlyFavorites, setShowOnlyFavorites] = useState(false);
  const [showOnly2h, setShowOnly2h] = useState(false);
  const [favorites, setFavorites] = useState<string[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [startTime, setStartTime] = useState("");
  const [endTime, setEndTime] = useState("");
  const [error, setError] = useState(false);
  const [language, setLanguage] = useState<Language>(getInitialLanguage);
  // Status badges are present-tense; re-render once a minute so "now" stays true.
  const [nowTick, setNowTick] = useState(0);
  const [reloadKey, setReloadKey] = useState(0);

  const fetcher = ScheduleFetcher.getInstance();
  const hasLoadedOnceRef = useRef(false);
  const t = useTranslation(language);
  const todayDateValue = getTodayDateValue();
  const isSelectedDateToday = selectedDate === todayDateValue;
  const isFutureDate = selectedDate > todayDateValue;
  const isPastDate = selectedDate < todayDateValue;
  // Present-tense availability only describes today; on other dates the button
  // stays visible-disabled with an explanation.
  const showAvailabilityFilter = !isPastDate;
  const availabilityActive = showOnlyAvailable && isSelectedDateToday;
  const availabilityFilterLabel = t.availableNow;
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
    try {
      const saved = JSON.parse(
        window.localStorage.getItem(FAVORITE_ROOMS_KEY) || "[]"
      );
      if (Array.isArray(saved)) setFavorites(saved);
    } catch {
      // Corrupt favorites list: start clean.
    }
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
        setError(false);

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
          setLastUpdated(new Date());
          hasLoadedOnceRef.current = true;
        }
      } catch (error) {
        console.error("Error loading selected date schedule:", error);
        if (!cancelled) {
          setError(true);
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
  }, [fetcher, selectedDateObj, reloadKey]);

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

  // A room free for the whole opening window is far more likely an unbooked,
  // locked room than a lucky find, so the card warns. Official study rooms
  // are open all day on purpose, so they are exempt.
  const isRoomFreeAllDay = (building: string, room: string): boolean => {
    if (!isBuildingOpen(building, selectedDateObj)) return false;
    if (fetcher.isStudyRoom(building, room)) return false;
    const opening = getBuildingOpeningTime(building, selectedDateObj);
    const closing = getBuildingClosingTime(building, selectedDateObj);
    return fetcher
      .getFreeTimeSlots(building, room, selectedDateObj)
      .some((slot) => slot.start <= opening && slot.end >= closing);
  };

  const isRoomCurrentlyFree = (building: string, room: string) => {
    // Check if building is open on selected date
    if (!isBuildingOpen(building, selectedDateObj)) {
      return false;
    }

    const currentMinutes = romeMinutes();

    const todayFree = getDisplayTimeSlots(building, room);

    return todayFree.some((event) => {
      const startMinutes = toMinutes(event.start);
      const endMinutes = toMinutes(event.end);

      return (
        currentMinutes >= startMinutes &&
        currentMinutes + MIN_FREE_NOW_MINUTES <= endMinutes
      );
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

  const favoriteSet = useMemo(() => new Set(favorites), [favorites]);

  const toggleFavorite = (building: string, room: string) => {
    const key = `${building}/${room}`;
    setFavorites((current) => {
      const next = current.includes(key)
        ? current.filter((item) => item !== key)
        : [...current, key];
      try {
        window.localStorage.setItem(FAVORITE_ROOMS_KEY, JSON.stringify(next));
      } catch {
        // Storage full/unavailable: favorites stay for this session.
      }
      return next;
    });
  };

  const filteredRooms = useMemo(() => {
    const filtered = allRooms.filter(({ building, room }) => {
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
        !availabilityActive || isRoomCurrentlyFree(building, room);
      const timeRangeMatch = isRoomAvailableInTimeRange(building, room);
      const favoriteMatch =
        !showOnlyFavorites || favoriteSet.has(`${building}/${room}`);
      const free2hMatch =
        !showOnly2h ||
        getDisplayTimeSlots(building, room).some(
          (slot) => toMinutes(slot.end) - toMinutes(slot.start) >= 120
        );
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
        favoriteMatch &&
        free2hMatch &&
        studyRoomMatch
      );
    });
    // Favorites always sort to the top of the grid.
    return [
      ...filtered.filter(({ building, room }) =>
        favoriteSet.has(`${building}/${room}`)
      ),
      ...filtered.filter(
        ({ building, room }) => !favoriteSet.has(`${building}/${room}`)
      ),
    ];
  }, [
    allRooms,
    selectedBuilding,
    searchQuery,
    availabilityActive,
    showOnlyStudyRooms,
    showOnlyFavorites,
    showOnly2h,
    favoriteSet,
    startTime,
    endTime,
    selectedDate,
    scheduleData,
    nowTick,
  ]);

  const displayedFilteredCount = isRefreshing
    ? "—"
    : String(filteredRooms.length);

  // A scrape that returns zero events campus-wide means "no data", not "all
  // rooms free". Rendering the full grid in that case shows every room with a
  // full-day free slot, which sends students to rooms they cannot verify.
  const campusEventCount = Object.values(scheduleData).reduce(
    (sum, rooms) =>
      sum + Object.values(rooms).reduce((s, evs) => s + evs.length, 0),
    0
  );
  const showNoDataState = !error && campusEventCount === 0;

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
    availabilityActive ||
    showOnlyStudyRooms ||
    showOnlyFavorites ||
    showOnly2h ||
    startTime !== "" ||
    endTime !== "";

  const handleReset = () => {
    setSearchQuery("");
    setStartTime("");
    setEndTime("");
    setSelectedDate(getTodayDateValue());
    setSelectedBuilding("all");
    setShowOnlyAvailable(true);
    setShowOnlyStudyRooms(false);
    setShowOnlyFavorites(false);
    setShowOnly2h(false);
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
          availabilityDisabled={!isSelectedDateToday}
          availabilityFilterLabel={availabilityFilterLabel}
          showOnlyStudyRooms={showOnlyStudyRooms}
          onStudyRoomsChange={handleStudyRoomsChange}
          showOnlyFavorites={showOnlyFavorites}
          onFavoritesChange={setShowOnlyFavorites}
          favoriteCount={favorites.length}
          showOnly2h={showOnly2h}
          on2hChange={setShowOnly2h}
          visibleBuildings={visibleBuildings}
          filteredCount={displayedFilteredCount}
          minDate={todayDateValue}
          maxDate={MAX_DATE_VALUE}
          onReset={handleReset}
          resetDisabled={!hasActiveFilters}
          t={t}
        />

        {lastUpdated && (
          <p className="-mt-2 mb-6 text-xs text-muted-foreground">
            {t.dataSourceLine}{" "}
            {lastUpdated.toLocaleTimeString("en-GB", {
              hour: "2-digit",
              minute: "2-digit",
              timeZone: "Europe/Rome",
            })}
          </p>
        )}

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
          <div className="mb-6 rounded-md border border-amber-300/50 bg-amber-50/80 px-4 py-3 text-sm text-amber-900 dark:border-amber-800/60 dark:bg-amber-950/50 dark:text-amber-200">
            {t.futureDatesNotice}
          </div>
        )}

        {/* Error Display */}
        {error && (
          <div className="mb-6 p-4 rounded-lg bg-destructive/10 border border-destructive/20 text-destructive">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <span>{t.error}</span>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setReloadKey((key) => key + 1)}
              >
                {t.refresh}
              </Button>
            </div>
          </div>
        )}

        {/* Room Cards Grid */}
        {isRefreshing ? (
          <RoomGridSkeleton count={9} />
        ) : showNoDataState ? (
          <div className="rounded-lg border border-destructive/20 bg-destructive/10 p-4 text-center text-destructive">
            {t.noDataForDate}
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredRooms.map(({ building, room }) => (
              <RoomCard
                key={`${building}-${room}`}
                building={building}
                room={room}
                buildingDisplayName={fetcher.getBuildingDisplayName(building)}
                timeSlots={getDisplayTimeSlots(building, room)}
                slotsLabel={showOnlyStudyRooms ? t.studySessionsToday : t.freeSlotsToday}
                isFree={isRoomCurrentlyFree(building, room)}
                isFreeAllDay={isRoomFreeAllDay(building, room)}
                isOpen={isBuildingOpen(building, selectedDateObj)}
                openTime={getBuildingOpeningTime(building, selectedDateObj)}
                availableStatusLabel={availabilityStatusLabel}
                occupiedStatusLabel={occupiedLabel}
                buildingClosedMessage={buildingClosedMessage}
                isFavorite={favoriteSet.has(`${building}/${room}`)}
                onToggleFavorite={() => toggleFavorite(building, room)}
                showStatus={!isPastDate}
                t={t}
              />
            ))}
          </div>
        )}

        {/* No Results */}
        {filteredRooms.length === 0 && !error && !isInitialLoading && !isRefreshing && (
          <div className="text-center py-12">
            <div className="text-muted-foreground text-lg">
              {availabilityActive
                ? noAvailabilityMessage
                : t.noRooms}
            </div>
          </div>
        )}
      </div>
      </PageLayout>
    );
  }
