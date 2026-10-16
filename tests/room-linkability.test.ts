import { describe, expect, it } from "vitest";
import { isLinkableRoomName, normalizeEntity } from "@/lib/constants";

describe("room linkability", () => {
  it("links real rooms", () => {
    expect(isLinkableRoomName("Aula 1")).toBe(true);
    expect(isLinkableRoomName("1-E4-SR01")).toBe(true);
    expect(isLinkableRoomName("Aula Franceschi")).toBe(true);
  });

  it("never links virtual attendance markers", () => {
    expect(isLinkableRoomName("Virtual Class")).toBe(false);
    expect(isLinkableRoomName("LIVE ROOM")).toBe(false);
    expect(isLinkableRoomName("Aula 1 (fuori sede)")).toBe(false);
    expect(isLinkableRoomName("Off Campus")).toBe(false);
    expect(isLinkableRoomName("   ")).toBe(false);
  });
});

describe("normalizeEntity hyphen folding", () => {
  it("folds unicode hyphens to ASCII so feed codes match config codes", () => {
    expect(normalizeEntity("1‑E4‑SR01")).toBe(normalizeEntity("1-E4-SR01"));
    expect(normalizeEntity("1–C1–10")).toBe(normalizeEntity("1-C1-10"));
    expect(normalizeEntity("1−D1−05")).toBe(normalizeEntity("1-D1-05"));
  });
});
