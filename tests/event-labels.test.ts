import { describe, expect, it } from "vitest";
import { getEventTypeLabel } from "@/lib/i18n";
import { eventCourseTitle } from "@/lib/event-matching";
import { summarizeClass } from "@/lib/bocconi-calendar";

describe("getEventTypeLabel", () => {
  it("translates the upstream types", () => {
    expect(getEventTypeLabel("Lezione", "en")).toBe("Lesson");
    expect(getEventTypeLabel("Attivita'", "en")).toBe("Activity");
    expect(getEventTypeLabel("Attivita'", "it")).toBe("Attività");
  });

  it("keeps a parenthetical suffix such as the exam kind", () => {
    expect(getEventTypeLabel("Esame (S)", "en")).toBe("Exam (S)");
    expect(getEventTypeLabel("Esame (S)", "it")).toBe("Esame (S)");
  });

  it("falls back to the raw type", () => {
    expect(getEventTypeLabel("Workshop", "en")).toBe("Workshop");
  });
});

describe("eventCourseTitle", () => {
  it("uses the first description line, not the section", () => {
    expect(
      eventCourseTitle({ description: "MANAGEMENT CONSULTING\nIMB", class: "Cl.31", type: "Lezione" })
    ).toBe("MANAGEMENT CONSULTING");
  });

  it("names exams from the description", () => {
    expect(
      eventCourseTitle({ description: "COST AND PERFORMANCE MANAGEMENT IN ARTS ORGANIZATIONS (1)", class: "", type: "Esame (S)" })
    ).toBe("COST AND PERFORMANCE MANAGEMENT IN ARTS ORGANIZATIONS (1)");
  });

  it("falls back to section, then type", () => {
    expect(eventCourseTitle({ description: "", class: "Cl.3", type: "Lezione" })).toBe("Cl.3");
    expect(eventCourseTitle({ description: " ", class: "", type: "Lezione" })).toBe("Lezione");
  });
});

describe("summarizeClass", () => {
  it("keeps the most frequent weekly meetings in weekday order", () => {
    const week = (date: string, start: string) => ({ date, start, teachers: ["ROSSI M."] });
    const summary = summarizeClass([
      week("2026-11-19", "10:15"), // Thursday
      week("2026-11-16", "08:30"), // Monday
      week("2026-11-26", "10:15"),
      week("2026-11-23", "08:30"),
      week("2026-11-28", "14:00"), // one-off Saturday make-up
    ]);
    expect(summary.teachers).toEqual(["ROSSI M."]);
    expect(summary.meetings).toEqual([
      { day: 1, start: "08:30" },
      { day: 4, start: "10:15" },
    ]);
  });
});
