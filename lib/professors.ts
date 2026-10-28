import { cache } from "react";
import { unstable_cache } from "next/cache";
import * as Sentry from "@sentry/nextjs";
import { fetchBocconiEvents, SUBSCRIPTION_REVALIDATE_SECONDS } from "./bocconi-calendar";

const PROFESSOR_WINDOW_DAYS = 91;
const DAY_MS = 86_400_000;
const WEEK_MS = 7 * DAY_MS;
const WEEK_ANCHOR_MS = Date.UTC(2024, 0, 1);

// Cache the parsed names, not just the upstream HTML: otherwise every page
// validation reparses thirteen weekly tables, even when fetch hits its cache.
const getCachedProfessorNames = unstable_cache(
  async (start: number): Promise<string[]> => {
    const end = start + PROFESSOR_WINDOW_DAYS * DAY_MS;
    const ranges: Array<{ startDate: Date; endDate: Date }> = [];
    for (let cursor = start; cursor < end; cursor += WEEK_MS) {
      ranges.push({
        startDate: new Date(cursor),
        endDate: new Date(Math.min(cursor + 6 * DAY_MS, end)),
      });
    }

    const settled = await Promise.allSettled(
      ranges.map((range) => fetchBocconiEvents(range))
    );
    const failures = settled.filter((result) => result.status === "rejected").length;
    // Throw on total failure so ISR retains the last good list and page.
    if (failures === settled.length) {
      throw new Error(`${failures}/${settled.length} professor shards failed`);
    }
    if (failures > 0) {
      Sentry.captureMessage(
        `Professor index: ${failures}/${settled.length} shards failed`,
        "warning"
      );
    }

    const names = new Set<string>();
    for (const result of settled) {
      if (result.status === "fulfilled") {
        for (const event of result.value) {
          for (const teacher of event.teachers) names.add(teacher);
        }
      }
    }
    return Array.from(names).sort((a, b) => a.localeCompare(b, "it"));
  },
  ["professor-names-v1"],
  { revalidate: SUBSCRIPTION_REVALIDATE_SECONDS }
);

// Share the lookup between metadata and page validation in one render. The
// week is also part of the persistent cache key, keeping the window current.
export const fetchProfessorNames = cache(() => {
  const start =
    WEEK_ANCHOR_MS + Math.floor((Date.now() - WEEK_ANCHOR_MS) / WEEK_MS) * WEEK_MS;
  return getCachedProfessorNames(start);
});
