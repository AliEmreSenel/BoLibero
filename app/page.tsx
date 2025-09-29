"use client";

import { useState, useEffect, useMemo } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { MapPin, ArrowRight, Clock, Calendar, Search } from "lucide-react";
import { format, parseISO, isToday } from "date-fns";
import { it, enUS } from "date-fns/locale";
import Link from "next/link";
import { ScheduleFetcher } from "@/lib/schedule-fetcher";
import type { ScheduleData } from "@/lib/schedule-fetcher";
import { Navbar } from "@/components/navbar";
import { Footer } from "@/components/footer";
import { type Language, useTranslation } from "@/lib/i18n";
import { loadSettings, saveSettings } from "@/lib/settings";
import { isBuildingOpen } from "@/lib/building-hours";
import { BuildingHours } from "@/components/building-hours";

interface TimeSlot {
  start: string;
  end: string;
}

export default function BSpace() {
  const [scheduleData, setScheduleData] = useState<ScheduleData>({});
  const [loading, setLoading] = useState(true);
  const [selectedBuilding, setSelectedBuilding] = useState<string>("all");
  const [showOnlyAvailable, setShowOnlyAvailable] = useState(false);
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

  const isRoomCurrentlyFree = (building: string, room: string) => {
    const today = new Date();

    // Check if building is open today
    if (!isBuildingOpen(building, today)) {
      return false;
    }

    const events = scheduleData[building]?.[room] || [];
    const currentTime = getCurrentTime();
    const [currentHour, currentMin] = currentTime.split(":").map(Number);
    const currentMinutes = currentHour * 60 + currentMin;

    const todayEvents = events.filter((event) => {
      const eventDate = parseISO(event.date);
      return isToday(eventDate);
    });

    return !todayEvents.some((event) => {
      const [startHour, startMin] = event.start.split(":").map(Number);
      const [endHour, endMin] = event.end.split(":").map(Number);
      const startMinutes = startHour * 60 + startMin;
      const endMinutes = endHour * 60 + endMin;

      // 5-minute tolerance: room is considered occupied 5 minutes before class starts
      return currentMinutes >= startMinutes - 5 && currentMinutes <= endMinutes;
    });
  };

  const getFreeTimeSlots = (building: string, room: string): TimeSlot[] => {
    return fetcher.getFreeTimeSlots(building, room, new Date());
  };

  // Filter rooms based on time range
  const isRoomAvailableInTimeRange = (
    building: string,
    room: string,
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
    Object.keys(rooms).map((room) => ({ building, room })),
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

      return (
        buildingMatch && searchMatch && availabilityMatch && timeRangeMatch
      );
    });
  }, [
    allRooms,
    selectedBuilding,
    searchQuery,
    showOnlyAvailable,
    startTime,
    endTime,
    scheduleData,
  ]);

  const handleLanguageChange = (newLanguage: Language) => {
    setLanguage(newLanguage);
    const currentSettings = loadSettings();
    saveSettings({ ...currentSettings, language: newLanguage });
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
      <div className="min-h-screen flex flex-col">
        <Navbar language={language} onLanguageChange={handleLanguageChange} />
        <div className="container mx-auto p-6 flex-1">
          <div className="flex items-center justify-center h-64">
            <div className="text-lg">{t.loading}</div>
          </div>
        </div>
        <Footer language={language} />
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col">
      {/* Navbar */}
      <Navbar language={language} onLanguageChange={handleLanguageChange} />

      <main className="flex-1">
        <div className="container mx-auto p-6 max-w-7xl">
          {/* Page Header */}
          <div className="mb-8">
            <h2 className="text-3xl font-bold mb-2">{t.availableRooms}</h2>
            <p className="text-muted-foreground text-lg">{t.appDescription}</p>
            <div className="mt-4 flex items-center gap-2">
              <Calendar className="h-4 w-4 text-muted-foreground" />
              <span>
                {format(new Date(), "EEEE, MMMM do, yyyy", {
                  locale: language === "it" ? it : enUS,
                })}
              </span>
            </div>
          </div>

          {/* Building Hours Info 
          <div className="mb-6">
            <h3 className="text-lg font-semibold mb-4">{t.buildingHours}</h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {Object.entries(visibleBuildings).map(
                ([buildingKey, displayName]) => (
                  <BuildingHours
                    key={buildingKey}
                    buildingKey={buildingKey}
                    buildingName={displayName}
                    language={language}
                    compact={false}
                  />
                ),
              )}
            </div>
          </div>*/}

          {/* Search and Filters */}
          <Card className="mb-6">
            <CardContent className="p-6">
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-4">
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
                <Button onClick={handleReset} variant="outline">
                  {t.reset}
                </Button>
              </div>

              {/* Campus Navigation */}
              <div className="flex flex-wrap gap-2 mb-4">
                <Button
                  variant={selectedBuilding === "all" ? "default" : "outline"}
                  onClick={() => setSelectedBuilding("all")}
                  className="rounded-full"
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
                      className="rounded-full"
                    >
                      {displayName.toUpperCase()}
                    </Button>
                  ),
                )}
              </div>

              {/* Filter Tabs */}
              <div className="flex items-center justify-between">
                <div className="flex gap-4">
                  <Button
                    variant={!showOnlyAvailable ? "default" : "ghost"}
                    onClick={() => setShowOnlyAvailable(false)}
                  >
                    {t.allRooms}
                  </Button>
                  <Button
                    variant={showOnlyAvailable ? "default" : "ghost"}
                    onClick={() => setShowOnlyAvailable(true)}
                  >
                    {t.availableNow}
                  </Button>
                </div>
                <div className="text-muted-foreground">
                  {filteredRooms.length}{" "}
                  {filteredRooms.length === 1 ? t.roomFound : t.roomsFound}
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Error Display */}
          {error && (
            <div className="mb-6 p-4 rounded-lg bg-destructive/10 border border-destructive/20 text-destructive">
              {error}
            </div>
          )}

          {/* Room Cards Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredRooms.map(({ building, room }) => {
              const freeSlots = getFreeTimeSlots(building, room);
              const isFree = isRoomCurrentlyFree(building, room);
              const buildingDisplayName =
                fetcher.getBuildingDisplayName(building);

              return (
                <Card
                  key={`${building}-${room}`}
                  className="hover:shadow-md transition-shadow"
                >
                  <CardContent className="p-6">
                    {/* Room Header */}
                    <div className="flex items-center justify-between mb-4">
                      <h3 className="text-xl font-semibold">{room}</h3>
                      <div className="flex items-center gap-1 text-muted-foreground text-sm">
                        <MapPin className="h-4 w-4" />
                        <span>{buildingDisplayName}</span>
                      </div>
                    </div>

                    {/* Building Status */}
                    {!isBuildingOpen(building, new Date()) && (
                      <div className="mb-4 p-2 bg-destructive/10 border border-destructive/20 rounded text-sm text-destructive">
                        {t.buildingClosedToday}
                      </div>
                    )}

                    {/* Free Slots Count */}
                    <div className="mb-4">
                      <div className="text-sm">
                        {freeSlots.length}{" "}
                        {freeSlots.length === 1 ? t.freeSlot : t.freeSlots}
                      </div>
                    </div>

                    {/* Time Slot Badges */}
                    <div className="mb-4 flex flex-wrap gap-2">
                      {freeSlots.slice(0, 6).map((slot, index) => (
                        <Badge
                          key={index}
                          variant="secondary"
                          className="text-xs"
                        >
                          <Clock className="h-3 w-3 mr-1" />
                          {slot.start} - {slot.end}
                        </Badge>
                      ))}
                      {freeSlots.length > 6 && (
                        <Badge variant="outline" className="text-xs">
                          +{freeSlots.length - 6}
                        </Badge>
                      )}
                    </div>

                    {/* Room Status */}
                    <div className="mb-4">
                      <div
                        className={`text-sm font-medium ${isFree ? "text-green-600" : "text-red-600"}`}
                      >
                        {isFree ? `✓ ${t.availableNow}` : `✗ ${t.occupiedNow}`}
                      </div>
                    </div>

                    {/* More Info Link */}
                    <Link
                      href={`/room/${encodeURIComponent(building)}/${encodeURIComponent(room)}`}
                    >
                      <Button
                        variant="ghost"
                        className="w-full justify-between p-0 h-auto py-2"
                      >
                        <span>{t.moreInfo}</span>
                        <ArrowRight className="h-4 w-4" />
                      </Button>
                    </Link>
                  </CardContent>
                </Card>
              );
            })}
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
      </main>

      {/* Footer */}
      <Footer language={language} />
    </div>
  );
}
