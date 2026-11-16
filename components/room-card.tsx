"use client";

import { memo } from "react";
import Link from "next/link";
import { ArrowRight, Star } from "lucide-react";
import { DayBar, LockedMark, SlotChips, StudyIcon } from "@/components/availability";
import {
  formatDuration,
  formatMinutes,
  type RoomStatus,
  type RoomWindow,
} from "@/lib/availability";
import { fill, type Translations } from "@/lib/i18n";
import { cn } from "@/lib/utils";

interface RoomCardProps {
  building: string;
  room: string;
  buildingDisplayName: string;
  windows: RoomWindow[];
  // Status at the chosen time; null on days where "now" has no meaning.
  status: RoomStatus | null;
  // Minute shown as the marker on the day bar (the chosen time).
  marker: number | null;
  open: number;
  close: number;
  isOpen: boolean;
  openTime: string;
  closedMessage: string;
  hasStudySession: boolean;
  isFreeAllDay: boolean;
  studyOnly: boolean;
  isFavorite: boolean;
  onToggleFavorite: (building: string, room: string) => void;
  t: Translations;
}

function Band({
  status,
  windows,
  isOpen,
  closedMessage,
  close,
  studyOnly,
  t,
}: Pick<RoomCardProps, "status" | "windows" | "isOpen" | "closedMessage" | "close" | "studyOnly" | "t">) {
  let tone = "bg-busy text-busy-foreground";
  let title = "";
  let detail = "";
  let study = false;

  if (!isOpen) {
    // Closed for the whole day: an opening time would be misleading.
    title = closedMessage;
  } else if (!status) {
    title = fill(t.freeSlotsCount, { n: windows.length });
  } else if (status.state === "free" && status.current) {
    tone = "bg-free text-free-foreground";
    study = status.current.kind === "study";
    title =
      status.until >= close
        ? t.freeUntilClosing
        : fill(t.freeUntil, { time: formatMinutes(status.until) });
    detail = `· ${fill(t.timeLeft, { d: formatDuration(status.minutes) })}`;
  } else if (status.state === "soon" && status.upcoming) {
    tone = "bg-soon text-soon-foreground";
    study = status.upcoming.kind === "study";
    title = fill(t.freeIn, { n: status.minutes });
    detail = `· ${fill(t.untilTime, { time: formatMinutes(status.until) })}`;
  } else {
    title = studyOnly ? t.noStudySessionNow : t.occupied;
    if (status.next) {
      detail = `· ${fill(status.next.kind === "study" ? t.studySessionAt : t.freeAt, {
        time: formatMinutes(status.next.start),
      })}`;
    }
  }

  return (
    <span className={cn("flex min-h-12 items-center justify-between gap-3 px-4 text-sm", tone)}>
      <span className="flex min-w-0 items-center gap-1.5">
        {study && <StudyIcon className="h-4 w-4" label={t.studySession} />}
        <span>
          <strong className="font-bold">{title}</strong>{" "}
          {detail && <span className="opacity-90">{detail}</span>}
        </span>
      </span>
      <span className="inline-flex shrink-0 items-center gap-1 font-semibold">
        {t.moreInfo}
        <ArrowRight className="h-4 w-4" aria-hidden="true" />
      </span>
    </span>
  );
}

export const RoomCard = memo(function RoomCard(props: RoomCardProps) {
  const {
    building,
    room,
    buildingDisplayName,
    windows,
    status,
    marker,
    open,
    close,
    isOpen,
    hasStudySession,
    isFreeAllDay,
    isFavorite,
    onToggleFavorite,
    t,
  } = props;

  const border =
    status?.state === "free"
      ? "border-free-border"
      : status?.state === "soon"
        ? "border-soon-border"
        : "border-border";

  return (
    <article className={cn("flex flex-col overflow-hidden rounded-2xl border bg-card", border)}>
      <div className="flex flex-1 flex-col gap-3 p-4">
        <div className="flex items-start justify-between gap-2">
          <div className="min-w-0">
            <h2 className="truncate text-xl font-bold" title={room}>
              {room}
            </h2>
            <p className="flex items-center gap-1.5 text-[13px] text-muted-foreground">
              {buildingDisplayName}
              {hasStudySession && (
                <span title={t.studySessionToday} className="inline-flex text-study">
                  <StudyIcon className="h-3.5 w-3.5" label={t.studySessionToday} />
                </span>
              )}
            </p>
          </div>
          <div className="flex items-center gap-1">
            {isFreeAllDay && <LockedMark label={t.freeAllDayUnlockWarning} />}
            <button
              type="button"
              onClick={() => onToggleFavorite(building, room)}
              aria-label={isFavorite ? t.removeFavorite : t.addFavorite}
              aria-pressed={isFavorite}
              className="-mr-2 inline-flex h-10 w-10 items-center justify-center rounded-lg hover:bg-muted"
            >
              <Star
                className={cn(
                  "h-[18px] w-[18px]",
                  isFavorite ? "fill-amber-400 text-amber-500" : "text-muted-foreground"
                )}
              />
            </button>
          </div>
        </div>

        {isOpen && (
          <>
            <SlotChips windows={windows} status={status} studyLabel={t.studySession} />
            <DayBar windows={windows} status={status} open={open} close={close} marker={marker} />
          </>
        )}
      </div>
      <Link
        href={`/room/${encodeURIComponent(building)}/${encodeURIComponent(room)}`}
        className="block focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-ring"
      >
        <Band {...props} />
      </Link>
    </article>
  );
});
