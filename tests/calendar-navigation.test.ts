import { describe, expect, it } from "vitest";
import { calendarRange } from "@/lib/calendar-navigation";

describe("calendar data window", () => {
  it("includes the days from adjacent months in the first and last visible weeks", () => {
    expect(calendarRange(new Date(2026, 10, 17))).toEqual({
      from: "2026-10-26",
      to: "2026-12-06",
    });
  });

  it("uses local dates across the Rome daylight-saving change", () => {
    expect(calendarRange(new Date(2026, 2, 29))).toEqual({
      from: "2026-02-23",
      to: "2026-04-05",
    });
  });

  it("handles year boundaries without losing dates", () => {
    expect(calendarRange(new Date(2027, 0, 1))).toEqual({
      from: "2026-12-28",
      to: "2027-01-31",
    });
  });
});
