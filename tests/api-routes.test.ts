import { readFileSync } from "node:fs";
import { NextRequest } from "next/server";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { GET as eventsGET } from "@/app/api/events/route";
import { GET as classesGET } from "@/app/api/classes/route";
import { GET as icsGET } from "@/app/api/calendar.ics/route";

const html = readFileSync(
  new URL("fixtures/schedule-table.html", import.meta.url),
  "utf8"
);

const htmlResponse = (body = html) =>
  new Response(body, {
    status: 200,
    headers: { "Content-Type": "text/html" },
  });

const upstreamQueryOf = (call: unknown[]) =>
  new URL(String(call[0])).searchParams.get("ric_descriz");

beforeEach(() => {
  vi.spyOn(console, "error").mockImplementation(() => {});
});

afterEach(() => {
  vi.unstubAllGlobals();
  vi.restoreAllMocks();
});

describe("GET /api/events", () => {
  it("scopes class queries upstream by class code", async () => {
    const fetchMock = vi.fn<(input: URL | RequestInfo) => Promise<Response>>(
      async () => htmlResponse()
    );
    vi.stubGlobal("fetch", fetchMock);

    const response = await eventsGET(
      new NextRequest(
        "http://localhost/api/events?class=30062::Cl.43&from=2026-10-01&to=2026-10-03"
      )
    );

    expect(response.status).toBe(200);
    expect(response.headers.get("Cache-Control")).toContain("s-maxage=300");
    expect(fetchMock).toHaveBeenCalledTimes(1);
    expect(upstreamQueryOf(fetchMock.mock.calls[0])).toBe("30062");

    const body = await response.json();
    expect(body.events).toHaveLength(1);
    expect(body.events[0].class).toBe("Cl.43");
  });

  it("keeps room queries room-scoped and caches 200 responses", async () => {
    const fetchMock = vi.fn<(input: URL | RequestInfo) => Promise<Response>>(
      async () => htmlResponse()
    );
    vi.stubGlobal("fetch", fetchMock);

    const response = await eventsGET(
      new NextRequest(
        "http://localhost/api/events?room=Aula%201&building=Sarfatti%2025&from=2026-10-01&to=2026-10-03"
      )
    );

    expect(response.status).toBe(200);
    expect(response.headers.get("Cache-Control")).toContain("s-maxage=300");
    const url = new URL(String(fetchMock.mock.calls[0][0]));
    expect(url.searchParams.get("ric_aula")).toBe("Aula 1");
  });

  it("treats a zero-event day-mode scrape as a failure with no-store", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn(async () => htmlResponse("<html><body>no table</body></html>"))
    );

    const response = await eventsGET(
      new NextRequest("http://localhost/api/events?day=2026-10-01")
    );

    expect(response.status).toBe(502);
    expect(response.headers.get("Cache-Control")).toBe("no-store");
  });

  it("serves day-mode schedules when the scrape has events", async () => {
    vi.stubGlobal("fetch", vi.fn(async () => htmlResponse()));

    const response = await eventsGET(
      new NextRequest("http://localhost/api/events?day=2026-10-01")
    );

    expect(response.status).toBe(200);
    const body = await response.json();
    expect(body.events).toHaveLength(1);
  });
});

describe("GET /api/classes", () => {
  it("fails with no-store when any shard fails", async () => {
    let calls = 0;
    vi.stubGlobal(
      "fetch",
      vi.fn(async () => {
        calls += 1;
        if (calls === 2) throw new Error("shard down");
        return htmlResponse();
      })
    );

    const response = await classesGET();

    expect(response.status).toBe(502);
    expect(response.headers.get("Cache-Control")).toBe("no-store");
  });

  it("caches the catalog when all shards succeed", async () => {
    vi.stubGlobal("fetch", vi.fn(async () => htmlResponse()));

    const response = await classesGET();

    expect(response.status).toBe(200);
    expect(response.headers.get("Cache-Control")).toContain("s-maxage=21600");
    const body = await response.json();
    expect(body.classes.map((item: { id: string }) => item.id)).toEqual([
      "20127::Cl.12",
      "30062::Cl.43",
    ]);
  });
});

describe("GET /api/calendar.ics", () => {
  const url =
    "http://localhost/api/calendar.ics?class=30062::Cl.43&class=20127::Cl.12";

  it("fails with no-store when any class fetch fails", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn(async (input: URL | RequestInfo) => {
        if (new URL(String(input)).searchParams.get("ric_descriz") === "20127") {
          throw new Error("class down");
        }
        return htmlResponse();
      })
    );

    const response = await icsGET(new NextRequest(url));

    expect(response.status).toBe(502);
    expect(response.headers.get("Cache-Control")).toBe("no-store");
  });

  it("caches the feed when every class fetch succeeds", async () => {
    vi.stubGlobal("fetch", vi.fn(async () => htmlResponse()));

    const response = await icsGET(new NextRequest(url));

    expect(response.status).toBe(200);
    expect(response.headers.get("Cache-Control")).toContain("s-maxage=21600");
    const body = await response.text();
    expect(body).toContain("BEGIN:VCALENDAR");
    expect(body.match(/BEGIN:VEVENT/g)).toHaveLength(2);
  });
});
