"use client";

import { Search } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import type { Translations } from "@/lib/i18n";

interface SearchFiltersProps {
  searchQuery: string;
  setSearchQuery: (query: string) => void;
  startTime: string;
  setStartTime: (time: string) => void;
  endTime: string;
  setEndTime: (time: string) => void;
  selectedBuilding: string;
  setSelectedBuilding: (building: string) => void;
  showOnlyAvailable: boolean;
  setShowOnlyAvailable: (show: boolean) => void;
  showOnlyStudyRooms: boolean;
  onStudyRoomsChange: (enabled: boolean) => void;
  visibleBuildings: Record<string, string>;
  filteredCount: number;
  onReset: () => void;
  t: Translations;
}

export function SearchFilters({
  searchQuery,
  setSearchQuery,
  startTime,
  setStartTime,
  endTime,
  setEndTime,
  selectedBuilding,
  setSelectedBuilding,
  showOnlyAvailable,
  setShowOnlyAvailable,
  showOnlyStudyRooms,
  onStudyRoomsChange,
  visibleBuildings,
  filteredCount,
  onReset,
  t,
}: SearchFiltersProps) {
  return (
    <Card className="mb-6">
      <CardContent className="p-4 sm:p-6">
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-3 sm:gap-4 mb-4">
          {/* Search */}
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder={t.searchPlaceholder}
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10"
            />
          </div>

          {/* Start Time */}
          <Input
            type="time"
            placeholder={t.startTime}
            value={startTime}
            onChange={(e) => setStartTime(e.target.value)}
          />

          {/* End Time */}
          <Input
            type="time"
            placeholder={t.endTime}
            value={endTime}
            onChange={(e) => setEndTime(e.target.value)}
          />

          {/* Reset Button */}
          <Button onClick={onReset} variant="outline">
            {t.reset}
          </Button>
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
            <Button
              variant={showOnlyAvailable ? "default" : "ghost"}
              onClick={() => setShowOnlyAvailable(true)}
              size="sm"
              className="text-xs sm:text-sm"
            >
              {t.availableNow}
            </Button>
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
