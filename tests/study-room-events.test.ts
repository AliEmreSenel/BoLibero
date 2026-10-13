import { describe, expect, it } from "vitest";
import { isFreeTimeEvent, isStudyRoomEvent } from "@/lib/constants";

describe("study-room event markers", () => {
  it("detects the marker in the description (current upstream shape)", () => {
    const upstream = { type: "Attivita'", description: "Aule studio" };
    expect(isFreeTimeEvent(upstream)).toBe(true);
    expect(isStudyRoomEvent(upstream)).toBe(true);
  });

  it("detects the marker in the type (older feed shape)", () => {
    expect(isFreeTimeEvent({ type: "Aule studio", description: "" })).toBe(true);
    expect(isStudyRoomEvent({ type: "Aula Studio", description: "x" })).toBe(true);
    expect(isFreeTimeEvent({ type: "Studio", description: "" })).toBe(true);
  });

  it("does not match class titles that merely contain studio", () => {
    const lecture = { type: "Lezione", description: "MAFINRISK - Aula studio" };
    expect(isFreeTimeEvent(lecture)).toBe(false);
    expect(isStudyRoomEvent(lecture)).toBe(false);
  });
});
