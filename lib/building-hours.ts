export interface TimeRange {
  start: string;
  end: string;
}

export interface BuildingHours {
  normal: TimeRange;
  saturday: TimeRange;
  holidays: { [date: string]: TimeRange | null }; // null means closed
  specialDates: { [date: string]: TimeRange | null };
}

export interface BuildingHoursConfig {
  [buildingKey: string]: BuildingHours;
}

// Default building hours configuration
export const BUILDING_HOURS: BuildingHoursConfig = {
  "Sarfatti 25": {
    normal: { start: "08:00", end: "20:00" },
    saturday: { start: "08:00", end: "18:00" },
    holidays: {},
    specialDates: {},
  },
  "Sraffa 13": {
    normal: { start: "08:00", end: "20:00" },
    saturday: { start: "08:00", end: "13:00" },
    holidays: {},
    specialDates: {},
  },
  Roentgen: {
    normal: { start: "08:00", end: "21:00" },
    saturday: { start: "00:00", end: "00:00" },
    holidays: {},
    specialDates: {},
  },
};

export function getBuildingHours(
  buildingKey: string,
  date: Date,
): TimeRange | null {
  const config = BUILDING_HOURS[buildingKey];
  if (!config) {
    // Default hours if building not configured
    return { start: "08:00", end: "20:00" };
  }

  const dateStr = date.toISOString().split("T")[0]; // YYYY-MM-DD format

  // Check for sunday

  // Check for special dates first (highest priority)
  if (config.specialDates[dateStr] !== undefined) {
    return config.specialDates[dateStr];
  }

  // Check for holidays (medium priority)
  if (config.holidays[dateStr] !== undefined) {
    return config.holidays[dateStr];
  }
  if (date.getDay() == 6) return config.saturday;
  if (date.getDay() == 0) return null;

  // Return normal hours (lowest priority)
  return config.normal;
}

export function isBuildingOpen(buildingKey: string, date: Date): boolean {
  const hours = getBuildingHours(buildingKey, date);
  return hours !== null;
}

export function getBuildingOpeningTime(
  buildingKey: string,
  date: Date,
): string {
  const hours = getBuildingHours(buildingKey, date);
  return hours?.start || "08:00";
}

export function getBuildingClosingTime(
  buildingKey: string,
  date: Date,
): string {
  const hours = getBuildingHours(buildingKey, date);
  return hours?.end || "20:00";
}

export function formatBuildingHours(
  buildingKey: string,
  date: Date,
  language: "en" | "it",
): string {
  const hours = getBuildingHours(buildingKey, date);

  if (!hours) {
    return language === "it" ? "Chiuso" : "Closed";
  }

  return `${hours.start} - ${hours.end}`;
}

export function getBuildingStatus(
  buildingKey: string,
  date: Date,
  language: "en" | "it",
): {
  status: "open" | "closed" | "special";
  message: string;
  hours: TimeRange | null;
} {
  const config = BUILDING_HOURS[buildingKey];
  if (!config) {
    return {
      status: "open",
      message: language === "it" ? "Orari normali" : "Normal hours",
      hours: { start: "08:00", end: "20:00" },
    };
  }

  const dateStr = date.toISOString().split("T")[0];
  const hours = getBuildingHours(buildingKey, date);

  if (!hours) {
    let reason = "";
    if (config.holidays[dateStr] !== undefined) {
      reason = language === "it" ? "Giorno festivo" : "Holiday";
    } else if (config.specialDates[dateStr] !== undefined) {
      reason = language === "it" ? "Giorno speciale" : "Special date";
    } else {
      reason = "";
    }

    return {
      status: "closed",
      message: reason,
      hours: null,
    };
  }

  // Check if it's special hours
  if (config.specialDates[dateStr] !== undefined) {
    return {
      status: "special",
      message: language === "it" ? "Orari speciali" : "Special hours",
      hours,
    };
  }

  if (config.holidays[dateStr] !== undefined) {
    return {
      status: "special",
      message: language === "it" ? "Orari festivi" : "Holiday hours",
      hours,
    };
  }

  return {
    status: "open",
    message: language === "it" ? "Orari normali" : "Normal hours",
    hours,
  };
}
