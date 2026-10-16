// Scraped schedule times are raw page text ("8:30", "24:00", "8.30").
// Every consumer that compares times must normalize first.
export const normalizeTime = (time: string): string | null => {
  const match = time.trim().match(/^(\d{1,2}):(\d{2})$/);
  if (!match) return null;
  const hours = Number(match[1]);
  const minutes = Number(match[2]);
  // "24:00" is a valid closing time; "24:01"+ is not a time of day.
  if (hours > 24 || (hours === 24 && minutes > 0) || minutes > 59) return null;
  return `${String(hours).padStart(2, "0")}:${match[2]}`;
};

// Minutes since midnight for a normalized "HH:MM" string.
export const toMinutes = (hhmm: string): number => {
  const [hours, minutes] = hhmm.split(":").map(Number);
  return hours * 60 + minutes;
};

export const minutesToTime = (total: number): string =>
  `${String(Math.floor(total / 60)).padStart(2, "0")}:${String(total % 60).padStart(2, "0")}`;

// All schedule data is Italian; "today" and "now" must mean Rome, not the
// visitor's device timezone.
const romeFormatter = new Intl.DateTimeFormat("en-CA", {
  timeZone: "Europe/Rome",
  year: "numeric",
  month: "2-digit",
  day: "2-digit",
});

export const romeDateKey = (date: Date = new Date()): string =>
  romeFormatter.format(date);

const romeTimeFormatter = new Intl.DateTimeFormat("en-GB", {
  timeZone: "Europe/Rome",
  hour: "2-digit",
  minute: "2-digit",
  hourCycle: "h23",
});

export const romeMinutes = (date: Date = new Date()): number => {
  const [hours, minutes] = romeTimeFormatter.format(date).split(":").map(Number);
  return hours * 60 + minutes;
};
