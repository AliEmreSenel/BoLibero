import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";
import { parseBocconiSchedule } from "@/lib/bocconi-calendar";

const html = readFileSync(
  new URL("fixtures/schedule-table.html", import.meta.url),
  "utf8"
);
const events = parseBocconiSchedule(html);

describe("parseBocconiSchedule", () => {
  it("keeps only rows with a full schedule shape", () => {
    expect(events).toHaveLength(4);
  });

  it("converts Italian dates to ISO and pads them", () => {
    expect(events[0].date).toBe("2026-10-01");
    expect(events[1].date).toBe("2026-10-02");
  });

  it("splits code and section from the codice cell", () => {
    expect(events[0].code).toBe("30062");
    expect(events[0].className).toBe("Cl.43");
  });

  it("decodes HTML entities and keeps description line breaks", () => {
    expect(events[0].description).toBe(
      "MATEMATICA - MODULO 1\nGENERALE / MATHEMATICS & STATS"
    );
  });

  it("parses rooms into name + last-part building", () => {
    expect(events[0].rooms).toEqual([
      { roomName: "Aula 1", building: "Sarfatti 25" },
      { roomName: "Aula 11", building: "Sarfatti 25" },
    ]);
  });

  it("splits teachers on the dash separator", () => {
    expect(events[0].teachers).toEqual(["SAVOCHKIN A.", "MILANI S."]);
  });

  it("keeps hyphenated professor names as one teacher", () => {
    expect(events[2].teachers).toEqual(["GARCIA-LOPEZ J."]);
  });

  it("normalizes unpadded scraped times", () => {
    expect(events[2].start).toBe("08:30");
    expect(events[2].end).toBe("09:45");
  });

  it("canonicalizes sections written as 'Cl. 43' with a space", () => {
    expect(events[2].code).toBe("30062");
    expect(events[2].className).toBe("Cl.43");
  });

  it("decodes Italian named entities and keeps out-of-range numeric entities raw", () => {
    expect(events[2].description).toBe(
      "STATISTICA è APPLICATA €\nSEDE MILANO è &#x7FFFFFFF; § 1°"
    );
  });

  it("sorts by date then start time", () => {
    const keys = events.map((e) => `${e.date}T${e.start}`);
    expect(keys).toEqual([...keys].sort());
  });
});
