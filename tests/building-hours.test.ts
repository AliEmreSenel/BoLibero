import { describe, expect, it } from "vitest";
import { getBuildingHours } from "@/lib/building-hours";

describe("getBuildingHours", () => {
  it("returns normal hours on a regular weekday", () => {
    expect(getBuildingHours("Sarfatti 25", new Date(2026, 9, 12))).toEqual({
      start: "08:00",
      end: "20:00",
    });
  });

  it("returns building-specific Saturday hours", () => {
    expect(getBuildingHours("Sarfatti 25", new Date(2026, 9, 17))).toEqual({
      start: "08:00",
      end: "18:00",
    });
  });

  it("is closed on Sundays", () => {
    expect(getBuildingHours("Sarfatti 25", new Date(2026, 9, 18))).toBeNull();
  });

  it("is closed on 2026 national holidays", () => {
    for (const [year, month, day] of [
      [2026, 3, 6], // Easter Monday
      [2026, 3, 25], // Liberation Day
      [2026, 7, 15], // Assumption
      [2026, 11, 25], // Christmas
    ] as const) {
      expect(getBuildingHours("Sarfatti 25", new Date(year, month, day))).toBeNull();
    }
  });

  it("uses the LOCAL date key, not the UTC one", () => {
    // 00:30 in Rome on Epiphany is Jan 5 23:30 UTC; the old UTC key would
    // report Jan 5 (open) instead of Jan 6 (closed).
    expect(
      getBuildingHours("Sarfatti 25", new Date(2026, 0, 6, 0, 30))
    ).toBeNull();
  });
});
