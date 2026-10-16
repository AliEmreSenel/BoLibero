"use client";

import Link from "next/link";
import { MapPin, ArrowRight, Clock, Star } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import type { Translations } from "@/lib/i18n";

interface TimeSlot {
  start: string;
  end: string;
}

interface RoomCardProps {
  building: string;
  room: string;
  buildingDisplayName: string;
  timeSlots: TimeSlot[];
  slotsLabel: string;
  isFree: boolean;
  isFreeAllDay: boolean;
  isOpen: boolean;
  openTime: string;
  availableStatusLabel: string;
  occupiedStatusLabel: string;
  buildingClosedMessage: string;
  showStatus?: boolean;
  isFavorite: boolean;
  onToggleFavorite: () => void;
  t: Translations;
}

export function RoomCard({
  building,
  room,
  buildingDisplayName,
  timeSlots,
  slotsLabel,
  isFree,
  isFreeAllDay,
  isOpen,
  openTime,
  availableStatusLabel,
  occupiedStatusLabel,
  buildingClosedMessage,
  showStatus = true,
  isFavorite,
  onToggleFavorite,
  t,
}: RoomCardProps) {
  return (
    <Card className="hover:shadow-md transition-shadow min-h-[220px]">
      <CardContent className="p-6 flex flex-col h-full">
        {/* Room Header */}
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-xl font-semibold truncate" title={room}>
            {room}
          </h3>
          <div className="flex items-center gap-1 text-muted-foreground text-sm">
            <MapPin className="h-4 w-4" />
            <span>{buildingDisplayName}</span>
            <Button
              variant="ghost"
              size="icon"
              className="h-8 w-8"
              onClick={onToggleFavorite}
              aria-label={isFavorite ? t.removeFavorite : t.addFavorite}
              aria-pressed={isFavorite}
            >
              <Star
                className={`h-4 w-4 ${
                  isFavorite ? "fill-amber-400 text-amber-400" : ""
                }`}
              />
            </Button>
          </div>
        </div>

        {/* Content area with flex-grow */}
        <div className="flex-grow">
          {/* Building Status */}
          {!isOpen && (
            <div className="mb-4 p-2 bg-destructive/10 border border-destructive/20 rounded text-sm text-destructive">
              {buildingClosedMessage}
              <div className="text-xs opacity-80">
                {t.closedOpensAt} {openTime}
              </div>
            </div>
          )}

          {isOpen && (
            <>
              {isFreeAllDay && (
                <div className="mb-4 rounded border border-amber-300/50 bg-amber-50/80 px-3 py-2 text-xs text-amber-900 dark:border-amber-800/60 dark:bg-amber-950/50 dark:text-amber-200">
                  {t.freeAllDayUnlockWarning}
                </div>
              )}

              {/* Time Slot Badges */}
              <div className="mb-4 min-h-[52px]">
                <div className="text-xs font-medium text-muted-foreground mb-1.5">
                  {slotsLabel}
                </div>
                <div className="flex flex-wrap gap-2 min-h-[32px]">
                {timeSlots.slice(0, 6).map((slot, index) => (
                  <Badge key={index} variant="secondary" className="text-xs">
                    <Clock className="h-3 w-3 mr-1" />
                    {slot.start} - {slot.end}
                  </Badge>
                ))}
                {timeSlots.length > 6 && (
                  <Badge variant="outline" className="text-xs">
                    +{timeSlots.length - 6}
                  </Badge>
                )}
                </div>
              </div>

              {/* Room Status */}
              {showStatus && (
                <div className="mb-4">
                  <div
                    className={`text-sm font-medium ${isFree ? "text-green-600 dark:text-green-400" : "text-red-600 dark:text-red-400"}`}
                  >
                    {isFree
                      ? `✓ ${availableStatusLabel}`
                      : `✗ ${occupiedStatusLabel}`}
                  </div>
                </div>
              )}
            </>
          )}
        </div>

        {/* More Info Link */}
        <Button
          asChild
          variant="ghost"
          className="w-full justify-between p-0 h-auto py-2"
        >
          <Link
            href={`/room/${encodeURIComponent(building)}/${encodeURIComponent(room)}`}
          >
            <span>{t.moreInfo}</span>
            <ArrowRight className="h-4 w-4" />
          </Link>
        </Button>
      </CardContent>
    </Card>
  );
}
