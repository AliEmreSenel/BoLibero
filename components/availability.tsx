"use client";

import { useState } from "react";
import { BookOpen } from "lucide-react";
import {
  barPercent,
  formatMinutes,
  type RoomStatus,
  type RoomWindow,
} from "@/lib/availability";
import { cn } from "@/lib/utils";

// Shared pieces of the availability UI: slot chips, the day bar and the
// "might be locked" mark. Colors come from the free/soon/study tokens.

export function StudyIcon({ className, label }: { className?: string; label?: string }) {
  return (
    <BookOpen
      className={cn("h-3 w-3 shrink-0", className)}
      aria-hidden={label ? undefined : true}
      aria-label={label}
      role={label ? "img" : undefined}
    />
  );
}

const chipClass = (window: RoomWindow, status: RoomStatus | null): string => {
  const isCurrent = status?.current === window;
  const isUpcoming = status?.upcoming === window;
  if (isCurrent) {
    return window.kind === "study"
      ? "border-study bg-study text-study-foreground"
      : "border-free-soft bg-free-soft text-free-soft-foreground";
  }
  if (isUpcoming) return "border-soon-border bg-soon-soft text-soon-soft-foreground";
  if (window.kind === "study") return "border-study-border bg-study-soft text-study-soft-foreground";
  return "border-transparent bg-muted text-busy-foreground";
};

export function SlotChips({
  windows,
  status,
  studyLabel,
  className,
}: {
  windows: RoomWindow[];
  status: RoomStatus | null;
  studyLabel: string;
  className?: string;
}) {
  if (windows.length === 0) return null;
  return (
    <ul className={cn("flex flex-wrap gap-1 sm:gap-1.5", className)}>
      {windows.map((window) => (
        <li
          key={`${window.start}-${window.kind}`}
          className={cn(
            "inline-flex items-center gap-1 rounded border px-1.5 py-0.5 text-[11px] sm:rounded-md sm:px-2 sm:text-xs font-semibold tabular-nums",
            chipClass(window, status)
          )}
        >
          {window.kind === "study" && <StudyIcon label={studyLabel} />}
          {formatMinutes(window.start)}–{formatMinutes(window.end)}
        </li>
      ))}
    </ul>
  );
}

const segmentClass = (window: RoomWindow, status: RoomStatus | null): string => {
  if (status?.upcoming === window) return "bg-soon-bar";
  if (window.kind === "study") return status?.current === window ? "bg-study" : "bg-study-bar-muted";
  return status?.current === window ? "bg-free-bar" : "bg-free-bar-muted";
};

export function DayBar({
  windows,
  status,
  open,
  close,
  marker,
  showLabels = true,
  className,
  barClassName = "h-4",
}: {
  windows: RoomWindow[];
  status: RoomStatus | null;
  open: number;
  close: number;
  marker: number | null;
  showLabels?: boolean;
  className?: string;
  barClassName?: string;
}) {
  const labels = [open, 12 * 60, 16 * 60, close].filter(
    (minute, index, all) =>
      (index === 0 || index === all.length - 1 || (minute > open + 60 && minute < close - 60))
  );
  return (
    <div className={className} aria-hidden="true">
      <div className={cn("relative overflow-hidden rounded-[5px] bg-track", barClassName)}>
        {windows.map((window) => (
          <span
            key={`${window.start}-${window.kind}`}
            className={cn("absolute inset-y-0", segmentClass(window, status))}
            style={{
              left: `${barPercent(window.start, open, close)}%`,
              width: `${barPercent(window.end, open, close) - barPercent(window.start, open, close)}%`,
            }}
          />
        ))}
        {marker !== null && marker >= open && marker <= close && (
          <span
            className="absolute inset-y-0 -ml-px w-0.5 bg-ink"
            style={{ left: `${barPercent(marker, open, close)}%` }}
          />
        )}
      </div>
      {showLabels && (
        <div className="day-bar-labels relative mt-1 h-3.5 text-[11px] text-muted-foreground tabular-nums">
          {labels.map((minute, index) => (
            <span
              key={minute}
              className="absolute"
              style={
                index === 0
                  ? { left: 0 }
                  : index === labels.length - 1
                    ? { right: 0 }
                    : { left: `${barPercent(minute, open, close)}%`, transform: "translateX(-50%)" }
              }
            >
              {formatMinutes(minute)}
            </span>
          ))}
        </div>
      )}
    </div>
  );
}

/** Amber "!" shown when a room has no classes all day and may be locked. */
// Hover shows the title on desktop; a tap toggles the same text on touch.
export function LockedMark({ label, className }: { label: string; className?: string }) {
  const [open, setOpen] = useState(false);
  return (
    <span className="relative inline-flex">
      <button
        type="button"
        title={label}
        aria-label={label}
        aria-expanded={open}
        onClick={() => setOpen((value) => !value)}
        onBlur={() => setOpen(false)}
        className={cn(
          "inline-flex h-7 w-7 shrink-0 cursor-help items-center justify-center rounded-lg border-[1.5px] border-warn-border bg-warn text-[15px] font-extrabold text-warn-foreground",
          className
        )}
      >
        !
      </button>
      {open && (
        <span
          role="tooltip"
          className="absolute right-0 top-9 z-20 w-56 rounded-lg border border-warn-border bg-warn p-2 text-xs font-medium text-warn-foreground shadow-md"
        >
          {label}
        </span>
      )}
    </span>
  );
}
