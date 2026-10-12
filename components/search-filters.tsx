"use client";

import { Search, X } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import type { Translations } from "@/lib/i18n";

interface SearchFiltersProps {
  searchQuery: string;
  setSearchQuery: (query: string) => void;
  selectedDate: string;
  setSelectedDate: (date: string) => void;
  startTime: string;
  setStartTime: (time: string) => void;
  endTime: string;
  setEndTime: (time: string) => void;
  selectedBuilding: string;
  setSelectedBuilding: (building: string) => void;
  showOnlyAvailable: boolean;
  setShowOnlyAvailable: (show: boolean) => void;
  showAvailabilityFilter: boolean;
  availabilityFilterLabel: string;
  showOnlyStudyRooms: boolean;
  onStudyRoomsChange: (enabled: boolean) => void;
  visibleBuildings: Record<string, string>;
  filteredCount: number;
  minDate: string;
  maxDate: string;
  onReset: () => void;
  resetDisabled?: boolean;
  t: Translations;
}

export function SearchFilters({
  searchQuery,
  setSearchQuery,
  selectedDate,
  setSelectedDate,
  startTime,
  setStartTime,
  endTime,
  setEndTime,
  selectedBuilding,
  setSelectedBuilding,
  showOnlyAvailable,
  setShowOnlyAvailable,
  showAvailabilityFilter,
  availabilityFilterLabel,
  showOnlyStudyRooms,
  onStudyRoomsChange,
  visibleBuildings,
  filteredCount,
  minDate,
  maxDate,
  onReset,
  resetDisabled = false,
  t,
}: SearchFiltersProps) {
  return (
    <Card className="mb-6">
      <CardContent className="p-4 sm:p-6">
        <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-12 gap-3 sm:gap-4 mb-4 items-end">
          {/* Search */}
          <div className="space-y-1 xl:col-span-4">
            <label className="text-xs font-medium text-muted-foreground">
              {t.search}
            </label>
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder={t.searchPlaceholder}
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10 pr-9"
              />
              {searchQuery && (
                <button
                  type="button"
                  onClick={() => setSearchQuery("")}
                  aria-label={t.reset}
                  className="absolute right-2 top-1/2 -translate-y-1/2 rounded-full p-1 text-muted-foreground hover:bg-muted hover:text-foreground"
                >
                  <X className="h-4 w-4" />
                </button>
              )}
            </div>
          </div>

          {/* Day */}
          <div className="space-y-1 xl:col-span-2">
            <label className="text-xs font-medium text-muted-foreground">
              {t.day}
            </label>
            <Input
              type="date"
              value={selectedDate}
              onChange={(e) => setSelectedDate(e.target.value)}
              min={minDate}
              max={maxDate}
              aria-label={t.day}
            />
          </div>

          {/* Start Time */}
          <div className="space-y-1 xl:col-span-2">
            <label className="text-xs font-medium text-muted-foreground">
              {t.startTime}
            </label>
            <Input
              type="time"
              value={startTime}
              onChange={(e) => setStartTime(e.target.value)}
              aria-label={t.startTime}
            />
          </div>

          {/* End Time */}
          <div className="space-y-1 xl:col-span-2">
            <label className="text-xs font-medium text-muted-foreground">
              {t.endTime}
            </label>
            <Input
              type="time"
              value={endTime}
              onChange={(e) => setEndTime(e.target.value)}
              aria-label={t.endTime}
            />
          </div>

          {/* Reset Button */}
          <div className="space-y-1 xl:col-span-2">
            <label className="text-xs font-medium text-muted-foreground opacity-0">
              {t.reset}
            </label>
            <Button
              onClick={onReset}
              variant="outline"
              className="w-full"
              disabled={resetDisabled}
            >
              {t.reset}
            </Button>
          </div>
        </div>

        {/* Campus Navigation */}
        <div className="flex flex-wrap gap-2 mb-4">
          <Button
            variant={selectedBuilding === "all" ? "default" : "outline"}
            onClick={() => setSelectedBuilding("all")}
            className="rounded-full text-xs sm:text-sm"
            size="sm"
          >
            {t.allCampuses}
          </Button>
          {Object.entries(visibleBuildings).map(
            ([buildingKey, displayName]) => (
              <Button
                key={buildingKey}
                variant={
                  selectedBuilding === buildingKey ? "default" : "outline"
                }
                onClick={() => setSelectedBuilding(buildingKey)}
                className="rounded-full text-xs sm:text-sm"
                size="sm"
              >
                {displayName.toUpperCase()}
              </Button>
            )
          )}
        </div>

        {/* Filter Tabs */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
          <div className="flex flex-wrap gap-2">
            <Button
              variant={!showOnlyAvailable ? "default" : "ghost"}
              onClick={() => setShowOnlyAvailable(false)}
              size="sm"
              className="text-xs sm:text-sm"
            >
              {t.allRooms}
            </Button>
            {showAvailabilityFilter && (
              <Button
                variant={showOnlyAvailable ? "default" : "ghost"}
                onClick={() => setShowOnlyAvailable(true)}
                size="sm"
                className="text-xs sm:text-sm"
              >
                {availabilityFilterLabel}
              </Button>
            )}
            <Button
              variant={showOnlyStudyRooms ? "default" : "ghost"}
              onClick={() => onStudyRoomsChange(!showOnlyStudyRooms)}
              size="sm"
              className="text-xs sm:text-sm"
            >
              {t.showOnlyStudyRooms}
            </Button>
          </div>
          <div className="text-sm text-muted-foreground whitespace-nowrap">
            {filteredCount} {filteredCount === 1 ? t.roomFound : t.roomsFound}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
