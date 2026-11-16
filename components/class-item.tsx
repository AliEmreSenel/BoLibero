"use client";

import type { ReactNode } from "react";
import Link from "next/link";
import type { ClientEvent } from "@/lib/event-matching";
export { eventCourseTitle } from "@/lib/event-matching";
import { getEventTypeLabel, type Language } from "@/lib/i18n";
import { isLinkableRoomName } from "@/lib/constants";
import { getBuildingDisplayName } from "@/lib/constants";
import { cn } from "@/lib/utils";

export const roomHref = (building: string, roomName: string) =>
  `/room/${encodeURIComponent(building)}/${encodeURIComponent(roomName)}`;

export function roomLabel(room: { building: string; roomName: string }): string {
  const building = getBuildingDisplayName(room.building);
  return building ? `${room.roomName}, ${building}` : room.roomName;
}

/** Title line, badges, section and people links of one scheduled event. */
export function ClassDetails({
  event,
  language,
  showTeachers = true,
  showRooms = false,
  badges,
}: {
  event: ClientEvent;
  language: Language;
  showTeachers?: boolean;
  showRooms?: boolean;
  badges?: ReactNode;
}) {
  const typeLabel = event.type ? getEventTypeLabel(event.type, language) : "";
  const descriptionLines = event.description
    .split("\n")
    .map((line) => line.trim())
    .filter(Boolean);
  const title = descriptionLines[0] || event.class || typeLabel;
  const meta: ReactNode[] = [];
  // Section ("Cl.31") and the remaining description lines (programme, notes).
  const details = [
    descriptionLines[0] ? event.class : "",
    ...descriptionLines.slice(1),
  ].filter(Boolean);
  if (details.length > 0) {
    meta.push(<span key="details">{details.join(" · ")}</span>);
  }
  if (showTeachers) {
    event.teachers.forEach((teacher) =>
      meta.push(
        <Link
          key={`t-${teacher}`}
          href={`/professor/${encodeURIComponent(teacher)}`}
          className="font-semibold text-free-soft-foreground hover:underline"
        >
          {teacher}
        </Link>
      )
    );
  }
  if (showRooms) {
    event.rooms.forEach((room, index) =>
      meta.push(
        isLinkableRoomName(room.roomName) ? (
          <Link
            key={`r-${index}`}
            href={roomHref(room.building, room.roomName)}
            className="font-semibold text-foreground hover:underline"
          >
            {roomLabel(room)}
          </Link>
        ) : (
          <span key={`r-${index}`}>{room.roomName}</span>
        )
      )
    );
  }
  return (
    <div className="min-w-0">
      <div className="flex flex-wrap items-center gap-x-2 gap-y-1">
        <strong className="text-[15px]">{title}</strong>
        {typeLabel && title !== typeLabel && (
          <span className="rounded-full border px-2 text-[11px] font-semibold text-busy-foreground">{typeLabel}</span>
        )}
        {event.code && (
          <span className="rounded-full bg-muted px-2 text-[11px] font-semibold text-busy-foreground">{event.code}</span>
        )}
        {badges}
      </div>
      {meta.length > 0 && (
        <div className="mt-0.5 text-[13px] text-muted-foreground">
          {meta.map((item, index) => (
            <span key={index}>
              {index > 0 && " · "}
              {item}
            </span>
          ))}
        </div>
      )}
    </div>
  );
}

/** "08:30–10:00" in a fixed-width column on wide screens, stacked on phones. */
export function TimeCell({ start, end, className }: { start: string; end: string; className?: string }) {
  return (
    <span className={cn("font-bold tabular-nums", className)}>
      <span className="sm:hidden">
        {start}
        <br />
        <span className="font-medium text-muted-foreground">{end}</span>
      </span>
      <span className="hidden sm:inline">
        {start}–{end}
      </span>
    </span>
  );
}
