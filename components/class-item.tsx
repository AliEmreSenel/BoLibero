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
  const details = [descriptionLines[0] ? event.class : "", ...descriptionLines.slice(1)].filter(
    Boolean,
  );
  if (details.length > 0) {
    meta.push(<span key="details">{details.join(" · ")}</span>);
  }
  if (showTeachers) {
    event.teachers.forEach((teacher) =>
      meta.push(
        <Link
          key={`t-${teacher}`}
          href={`/professor/${encodeURIComponent(teacher)}`}
          className="font-semibold text-free-soft-foreground underline underline-offset-2"
        >
          {teacher}
        </Link>,
      ),
    );
  }
  if (showRooms) {
    event.rooms.forEach((room, index) =>
      meta.push(
        isLinkableRoomName(room.roomName) ? (
          <Link
            key={`r-${index}`}
            href={roomHref(room.building, room.roomName)}
            className="font-semibold text-foreground underline underline-offset-2"
          >
            {roomLabel(room)}
          </Link>
        ) : (
          <span key={`r-${index}`}>{room.roomName}</span>
        ),
      ),
    );
  }
  return (
    <div className="min-w-0">
      <div className="flex flex-wrap items-baseline gap-x-1.5 gap-y-0.5 sm:gap-x-2 sm:gap-y-1">
        <strong className="break-words text-[13px] leading-snug sm:text-[15px]">{title}</strong>
        {typeLabel && title !== typeLabel && (
          <span className="text-[10px] text-muted-foreground sm:rounded-full sm:border sm:px-2 sm:text-[11px] sm:font-semibold sm:text-busy-foreground">
            {typeLabel}
          </span>
        )}
        {event.code && (
          <span className="text-[10px] text-muted-foreground sm:rounded-full sm:bg-muted sm:px-2 sm:text-[11px] sm:font-semibold sm:text-busy-foreground">
            {event.code}
          </span>
        )}
        {badges}
      </div>
      {meta.length > 0 && (
        <div className="mt-0.5 break-words text-[11px] leading-snug text-muted-foreground sm:text-[13px]">
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
export function TimeCell({
  start,
  end,
  className,
}: {
  start: string;
  end: string;
  className?: string;
}) {
  return (
    <span className={cn("text-xs leading-snug font-semibold tabular-nums sm:text-sm", className)}>
      <span className="sm:hidden">
        {start}
        <br />
        <span className="font-normal opacity-75">{end}</span>
      </span>
      <span className="hidden sm:inline">
        {start}–{end}
      </span>
    </span>
  );
}

/** Shared timeline row, including the time on both phone and desktop layouts. */
export function TimedRow({
  start,
  end,
  children,
  footer,
  className,
}: {
  start: string;
  end: string;
  children: ReactNode;
  footer?: ReactNode;
  className?: string;
}) {
  return (
    <div className={cn("overflow-hidden rounded-lg border bg-card sm:rounded-xl", className)}>
      <div className="grid grid-cols-[44px_minmax(0,1fr)] items-start gap-2 px-2.5 py-2 sm:grid-cols-[104px_minmax(0,1fr)] sm:gap-3 sm:px-3.5 sm:py-2.5">
        <TimeCell start={start} end={end} />
        <div className="min-w-0 self-center">{children}</div>
      </div>
      {footer}
    </div>
  );
}
