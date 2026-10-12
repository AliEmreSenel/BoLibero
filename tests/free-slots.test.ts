import { describe, expect, it } from "vitest";
import { computeFreeSlots } from "@/lib/free-slots";

const DAY = { start: "08:00", end: "20:00" };

describe("computeFreeSlots", () => {
  it("returns the full open window when nothing is busy", () => {
    expect(computeFreeSlots([], DAY.start, DAY.end)).toEqual([
      { start: "08:00", end: "20:00" },
    ]);
  });

  it("merges overlapping classes into one busy block", () => {
    const slots = computeFreeSlots(
      [
        { start: "08:30", end: "10:00" },
        { start: "09:30", end: "11:45" },
        { start: "12:05", end: "13:00" },
        { start: "13:30", end: "24:00" },
      ],
      DAY.start,
      DAY.end
    );
    expect(slots).toEqual([
      { start: "08:00", end: "08:30" },
      { start: "11:45", end: "12:05" },
      { start: "13:00", end: "13:30" },
    ]);
  });

  it("clamps classes to opening hours", () => {
    const slots = computeFreeSlots(
      [{ start: "06:00", end: "09:00" }],
      DAY.start,
      DAY.end
    );
    expect(slots).toEqual([{ start: "09:00", end: "20:00" }]);
  });

  it("skips malformed and inverted times", () => {
    const slots = computeFreeSlots(
      [
        { start: "8.30", end: "09:00" },
        { start: "10:00", end: "10:00" },
        { start: "12:00", end: "11:00" },
      ],
      DAY.start,
      DAY.end
    );
    expect(slots).toEqual([{ start: "08:00", end: "20:00" }]);
  });

  it("drops gaps of 15 minutes or less", () => {
    const slots = computeFreeSlots(
      [
        { start: "08:00", end: "10:00" },
        { start: "10:10", end: "12:00" },
      ],
      DAY.start,
      DAY.end
    );
    expect(slots).toEqual([{ start: "12:00", end: "20:00" }]);
  });
});
