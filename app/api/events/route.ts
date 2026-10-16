import { type NextRequest, NextResponse } from "next/server";
import {
  fetchBocconiEvents,
  makeClassId,
  parseClassId,
} from "@/lib/bocconi-calendar";
import { BUILDING_CONFIG } from "@/lib/constants";
import { isFreeTimeEvent } from "@/lib/constants";
import {
  exactProfMatch,
  exactRoomMatch,
  toClientEvent,
} from "@/lib/event-matching";
import { upstreamJsonFailure } from "@/app/api/upstream-failure";

// One parser, one truth: the UI pages get the same server-parsed events as the
// ICS feed (parseBocconiSchedule), replacing the browser DOMParser twin.
// Five-minute freshness matches the app's availability promise.
const UPSTREAM_REVALIDATE_SECONDS = 300;

// The unfiltered campus query returns the full table and is markedly slower
// upstream than a room-scoped one.
const DAY_MODE_TIMEOUT_MS = 25_000;

const DATE_RE = /^\d{4}-\d{2}-\d{2}$/;

const badRequest = (message: string) =>
  NextResponse.json({ error: message }, { status: 400 });

export async function GET(request: NextRequest) {
  const params = request.nextUrl.searchParams;
  const room = (params.get("room") ?? "").trim();
  const building = (params.get("building") ?? "").trim();
  const prof = (params.get("prof") ?? "").trim();
  const classId = (params.get("class") ?? "").trim();
  const day = (params.get("day") ?? "").trim();

  // day mode: the whole campus schedule for one date (drives the home grid).
  const from = day || (params.get("from") ?? "");
  const to = day || (params.get("to") ?? "");

  if (!DATE_RE.test(from) || !DATE_RE.test(to) || from > to) {
    return badRequest("from and to must be YYYY-MM-DD with from <= to");
  }
  const days =
    (Date.parse(`${to}T00:00:00Z`) - Date.parse(`${from}T00:00:00Z`)) /
    86_400_000;
  if (days > 120) return badRequest("date window is limited to 120 days");

  if (day) {
    if (room || prof || classId) {
      return badRequest("day mode takes no room, prof or class");
    }
  } else if ([room, prof, classId].filter(Boolean).length !== 1) {
    return badRequest("exactly one of room, prof or class is required");
  }
  if (room.length > 120 || prof.length > 120 || classId.length > 160) {
    return badRequest("query is too long");
  }
  if (classId && !parseClassId(classId)) {
    return badRequest("class must be a valid class id");
  }
  if (room && !(BUILDING_CONFIG[building]?.rooms ?? []).includes(room)) {
    return badRequest("room must be a tracked room of the given building");
  }

  try {
    const events = await fetchBocconiEvents({
      startDate: new Date(`${from}T00:00:00Z`),
      endDate: new Date(`${to}T00:00:00Z`),
      room: room || undefined,
      // Scope the scrape upstream: an empty query fetches the whole campus.
      query: room ? undefined : classId ? parseClassId(classId)?.code : prof,
      revalidateSeconds: UPSTREAM_REVALIDATE_SECONDS,
      timeoutMs: day ? DAY_MODE_TIMEOUT_MS : classId ? DAY_MODE_TIMEOUT_MS : undefined,
    });

    // Zero events for an unfiltered whole-campus day query means the scrape
    // broke, not that the campus is empty. Fail loudly (no CDN write).
    if (day && events.length === 0) {
      throw new Error("Zero events scraped for day mode");
    }

    const matched = events.filter((event) => {
      const inRange = event.date >= from && event.date <= to;
      if (!inRange) return false;
      if (day) return true;
      if (room) return exactRoomMatch(room, event.rooms) && !isFreeTimeEvent(event);
      if (classId) {
        return (
          !isFreeTimeEvent(event) &&
          makeClassId(event.code, event.className) === classId
        );
      }
      return exactProfMatch(prof, event.teachers);
    });

    return NextResponse.json(
      { events: matched.map(toClientEvent) },
      {
        headers: {
          "Cache-Control": "public, s-maxage=300, stale-while-revalidate=3600",
        },
      },
    );
  } catch (error) {
    console.error("events route: upstream failure:", error);
    return upstreamJsonFailure("Failed to fetch schedule data");
  }
}
