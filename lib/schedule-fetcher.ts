import {
  getBuildingOpeningTime,
  getBuildingClosingTime,
  isBuildingOpen,
} from "./building-hours";
import { fetchBocconiEvents } from "./bocconi-calendar";
import {
  BUILDINGS,
  isFreeTimeEvent,
  resolveRoom,
  getBuildingDisplayName,
  getVisibleBuildings,
  isStudyRoomEvent,
} from "./constants";
import { computeFreeSlots } from "./free-slots";
import * as Sentry from "@sentry/nextjs";

// Each unknown room is reported at most once per page session.
const reportedUnknownRooms = new Set<string>();
import type { ClientEvent } from "./event-matching";

export type ScheduleEvent = ClientEvent;

interface ScheduleData {
  [building: string]: {
    [room: string]: ScheduleEvent[];
  };
}

// Thin client of /api/events: the server owns fetching and parsing
// (parseBocconiSchedule). This module only organizes events into the
// building/room grid and derives free/study slots for the home grid.
const CACHE_DURATION = 5 * 60 * 1000;
const MAX_CACHED_DAYS = 14;
const FETCH_TIMEOUT_MS = 15_000;

class ScheduleFetcher {
  private static instance: ScheduleFetcher;

  // Instance state, bounded: on a long-lived tab the day cache and study-slot
  // maps used to grow for the life of the page.
  private dayCache = new Map<string, { events: ScheduleEvent[]; timestamp: number }>();

  // Per-date organized grids, so slot queries read the day they ask for
  // instead of the last fetched day. Bounded by the same eviction as dayCache.
  private scheduleDataByDate = new Map<string, ScheduleData>();

  // One in-flight upstream fetch per date: concurrent same-day callers share it.
  private inflight = new Map<string, Promise<ScheduleEvent[]>>();

  private constructor() {}

  static getInstance(): ScheduleFetcher {
    if (!ScheduleFetcher.instance) {
      ScheduleFetcher.instance = new ScheduleFetcher();
    }
    return ScheduleFetcher.instance;
  }

  private formatDateKey(date: Date): string {
    const year = date.getFullYear();
    const month = (date.getMonth() + 1).toString().padStart(2, "0");
    const day = date.getDate().toString().padStart(2, "0");
    return `${year}-${month}-${day}`;
  }

  private async fetchDay(dateKey: string): Promise<ScheduleEvent[]> {
    const cached = this.dayCache.get(dateKey);
    if (cached && Date.now() - cached.timestamp < CACHE_DURATION) {
      return cached.events;
    }

    const pending = this.inflight.get(dateKey);
    if (pending) {
      return pending;
    }

    const promise = this.loadDay(dateKey, cached).finally(() => {
      this.inflight.delete(dateKey);
    });
    this.inflight.set(dateKey, promise);
    return promise;
  }

  private async loadDay(
    dateKey: string,
    stale: { events: ScheduleEvent[]; timestamp: number } | undefined
  ): Promise<ScheduleEvent[]> {
    let data: { events: ScheduleEvent[] };
    try {
      const response = await fetch(`/api/events?day=${dateKey}`, {
        signal: AbortSignal.timeout(FETCH_TIMEOUT_MS),
      });
      if (!response.ok) {
        throw new Error(
          "Impossibile accedere ai dati di Bocconi. Riprova più tardi."
        );
      }
      data = (await response.json()) as { events: ScheduleEvent[] };
    } catch (error) {
      // Serve the expired entry so a flaky upstream never blanks the grid.
      if (stale) {
        return stale.events;
      }
      throw error;
    }

    if (this.dayCache.size >= MAX_CACHED_DAYS) {
      const oldest = this.dayCache.keys().next().value;
      if (oldest !== undefined) {
        this.dayCache.delete(oldest);
        this.scheduleDataByDate.delete(oldest);
        this.clearStudyRoomSlotsForDate(oldest);
      }
    }
    this.dayCache.set(dateKey, { events: data.events, timestamp: Date.now() });
    return data.events;
  }

  // Organize schedule data by building and room - ONLY for valid rooms
  private organizeSchedule(scheduleItems: ScheduleEvent[]): ScheduleData {
    // Start with all buildings and rooms from our predefined list
    const organized: ScheduleData = {};

    // Initialize all buildings and rooms with empty arrays
    Object.entries(BUILDINGS).forEach(([buildingName, { rooms }]) => {
      organized[buildingName] = {};
      rooms.forEach((roomName) => {
        organized[buildingName][roomName] = [];
      });
    });

    // Add events only to canonical rooms, resolving the building from our
    // own room list (the scraped placement string is free text).
    // BUT exclude events that indicate free time
    for (const item of scheduleItems) {
      // Skip events that indicate the room is available for general use
      if (isFreeTimeEvent(item)) {
        continue;
      }

      let placed = false;
      for (const { roomName } of item.rooms) {
        const canonical = resolveRoom(roomName);
        if (canonical) {
          organized[canonical.building][canonical.room].push(item);
          placed = true;
        }
      }

      // A room not in our tracking config means Bocconi added a room the app
      // silently ignores. Surface it once per room so the constants list can
      // be updated.
      if (item.rooms.length > 0 && !placed) {
        for (const { roomName } of item.rooms) {
          if (!reportedUnknownRooms.has(roomName)) {
            reportedUnknownRooms.add(roomName);
            Sentry.captureMessage(
              `Schedule event in untracked room: "${roomName}"`,
              "warning"
            );
          }
        }
      }
    }

    return organized;
  }

  async fetchScheduleForDate(date: Date): Promise<ScheduleData> {
    const dateKey = this.formatDateKey(date);

    const scheduleItems = await this.fetchDay(dateKey);

    // Refresh slot cache for this date so repeated effects/fetches stay idempotent.
    this.clearStudyRoomSlotsForDate(dateKey);

    // Track study rooms based on "Aule studio" type events
    this.updateStudyRooms(scheduleItems);

    const organized = this.organizeSchedule(scheduleItems);
    this.scheduleDataByDate.set(dateKey, organized);

    // Rebuild the study-room set from retained slots so it reflects the
    // cached window instead of accumulating forever across date changes.
    this.studyRooms = new Set(
      [...this.studyRoomSlots.keys()].map(
        (key) => key.slice(0, key.lastIndexOf(":"))
      )
    );

    return organized;
  }

  // Fetch today's schedule for main page
  async fetchTodaySchedule(): Promise<ScheduleData> {
    return this.fetchScheduleForDate(new Date());
  }

  /**
   * Update the study rooms set and time slots based on schedule items that have "Aule studio" type
   */
  private updateStudyRooms(scheduleItems: ScheduleEvent[]): void {
    for (const item of scheduleItems) {
      if (isStudyRoomEvent(item)) {
        for (const { roomName } of item.rooms) {
          const canonical = resolveRoom(roomName);
          if (canonical) {
            const canonicalKey = `${canonical.building}:${canonical.room}`;

            // Track that this room is a study room
            this.studyRooms.add(canonicalKey);

            // Track the specific time slot
            const key = `${canonicalKey}:${item.date}`;
            const existingSlots = this.studyRoomSlots.get(key) || [];

            const hasSlot = existingSlots.some(
              (slot) => slot.start === item.start && slot.end === item.end
            );

            if (!hasSlot) {
              existingSlots.push({ start: item.start, end: item.end });
            }

            this.studyRoomSlots.set(key, existingSlots);
          }
        }
      }
    }
  }

  // Get free time slots for a room considering building hours.
  getFreeTimeSlots(
    building: string,
    room: string,
    date: Date = new Date()
  ): Array<{ start: string; end: string }> {
    const dateKey = this.formatDateKey(date);
    const events =
      this.scheduleDataByDate.get(dateKey)?.[building]?.[room] || [];

    // Check if building is open on this date
    if (!isBuildingOpen(building, date)) {
      return []; // Building is closed, no free slots
    }

    const dayEvents = events.filter((event) => event.date === dateKey);

    return computeFreeSlots(
      dayEvents,
      getBuildingOpeningTime(building, date),
      getBuildingClosingTime(building, date)
    );
  }

  // Study-room bookkeeping state
  private studyRooms: Set<string> = new Set();

  /**
   * Check if a room is an officially designated study room
   * Study rooms are identified by having "Aule studio" type events scheduled
   */
  isStudyRoom(building: string, room: string): boolean {
    return this.studyRooms.has(`${building}:${room}`);
  }

  /**
   * Get all study rooms
   */
  getStudyRooms(): Set<string> {
    return this.studyRooms;
  }

  /**
   * Get study room time slots for a room on a specific date
   * These are the official "Aule studio" events scheduled for the room
   */
  getStudyRoomTimeSlots(
    building: string,
    room: string,
    date: Date = new Date()
  ): Array<{ start: string; end: string }> {
    return this.studyRoomSlots.get(`${building}:${room}:${this.formatDateKey(date)}`) || [];
  }

  // Store study room slots by building:room:date
  private studyRoomSlots: Map<string, Array<{ start: string; end: string }>> = new Map();

  private clearStudyRoomSlotsForDate(dateKey: string): void {
    const suffix = `:${dateKey}`;
    for (const key of this.studyRoomSlots.keys()) {
      if (key.endsWith(suffix)) {
        this.studyRoomSlots.delete(key);
      }
    }
  }

  // Get all buildings and rooms structure
  getBuildingsStructure() {
    return BUILDINGS;
  }

  // Get building display name
  getBuildingDisplayName(buildingKey: string): string {
    return getBuildingDisplayName(buildingKey);
  }

  // Get visible buildings with display names
  getVisibleBuildings() {
    return getVisibleBuildings();
  }

  /**
   * Fetch study room data for the coming days and update the studyRooms set.
   * Study rooms are rooms that carry "Aule studio" events.
   */
  async fetchStudyRooms(): Promise<Set<string>> {
    const days = Array.from({ length: 7 }, (_, offset) => {
      const day = new Date();
      day.setDate(day.getDate() + offset);
      return this.formatDateKey(day);
    });

    const week = await Promise.all(days.map((day) => this.fetchDay(day)));
    for (const dayEvents of week) {
      this.updateStudyRooms(dayEvents);
    }

    return this.studyRooms;
  }

  // Clear cache (useful for manual refresh)
  clearCache() {
    this.dayCache.clear();
    this.scheduleDataByDate.clear();
    this.studyRooms.clear();
    this.studyRoomSlots.clear();
  }
}

export { ScheduleFetcher };
export type { ScheduleData };

// Server-side professor index scraper. An unfiltered multi-month response
// exceeds Next's 2 MB data-cache item limit, so the ~3-month window is sharded
// into weekly windows aligned to fixed UTC Mondays: every regeneration reuses
// the same cache keys. Same shard pattern as app/api/classes/route.ts.
const PROFESSOR_WINDOW_DAYS = 91;
const DAY_MS = 86_400_000;
const WEEK_MS = 7 * DAY_MS;
const WEEK_ANCHOR_MS = Date.UTC(2024, 0, 1);

export async function fetchProfessorNames(): Promise<string[]> {
  const start =
    WEEK_ANCHOR_MS + Math.floor((Date.now() - WEEK_ANCHOR_MS) / WEEK_MS) * WEEK_MS;
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
  // Total failure must throw so ISR keeps serving the last-good page instead
  // of caching an empty index; partial success proceeds with survivors.
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
}
