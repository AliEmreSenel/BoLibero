import { describe, expect, it } from "vitest";
import { makeClassId, parseClassId } from "@/lib/bocconi-calendar";
import { normalizeTime, romeDateKey, romeMinutes, toMinutes, minutesToTime } from "@/lib/time";

describe("class ids", () => {
  it("round-trips code and section", () => {
    const id = makeClassId("30062", "Cl.43");
    expect(parseClassId(id)).toMatchObject({ code: "30062", section: "Cl.43" });
  });

  it("accepts a code without a section", () => {
    expect(parseClassId("30062::")).toMatchObject({ code: "30062", section: "" });
  });

  it("accepts sections with a space or Classe prefix", () => {
    const id = makeClassId("30062", "Cl. 43");
    expect(parseClassId(id)).toMatchObject({ code: "30062", section: "Cl. 43" });
    expect(parseClassId("30062::Classe 4")).toMatchObject({ code: "30062", section: "Classe 4" });
  });

  it("rejects malformed input", () => {
    expect(parseClassId("30062")).toBeNull();
    expect(parseClassId("::Cl.43")).toBeNull();
    expect(parseClassId("bad code!::Cl.43")).toBeNull();
    expect(parseClassId("30062::Section 4")).toBeNull();
    expect(parseClassId("x".repeat(101))).toBeNull();
  });
});

describe("time utils", () => {
  it("normalizes scraped times", () => {
    expect(normalizeTime("8:30")).toBe("08:30");
    expect(normalizeTime("24:00")).toBe("24:00");
    expect(normalizeTime("23:59")).toBe("23:59");
    expect(normalizeTime("24:01")).toBeNull();
    expect(normalizeTime("24:05")).toBeNull();
    expect(normalizeTime("8.30")).toBeNull();
    expect(normalizeTime("25:00")).toBeNull();
    expect(normalizeTime("10:60")).toBeNull();
  });

  it("converts minutes both ways", () => {
    expect(toMinutes("10:05")).toBe(605);
    expect(minutesToTime(605)).toBe("10:05");
  });

  it("reads Rome date and minutes across midnight", () => {
    const utcLate = new Date("2026-10-12T22:30:00Z"); // 00:30 Rome on the 13th
    expect(romeDateKey(utcLate)).toBe("2026-10-13");
    expect(romeMinutes(utcLate)).toBe(30);
  });
});
