export interface TimeRange {
  start: string
  end: string
}

export interface BuildingHours {
  normal: TimeRange
  holidays: { [date: string]: TimeRange | null } // null means closed
  specialDates: { [date: string]: TimeRange | null }
}

export interface BuildingHoursConfig {
  [buildingKey: string]: BuildingHours
}

// Default building hours configuration
export const BUILDING_HOURS: BuildingHoursConfig = {
  "Sarfatti 25": {
    normal: { start: "07:30", end: "22:00" },
    holidays: {
      // Christmas holidays 2024
      "2024-12-24": { start: "08:00", end: "14:00" }, // Christmas Eve - reduced hours
      "2024-12-25": null, // Christmas Day - closed
      "2024-12-26": null, // Boxing Day - closed
      "2024-12-31": { start: "08:00", end: "14:00" }, // New Year's Eve - reduced hours
      "2025-01-01": null, // New Year's Day - closed

      // Easter holidays 2025
      "2025-04-18": null, // Good Friday - closed
      "2025-04-21": null, // Easter Monday - closed

      // Italian national holidays
      "2025-04-25": null, // Liberation Day - closed
      "2025-05-01": null, // Labour Day - closed
      "2025-06-02": null, // Republic Day - closed
      "2025-08-15": null, // Assumption - closed
      "2025-11-01": null, // All Saints' Day - closed
      "2025-12-08": null, // Immaculate Conception - closed
    },
    specialDates: {
      // Exam periods - extended hours
      "2024-06-10": { start: "07:00", end: "24:00" },
      "2024-06-11": { start: "07:00", end: "24:00" },
      "2024-06-12": { start: "07:00", end: "24:00" },
      "2024-06-13": { start: "07:00", end: "24:00" },
      "2024-06-14": { start: "07:00", end: "24:00" },
      "2024-06-15": { start: "07:00", end: "24:00" },
      "2024-06-16": { start: "07:00", end: "24:00" },

      // Summer reduced hours
      "2024-07-01": { start: "08:00", end: "18:00" },
      "2024-07-02": { start: "08:00", end: "18:00" },
      "2024-07-03": { start: "08:00", end: "18:00" },
      "2024-07-04": { start: "08:00", end: "18:00" },
      "2024-07-05": { start: "08:00", end: "18:00" },
    },
  },
  "Sraffa 13": {
    normal: { start: "08:00", end: "20:00" },
    holidays: {
      // Christmas holidays 2024
      "2024-12-24": { start: "08:00", end: "13:00" },
      "2024-12-25": null,
      "2024-12-26": null,
      "2024-12-31": { start: "08:00", end: "13:00" },
      "2025-01-01": null,

      // Easter holidays 2025
      "2025-04-18": null,
      "2025-04-21": null,

      // Italian national holidays
      "2025-04-25": null,
      "2025-05-01": null,
      "2025-06-02": null,
      "2025-08-15": null,
      "2025-11-01": null,
      "2025-12-08": null,
    },
    specialDates: {
      // Weekend extended hours during exam period
      "2024-06-10": { start: "07:30", end: "22:00" },
      "2024-06-11": { start: "07:30", end: "22:00" },
      "2024-06-12": { start: "07:30", end: "22:00" },
      "2024-06-13": { start: "07:30", end: "22:00" },
      "2024-06-14": { start: "07:30", end: "22:00" },
      "2024-06-15": { start: "07:30", end: "22:00" },
      "2024-06-16": { start: "07:30", end: "22:00" },
    },
  },
  Roentgen: {
    normal: { start: "08:00", end: "21:00" },
    holidays: {
      // Christmas holidays 2024
      "2024-12-24": { start: "08:00", end: "14:00" },
      "2024-12-25": null,
      "2024-12-26": null,
      "2024-12-31": { start: "08:00", end: "14:00" },
      "2025-01-01": null,

      // Easter holidays 2025
      "2025-04-18": null,
      "2025-04-21": null,

      // Italian national holidays
      "2025-04-25": null,
      "2025-05-01": null,
      "2025-06-02": null,
      "2025-08-15": null,
      "2025-11-01": null,
      "2025-12-08": null,
    },
    specialDates: {
      // Research facility - 24/7 during special projects
      "2024-06-10": { start: "00:00", end: "23:59" },
      "2024-06-11": { start: "00:00", end: "23:59" },
      "2024-06-12": { start: "00:00", end: "23:59" },
    },
  },
}

export function getBuildingHours(buildingKey: string, date: Date): TimeRange | null {
  const config = BUILDING_HOURS[buildingKey]
  if (!config) {
    // Default hours if building not configured
    return { start: "08:00", end: "20:00" }
  }

  const dateStr = date.toISOString().split("T")[0] // YYYY-MM-DD format

  // Check for special dates first (highest priority)
  if (config.specialDates[dateStr] !== undefined) {
    return config.specialDates[dateStr]
  }

  // Check for holidays (medium priority)
  if (config.holidays[dateStr] !== undefined) {
    return config.holidays[dateStr]
  }

  // Return normal hours (lowest priority)
  return config.normal
}

export function isBuildingOpen(buildingKey: string, date: Date): boolean {
  const hours = getBuildingHours(buildingKey, date)
  return hours !== null
}

export function getBuildingOpeningTime(buildingKey: string, date: Date): string {
  const hours = getBuildingHours(buildingKey, date)
  return hours?.start || "08:00"
}

export function getBuildingClosingTime(buildingKey: string, date: Date): string {
  const hours = getBuildingHours(buildingKey, date)
  return hours?.end || "20:00"
}

export function formatBuildingHours(buildingKey: string, date: Date, language: "en" | "it"): string {
  const hours = getBuildingHours(buildingKey, date)

  if (!hours) {
    return language === "it" ? "Chiuso" : "Closed"
  }

  return `${hours.start} - ${hours.end}`
}

export function getBuildingStatus(
  buildingKey: string,
  date: Date,
  language: "en" | "it",
): {
  status: "open" | "closed" | "special"
  message: string
  hours: TimeRange | null
} {
  const config = BUILDING_HOURS[buildingKey]
  if (!config) {
    return {
      status: "open",
      message: language === "it" ? "Orari normali" : "Normal hours",
      hours: { start: "08:00", end: "20:00" },
    }
  }

  const dateStr = date.toISOString().split("T")[0]
  const hours = getBuildingHours(buildingKey, date)

  if (!hours) {
    let reason = ""
    if (config.holidays[dateStr] !== undefined) {
      reason = language === "it" ? "Giorno festivo" : "Holiday"
    } else if (config.specialDates[dateStr] !== undefined) {
      reason = language === "it" ? "Giorno speciale" : "Special date"
    } else {
      reason = language === "it" ? "Chiuso" : "Closed"
    }

    return {
      status: "closed",
      message: reason,
      hours: null,
    }
  }

  // Check if it's special hours
  if (config.specialDates[dateStr] !== undefined) {
    return {
      status: "special",
      message: language === "it" ? "Orari speciali" : "Special hours",
      hours,
    }
  }

  if (config.holidays[dateStr] !== undefined) {
    return {
      status: "special",
      message: language === "it" ? "Orari festivi" : "Holiday hours",
      hours,
    }
  }

  return {
    status: "open",
    message: language === "it" ? "Orari normali" : "Normal hours",
    hours,
  }
}
