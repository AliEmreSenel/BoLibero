import { normalizeTime, toMinutes, minutesToTime } from "./time";
import type { SlotRange } from "./free-slots";

// A window of time a room can be used, in minutes since midnight. "study" is
// an official "Aule studio" session inside an ordinary room; "free" is time
// with no scheduled event.
export type WindowKind = "free" | "study";

export interface RoomWindow {
  start: number;
  end: number;
  kind: WindowKind;
}

// "Available now" also lists rooms whose class ends within this many minutes.
export const FREE_SOON_MINUTES = 15;

// A room only counts as free if it stays free for at least this long.
export const MIN_FREE_MINUTES = 15;

// The "Free ≥ 2h" filter threshold.
export const LONG_FREE_MINUTES = 120;

const parse = (time: string): number | null => {
  const normalized = normalizeTime(time);
  return normalized ? toMinutes(normalized) : null;
};

const toRanges = (slots: SlotRange[]): Array<[number, number]> =>
  slots
    .map((slot) => [parse(slot.start), parse(slot.end)] as const)
    .filter((pair): pair is readonly [number, number] => pair[0] !== null && pair[1] !== null && pair[1] > pair[0])
    .map(([start, end]) => [start, end] as [number, number])
    .sort((a, b) => a[0] - b[0]);

/**
 * Splits the free slots of a room into plain-free and study-session windows.
 * Study events are not counted as busy when free slots are computed, so a
 * study session always sits inside a free slot; the overlapping part becomes
 * a "study" window and the rest stays "free". Leftover pieces shorter than
 * MIN_FREE_MINUTES are dropped so a session never leaves 5-minute crumbs.
 */
export const buildWindows = (
  freeSlots: SlotRange[],
  studySlots: SlotRange[] = []
): RoomWindow[] => {
  const study = toRanges(studySlots);
  const windows: RoomWindow[] = [];
  for (const [start, end] of toRanges(freeSlots)) {
    let cursor = start;
    for (const [studyStart, studyEnd] of study) {
      const from = Math.max(studyStart, start);
      const to = Math.min(studyEnd, end);
      if (to <= from) continue;
      if (from - cursor >= MIN_FREE_MINUTES) windows.push({ start: cursor, end: from, kind: "free" });
      windows.push({ start: from, end: to, kind: "study" });
      cursor = Math.max(cursor, to);
    }
    if (end - cursor >= MIN_FREE_MINUTES) windows.push({ start: cursor, end, kind: "free" });
  }
  return windows.sort((a, b) => a.start - b.start);
};

/** Only the study-session windows, for the "study sessions only" filter. */
export const studyWindowsOnly = (windows: RoomWindow[]): RoomWindow[] =>
  windows.filter((window) => window.kind === "study");

export type RoomState = "free" | "soon" | "busy";

export interface RoomStatus {
  state: RoomState;
  // The window the room is in at `at` (only when state is "free").
  current: RoomWindow | null;
  // The window starting within FREE_SOON_MINUTES (only when state is "soon").
  upcoming: RoomWindow | null;
  // The next window after `at`, whatever its distance (for "free at 13:30").
  next: RoomWindow | null;
  // End of the usable stretch: windows that touch (free time running straight
  // into a study session) count as one stretch. 0 when busy.
  until: number;
  // Minutes until the stretch ends (free) or starts (soon).
  minutes: number;
  // Whether the stretch that makes the room available lasts ≥ LONG_FREE_MINUTES.
  // For a free room that is the time left from `at`; for a room freeing up soon
  // it is the whole upcoming stretch.
  longEnough: boolean;
}

/** End of the run of back-to-back windows starting with `first`. */
const stretchEnd = (windows: RoomWindow[], first: RoomWindow): number => {
  let end = first.end;
  for (const window of windows) {
    if (window.start > end) break;
    if (window.end > end && window.start <= end && window.start >= first.start) end = window.end;
  }
  return end;
};

/** Where a room stands at minute `at` of the day. */
export const roomStatusAt = (windows: RoomWindow[], at: number): RoomStatus => {
  const sorted = [...windows].sort((a, b) => a.start - b.start);
  const next = sorted.find((window) => window.start > at) ?? null;
  const current = sorted.find((window) => window.start <= at && at < window.end) ?? null;
  if (current) {
    const until = stretchEnd(sorted, current);
    if (until - at >= MIN_FREE_MINUTES) {
      return {
        state: "free",
        current,
        upcoming: null,
        next,
        until,
        minutes: until - at,
        longEnough: until - at >= LONG_FREE_MINUTES,
      };
    }
  }
  const upcoming =
    sorted.find(
      (window) =>
        window.start > at &&
        window.start - at <= FREE_SOON_MINUTES &&
        stretchEnd(sorted, window) - window.start >= MIN_FREE_MINUTES
    ) ?? null;
  if (upcoming) {
    const until = stretchEnd(sorted, upcoming);
    return {
      state: "soon",
      current: null,
      upcoming,
      next,
      until,
      minutes: upcoming.start - at,
      longEnough: until - upcoming.start >= LONG_FREE_MINUTES,
    };
  }
  return { state: "busy", current: null, upcoming: null, next, until: 0, minutes: 0, longEnough: false };
};

/** Longest single window of the day, in minutes. */
export const longestWindow = (windows: RoomWindow[]): number =>
  windows.reduce((longest, window) => Math.max(longest, window.end - window.start), 0);

/** "1h 20m", "45 min", "2h". */
export const formatDuration = (minutes: number): string => {
  const hours = Math.floor(minutes / 60);
  const rest = minutes % 60;
  if (!hours) return `${rest} min`;
  return rest ? `${hours}h ${rest}m` : `${hours}h`;
};

export const formatMinutes = minutesToTime;

/** Position of a minute on a day bar from `open` to `close`, as a percentage. */
export const barPercent = (minute: number, open: number, close: number): number => {
  if (close <= open) return 0;
  return Math.min(100, Math.max(0, ((minute - open) / (close - open)) * 100));
};
