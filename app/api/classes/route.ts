import { NextResponse } from "next/server";
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
    const events = (
      await Promise.all(ranges.map((range) => fetchBocconiEvents(range)))
    ).flat();
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
    return NextResponse.json(
      { error: "Unable to load the class catalog" },
      { status: 502 }
    );
  }
}
