import { describe, expect, it } from "vitest";
import {
  buildWindows,
  formatDuration,
  longestWindow,
  roomStatusAt,
  studyWindowsOnly,
} from "@/lib/availability";

const m = (hhmm: string) => {
  const [h, mm] = hhmm.split(":").map(Number);
  return h * 60 + mm;
};

describe("buildWindows", () => {
  it("keeps free slots as free windows", () => {
    expect(buildWindows([{ start: "08:30", end: "10:00" }])).toEqual([
      { start: m("08:30"), end: m("10:00"), kind: "free" },
    ]);
  });

  it("splits a free slot around a study session", () => {
    const windows = buildWindows(
      [{ start: "12:00", end: "18:00" }],
      [{ start: "13:45", end: "17:00" }]
    );
    expect(windows).toEqual([
      { start: m("12:00"), end: m("13:45"), kind: "free" },
      { start: m("13:45"), end: m("17:00"), kind: "study" },
      { start: m("17:00"), end: m("18:00"), kind: "free" },
    ]);
  });

  it("drops leftover pieces shorter than 15 minutes", () => {
    const windows = buildWindows(
      [{ start: "13:35", end: "17:10" }],
      [{ start: "13:45", end: "17:00" }]
    );
    expect(windows).toEqual([{ start: m("13:45"), end: m("17:00"), kind: "study" }]);
    expect(studyWindowsOnly(windows)).toHaveLength(1);
  });

  it("ignores malformed times", () => {
    expect(buildWindows([{ start: "x", end: "10:00" }])).toEqual([]);
  });
});

describe("roomStatusAt", () => {
  const windows = buildWindows([
    { start: "10:00", end: "13:00" },
    { start: "14:30", end: "16:15" },
  ]);

  it("reports a free room with the time left", () => {
    const status = roomStatusAt(windows, m("11:40"));
    expect(status.state).toBe("free");
    expect(status.minutes).toBe(80);
    expect(status.longEnough).toBe(false);
  });

  it("reports a room freeing up within 15 minutes as soon", () => {
    const status = roomStatusAt(windows, m("14:20"));
    expect(status.state).toBe("soon");
    expect(status.minutes).toBe(10);
    expect(status.upcoming?.start).toBe(m("14:30"));
  });

  it("does not count a room freeing up in more than 15 minutes", () => {
    expect(roomStatusAt(windows, m("14:00")).state).toBe("busy");
  });

  it("treats a free stretch ending within 15 minutes as busy", () => {
    expect(roomStatusAt(windows, m("12:50")).state).toBe("busy");
  });

  it("qualifies for ≥ 2h from the stretch that makes the room available", () => {
    const long = buildWindows([{ start: "11:00", end: "15:00" }]);
    expect(roomStatusAt(long, m("11:40")).longEnough).toBe(true);
    expect(roomStatusAt(long, m("13:30")).longEnough).toBe(false);
    expect(roomStatusAt(long, m("10:50")).longEnough).toBe(true);
  });

  it("finds the next window for busy rooms", () => {
    expect(roomStatusAt(windows, m("13:10")).next?.start).toBe(m("14:30"));
  });
});

describe("helpers", () => {
  it("formats durations", () => {
    expect(formatDuration(45)).toBe("45 min");
    expect(formatDuration(120)).toBe("2h");
    expect(formatDuration(80)).toBe("1h 20m");
  });

  it("finds the longest window", () => {
    expect(longestWindow(buildWindows([{ start: "08:30", end: "09:30" }, { start: "12:00", end: "15:00" }]))).toBe(180);
  });
});
