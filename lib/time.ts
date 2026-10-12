// Scraped schedule times are raw page text ("8:30", "24:00", "8.30").
// Every consumer that compares times must normalize first.
export const normalizeTime = (time: string): string | null => {
  const match = time.trim().match(/^(\d{1,2}):(\d{2})$/);
  if (!match) return null;
  const hours = Number(match[1]);
  const minutes = Number(match[2]);
  if (hours > 24 || minutes > 59) return null;
  return `${String(hours).padStart(2, "0")}:${match[2]}`;
};

// Minutes since midnight for a normalized "HH:MM" string.
export const toMinutes = (hhmm: string): number => {
  const [hours, minutes] = hhmm.split(":").map(Number);
  return hours * 60 + minutes;
};

export const minutesToTime = (total: number): string =>
  `${String(Math.floor(total / 60)).padStart(2, "0")}:${String(total % 60).padStart(2, "0")}`;
