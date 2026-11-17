import { describe, expect, it } from "vitest";
import {
  filterProfessors,
  professorHref,
  professorInitials,
  professorsHref,
} from "@/lib/professor-search";

const professors = ["Bianchi Anna", "D’Angelo José", "Rossi M.", "Élodie Anne-Marie"];

describe("professor name search", () => {
  it.each(["", "   ", "… - '"])("shows all names for an empty search (%s)", (query) => {
    expect(filterProfessors(professors, query)).toEqual(professors);
  });

  it.each([
    ["ROSS", ["Rossi M."]],
    ["jose", ["D’Angelo José"]],
    ["Jose\u0301", ["D’Angelo José"]],
    ["jose dangelo", ["D’Angelo José"]],
    ["  m   rossi  ", ["Rossi M."]],
    ["M.,ROSSI", ["Rossi M."]],
    ["jose d'angelo", ["D’Angelo José"]],
    ["AnneMarie elodie", ["Élodie Anne-Marie"]],
    ["Bianchi José", []],
    ["unknown", []],
  ])("matches %s against the published names", (query, expected) => {
    expect(filterProfessors(professors, query)).toEqual(expected);
  });

  it("preserves published spelling and order without modifying the list", () => {
    const names = ["ROSSI M.", "Rossi Maria", "ROSSI Marco"];
    expect(filterProfessors(names, "rossi")).toEqual(names);
    expect(names).toEqual(["ROSSI M.", "Rossi Maria", "ROSSI Marco"]);
    expect(filterProfessors([], "rossi")).toEqual([]);
  });
});

describe("professor search navigation", () => {
  it("encodes names and carries the exact query to the calendar and back", () => {
    const name = "D’Angelo José / M.";
    const query = "José + D'Angelo & M? #1";
    const detail = new URL(professorHref(name, query), "https://example.test");

    expect(decodeURIComponent(detail.pathname.slice("/professor/".length))).toBe(name);
    expect(detail.searchParams.get("q")).toBe(query);
    expect(detail.hash).toBe("");

    const back = new URL(professorsHref(detail.searchParams.get("q") ?? ""), detail);
    expect(back.pathname).toBe("/professors");
    expect(back.searchParams.get("q")).toBe(query);
  });

  it("leaves direct calendar visits and cleared searches free of empty parameters", () => {
    expect(professorHref("Rossi M.", "")).toBe("/professor/Rossi%20M.");
    expect(professorsHref("")).toBe("/professors");
  });

  it.each([
    ["ROSSI M.", "RM"],
    ["  Élodie   Anne-Marie ", "ÉA"],
    ["Bianchi", "B"],
  ])("uses the same initials for search results and calendars (%s)", (name, expected) => {
    expect(professorInitials(name)).toBe(expected);
  });
});
