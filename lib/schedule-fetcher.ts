import {
  getBuildingOpeningTime,
  getBuildingClosingTime,
  isBuildingOpen,
} from "./building-hours";
import {
  BUILDINGS,
  BUILDING_CONFIG,
  isEventTypeFreeTime,
  isValidRoom,
  getBuildingDisplayName,
  getVisibleBuildings,
  isStudyRoomType,
} from "./constants";

interface RoomInfo {
  roomName: string;
  building: string;
}

interface ScheduleEvent {
  date: string;
  start: string;
  end: string;
  type: string;
  code: string;
  class: string;
  description: string;
  teachers: string[];
  rooms: RoomInfo[];
  teacher_raw: string;
  room_raw: string;
  isStudyRoom?: boolean;
}

interface ScheduleData {
  [building: string]: {
    [room: string]: ScheduleEvent[];
  };
}

// Cache for storing fetched data
const scheduleCache = new Map<
  string,
  { data: ScheduleEvent[]; timestamp: number }
>();
const CACHE_DURATION = 5 * 60 * 1000; // 5 minutes

class ScheduleFetcher {
  private static instance: ScheduleFetcher;
  private parser: DOMParser | null = null;

  private formatDateKey(date: Date): string {
    const year = date.getFullYear();
    const month = (date.getMonth() + 1).toString().padStart(2, "0");
    const day = date.getDate().toString().padStart(2, "0");
    return `${year}-${month}-${day}`;
  }

  private constructor() {
    // Only initialize DOMParser on client side
    if (typeof window !== "undefined") {
      this.parser = new DOMParser();
    }
  }

  static getInstance(): ScheduleFetcher {
    if (!ScheduleFetcher.instance) {
      ScheduleFetcher.instance = new ScheduleFetcher();
    }
    return ScheduleFetcher.instance;
  }

  // Parse room field similar to Python script logic
  private parseRoomField(roomField: string): Array<RoomInfo> {
    const results: Array<RoomInfo> = [];

    // Split on semicolon for multiple rooms
    const roomEntries = roomField
      .split(";")
      .map((r) => r.trim())
      .filter((r) => r);

    for (const entry of roomEntries) {
      // Split on comma - format is usually: "Room, Floor/Details, Building"
      const parts = entry.split(",").map((p) => p.trim());

      if (parts.length >= 2) {
        const roomName = parts[0];
        const building = parts[parts.length - 1]; // Last part is usually the building

        // Only include if building is in our known buildings
        if (building in BUILDINGS) {
          results.push({ roomName, building });
        }
      }
    }

    return results;
  }

  // Parse prof field similar to Python script logic
  private parseProfField(profField: string): string[] {
    // Split on semicolon for multiple rooms
    const profEntries = profField
      .split("-")
      .map((r) => r.trim())
      .filter((r) => r);

    return profEntries;
  }

  // Exact room matching - similar to Python script logic
  private exactRoomMatch(targetRoom: string, rooms: Array<RoomInfo>): boolean {
    return rooms.some(({ roomName }) => {
      // Exact match
      if (roomName === targetRoom) {
        return true;
      }

      // Handle cases where room might have extra spaces or formatting
      const normalizedRoom = roomName.replace(/\s+/g, " ").trim();
      const normalizedTarget = targetRoom.replace(/\s+/g, " ").trim();

      return normalizedRoom.toLowerCase() === normalizedTarget.toLowerCase();
    });
  }

  // Exact room matching - similar to Python script logic
  private exactProfMatch(targetName: string, teachers: string[]): boolean {
    return teachers.some((profName) => {
      // Exact match
      if (profName === targetName) {
        return true;
      }

      // Handle cases where room might have extra spaces or formatting
      const normalizedRoom = profName.replace(/\s+/g, " ").trim();
      const normalizedTarget = targetName.replace(/\s+/g, " ").trim();

      return normalizedRoom.toLowerCase() === normalizedTarget.toLowerCase();
    });
  }

  // Parse HTML table similar to Python BeautifulSoup logic
  private parseHtmlTable(html: string): ScheduleEvent[] {
    // Return empty array if parser is not available (server-side)
    if (!this.parser) {
      return [];
    }

    const doc = this.parser.parseFromString(html, "text/html");
    const rows = Array.from(doc.querySelectorAll("table tr")).slice(1); // Skip header
    const data: ScheduleEvent[] = [];

    for (const row of rows) {
      const cols = row.querySelectorAll("td");
      if (!cols || cols.length < 8) continue;

      // Based on the screenshot: Data, Dalle, Alle, Tipo, Codice, Descrizione, Docenti, Aule assegnate
      const dateStr = cols[0].textContent?.trim() || "";
      const start = cols[1].textContent?.trim() || "";
      const end = cols[2].textContent?.trim() || "";
      const lessonType = cols[3].textContent?.trim() || "";

      // Handle code column with potential HTML
      const codeHtml = cols[4];
      const codice =
        codeHtml.querySelector("strong")?.textContent?.trim() ||
        codeHtml.textContent?.trim() ||
        "";

      // Extract class info from code column HTML (similar to Python regex)
      const clMatch = codeHtml.innerHTML.match(/Cl\.\d+/);
      const classe = clMatch ? clMatch[0] : "";

      const description = cols[5].innerHTML.replace(/<br\s*\/?>/gi, " ").trim();
      const docenti = cols[6].textContent?.trim() || "";
      const aule = cols[7].textContent?.trim() || "";

      // Parse room field to get individual rooms
      const parsedRooms = this.parseRoomField(aule);

      // Only include events for rooms that are in our valid list
      const validRooms = parsedRooms.filter(({ roomName }) =>
        isValidRoom(roomName)
      );

      if (validRooms.length === 0) {
        continue; // Skip this event if no valid rooms found
      }

      // Convert date format from DD/MM/YYYY to YYYY-MM-DD
      let dateObj = dateStr;
      try {
        const [day, month, year] = dateStr.split("/");
        if (day && month && year) {
          dateObj = `${year}-${month.padStart(2, "0")}-${day.padStart(2, "0")}`;
        }
      } catch (error) {
        console.warn("Date parsing error:", error);
      }

      // Determine if this is a study room event
      const isStudyRoom = isEventTypeFreeTime(lessonType, description);

      // Create event entry
      data.push({
        date: dateObj,
        start,
        end,
        type: lessonType,
        code: codice,
        class: classe,
        description: description,
        teachers: this.parseProfField(docenti),
        rooms: this.parseRoomField(aule), // Keep original room field for reference
        teacher_raw: docenti,
        room_raw: aule,
        isStudyRoom,
      });
    }

    return data.sort((a, b) => {
      const dateCompare = a.date.localeCompare(b.date);
      if (dateCompare !== 0) return dateCompare;
      return a.start.localeCompare(b.start);
    });
  }

  // Fetch schedule data using our API route
  private async fetchScheduleData(
    params: URLSearchParams
  ): Promise<ScheduleEvent[]> {
    // Return empty array if running on server side
    if (typeof window === "undefined") {
      return [];
    }

    try {
      const response = await fetch(`/api/schedule?${params.toString()}`, {
        method: "GET",
        headers: {
          Accept:
            "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8",
        },
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const html = await response.text();
      return this.parseHtmlTable(html);
    } catch (error) {
      console.error("Error fetching schedule data:", error);
      throw new Error(
        "Impossibile accedere ai dati di Bocconi. Riprova più tardi."
      );
    }
  }

  // Get cached data or fetch new data
  private async getCachedOrFetch(
    cacheKey: string,
    params: URLSearchParams
  ): Promise<ScheduleEvent[]> {
    const cached = scheduleCache.get(cacheKey);
    const now = Date.now();

    if (cached && now - cached.timestamp < CACHE_DURATION) {
      console.log("Using client cache for:", cacheKey);
      return cached.data;
    }

    console.log("Fetching new data for:", cacheKey);
    const data = await this.fetchScheduleData(params);
    scheduleCache.set(cacheKey, { data, timestamp: now });
    return data;
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
      if (isEventTypeFreeTime(item.type, item.description)) {
        continue;
      }

      for (const { roomName, building } of item.rooms) {
        // Only add if room is in our valid list and building exists
        if (
          isValidRoom(roomName) &&
          organized[building] &&
          organized[building][roomName]
        ) {
          organized[building][roomName].push(item);
        }
      }
    }

    return organized;
  }

  private buildBocconiParams(params: {
    startDate?: Date;
    endDate?: Date;
    room?: string;
    type?: string;
    prof?: string;
  }): URLSearchParams {
    const urlParams = new URLSearchParams();

    // Set default date range if not provided
    const startDate = params.startDate || new Date();
    const endDate =
      params.endDate || new Date(Date.now() + 30 * 24 * 60 * 60 * 1000); // 30 days from now

    // Format dates for Bocconi API
    urlParams.set("ric_tipo", params.type || "");
    urlParams.set("ric_aula", params.room || "");
    urlParams.set("ric_descriz", params.prof || "");
    urlParams.set("ric_da_gg", startDate.getDate().toString().padStart(2, "0"));
    urlParams.set(
      "ric_da_mm",
      (startDate.getMonth() + 1).toString().padStart(2, "0")
    );
    urlParams.set("ric_da_aa", startDate.getFullYear().toString());
    urlParams.set("ric_a_gg", endDate.getDate().toString().padStart(2, "0"));
    urlParams.set(
      "ric_a_mm",
      (endDate.getMonth() + 1).toString().padStart(2, "0")
    );
    urlParams.set("ric_a_aa", endDate.getFullYear().toString());
    urlParams.set("ric_da_hh", "8");
    urlParams.set("ric_da_ii", "00");
    urlParams.set("cerca", "CERCA");

    return urlParams;
  }

  // Get free time slots for a room considering building hours
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

    // Get building-specific opening hours
    const dayStart = getBuildingOpeningTime(building, date);
    const dayEnd = getBuildingClosingTime(building, date);

    const dateStr = this.formatDateKey(date);
    const todayEvents = events
      .filter((event) => event.date === dateStr)
      .sort((a, b) => a.start.localeCompare(b.start));

    const freeSlots: Array<{ start: string; end: string }> = [];

    if (todayEvents.length === 0) {
      freeSlots.push({ start: dayStart, end: dayEnd });
      return freeSlots;
    }

    // Check if there's free time before first event
    if (todayEvents[0].start > dayStart) {
      if (todayEvents[0].start != "08:30")
        freeSlots.push({ start: dayStart, end: todayEvents[0].start });
    }

    const toMinutes = (hhmm: string) => {
      const [h, m] = hhmm.split(":").map(Number);
      return h * 60 + m;
    };

    const MIN_GAP_MINUTES = 15; // "more than 15" → use >, not >=

    for (let i = 0; i < todayEvents.length - 1; i++) {
      const currentEnd = todayEvents[i].end; // e.g., "10:15"
      const nextStart = todayEvents[i + 1].start; // e.g., "10:30"
      const gap = toMinutes(nextStart) - toMinutes(currentEnd);

      if (gap > MIN_GAP_MINUTES) {
        freeSlots.push({ start: currentEnd, end: nextStart });
      }
    }
    // Check if there's free time after last event
    const lastEvent = todayEvents[todayEvents.length - 1];
    const gap = toMinutes(dayEnd) - toMinutes(lastEvent.end);

    if (gap > MIN_GAP_MINUTES) {
      freeSlots.push({ start: lastEvent.end, end: dayEnd });
    }

    return freeSlots;
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
    // We need to get the study room events from the raw schedule data
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

  async fetchScheduleForDate(date: Date): Promise<ScheduleData> {
    const targetDate = new Date(
      date.getFullYear(),
      date.getMonth(),
      date.getDate()
    );

    const dateKey = this.formatDateKey(targetDate);
    const cacheKey = `day-${dateKey}`;

    const params = this.buildBocconiParams({
      startDate: targetDate,
      // Bocconi search uses an inclusive date range.
      // Set endDate to the same day to avoid fetching the next day too.
      endDate: targetDate,
    });

    const scheduleItems = await this.getCachedOrFetch(cacheKey, params);

    // Refresh slot cache for this date so repeated effects/fetches stay idempotent.
    this.clearStudyRoomSlotsForDate(dateKey);

    // Track study rooms based on "Aule studio" type events
    this.updateStudyRooms(scheduleItems);

    const targetDateEvents = scheduleItems.filter((item) => item.date === dateKey);

    const organized = this.organizeSchedule(targetDateEvents);
    this.currentScheduleData = organized;
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
      if (isStudyRoomType(item.type, item.description)) {
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

  // Fetch schedule for a specific month (for room calendar view)
  async fetchMonthSchedule(year: number, month: number): Promise<ScheduleData> {
    const startDate = new Date(year, month - 1, 1);
    const endDate = new Date(year, month, 0); // Last day of month

    const monthKey = `${year}-${month.toString().padStart(2, "0")}`;
    const cacheKey = `month-${monthKey}`;

    const params = this.buildBocconiParams({
      startDate,
      endDate,
    });

    const scheduleItems = await this.getCachedOrFetch(cacheKey, params);

    // Filter events for the specific month
    const monthEvents = scheduleItems.filter((item) => {
      const itemDate = new Date(item.date);
      return (
        itemDate.getFullYear() === year && itemDate.getMonth() === month - 1
      );
    });

    const organized = this.organizeSchedule(monthEvents);
    this.currentScheduleData = organized;
    return organized;
  }

  // Fetch schedule for a specific room and date range with EXACT room matching
  async fetchRoomSchedule(
    building: string,
    room: string,
    startDate: Date,
    endDate: Date
  ): Promise<ScheduleEvent[]> {
    const start = startDate.toISOString().split("T")[0];
    const end = endDate.toISOString().split("T")[0];
    const cacheKey = `room-${building}-${room}-${start}-${end}`;

    // Search for the specific room - send room name as search parameter
    const params = this.buildBocconiParams({
      startDate,
      endDate,
      room: room, // This will help filter on the server side
    });

    const scheduleItems = await this.getCachedOrFetch(cacheKey, params);

    // Filter events for the EXACT room and date range
    // BUT exclude free time events
    return scheduleItems.filter((item) => {
      const itemDate = new Date(item.date);
      const inDateRange = itemDate >= startDate && itemDate <= endDate;

      // Use exact room matching to avoid "Aula 1" matching "Aula 11"
      const matchesRoom = this.exactRoomMatch(room, item.rooms);

      // Exclude free time events
      const isNotFreeTime = !isEventTypeFreeTime(item.type, item.description);

      return matchesRoom && inDateRange && isNotFreeTime;
    });
  }

  // Fetch schedule for a specific professor and date range with EXACT matching
  async fetchProfSchedule(
    name: string,
    startDate: Date,
    endDate: Date
  ): Promise<ScheduleEvent[]> {
    const start = startDate.toISOString().split("T")[0];
    const end = endDate.toISOString().split("T")[0];
    const cacheKey = `room-prof-${name}-${start}-${end}`;

    // Search for the specific professor - send name as search parameter
    const params = this.buildBocconiParams({
      startDate,
      endDate,
      prof: name, // This will help filter on the server side
    });

    const scheduleItems = await this.getCachedOrFetch(cacheKey, params);

    // Filter events for the EXACT professor and date range
    return scheduleItems.filter((item) => {
      const itemDate = new Date(item.date);
      const inDateRange = itemDate >= startDate && itemDate <= endDate;

      const matchesProf = this.exactProfMatch(name, item.teachers);

      return matchesProf && inDateRange;
    });
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
   * Fetch study room data by searching for "Aule studio" type events
   * This updates the internal studyRooms set
   */
  async fetchStudyRooms(): Promise<Set<string>> {
    const today = new Date();
    const nextMonth = new Date(today);
    nextMonth.setMonth(nextMonth.getMonth() + 1);

    const cacheKey = `study-rooms-${this.formatDateKey(today)}`;

    // Search for study rooms using the "Aule studio" type
    const params = this.buildBocconiParams({
      startDate: today,
      endDate: nextMonth,
      type: "Aule studio",
    });

    const scheduleItems = await this.getCachedOrFetch(cacheKey, params);

    // Update study rooms set
    this.updateStudyRooms(scheduleItems);

    return this.studyRooms;
  }

  // Clear cache (useful for manual refresh)
  clearCache() {
    scheduleCache.clear();
    this.studyRooms.clear();
    this.studyRoomSlots.clear();
  }
}

export { ScheduleFetcher };
export type { ScheduleEvent, ScheduleData };
