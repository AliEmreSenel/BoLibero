import {
  getBuildingOpeningTime,
  getBuildingClosingTime,
  isBuildingOpen,
} from "./building-hours";
import {
  BUILDINGS,
  isEventTypeFreeTime,
  isValidRoom,
  getBuildingDisplayName,
  getVisibleBuildings,
  isStudyRoomType,
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

class ScheduleFetcher {
  private static instance: ScheduleFetcher;

  // Instance state, bounded: on a long-lived tab the day cache and study-slot
  // maps used to grow for the life of the page.
  private dayCache = new Map<string, { events: ScheduleEvent[]; timestamp: number }>();

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

    const response = await fetch(`/api/events?day=${dateKey}`);
    if (!response.ok) {
      throw new Error(
        "Impossibile accedere ai dati di Bocconi. Riprova più tardi."
      );
    }
    const data = (await response.json()) as { events: ScheduleEvent[] };
    if (this.dayCache.size >= MAX_CACHED_DAYS) {
      const oldest = this.dayCache.keys().next().value;
      if (oldest !== undefined) this.dayCache.delete(oldest);
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

    // Add events only to valid rooms using exact matching
    // BUT exclude events that indicate free time
    for (const item of scheduleItems) {
      // Skip events that indicate the room is available for general use
      if (isEventTypeFreeTime(item.type)) {
        continue;
      }

      let placed = false;
      for (const { roomName, building } of item.rooms) {
        // Only add if room is in our valid list and building exists
        if (
          isValidRoom(roomName) &&
          organized[building] &&
          organized[building][roomName]
        ) {
          organized[building][roomName].push(item);
          placed = true;
        }
      }

      // A listed room that is not in our tracking config means Bocconi added
      // a room the app silently ignores. Surface it once per room so the
      // constants list can be updated.
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
    this.currentScheduleData = organized;

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
      if (isStudyRoomType(item.type)) {
        for (const { roomName, building } of item.rooms) {
          if (isValidRoom(roomName)) {
            // Track that this room is a study room
            this.studyRooms.add(`${building}:${roomName}`);

            // Track the specific time slot
            const key = `${building}:${roomName}:${item.date}`;
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
    const events = this.getCurrentScheduleData()[building]?.[room] || [];

    // Check if building is open on this date
    if (!isBuildingOpen(building, date)) {
      return []; // Building is closed, no free slots
    }

    const dateStr = this.formatDateKey(date);
    const dayEvents = events.filter((event) => event.date === dateStr);

    return computeFreeSlots(
      dayEvents,
      getBuildingOpeningTime(building, date),
      getBuildingClosingTime(building, date)
    );
  }

  // Store current schedule data for access by other methods
  private currentScheduleData: ScheduleData = {};
  private studyRooms: Set<string> = new Set();

  private getCurrentScheduleData(): ScheduleData {
    return this.currentScheduleData;
  }

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
    this.studyRooms.clear();
    this.studyRoomSlots.clear();
  }
}

export { ScheduleFetcher };
export type { ScheduleData };
