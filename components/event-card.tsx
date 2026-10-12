"use client";

import { Clock, MapPin, User, BookOpen } from "lucide-react";
import Link from "next/link";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import type { ScheduleEvent } from "@/lib/schedule-fetcher";
import { ScheduleFetcher } from "@/lib/schedule-fetcher";
import { getEventTypeLabel, type Language } from "@/lib/i18n";

interface EventCardProps {
  event: ScheduleEvent;
  showRoom?: boolean;
  showTeachers?: boolean;
  language?: Language;
}

export function EventCard({
  event,
  showRoom = true,
  showTeachers = true,
  language = "en",
}: EventCardProps) {
  const fetcher = ScheduleFetcher.getInstance();

  return (
    <Card className="border-l-4 border-l-primary">
      <CardContent className="p-4">
        <div className="flex items-start justify-between mb-3">
          <div className="flex items-center gap-2">
            <Badge variant="outline">{getEventTypeLabel(event.type, language)}</Badge>
            {event.code && <Badge variant="secondary">{event.code}</Badge>}
          </div>
          <div className="flex items-center gap-1 text-sm text-muted-foreground">
            <Clock className="h-4 w-4" />
            {event.start} - {event.end}
          </div>
        </div>

        {event.class && (
          <div className="flex items-center gap-2 mb-2">
            <BookOpen className="h-4 w-4 text-muted-foreground" />
            <span className="font-medium">{event.class}</span>
          </div>
        )}

        {event.description && (
          <div
            className="text-sm text-muted-foreground mb-3"
            dangerouslySetInnerHTML={{
              __html: event.description.replace(/<br\/?>/g, ""),
            }}
          />
        )}

        <div className="flex flex-col gap-2 text-sm">
          {showTeachers && event.teachers && event.teachers.length > 0 && (
            <div className="flex items-center gap-2">
              <User className="h-4 w-4 text-muted-foreground" />
              {event.teachers.map((teacher) => (
                <Link key={teacher} href={"/professor/" + encodeURIComponent(teacher)}>
                  <Badge>{teacher}</Badge>
                </Link>
              ))}
            </div>
          )}

          {showRoom && event.rooms && event.rooms.length > 0 && (
            <div className="flex items-center gap-2">
              <MapPin className="h-4 w-4 text-muted-foreground" />
              {event.rooms.map((room, idx) => (
                <Link
                  key={`${room.building}-${room.roomName}-${idx}`}
                  href={`/room/${encodeURIComponent(room.building)}/${encodeURIComponent(room.roomName)}`}
                >
                  <Badge variant="outline">
                    {room.roomName}, {fetcher.getBuildingDisplayName(room.building)}
                  </Badge>
                </Link>
              ))}
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
