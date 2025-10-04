import {
  getBuildingOpeningTime,
  getBuildingClosingTime,
  isBuildingOpen,
} from "./building-hours";

interface ScheduleEvent {
  date: string;
  start: string;
  end: string;
  type: string;
  code: string;
  class: string;
  description: string;
  teacher: string;
  room: string;
}

interface ScheduleData {
  [building: string]: {
    [room: string]: ScheduleEvent[];
  };
}

// Building configurations with translations and visibility
const BUILDING_CONFIG = {
  "Sarfatti 25": {
    displayName: "Leoni",
    visible: true,
    rooms: [
      "Aula 1",
      "Aula 2",
      "Aula 3",
      "Aula 4",
      "Aula 5",
      "Aula A",
      "Aula B",
      "Aula C",
      "Aula D",
      "Aula E",
      "Aula F",
      "Aula 11",
      "Aula 12",
      "Aula 13",
      "Aula 14",
      "Aula 15",
      "Aula 16",
      "Aula 101",
      "Aula 201",
      "Aula 202",
      "Aula 203",
      "Aula 204",
      "Aula 205",
      "Aula 21",
      "Aula 22",
      "Aula 23",
      "Aula 24",
      "Aula 25",
      "Aula 26",
      "Aula 31",
      "Aula 32",
      "Aula 33",
      "Aula 34",
      "Aula 35",
      "Aula 36",
      "Aula 301",
      "Aula 302",
      "Aula 41",
      "Aula 42",
      "Aula 43",
      "Aula 44",
      "Aula 4a",
      "Aula 4b",
      "Aula 4c",
      "Aula Franceschi",
      "Aula Manfredini",
      "Aula Notari",
      "Aula Perego",
      "Aula Zappa",
      "Aula INFOU01",
    ],
  },
  Roentgen: {
    displayName: "Campus Roentgen",
    visible: false,
    rooms: [
      "1‑C1‑10",
      "1‑C3‑01",
      "1‑C4‑SR01",
      "1‑C4‑SR02",
      "1‑C4‑SR03",
      "1‑D1‑05",
      "1‑D1‑16",
      "1‑D2‑03",
      "1‑D2‑06",
      "1‑E1‑04",
      "1‑E1‑06",
      "1‑E1‑09",
      "1‑E1‑10",
      "1‑E1‑14",
      "1‑E1‑FM01",
      "1‑E2‑06",
      "1‑E2‑FM01",
      "1‑E4‑SR01",
      "1‑E4‑SR02",
      "2‑B3‑SR02",
      "2‑C2‑09",
      "2‑C3‑09",
      "2‑C4‑SR02",
      "2‑D1‑05",
      "2‑D1‑18",
      "2‑E1‑FM01",
      "2‑E3‑04",
      "2‑E4‑SR01",
      "2‑E4‑SR02",
      "3‑A1‑05",
      "3‑A1‑07",
      "3‑A1‑18",
      "3‑A2‑02",
      "3‑A2‑03",
      "3‑A2‑04",
      "3‑A2‑05",
      "3‑A2‑07",
      "3‑A2‑FM01",
      "3‑B1‑10",
      "3‑B1‑14",
      "3‑B2‑10",
      "3‑B3‑SR01",
      "3‑C1‑01",
      "3‑C1‑04",
      "3‑C1‑08",
      "3‑C1‑09",
      "3‑C1‑13",
      "3‑C1‑16",
      "3‑C1‑17",
      "3‑C2‑01",
      "3‑C2‑02",
      "3‑C2‑03",
      "3‑C2‑04",
      "3‑C2‑05",
      "3‑C4‑SR01",
      "3‑C4‑SR02",
      "3‑D2‑01",
      "3‑D2‑03",
      "3‑D3‑SR01",
      "3‑E1‑14",
      "3‑E2‑01",
      "3‑E3‑FM01",
      "3‑E4‑SR03",
      "4‑4C‑304",
      "4‑A1‑FM01",
      "4‑A1‑FM02",
      "4‑A2‑14",
      "4‑A3‑02",
      "4‑A4‑01",
      "4‑A4‑FM01",
      "4‑B1‑10",
      "4‑B2‑07",
      "4‑C1‑13",
      "4‑C2‑03",
      "4‑C2‑04",
      "4‑C3‑02",
      "4‑C3‑04",
      "4‑C3‑05",
      "4‑C4‑SR01",
      "4‑C4‑SR02",
      "4‑D1‑11",
      "4‑D1‑15",
      "4‑D1‑16",
      "4‑D1‑17",
      "4‑D1‑18",
      "4‑E4‑SR01",
      "4‑E4‑SR02",
      "4‑E4‑SR03",
      "5‑A4‑01",
      "5‑B3‑SR01",
      "5‑C1‑08",
      "5‑C3‑SR04",
      "5‑C4‑SR01",
      "5‑C4‑SR02",
      "5‑C4‑SR03",
      "5‑D1‑13",
      "5‑D1‑16",
      "5‑D3‑SR01",
      "5‑E1‑03",
      "5‑E1‑12",
      "5‑E3‑02",
      "5‑E4‑SR01",
      "5‑E4‑SR02",
      "5‑E4‑SR03",
      "5‑E4‑SR04",
      "AS01",
      "AS02",
      "AS03",
      "AS04",
      "AS05",
      "Aula AS01",
      "Aula AS02",
      "Aula AS03",
      "Aula InfoAS04",
      "Aula InfoAS05",
      "Via Roentgen",
    ],
  },
  "Sraffa 13": {
    displayName: "Velodromo",
    visible: true,
    rooms: [
      "Aula N01",
      "Aula N02",
      "Aula N03",
      "Aula N04",
      "Aula N05",
      "Aula N06",
      "Aula N07",
      "Aula N08",
      "Aula N10",
      "Aula N11",
      "Aula N12",
      "Aula N13",
      "Aula N14",
      "Aula N15",
      "Aula N16",
      "Aula N17",
      "Aula N18",
      "Aula N19",
      "Aula N20",
      "Aula N21",
      "Aula N22",
      "Aula N23",
      "Aula N24",
      "Aula N25",
      "Aula N26",
      "Aula N27",
      "Aula N28",
      "Aula N29",
      "Aula N30",
      "Aula N31",
      "Aula N32",
      "Aula N33",
      "Aula N34",
      "Aula N35",
      "Aula N36",
      "Aula N37",
      "Aula N38",
      "Aula N39",
    ],
  },
};

// Get only visible buildings
const BUILDINGS = Object.fromEntries(
  Object.entries(BUILDING_CONFIG)
    .filter(([, config]) => config.visible)
    .map(([key, config]) => [key, { rooms: config.rooms }]),
);

// Cache for storing fetched data
const scheduleCache = new Map<
  string,
  { data: ScheduleEvent[]; timestamp: number }
>();
const CACHE_DURATION = 5 * 60 * 1000; // 5 minutes

// Event types that indicate the room is available for general use (not occupied by a class)
const FREE_TIME_TYPES = new Set([
  "Aule studio",
  "Studio",
  "Aule Studio",
  "AULE STUDIO",
  "aule studio",
]);

class ScheduleFetcher {
  private static instance: ScheduleFetcher;
  private parser: DOMParser | null = null;

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

  // Check if an event type indicates the room is free for general use
  private isEventTypeFreeTime(eventType: string, description = ""): boolean {
    // Check event type for study-related keywords only
    const lowerType = eventType.toLowerCase().trim();
    const lowerDesc = description.toLowerCase().trim();

    // Only "Aule studio" and similar study-related terms indicate free time
    return (
      FREE_TIME_TYPES.has(eventType.trim()) ||
      lowerType.includes("aule studio") ||
      lowerType === "studio" ||
      lowerDesc.includes("aule studio")
    );
  }

  // Parse room field similar to Python script logic
  private parseRoomField(
    roomField: string,
  ): Array<{ roomName: string; building: string }> {
    const results: Array<{ roomName: string; building: string }> = [];

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
  private exactRoomMatch(targetRoom: string, roomString: string): boolean {
    const parsedRooms = this.parseRoomField(roomString);

    return parsedRooms.some(({ roomName }) => {
      // Exact match
      if (roomName === targetRoom) {
        return true;
      }

      // Handle cases where room might have extra spaces or formatting
      const normalizedRoom = roomName.replace(/\s+/g, " ").trim();
      const normalizedTarget = targetRoom.replace(/\s+/g, " ").trim();

      return normalizedRoom === normalizedTarget;
    });
  }

  // Exact room matching - similar to Python script logic
  private exactProfMatch(targetName: string, namesString: string): boolean {
    const parsedProfs = this.parseProfField(namesString);

    return parsedProfs.some((profName) => {
      // Exact match
      if (profName === targetName) {
        return true;
      }

      // Handle cases where room might have extra spaces or formatting
      const normalizedRoom = profName.replace(/\s+/g, " ").trim();
      const normalizedTarget = targetName.replace(/\s+/g, " ").trim();

      return normalizedRoom === normalizedTarget;
    });
  }

  // Get all valid room names from our buildings list
  private getAllValidRooms(): Set<string> {
    const validRooms = new Set<string>();
    Object.values(BUILDINGS).forEach((building) => {
      building.rooms.forEach((room) => {
        validRooms.add(room);
      });
    });
    return validRooms;
  }

  // Check if a room name is in our valid rooms list
  private isValidRoom(roomName: string): boolean {
    const validRooms = this.getAllValidRooms();
    return validRooms.has(roomName);
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
        this.isValidRoom(roomName),
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

      // Create event entry
      data.push({
        date: dateObj,
        start,
        end,
        type: lessonType,
        code: codice,
        class: classe,
        description: description,
        teacher: docenti,
        room: aule, // Keep original room field for reference
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
    params: URLSearchParams,
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
        "Impossibile accedere ai dati di Bocconi. Riprova più tardi.",
      );
    }
  }

  // Get cached data or fetch new data
  private async getCachedOrFetch(
    cacheKey: string,
    params: URLSearchParams,
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
      if (this.isEventTypeFreeTime(item.type, item.description)) {
        continue;
      }

      const parsedRooms = this.parseRoomField(item.room);

      for (const { roomName, building } of parsedRooms) {
        // Only add if room is in our valid list and building exists
        if (
          this.isValidRoom(roomName) &&
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
      (startDate.getMonth() + 1).toString().padStart(2, "0"),
    );
    urlParams.set("ric_da_aa", startDate.getFullYear().toString());
    urlParams.set("ric_a_gg", endDate.getDate().toString().padStart(2, "0"));
    urlParams.set(
      "ric_a_mm",
      (endDate.getMonth() + 1).toString().padStart(2, "0"),
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
    date: Date = new Date(),
  ): Array<{ start: string; end: string }> {
    const events = this.getCurrentScheduleData()[building]?.[room] || [];

    // Check if building is open on this date
    if (!isBuildingOpen(building, date)) {
      return []; // Building is closed, no free slots
    }

    // Get building-specific opening hours
    const dayStart = getBuildingOpeningTime(building, date);
    const dayEnd = getBuildingClosingTime(building, date);

    const dateStr = date.toISOString().split("T")[0];
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

    const toMinutes = (hhmm) => {
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

  private getCurrentScheduleData(): ScheduleData {
    return this.currentScheduleData;
  }

  // Fetch today's schedule for main page
  async fetchTodaySchedule(): Promise<ScheduleData> {
    const today = new Date();
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);

    const cacheKey = `today-${today.toISOString().split("T")[0]}`;

    const params = this.buildBocconiParams({
      startDate: today,
      endDate: tomorrow,
    });

    const scheduleItems = await this.getCachedOrFetch(cacheKey, params);

    // Filter only today's events
    const todayStr = today.toISOString().split("T")[0];
    const todayEvents = scheduleItems.filter((item) => item.date === todayStr);

    const organized = this.organizeSchedule(todayEvents);
    this.currentScheduleData = organized;
    return organized;
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
    endDate: Date,
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
      const matchesRoom = this.exactRoomMatch(room, item.room);

      // Exclude free time events
      const isNotFreeTime = !this.isEventTypeFreeTime(
        item.type,
        item.description,
      );

      return matchesRoom && inDateRange && isNotFreeTime;
    });
  }

  // Fetch schedule for a specific room and date range with EXACT room matching
  async fetchProfSchedule(
    name: string,
    startDate: Date,
    endDate: Date,
  ): Promise<ScheduleEvent[]> {
    const start = startDate.toISOString().split("T")[0];
    const end = endDate.toISOString().split("T")[0];
    const cacheKey = `room-prof-${name}-${start}-${end}`;

    // Search for the specific room - send room name as search parameter
    const params = this.buildBocconiParams({
      startDate,
      endDate,
      prof: name, // This will help filter on the server side
    });

    const scheduleItems = await this.getCachedOrFetch(cacheKey, params);

    // Filter events for the EXACT room and date range
    // BUT exclude free time events
    return scheduleItems.filter((item) => {
      const itemDate = new Date(item.date);
      const inDateRange = itemDate >= startDate && itemDate <= endDate;

      const matchesRoom = this.exactProfMatch(name, item.teacher);

      return matchesRoom && inDateRange;
    });
  }

  // Get all buildings and rooms structure
  getBuildingsStructure() {
    return BUILDINGS;
  }

  // Get building display name
  getBuildingDisplayName(buildingKey: string): string {
    return BUILDING_CONFIG[buildingKey]?.displayName || buildingKey;
  }

  // Get visible buildings with display names
  getVisibleBuildings() {
    return Object.fromEntries(
      Object.entries(BUILDING_CONFIG)
        .filter(([, config]) => config.visible)
        .map(([key, config]) => [key, config.displayName]),
    );
  }

  // Clear cache (useful for manual refresh)
  clearCache() {
    scheduleCache.clear();
  }
}

export { ScheduleFetcher, BUILDINGS, BUILDING_CONFIG };
export type { ScheduleEvent, ScheduleData };
