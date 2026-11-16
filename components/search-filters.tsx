"use client";

import { ChevronDown, Clock, Search, X } from "lucide-react";
import type { Translations } from "@/lib/i18n";
import { cn } from "@/lib/utils";

interface SearchFiltersProps {
  searchQuery: string;
  setSearchQuery: (query: string) => void;
  startTime: string;
  setStartTime: (time: string) => void;
  endTime: string;
  setEndTime: (time: string) => void;
  selectedBuilding: string;
  setSelectedBuilding: (building: string) => void;
  visibleBuildings: Record<string, string>;
  // Time scrubber
  showScrubber: boolean;
  scrubOpen: boolean;
  onToggleScrub: () => void;
  scrubValue: number;
  scrubMin: number;
  scrubMax: number;
  onScrubChange: (minutes: number) => void;
  onScrubNow: () => void;
  scrubIsNow: boolean;
  scrubButtonLabel: string;
  scrubHeading: string;
  // Filter chips
  showAvailabilityFilter: boolean;
  showOnlyAvailable: boolean;
  setShowOnlyAvailable: (show: boolean) => void;
  availabilityDisabled: boolean;
  availabilityFilterLabel: string;
  showOnlyStudyRooms: boolean;
  onStudyRoomsChange: (enabled: boolean) => void;
  showOnlyFavorites: boolean;
  onFavoritesChange: (enabled: boolean) => void;
  favoriteCount: number;
  showOnly2h: boolean;
  on2hChange: (enabled: boolean) => void;
  filteredCount: string;
  countDetail: string;
  onReset: () => void;
  resetDisabled?: boolean;
  t: Translations;
}

const chip = (active: boolean) =>
  cn(
    "inline-flex min-h-[34px] items-center rounded-full border px-3 text-sm font-semibold transition-colors disabled:cursor-not-allowed disabled:opacity-50",
    active
      ? "border-free-bar-muted bg-free-soft text-free-soft-foreground"
      : "border-input bg-card text-foreground hover:bg-muted"
  );

const fieldClass =
  "h-[42px] w-full rounded-[10px] border border-input bg-background px-3 text-sm text-foreground placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring";

export function SearchFilters(props: SearchFiltersProps) {
  const {
    searchQuery,
    setSearchQuery,
    startTime,
    setStartTime,
    endTime,
    setEndTime,
    selectedBuilding,
    setSelectedBuilding,
    visibleBuildings,
    t,
  } = props;

  const timeActive = props.scrubOpen || !props.scrubIsNow;

  return (
    <section aria-label={t.search} className="mb-4 rounded-2xl border bg-card">
      <div className="flex flex-wrap gap-2.5 p-3">
        <div className="relative min-w-0 flex-[3_1_260px]">
          <label htmlFor="room-search" className="sr-only">
            {t.search}
          </label>
          <Search
            className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground"
            aria-hidden="true"
          />
          <input
            id="room-search"
            type="search"
            placeholder={t.searchPlaceholder}
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className={cn(fieldClass, "pl-9 pr-10 text-base sm:text-sm")}
          />
          {searchQuery && (
            <button
              type="button"
              onClick={() => setSearchQuery("")}
              aria-label={t.reset}
              className="absolute right-1 top-1/2 inline-flex h-9 w-9 -translate-y-1/2 items-center justify-center rounded-lg text-muted-foreground hover:bg-muted hover:text-foreground"
            >
              <X className="h-4 w-4" />
            </button>
          )}
        </div>

        <div className="flex h-[42px] min-w-0 flex-[1_1_230px] items-center gap-1.5 rounded-[10px] border border-input bg-background px-2.5">
          <span className="text-xs text-muted-foreground">{t.freeFrom}</span>
          <label htmlFor="start-time" className="sr-only">
            {t.startTime}
          </label>
          <input
            id="start-time"
            type="time"
            value={startTime}
            onChange={(e) => setStartTime(e.target.value)}
            className="min-w-0 flex-1 bg-transparent text-sm text-foreground focus-visible:outline-none"
          />
          <span className="text-xs text-muted-foreground">{t.toLabel}</span>
          <label htmlFor="end-time" className="sr-only">
            {t.endTime}
          </label>
          <input
            id="end-time"
            type="time"
            value={endTime}
            onChange={(e) => setEndTime(e.target.value)}
            className="min-w-0 flex-1 bg-transparent text-sm text-foreground focus-visible:outline-none"
          />
        </div>

        {props.showScrubber && (
          <button
            type="button"
            aria-expanded={props.scrubOpen}
            aria-controls="time-scrubber"
            onClick={props.onToggleScrub}
            className={cn(
              "inline-flex h-[42px] items-center gap-2 rounded-[10px] border px-3.5 text-sm font-bold text-free-soft-foreground",
              timeActive ? "border-free-bar-muted bg-free-soft" : "border-input bg-card"
            )}
          >
            <Clock className="h-4 w-4" aria-hidden="true" />
            {props.scrubButtonLabel}
            <ChevronDown
              className={cn("h-3.5 w-3.5 transition-transform", props.scrubOpen && "rotate-180")}
              aria-hidden="true"
            />
          </button>
        )}

        <button
          type="button"
          onClick={props.onReset}
          disabled={props.resetDisabled}
          className="h-[42px] px-2 text-sm font-semibold text-muted-foreground underline underline-offset-4 hover:text-foreground disabled:no-underline disabled:opacity-50"
        >
          {t.reset}
        </button>
      </div>

      {(startTime || endTime) && (
        <p className="-mt-1 px-3 pb-2 text-xs text-muted-foreground">{t.timeRangeHint}</p>
      )}

      {props.showScrubber && props.scrubOpen && (
        <div
          id="time-scrubber"
          className="mx-3 mb-3 flex flex-wrap items-center gap-x-3.5 gap-y-2 rounded-xl bg-free-tint px-3.5 py-3"
        >
          <label htmlFor="time-scrubber-input" className="font-bold text-free-soft-foreground">
            {props.scrubHeading}
          </label>
          <input
            id="time-scrubber-input"
            type="range"
            min={props.scrubMin}
            max={props.scrubMax}
            step={5}
            value={props.scrubValue}
            onChange={(e) => props.onScrubChange(Number(e.target.value))}
            className="min-w-0 flex-[1_1_320px] accent-[var(--free-bar)]"
          />
          <button
            type="button"
            onClick={props.onScrubNow}
            className="min-h-8 rounded-full bg-card px-3 text-sm font-bold text-free-soft-foreground"
          >
            {t.nowLabel}
          </button>
        </div>
      )}

      <div className="flex flex-wrap items-center gap-x-3 gap-y-2 border-t px-3 py-2.5">
        <div role="group" aria-label={t.buildingLabel} className="flex rounded-[10px] bg-muted p-[3px]">
          {[["all", t.allBuildingsLabel], ...Object.entries(visibleBuildings)].map(([key, label]) => {
            const active = selectedBuilding === key;
            return (
              <button
                key={key}
                type="button"
                aria-pressed={active}
                onClick={() => setSelectedBuilding(key)}
                className={cn(
                  "min-h-8 rounded-lg px-3 text-sm font-semibold",
                  active ? "bg-card text-foreground shadow-sm" : "text-muted-foreground hover:text-foreground"
                )}
              >
                {label}
              </button>
            );
          })}
        </div>

        {props.showAvailabilityFilter && (
          <button
            type="button"
            aria-pressed={props.showOnlyAvailable && !props.availabilityDisabled}
            onClick={() => props.setShowOnlyAvailable(true)}
            disabled={props.availabilityDisabled}
            title={props.availabilityDisabled ? t.futureDatesNotice : undefined}
            className={chip(props.showOnlyAvailable && !props.availabilityDisabled)}
          >
            {props.availabilityFilterLabel}
          </button>
        )}
        <button
          type="button"
          aria-pressed={!props.showOnlyAvailable || props.availabilityDisabled}
          onClick={() => props.setShowOnlyAvailable(false)}
          className={chip(!props.showOnlyAvailable || props.availabilityDisabled)}
        >
          {t.allRooms}
        </button>
        <button
          type="button"
          aria-pressed={props.showOnlyStudyRooms}
          onClick={() => props.onStudyRoomsChange(!props.showOnlyStudyRooms)}
          className={chip(props.showOnlyStudyRooms)}
        >
          {t.studySessionsOnly}
        </button>
        <button
          type="button"
          aria-pressed={props.showOnly2h}
          onClick={() => props.on2hChange(!props.showOnly2h)}
          className={chip(props.showOnly2h)}
        >
          {t.free2h}
        </button>
        <button
          type="button"
          aria-pressed={props.showOnlyFavorites}
          onClick={() => props.onFavoritesChange(!props.showOnlyFavorites)}
          disabled={props.favoriteCount === 0 && !props.showOnlyFavorites}
          title={props.favoriteCount === 0 ? t.addFavorite : undefined}
          className={chip(props.showOnlyFavorites)}
        >
          {t.favorites} ({props.favoriteCount})
        </button>

        <span role="status" className="ml-auto text-sm text-muted-foreground">
          <strong className="text-foreground">{props.filteredCount}</strong>{" "}
          {props.filteredCount === "1" ? t.roomFound : t.roomsFound}
          {props.countDetail && ` · ${props.countDetail}`}
        </span>
      </div>
    </section>
  );
}
