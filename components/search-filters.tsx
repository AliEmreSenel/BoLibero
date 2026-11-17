"use client";

import { useEffect, useState } from "react";
import { ChevronDown, Clock, Search, SlidersHorizontal, Star, X } from "lucide-react";
import { BottomSheet } from "@/components/ui/bottom-sheet";
import { fill, type Translations } from "@/lib/i18n";
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
    "inline-flex min-h-11 items-center justify-center gap-1 rounded-full border px-3 text-xs font-semibold transition-colors disabled:cursor-not-allowed disabled:opacity-50 sm:min-h-9 sm:text-sm",
    active
      ? "border-free-bar-muted bg-free-soft text-free-soft-foreground"
      : "border-input bg-card text-foreground hover:bg-muted",
  );

/** The same fields and callbacks are used inline on desktop and in the mobile sheet. */
function AdvancedFilters({
  props,
  id,
  expanded = false,
}: {
  props: SearchFiltersProps;
  id: string;
  expanded?: boolean;
}) {
  const { t } = props;
  return (
    <div className="flex flex-wrap items-end gap-3">
      <div className="min-w-0 flex-[1_1_180px]">
        <label
          htmlFor={`${id}-building`}
          className="mb-1 block text-xs font-semibold text-muted-foreground"
        >
          {t.buildingLabel}
        </label>
        <select
          id={`${id}-building`}
          value={props.selectedBuilding}
          onChange={(e) => props.setSelectedBuilding(e.target.value)}
          className="h-11 w-full rounded-lg border border-input bg-background px-3 text-base sm:text-sm"
        >
          <option value="all">{t.allBuildingsLabel}</option>
          {Object.entries(props.visibleBuildings).map(([key, label]) => (
            <option key={key} value={key}>
              {label}
            </option>
          ))}
        </select>
      </div>
      <fieldset className="min-w-0 flex-[2_1_240px]">
        <legend className="mb-1 text-xs font-semibold text-muted-foreground">{t.freeFrom}</legend>
        <div className="flex min-h-11 items-center gap-2 rounded-lg border border-input bg-background px-3">
          <label htmlFor={`${id}-start`} className="sr-only">
            {t.startTime}
          </label>
          <input
            id={`${id}-start`}
            type="time"
            value={props.startTime}
            onChange={(e) => props.setStartTime(e.target.value)}
            className="min-w-0 flex-1 bg-transparent text-base sm:text-sm"
          />
          <span className="text-xs text-muted-foreground">{t.toLabel}</span>
          <label htmlFor={`${id}-end`} className="sr-only">
            {t.endTime}
          </label>
          <input
            id={`${id}-end`}
            type="time"
            value={props.endTime}
            onChange={(e) => props.setEndTime(e.target.value)}
            className="min-w-0 flex-1 bg-transparent text-base sm:text-sm"
          />
        </div>
      </fieldset>
      {!expanded && props.showScrubber && (
        <button
          type="button"
          aria-expanded={props.scrubOpen}
          aria-controls={`${id}-scrubber`}
          onClick={props.onToggleScrub}
          className={cn(chip(!props.scrubIsNow), "min-h-11 rounded-lg")}
        >
          <Clock className="h-4 w-4" aria-hidden="true" />
          {props.scrubButtonLabel}
          <ChevronDown
            className={cn("h-3.5 w-3.5", props.scrubOpen && "rotate-180")}
            aria-hidden="true"
          />
        </button>
      )}
      <button
        type="button"
        onClick={props.onReset}
        disabled={props.resetDisabled}
        className="min-h-11 px-2 text-sm font-semibold text-muted-foreground underline underline-offset-4 disabled:no-underline disabled:opacity-50"
      >
        {t.reset}
      </button>
      {(props.startTime || props.endTime) && (
        <p className="basis-full text-xs text-muted-foreground">{t.timeRangeHint}</p>
      )}
      {props.showScrubber && (expanded || props.scrubOpen) && (
        <div
          id={`${id}-scrubber`}
          className="flex basis-full flex-wrap items-center gap-3 rounded-lg bg-free-tint p-3"
        >
          <label
            htmlFor={`${id}-time`}
            className="basis-full text-sm font-semibold text-free-soft-foreground"
          >
            {props.scrubHeading}
          </label>
          <input
            id={`${id}-time`}
            type="range"
            min={props.scrubMin}
            max={props.scrubMax}
            step={5}
            value={props.scrubValue}
            onChange={(e) => props.onScrubChange(Number(e.target.value))}
            className="h-11 min-w-0 flex-1 accent-[var(--free-bar)]"
          />
          <button
            type="button"
            onClick={props.onScrubNow}
            className="min-h-11 rounded-lg bg-card px-3 text-sm font-semibold text-free-soft-foreground"
          >
            {t.nowLabel}
          </button>
        </div>
      )}
    </div>
  );
}

export function SearchFilters(props: SearchFiltersProps) {
  const [open, setOpen] = useState(false);
  const { t } = props;
  useEffect(() => {
    const desktop = window.matchMedia("(min-width: 640px)");
    const closeOnDesktop = () => {
      if (desktop.matches) setOpen(false);
    };
    desktop.addEventListener("change", closeOnDesktop);
    return () => desktop.removeEventListener("change", closeOnDesktop);
  }, []);

  const advancedCount =
    Number(props.selectedBuilding !== "all") +
    Number(Boolean(props.startTime || props.endTime)) +
    Number(!props.scrubIsNow);
  const summaries = [
    ...(props.selectedBuilding !== "all"
      ? [
          {
            label: props.visibleBuildings[props.selectedBuilding] ?? props.selectedBuilding,
            clear: () => props.setSelectedBuilding("all"),
          },
        ]
      : []),
    ...(props.startTime || props.endTime
      ? [
          {
            label: `${props.startTime || "…"}–${props.endTime || "…"}`,
            clear: () => {
              props.setStartTime("");
              props.setEndTime("");
            },
          },
        ]
      : []),
    ...(!props.scrubIsNow
      ? [{ label: fill(t.availableAt, { time: props.scrubButtonLabel }), clear: props.onScrubNow }]
      : []),
  ];

  return (
    <section aria-label={t.search} className="mb-3 sm:mb-4">
      <div className="space-y-2 sm:rounded-2xl sm:border sm:bg-card sm:p-3">
        <div className="relative">
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
            value={props.searchQuery}
            onChange={(e) => props.setSearchQuery(e.target.value)}
            className="h-11 w-full rounded-lg border border-input bg-card pl-9 pr-11 text-base placeholder:text-muted-foreground sm:bg-background sm:text-sm"
          />
          {props.searchQuery && (
            <button
              type="button"
              onClick={() => props.setSearchQuery("")}
              aria-label={t.reset}
              className="absolute right-0 top-0 inline-flex h-11 w-11 items-center justify-center rounded-lg text-muted-foreground hover:bg-muted"
            >
              <X className="h-4 w-4" aria-hidden="true" />
            </button>
          )}
        </div>
        <div className="flex flex-wrap items-center justify-between gap-2 sm:justify-start">
          <div
            role="group"
            aria-label={t.availableRooms}
            className="flex rounded-full bg-muted p-0.5"
          >
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
          </div>
          <button
            type="button"
            aria-haspopup="dialog"
            aria-expanded={open}
            onClick={() => setOpen(true)}
            className={cn(chip(advancedCount > 0), "rounded-lg sm:hidden")}
          >
            <SlidersHorizontal className="h-4 w-4" aria-hidden="true" />
            {t.filters}
            {advancedCount > 0 && <span className="tabular-nums">({advancedCount})</span>}
          </button>
          <div className="flex basis-full flex-wrap items-center gap-1.5 sm:basis-auto sm:gap-2">
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
              aria-pressed={props.showOnlyStudyRooms}
              aria-label={t.studySessionsOnly}
              onClick={() => props.onStudyRoomsChange(!props.showOnlyStudyRooms)}
              className={chip(props.showOnlyStudyRooms)}
            >
              <span className="sm:hidden">{t.studyOnlyShort}</span>
              <span className="hidden sm:inline">{t.studySessionsOnly}</span>
            </button>
            <button
              type="button"
              aria-pressed={props.showOnlyFavorites}
              onClick={() => props.onFavoritesChange(!props.showOnlyFavorites)}
              disabled={props.favoriteCount === 0 && !props.showOnlyFavorites}
              title={props.favoriteCount === 0 ? t.addFavorite : undefined}
              className={chip(props.showOnlyFavorites)}
            >
              <Star className="h-3.5 w-3.5" aria-hidden="true" />
              {t.favorites} ({props.favoriteCount})
            </button>
          </div>
        </div>
        <div className="hidden border-t pt-3 sm:block">
          <AdvancedFilters props={props} id="desktop-filter" />
        </div>
      </div>
      {summaries.length > 0 && (
        <div className="mt-2 flex flex-wrap gap-1.5 sm:hidden">
          {summaries.map(({ label, clear }) => (
            <button
              key={label}
              type="button"
              onClick={clear}
              aria-label={fill(t.removeFilter, { name: label })}
              className="inline-flex min-h-11 items-center gap-2 rounded-lg border border-free-border bg-free-tint px-2 text-xs font-medium text-free-soft-foreground"
            >
              {label}
              <X className="h-3.5 w-3.5" aria-hidden="true" />
            </button>
          ))}
        </div>
      )}
      <p role="status" className="mt-3 text-xs text-muted-foreground sm:text-sm">
        <strong className="text-foreground">{props.filteredCount}</strong>{" "}
        {props.filteredCount === "1" ? t.roomFound : t.roomsFound}
        {props.countDetail && ` · ${props.countDetail}`}
      </p>
      <BottomSheet
        open={open}
        onClose={() => setOpen(false)}
        title={t.filters}
        closeLabel={t.closePanel}
        footer={
          <button
            type="button"
            onClick={() => setOpen(false)}
            className="min-h-11 w-full rounded-lg bg-free px-4 text-sm font-bold text-free-foreground"
          >
            {fill(t.showRoomResults, { n: props.filteredCount })}
          </button>
        }
      >
        <AdvancedFilters props={props} id="mobile-filter" expanded />
      </BottomSheet>
    </section>
  );
}
