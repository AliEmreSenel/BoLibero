import { normalizeTime, toMinutes, minutesToTime } from "./time";

export interface SlotRange {
  start: string;
  end: string;
}

// Free slots = opening window minus the union of busy intervals.
// Times are normalized, invalid rows skipped, and intervals clamped to the
// building's opening hours so overlapping classes cannot invent free time.
export const computeFreeSlots = (
  busyTimes: Array<{ start: string; end: string }>,
  dayStart: string,
  dayEnd: string,
  minGapMinutes = 15
): SlotRange[] => {
  const intervals: Array<[number, number]> = [];
  for (const event of busyTimes) {
    const start = normalizeTime(event.start);
    let end = normalizeTime(event.end);
    if (end === "24:00") end = "23:59";
    if (!start || !end || end <= start) continue;
    const from = Math.max(toMinutes(start), toMinutes(dayStart));
    const to = Math.min(toMinutes(end), toMinutes(dayEnd));
    if (to > from) intervals.push([from, to]);
  }
  intervals.sort((a, b) => a[0] - b[0]);

  const freeSlots: SlotRange[] = [];
  let cursor = toMinutes(dayStart);
  for (const [from, to] of intervals) {
    if (from - cursor > minGapMinutes) {
      freeSlots.push({ start: minutesToTime(cursor), end: minutesToTime(from) });
    }
    cursor = Math.max(cursor, to);
    if (cursor >= toMinutes(dayEnd)) break;
  }
  if (toMinutes(dayEnd) - cursor > minGapMinutes) {
    freeSlots.push({ start: minutesToTime(cursor), end: dayEnd });
  }
  return freeSlots;
};
