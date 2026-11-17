"use client";

import { useState, useEffect, useMemo, useRef, useCallback } from "react";
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
import { fill, useTranslation } from "@/lib/i18n";
import {
  FAVORITE_ROOMS_KEY,
  loadSettings,
  safeGetItem,
  safeSetItem,
  saveSettings,
  useLanguage,
} from "@/lib/settings";
import {
  isBuildingOpen,
  getBuildingOpeningTime,
  getBuildingClosingTime,
} from "@/lib/building-hours";
import { getBuildingDisplayName, getVisibleBuildings } from "@/lib/constants";
import { romeDateKey, romeMinutes, toMinutes } from "@/lib/time";
import {
  LONG_FREE_MINUTES,
  buildWindows,
  formatMinutes,
  longestWindow,
  roomStatusAt,
  studyWindowsOnly,
  type RoomStatus,
  type RoomWindow,
} from "@/lib/availability";

interface TimeSlot {
  start: string;
  end: string;
}

const MAX_RANGE_DAYS = 90;

// Range of the "show rooms free at" slider, in minutes since midnight.
const SCRUB_MIN = 8 * 60;
const SCRUB_MAX = 21 * 60;

const getTodayDateValue = () => romeDateKey();

// Computed once at module load; the picker window slides with page loads,
// which is precise enough for a 90-day horizon.
const MAX_DATE_VALUE = romeDateKey(
  new Date(Date.now() + MAX_RANGE_DAYS * 86_400_000)
);

const fetcher = ScheduleFetcher.getInstance();
const VISIBLE_BUILDINGS = getVisibleBuildings();

const parseDateValue = (dateValue: string): Date => {
  const [year, month, day] = dateValue.split("-").map(Number);

  if (!year || !month || !day) {
    return new Date();
  }

  return new Date(year, month - 1, day);
};

const shiftDateValue = (dateValue: string, days: number): string => {
  const date = new Date(`${dateValue}T12:00:00Z`);
  date.setUTCDate(date.getUTCDate() + days);
  return date.toISOString().slice(0, 10);
};

interface RoomView {
  building: string;
  room: string;
  key: string;
  // Free slots as stored (merged, for the start/end time range filter).
  rangeSlots: TimeSlot[];
  windows: RoomWindow[];
  hasStudySession: boolean;
  isFreeAllDay: boolean;
  isOpen: boolean;
  open: number;
  close: number;
  openTime: string;
  status: RoomStatus | null;
}

export default function BSpace() {
  const [scheduleData, setScheduleData] = useState<ScheduleData>({});
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
  // The time the grid shows availability for. null = "now" today, and "no
  // time chosen" on other days.
  const [scrubTime, setScrubTime] = useState<number | null>(null);
  const [scrubOpen, setScrubOpen] = useState(false);
  const [error, setError] = useState(false);
  const [language, setLanguage] = useLanguage();
  // Status badges are present-tense; re-render once a minute so "now" stays true.
  const [nowTick, setNowTick] = useState(0);
  const [reloadKey, setReloadKey] = useState(0);
  const [slotsVersion, setSlotsVersion] = useState(0);

  const hasLoadedOnceRef = useRef(false);
  const t = useTranslation(language);
  const todayDateValue = getTodayDateValue();
  const isSelectedDateToday = selectedDate === todayDateValue;
  const isFutureDate = selectedDate > todayDateValue;
  const isPastDate = selectedDate < todayDateValue;
  const showAvailabilityFilter = !isPastDate;
  // nowTick forces a fresh reading once a minute.
  const nowMinutes = useMemo(() => {
    void nowTick;
    return romeMinutes();
  }, [nowTick]);
  const atTime: number | null = isPastDate
    ? null
    : isSelectedDateToday
      ? (scrubTime ?? nowMinutes)
      : scrubTime;
  const isLiveNow = isSelectedDateToday && scrubTime === null;
  const availabilityActive = showOnlyAvailable && atTime !== null;
  const availabilityFilterLabel =
    atTime === null || isLiveNow
      ? t.availableNow
      : fill(t.availableAt, { time: formatMinutes(atTime) });
  const buildingClosedMessage = isSelectedDateToday
    ? t.buildingClosedToday
    : t.buildingClosedOnSelectedDate;
  const noAvailabilityMessage = isLiveNow
    ? t.noAvailableRooms
    : t.noRoomsAvailableAtThisTime;
  const selectedDateObj = useMemo(
    () => parseDateValue(selectedDate),
    [selectedDate]
  );
  const allBuildingsClosed = useMemo(
    () => {
      const keys = Object.keys(VISIBLE_BUILDINGS);
      return keys.length > 0 && keys.every((key) => !isBuildingOpen(key, selectedDateObj));
    },
    [selectedDateObj]
  );

  // Load settings on mount
  useEffect(() => {
    setShowOnlyStudyRooms(loadSettings().showOnlyStudyRooms);
    try {
      const saved = JSON.parse(safeGetItem(FAVORITE_ROOMS_KEY) || "[]");
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
  }, [selectedDateObj, reloadKey]);

  // Day structure per room (free/study windows, opening hours), computed once
  // per selected date and schedule fetch; the time-dependent status is cheap
  // and derived below.
  const roomDays = useMemo(() => {
    void slotsVersion;
    const rooms: Omit<RoomView, "status">[] = [];
    for (const [building, buildingRooms] of Object.entries(scheduleData)) {
      const isOpen = isBuildingOpen(building, selectedDateObj);
      const openTime = getBuildingOpeningTime(building, selectedDateObj);
      const open = toMinutes(openTime);
      const close = toMinutes(getBuildingClosingTime(building, selectedDateObj));
      for (const room of Object.keys(buildingRooms)) {
        const freeSlots = fetcher.getFreeTimeSlots(building, room, selectedDateObj);
        const studySlots = fetcher.getStudyRoomTimeSlots(building, room, selectedDateObj);
        const all = buildWindows(freeSlots, studySlots);
        const windows = showOnlyStudyRooms ? studyWindowsOnly(all) : all;
        const hasStudySession = all.some((window) => window.kind === "study");
        // A room free for the whole opening window is far more likely an
        // unbooked, locked room than a lucky find, so the card warns.
        // Rooms with an official study session are open on purpose.
        const isFreeAllDay =
          isOpen &&
          !hasStudySession &&
          all.length === 1 &&
          all[0].start <= open &&
          all[0].end >= close;
        rooms.push({
          building,
          room,
          key: `${building}/${room}`,
          rangeSlots: showOnlyStudyRooms ? studySlots : freeSlots,
          windows,
          hasStudySession,
          isFreeAllDay,
          isOpen,
          open,
          close,
          openTime,
        });
      }
    }
    return rooms;
  }, [scheduleData, selectedDateObj, slotsVersion, showOnlyStudyRooms]);

  const rooms: RoomView[] = useMemo(
    () =>
      roomDays.map((day) => ({
        ...day,
        status: atTime !== null && day.isOpen ? roomStatusAt(day.windows, atTime) : null,
      })),
    [roomDays, atTime]
  );

  // Filter rooms based on time range
  const isRoomAvailableInTimeRange = useCallback(
    (slots: TimeSlot[]): boolean => {
      if (!startTime && !endTime) return true;
      return slots.some(
        (slot) =>
          (!startTime || (slot.start <= startTime && slot.end >= startTime)) &&
          (!endTime || (slot.start <= endTime && slot.end >= endTime))
      );
    },
    [startTime, endTime]
  );

  const favoriteSet = useMemo(() => new Set(favorites), [favorites]);

  const handleToggleFavorite = useCallback((building: string, room: string) => {
    const key = `${building}/${room}`;
    setFavorites((current) => {
      const next = current.includes(key)
        ? current.filter((item) => item !== key)
        : [...current, key];
      safeSetItem(FAVORITE_ROOMS_KEY, JSON.stringify(next));
      return next;
    });
  }, []);

  const filteredRooms = useMemo(() => {
    const query = searchQuery.toLowerCase();
    const filtered = rooms.filter((view) => {
      const { building, room, status } = view;
      const buildingMatch =
        selectedBuilding === "all" || building === selectedBuilding;
      const searchMatch =
        !query ||
        room.toLowerCase().includes(query) ||
        building.toLowerCase().includes(query) ||
        // Students search "Leoni"/"Velodromo", not the internal building keys.
        getBuildingDisplayName(building).toLowerCase().includes(query);
      // "Available" includes rooms whose class ends within 15 minutes.
      const availabilityMatch =
        !availabilityActive || (status !== null && status.state !== "busy");
      const timeRangeMatch = isRoomAvailableInTimeRange(view.rangeSlots);
      const favoriteMatch = !showOnlyFavorites || favoriteSet.has(view.key);
      // With "Available" on, ≥ 2h refers to the stretch that makes the room
      // available; otherwise to any window of the day.
      const free2hMatch =
        !showOnly2h ||
        (availabilityActive
          ? status?.longEnough === true
          : longestWindow(view.windows) >= LONG_FREE_MINUTES);
      const studyRoomMatch = !showOnlyStudyRooms || view.windows.length > 0;

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
    // Favorites first; then free rooms (longest stretch first), then rooms
    // freeing up soon (soonest first), then the rest in their natural order.
    const rank = (view: RoomView) =>
      view.status?.state === "free" ? 0 : view.status?.state === "soon" ? 1 : 2;
    return filtered
      .map((view, index) => ({ view, index }))
      .sort((a, b) => {
        const favorite =
          Number(favoriteSet.has(b.view.key)) - Number(favoriteSet.has(a.view.key));
        if (favorite) return favorite;
        const byRank = rank(a.view) - rank(b.view);
        if (byRank) return byRank;
        if (rank(a.view) === 0) return (b.view.status?.minutes ?? 0) - (a.view.status?.minutes ?? 0);
        if (rank(a.view) === 1) return (a.view.status?.minutes ?? 0) - (b.view.status?.minutes ?? 0);
        return a.index - b.index;
      })
      .map(({ view }) => view);
  }, [
    rooms,
    selectedBuilding,
    searchQuery,
    availabilityActive,
    showOnlyStudyRooms,
    showOnlyFavorites,
    showOnly2h,
    favoriteSet,
    isRoomAvailableInTimeRange,
  ]);

  const displayedFilteredCount = isRefreshing
    ? "—"
    : String(filteredRooms.length);
  const freeCount = filteredRooms.filter((view) => view.status?.state === "free").length;
  const soonCount = filteredRooms.filter((view) => view.status?.state === "soon").length;
  const countDetail =
    availabilityActive && !isRefreshing
      ? fill(t.freeSoonCount, { free: freeCount, soon: soonCount })
      : "";

  // A scrape that returns zero events campus-wide means "no data", not "all
  // rooms free". Rendering the full grid in that case shows every room with a
  // full-day free slot, which sends students to rooms they cannot verify.
  const campusEventCount = Object.values(scheduleData).reduce(
    (sum, rooms) =>
      sum + Object.values(rooms).reduce((s, evs) => s + evs.length, 0),
    0
  );
  const showNoDataState = !error && campusEventCount === 0;

  const handleStudyRoomsChange = async (enabled: boolean) => {
    setShowOnlyStudyRooms(enabled);
    const currentSettings = loadSettings();
    saveSettings({ ...currentSettings, showOnlyStudyRooms: enabled });

    // Fetch study room data if enabling the filter
    if (enabled) {
      await fetcher.fetchStudyRooms();
      setSlotsVersion((version) => version + 1);
    }
  };

  const hasActiveFilters =
    searchQuery !== "" ||
    selectedDate !== todayDateValue ||
    selectedBuilding !== "all" ||
    !showOnlyAvailable ||
    showOnlyStudyRooms ||
    showOnlyFavorites ||
    showOnly2h ||
    startTime !== "" ||
    endTime !== "" ||
    scrubTime !== null;

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
    setScrubTime(null);
    setScrubOpen(false);
    const currentSettings = loadSettings();
    saveSettings({ ...currentSettings, showOnlyStudyRooms: false });
  };

  const changeDate = (value: string) => {
    if (value < todayDateValue || value > MAX_DATE_VALUE) return;
    setSelectedDate(value);
  };

  const scrubButtonLabel = isLiveNow
    ? t.nowLabel
    : atTime !== null
      ? formatMinutes(atTime)
      : t.pickTime;
  const scrubHeading = fill(t.showRoomsFreeAt, {
    time: isLiveNow
      ? fill(t.nowWithTime, { time: formatMinutes(nowMinutes) })
      : formatMinutes(atTime ?? SCRUB_MIN),
  });

  const container = "mx-auto w-full max-w-[1240px] px-3 py-3 sm:px-6 sm:py-5";

  if (isInitialLoading) {
    return (
      <PageLayout language={language} onLanguageChange={setLanguage}>
        <div className={container}>
          <PageHeaderSkeleton />
          <SearchFiltersSkeleton />
          <RoomGridSkeleton count={9} />
        </div>
      </PageLayout>
    );
  }

  return (
    <PageLayout language={language} onLanguageChange={setLanguage}>
      <div className={container}>
        <PageHeader
          language={language}
          selectedDate={selectedDateObj}
          dateValue={selectedDate}
          minDate={todayDateValue}
          maxDate={MAX_DATE_VALUE}
          isToday={isSelectedDateToday}
          onDateChange={changeDate}
          onShiftDay={(days) => changeDate(shiftDateValue(selectedDate, days))}
          t={t}
        />

        <SearchFilters
          searchQuery={searchQuery}
          setSearchQuery={setSearchQuery}
          startTime={startTime}
          setStartTime={setStartTime}
          endTime={endTime}
          setEndTime={setEndTime}
          selectedBuilding={selectedBuilding}
          setSelectedBuilding={setSelectedBuilding}
          visibleBuildings={VISIBLE_BUILDINGS}
          showScrubber={!isPastDate}
          scrubOpen={scrubOpen}
          onToggleScrub={() => setScrubOpen((open) => !open)}
          scrubValue={atTime ?? SCRUB_MIN}
          scrubMin={SCRUB_MIN}
          scrubMax={SCRUB_MAX}
          onScrubChange={setScrubTime}
          onScrubNow={() => setScrubTime(null)}
          scrubIsNow={isLiveNow || (scrubTime === null && !isSelectedDateToday)}
          scrubButtonLabel={scrubButtonLabel}
          scrubHeading={scrubHeading}
          showAvailabilityFilter={showAvailabilityFilter}
          showOnlyAvailable={showOnlyAvailable}
          setShowOnlyAvailable={setShowOnlyAvailable}
          availabilityDisabled={atTime === null}
          availabilityFilterLabel={availabilityFilterLabel}
          showOnlyStudyRooms={showOnlyStudyRooms}
          onStudyRoomsChange={handleStudyRoomsChange}
          showOnlyFavorites={showOnlyFavorites}
          onFavoritesChange={setShowOnlyFavorites}
          favoriteCount={favorites.length}
          showOnly2h={showOnly2h}
          on2hChange={setShowOnly2h}
          filteredCount={displayedFilteredCount}
          countDetail={countDetail}
          onReset={handleReset}
          resetDisabled={!hasActiveFilters}
          t={t}
        />

        {isRefreshing && (
          <div role="status" className="mb-4 flex items-center gap-2 rounded-xl border border-free-tint-border bg-free-tint p-3 font-medium text-free-soft-foreground">
            <Loader2 className="h-4 w-4 animate-spin" />
            <span>{t.loading}</span>
          </div>
        )}

        {allBuildingsClosed && (
          <div role="alert" className="mb-4 rounded-xl border border-destructive/30 bg-destructive/5 px-4 py-3 text-sm text-destructive">
            {t.allBuildingsClosed}
          </div>
        )}

        {isFutureDate && (
          <div className="mb-4 rounded-xl border border-notice-border bg-notice px-4 py-3 text-sm text-notice-foreground">
            {t.futureDatesNotice}
          </div>
        )}

        {error && (
          <div role="alert" className="mb-4 rounded-xl border border-destructive/20 bg-destructive/10 p-4 text-destructive">
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

        {isRefreshing ? (
          <RoomGridSkeleton count={9} />
        ) : showNoDataState ? (
          <div role="alert" className="rounded-xl border border-destructive/20 bg-destructive/10 p-4 text-center text-destructive">
            {t.noDataForDate}
          </div>
        ) : (
          <div className="grid gap-2.5 sm:gap-3.5 [grid-template-columns:repeat(auto-fill,minmax(min(100%,330px),1fr))]">
            {filteredRooms.map((view) => (
              <RoomCard
                key={view.key}
                building={view.building}
                room={view.room}
                buildingDisplayName={fetcher.getBuildingDisplayName(view.building)}
                windows={view.windows}
                status={view.status}
                marker={atTime}
                open={view.open}
                close={view.close}
                isOpen={view.isOpen}
                openTime={view.openTime}
                closedMessage={buildingClosedMessage}
                hasStudySession={view.hasStudySession}
                isFreeAllDay={view.isFreeAllDay}
                studyOnly={showOnlyStudyRooms}
                isFavorite={favoriteSet.has(view.key)}
                onToggleFavorite={handleToggleFavorite}
                t={t}
              />
            ))}
          </div>
        )}

        {filteredRooms.length === 0 && !error && !isRefreshing && !showNoDataState && (
          <div role="status" className="py-12 text-center text-lg text-muted-foreground">
            {availabilityActive ? noAvailabilityMessage : t.noRooms}
          </div>
        )}
      </div>
    </PageLayout>
  );
}
