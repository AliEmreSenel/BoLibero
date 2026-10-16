import { normalizeTime, toMinutes, minutesToTime } from "./time";

export interface SlotRange {
  start: string;
  end: string;
}

// Free slots = opening window minus the union of busy intervals.
// Times are normalized, invalid rows skipped, events crossing midnight are
// split into evening + early-morning parts, and intervals are clamped to the
// building's opening hours so overlapping classes cannot invent free time.
// A gap is free when it is at least minGapMinutes long.
export const computeFreeSlots = (
  busyTimes: Array<{ start: string; end: string }>,
  dayStart: string,
  dayEnd: string,
  minGapMinutes = 15
): SlotRange[] => {
  const dayStartMin = toMinutes(dayStart);
  const dayEndMin = toMinutes(dayEnd);
  const midnight = toMinutes("24:00");
  const intervals: Array<[number, number]> = [];
  for (const event of busyTimes) {
    const start = normalizeTime(event.start);
    const end = normalizeTime(event.end);
    if (!start || !end) continue;
    const s = toMinutes(start);
    const e = toMinutes(end);
    const parts: Array<[number, number]> =
      s < e ? [[s, e]] : e < s ? [[s, midnight], [0, e]] : [];
    for (const [from, to] of parts) {
      const clampedFrom = Math.max(from, dayStartMin);
      const clampedTo = Math.min(to, dayEndMin);
      if (clampedTo > clampedFrom) intervals.push([clampedFrom, clampedTo]);
    }
  }
  intervals.sort((a, b) => a[0] - b[0]);

  const freeSlots: SlotRange[] = [];
  const isGap = (from: number, to: number) =>
    to > from && to - from >= minGapMinutes;
  let cursor = dayStartMin;
  for (const [from, to] of intervals) {
    if (isGap(cursor, from)) {
      freeSlots.push({ start: minutesToTime(cursor), end: minutesToTime(from) });
    }
    cursor = Math.max(cursor, to);
    if (cursor >= dayEndMin) break;
  }
  if (isGap(cursor, dayEndMin)) {
    freeSlots.push({ start: minutesToTime(cursor), end: dayEnd });
  }
  return freeSlots;
};
