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

// Italian national holidays: the whole campus is closed.
const NATIONAL_CLOSURES: { [date: string]: null } = {
    "2026-01-01": null,
    "2026-04-05": null, // Easter
    "2026-04-06": null, // Easter Monday
    "2026-04-25": null, // Liberation Day
    "2026-05-01": null, // Labour Day
    "2026-06-02": null, // Republic Day
    "2026-08-15": null, // Assumption
    "2026-11-01": null, // All Saints
    "2026-12-08": null, // Immaculate Conception
    "2026-12-25": null,
    "2026-12-26": null,
};

// Inclusive closed-day range, so the winter break list is one line per building.
const closedRange = (start: string, end: string): { [date: string]: null } => {
    const days: { [date: string]: null } = {};
    for (const d = new Date(`${start}T00:00:00Z`); d <= new Date(`${end}T00:00:00Z`); d.setUTCDate(d.getUTCDate() + 1)) {
        days[d.toISOString().split("T")[0]] = null;
    }
    return days;
};

const sharedClosures = {
    ...NATIONAL_CLOSURES,
    ...closedRange("2025-12-24", "2026-01-04"),
    "2025-12-08": null,
    "2026-01-06": null,
};

// Default building hours configuration
export const BUILDING_HOURS: BuildingHoursConfig = {
    "Sarfatti 25": {
        normal: { start: "08:00", end: "20:00" },
        saturday: { start: "08:00", end: "18:00" },
        holidays: { ...sharedClosures },
        specialDates: {},
    },
    "Sraffa 13": {
        normal: { start: "08:00", end: "20:00" },
        saturday: { start: "08:00", end: "13:00" },
        holidays: { ...sharedClosures, ...closedRange("2025-12-22", "2025-12-23"), "2026-01-05": null },
        specialDates: {},
    },
    Roentgen: {
        normal: { start: "08:00", end: "21:00" },
        saturday: { start: "00:00", end: "00:00" },
        holidays: { ...sharedClosures },
        specialDates: {},
    },
};

// Holiday keys are calendar days in Rome, so the lookup key must be the
// LOCAL date, not the UTC date (toISOString shifts late-evening requests
// to the next day and shows the wrong hours).
const localDateKey = (date: Date): string =>
    `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}-${String(date.getDate()).padStart(2, "0")}`;

export function getBuildingHours(
    buildingKey: string,
    date: Date,
): TimeRange | null {
    const config = BUILDING_HOURS[buildingKey];
    if (!config) {
        // Default hours if building not configured
        return { start: "08:00", end: "20:00" };
    }

    const dateStr = localDateKey(date);

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

    const dateStr = localDateKey(date);
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
