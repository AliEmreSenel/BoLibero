import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

const { fetchBocconiEvents, captureMessage } = vi.hoisted(() => ({
  fetchBocconiEvents: vi.fn(),
  captureMessage: vi.fn(),
}));

// Exercise the loader without a Next.js incremental-cache server in unit tests.
vi.mock("next/cache", () => ({ unstable_cache: (loader: unknown) => loader }));
vi.mock("@/lib/bocconi-calendar", () => ({
  fetchBocconiEvents,
  SUBSCRIPTION_REVALIDATE_SECONDS: 21600,
}));
vi.mock("@sentry/nextjs", () => ({ captureMessage }));

import { fetchProfessorNames } from "@/lib/professors";

beforeEach(() => {
  vi.useFakeTimers();
  vi.setSystemTime(new Date("2026-10-28T09:00:00Z"));
  fetchBocconiEvents.mockReset();
  captureMessage.mockClear();
});

afterEach(() => vi.useRealTimers());

describe("professor list loader", () => {
  it("deduplicates and sorts names from thirteen aligned weekly shards", async () => {
    fetchBocconiEvents.mockResolvedValue([
      { teachers: ["Rossi A.", "Bianchi B.", "Rossi A."] },
    ]);

    expect(await fetchProfessorNames()).toEqual(["Bianchi B.", "Rossi A."]);
    expect(fetchBocconiEvents).toHaveBeenCalledTimes(13);
    expect(fetchBocconiEvents).toHaveBeenNthCalledWith(1, {
      startDate: new Date("2026-10-26T00:00:00Z"),
      endDate: new Date("2026-11-01T00:00:00Z"),
    });
    expect(fetchBocconiEvents).toHaveBeenNthCalledWith(13, {
      startDate: new Date("2027-01-18T00:00:00Z"),
      endDate: new Date("2027-01-24T00:00:00Z"),
    });
  });

  it("rejects total upstream failure so an empty list cannot replace the cache", async () => {
    fetchBocconiEvents.mockRejectedValue(new Error("upstream unavailable"));

    await expect(fetchProfessorNames()).rejects.toThrow("13/13 professor shards failed");
  });

  it("keeps surviving names and reports a partial upstream failure", async () => {
    fetchBocconiEvents
      .mockRejectedValueOnce(new Error("upstream unavailable"))
      .mockResolvedValue([{ teachers: ["Rossi A."] }]);

    expect(await fetchProfessorNames()).toEqual(["Rossi A."]);
    expect(captureMessage).toHaveBeenCalledWith(
      "Professor index: 1/13 shards failed",
      "warning"
    );
  });
});
