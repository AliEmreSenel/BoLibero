import { createHash } from "node:crypto";
import { type NextRequest, NextResponse } from "next/server";
import * as Sentry from "@sentry/nextjs";
import {
  eventTitle,
  fetchBocconiEvents,
  makeClassId,
  parseClassId,
  SUBSCRIPTION_REVALIDATE_SECONDS,
  SUBSCRIPTION_STALE_SECONDS,
  type BocconiEvent,
} from "@/lib/bocconi-calendar";

export const revalidate = 21600;
const MAX_CLASSES = 20;
const UPSTREAM_CONCURRENCY = 4;

const mapWithConcurrency = async <T, R>(
  items: T[],
  limit: number,
  task: (item: T) => Promise<R>
) => {
  const results = new Array<R>(items.length);
  let nextIndex = 0;

  const worker = async () => {
    while (nextIndex < items.length) {
      const index = nextIndex++;
      results[index] = await task(items[index]);
    }
  };

  await Promise.all(
    Array.from({ length: Math.min(limit, items.length) }, () => worker())
  );
  return results;
};

const icsEscape = (value: string) =>
  value
    .replace(/\\/g, "\\\\")
    .replace(/\r?\n/g, "\\n")
    .replace(/,/g, "\\,")
    .replace(/;/g, "\\;");

const foldLine = (line: string) => {
  const encoder = new TextEncoder();
  const parts: string[] = [];
  let current = "";
  let limit = 73;

  for (const character of line) {
    if (encoder.encode(current + character).length > limit && current) {
      parts.push(current);
      current = character;
      limit = 72;
    } else {
      current += character;
    }
  }
  parts.push(current);
  return parts.join("\r\n ");
};

const localDateTime = (date: string, time: string) =>
  `${date.replaceAll("-", "")}T${time.replace(":", "")}00`;

const eventUid = (event: BocconiEvent) => {
  const identity = [
    event.date,
    event.start,
    event.end,
    event.code,
    event.className,
    event.roomRaw,
  ].join("|");
  return `${createHash("sha256").update(identity).digest("hex").slice(0, 24)}@bolibero.it`;
};

function createCalendar(events: BocconiEvent[]) {
  const generatedAt = new Date()
    .toISOString()
    .replace(/[-:]/g, "")
    .replace(/\.\d{3}Z$/, "Z");
  const lines = [
    "BEGIN:VCALENDAR",
    "VERSION:2.0",
    "PRODID:-//BoLibero//Class subscription calendar//EN",
    "CALSCALE:GREGORIAN",
    "METHOD:PUBLISH",
    "X-WR-CALNAME:BoLibero Classes",
    "X-WR-TIMEZONE:Europe/Rome",
    "REFRESH-INTERVAL;VALUE=DURATION:PT6H",
    "X-PUBLISHED-TTL:PT6H",
    "BEGIN:VTIMEZONE",
    "TZID:Europe/Rome",
    "X-LIC-LOCATION:Europe/Rome",
    "BEGIN:DAYLIGHT",
    "TZOFFSETFROM:+0100",
    "TZOFFSETTO:+0200",
    "TZNAME:CEST",
    "DTSTART:19700329T020000",
    "RRULE:FREQ=YEARLY;BYMONTH=3;BYDAY=-1SU",
    "END:DAYLIGHT",
    "BEGIN:STANDARD",
    "TZOFFSETFROM:+0200",
    "TZOFFSETTO:+0100",
    "TZNAME:CET",
    "DTSTART:19701025T030000",
    "RRULE:FREQ=YEARLY;BYMONTH=10;BYDAY=-1SU",
    "END:STANDARD",
    "END:VTIMEZONE",
  ];

  for (const event of events) {
    const details = [
      `${event.code} ${event.className}`.trim(),
      event.type,
      event.teacherRaw && `Teachers: ${event.teacherRaw}`,
    ]
      .filter(Boolean)
      .join("\n");

    lines.push(
      "BEGIN:VEVENT",
      `UID:${eventUid(event)}`,
      `DTSTAMP:${generatedAt}`,
      `DTSTART;TZID=Europe/Rome:${localDateTime(event.date, event.start)}`,
      `DTEND;TZID=Europe/Rome:${localDateTime(event.date, event.end)}`,
      `SUMMARY:${icsEscape(`${eventTitle(event)} (${event.className})`)}`,
      `DESCRIPTION:${icsEscape(details)}`,
      `LOCATION:${icsEscape(event.roomRaw)}`,
      "STATUS:CONFIRMED",
      "SEQUENCE:0",
      "END:VEVENT"
    );
  }

  lines.push("END:VCALENDAR");
  return `${lines.map(foldLine).join("\r\n")}\r\n`;
}

export async function GET(request: NextRequest) {
  const requested = Array.from(
    new Set(request.nextUrl.searchParams.getAll("class"))
  );
  if (requested.length === 0) {
    return new NextResponse("Select at least one class.", { status: 400 });
  }
  if (requested.length > MAX_CLASSES) {
    return new NextResponse(`A calendar can contain up to ${MAX_CLASSES} classes.`, {
      status: 400,
    });
  }

  const selected = requested.map(parseClassId);
  if (selected.some((item) => !item)) {
    return new NextResponse("One or more class identifiers are invalid.", {
      status: 400,
    });
  }

  const selectedClasses = selected.filter(
    (item): item is NonNullable<typeof item> => Boolean(item)
  );
  const selectedIds = new Set(selectedClasses.map((item) => item.id));
  const uniqueCodes = Array.from(
    new Set(selectedClasses.map((item) => item.code))
  );

  // Align the 6-month history / 12-month future window to calendar months.
  // This gives every request made during the same month identical upstream
  // cache keys instead of creating a new cache entry every day.
  const now = new Date();
  const startDate = new Date(
    Date.UTC(now.getUTCFullYear(), now.getUTCMonth() - 6, 1)
  );
  const endDate = new Date(
    Date.UTC(now.getUTCFullYear(), now.getUTCMonth() + 13, 0)
  );

  try {
    // A failing class code must not 502 the whole subscription: serve the
    // classes that loaded, warn on partials, fail only when all fetches fail.
    type Group = { evs: BocconiEvent[] | null };
    const groups = await mapWithConcurrency<string, Group>(
      uniqueCodes,
      UPSTREAM_CONCURRENCY,
      (code) =>
        fetchBocconiEvents({ startDate, endDate, query: code })
          .then((evs) => ({ evs }))
          .catch(() => ({ evs: null }))
    );
    const failures = groups.filter((group) => group.evs === null).length;
    if (failures === groups.length) {
      throw new Error("All class event fetches failed");
    }
    if (failures > 0) {
      Sentry.captureMessage(`Subscription feed: ${failures}/${groups.length} class fetches failed`, "warning");
    }
    const eventGroups = groups
      .filter((group): group is { evs: BocconiEvent[] } => group.evs !== null)
      .map((group) => group.evs);
    const seen = new Set<string>();
    const events = eventGroups
      .flat()
      .filter((event) =>
        selectedIds.has(makeClassId(event.code, event.className))
      )
      .filter((event) => {
        const key = eventUid(event);
        if (seen.has(key)) return false;
        seen.add(key);
        return true;
      })
      .sort(
        (a, b) =>
          a.date.localeCompare(b.date) || a.start.localeCompare(b.start)
      );

    // Zero events for a validated bundle over a 19-month window means the
    // scrape broke, not that the student has no classes. Fail loudly (no CDN
    // write) so subscribers keep the last good calendar via stale-while-revalidate.
    if (events.length === 0) {
      Sentry.captureMessage("Subscription feed: scraped zero events over 19 months", "warning");
      throw new Error("Zero events scraped");
    }

    return new NextResponse(createCalendar(events), {
      headers: {
        "Cache-Control": `public, s-maxage=${SUBSCRIPTION_REVALIDATE_SECONDS}, stale-while-revalidate=${SUBSCRIPTION_STALE_SECONDS}`,
        "Content-Disposition": 'inline; filename="bolibero-classes.ics"',
        "Content-Type": "text/calendar; charset=utf-8",
      },
    });
  } catch (error) {
    console.error("Failed to generate subscription calendar:", error);
    return new NextResponse("Unable to generate the calendar right now.", {
      status: 502,
    });
  }
}
