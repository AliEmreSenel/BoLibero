import { NextResponse } from "next/server";
import * as Sentry from "@sentry/nextjs";
import { upstreamJsonFailure } from "@/app/api/upstream-failure";
import {
  eventTitle,
  fetchBocconiEvents,
  makeClassId,
  SUBSCRIPTION_REVALIDATE_SECONDS,
  SUBSCRIPTION_STALE_SECONDS,
  type ClassOption,
} from "@/lib/bocconi-calendar";

export const revalidate = 21600;

const addUtcDays = (date: Date, days: number) => {
  const result = new Date(date);
  result.setUTCDate(result.getUTCDate() + days);
  return result;
};

export async function GET() {
  const startDate = new Date();
  startDate.setUTCDate(startDate.getUTCDate() - 7);
  const endDate = new Date();
  endDate.setUTCDate(endDate.getUTCDate() + 35);

  try {
    // An unfiltered semester response is too large for Next's 2 MB data-cache
    // item limit. Weekly shards remain individually cacheable and are reused by
    // every catalog request.
    const ranges: Array<{ startDate: Date; endDate: Date }> = [];
    for (let cursor = startDate; cursor <= endDate; cursor = addUtcDays(cursor, 7)) {
      ranges.push({
        startDate: cursor,
        endDate: new Date(Math.min(addUtcDays(cursor, 6).getTime(), endDate.getTime())),
      });
    }
    // One flaky shard must not discard the good ones: collect what succeeded
    // and only fail the whole request when every shard failed.
    const settled = await Promise.allSettled(
      ranges.map((range) => fetchBocconiEvents(range))
    );
    const failures = settled.filter((result) => result.status === "rejected").length;
    // A truncated catalog from surviving shards would publish a campus-wide
    // list with vanished courses and be cached for 6h, so any shard failure
    // fails the whole request (no CDN write).
    if (failures > 0) {
      Sentry.captureMessage(`Class catalog: ${failures}/${settled.length} shards failed`, "warning");
      throw new Error(`${failures}/${settled.length} class catalog shards failed`);
    }
    const events = settled.flatMap(
      (result) => (result.status === "fulfilled" ? result.value : [])
    );
    const classes = new Map<string, ClassOption>();

    for (const event of events) {
      if (!event.code || !event.className) continue;
      const id = makeClassId(event.code, event.className);
      if (!classes.has(id)) {
        classes.set(id, {
          id,
          code: event.code,
          section: event.className,
          title: eventTitle(event),
        });
      }
    }

    const result = Array.from(classes.values()).sort(
      (a, b) =>
        a.code.localeCompare(b.code, undefined, { numeric: true }) ||
        a.section.localeCompare(b.section, undefined, { numeric: true })
    );

    // An empty catalog over a 42-day window means the scrape broke, not that
    // the semester is empty. Fail loudly (no CDN write) so the CDN keeps
    // serving the last good catalog via stale-while-revalidate.
    if (result.length === 0) {
      Sentry.captureMessage("Class catalog: scraped zero classes over 42 days", "warning");
      throw new Error("Zero classes scraped");
    }

    return NextResponse.json(
      { classes: result },
      {
        headers: {
          "Cache-Control": `public, s-maxage=${SUBSCRIPTION_REVALIDATE_SECONDS}, stale-while-revalidate=${SUBSCRIPTION_STALE_SECONDS}`,
        },
      }
    );
  } catch (error) {
    console.error("Failed to build class catalog:", error);
    return upstreamJsonFailure("Unable to load the class catalog");
  }
}
