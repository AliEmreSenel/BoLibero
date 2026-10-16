import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { ScheduleFetcher } from "@/lib/schedule-fetcher";
import type { ClientEvent } from "@/lib/event-matching";

const captureMessage = vi.hoisted(() => vi.fn());
vi.mock("@sentry/nextjs", () => ({ captureMessage }));

const DAY1 = new Date(2026, 9, 19); // Monday
const DAY1_KEY = "2026-10-19";
const DAY2 = new Date(2026, 9, 20); // Tuesday

const event = (overrides: Partial<ClientEvent> = {}): ClientEvent => ({
  date: DAY1_KEY,
  start: "10:00",
  end: "12:00",
  type: "Lezione",
  code: "FIN001",
  class: "Cl. A",
  description: "Finance",
  teachers: ["Rossi."],
  rooms: [{ roomName: "Aula 1", building: "Sarfatti 25" }],
  teacher_raw: "Rossi.",
  room_raw: "Aula 1, Sarfatti 25",
  isStudyRoom: false,
  ...overrides,
});

const response = (events: ClientEvent[]) => ({
  ok: true,
  json: async () => ({ events }),
});

const dayOf = (url: unknown) =>
  new URL(String(url), "http://localhost").searchParams.get("day");

const fetcher = ScheduleFetcher.getInstance();

beforeEach(() => {
  fetcher.clearCache();
  captureMessage.mockClear();
});

afterEach(() => {
  vi.unstubAllGlobals();
  vi.restoreAllMocks();
});

describe("getFreeTimeSlots is date-scoped", () => {
  it("reports slots from the requested date, not the last fetched one", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn(async (url: unknown) =>
        response(dayOf(url) === DAY1_KEY ? [event()] : [])
      )
    );

    await fetcher.fetchScheduleForDate(DAY1);
    await fetcher.fetchScheduleForDate(DAY2);

    expect(fetcher.getFreeTimeSlots("Sarfatti 25", "Aula 1", DAY1)).toEqual([
      { start: "08:30", end: "10:00" },
      { start: "12:00", end: "20:00" },
    ]);
    expect(fetcher.getFreeTimeSlots("Sarfatti 25", "Aula 1", DAY2)).toEqual([
      { start: "08:30", end: "20:00" },
    ]);
  });
});

describe("room to building resolution", () => {
  it("places events with trailing placement parts via the canonical room map", async () => {
    // "Aula 1, Sarfatti 25, Piano 1" makes parseRooms report "Piano 1" as
    // the building; the room is the reliable key.
    vi.stubGlobal(
      "fetch",
      vi.fn(async () =>
        response([
          event({
            rooms: [{ roomName: "Aula 1", building: "Piano 1" }],
            room_raw: "Aula 1, Sarfatti 25, Piano 1",
          }),
        ])
      )
    );
    const organized = await fetcher.fetchScheduleForDate(DAY1);

    expect(organized["Sarfatti 25"]["Aula 1"].map((e) => e.description)).toEqual([
      "Finance",
    ]);
    expect(captureMessage).not.toHaveBeenCalled();
    expect(fetcher.getFreeTimeSlots("Sarfatti 25", "Aula 1", DAY1)).toEqual([
      { start: "08:30", end: "10:00" },
      { start: "12:00", end: "20:00" },
    ]);
  });

  it("reports rooms that are truly unknown", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn(async () =>
        response([
          event({
            rooms: [{ roomName: "Aula 999", building: "Nowhere" }],
            room_raw: "Aula 999, Nowhere",
          }),
        ])
      )
    );
    await fetcher.fetchScheduleForDate(DAY1);

    expect(captureMessage).toHaveBeenCalledWith(
      'Schedule event in untracked room: "Aula 999"',
      "warning"
    );
  });
});

describe("in-flight coalescing", () => {
  it("shares one upstream fetch between concurrent same-day calls", async () => {
    let resolveFetch: (value: ReturnType<typeof response>) => void;
    const gate = new Promise<ReturnType<typeof response>>((resolve) => {
      resolveFetch = resolve;
    });
    const fetchMock = vi.fn(() => gate);
    vi.stubGlobal("fetch", fetchMock);

    const first = fetcher.fetchScheduleForDate(DAY1);
    const second = fetcher.fetchScheduleForDate(DAY1);
    resolveFetch!(response([event()]));
    const [a, b] = await Promise.all([first, second]);

    expect(fetchMock).toHaveBeenCalledTimes(1);
    expect(a["Sarfatti 25"]["Aula 1"]).toHaveLength(1);
    expect(b["Sarfatti 25"]["Aula 1"]).toHaveLength(1);
  });
});

describe("stale-on-error", () => {
  it("serves the expired cache entry when the fetch fails", async () => {
    const events = [event()];
    const fetchMock = vi.fn(async () => response(events));
    vi.stubGlobal("fetch", fetchMock);

    const fresh = await fetcher.fetchScheduleForDate(DAY1);

    vi.spyOn(Date, "now").mockReturnValue(Date.now() + 6 * 60 * 1000);
    fetchMock.mockImplementation(async () => {
      throw new Error("network down");
    });

    const served = await fetcher.fetchScheduleForDate(DAY1);

    expect(served["Sarfatti 25"]["Aula 1"]).toEqual(fresh["Sarfatti 25"]["Aula 1"]);
  });

  it("rejects when the fetch fails with no cached day", async () => {
    vi.stubGlobal("fetch", vi.fn(async () => ({ ok: false, status: 502 })));
    await expect(fetcher.fetchScheduleForDate(DAY1)).rejects.toThrow(
      "Impossibile accedere ai dati di Bocconi"
    );
  });
});
