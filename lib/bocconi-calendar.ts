import { normalizeTime } from "./time";

export interface BocconiRoom {
  roomName: string;
  building: string;
}

export interface BocconiEvent {
  date: string;
  start: string;
  end: string;
  type: string;
  code: string;
  className: string;
  description: string;
  teachers: string[];
  rooms: BocconiRoom[];
  teacherRaw: string;
  roomRaw: string;
}

export interface ClassMeeting {
  // 0 = Sunday … 6 = Saturday, as Date.getUTCDay().
  day: number;
  start: string;
}

export interface ClassOption {
  id: string;
  code: string;
  section: string;
  title: string;
  // Who teaches it and when it usually meets, summarized from the catalog
  // window. Optional: share links and saved bundles only carry the id fields.
  teachers?: string[];
  meetings?: ClassMeeting[];
}

const MAX_SUMMARY_TEACHERS = 3;
const MAX_SUMMARY_MEETINGS = 4;

/**
 * Most frequent teachers and weekly meeting times of one class. Meetings are
 * the (weekday, start) pairs seen most often in the window; when there is a
 * weekly pattern, one-off make-up dates are left out. Ties keep the first seen.
 */
export function summarizeClass(
  events: Array<Pick<BocconiEvent, "date" | "start" | "teachers">>
): { teachers: string[]; meetings: ClassMeeting[] } {
  const teacherCounts = new Map<string, number>();
  const meetingCounts = new Map<string, { meeting: ClassMeeting; count: number }>();
  for (const event of events) {
    for (const teacher of event.teachers) {
      teacherCounts.set(teacher, (teacherCounts.get(teacher) ?? 0) + 1);
    }
    const date = new Date(`${event.date}T12:00:00Z`);
    if (Number.isNaN(date.getTime())) continue;
    const meeting = { day: date.getUTCDay(), start: event.start };
    const key = `${meeting.day}|${meeting.start}`;
    const entry = meetingCounts.get(key);
    if (entry) entry.count += 1;
    else meetingCounts.set(key, { meeting, count: 1 });
  }
  const byCount = <T,>(entries: Array<[T, number]>) =>
    entries.map((entry, index) => ({ entry, index }))
      .sort((a, b) => b.entry[1] - a.entry[1] || a.index - b.index)
      .map(({ entry }) => entry[0]);
  const teachers = byCount([...teacherCounts.entries()]).slice(0, MAX_SUMMARY_TEACHERS);
  // Monday-first weekday order for display.
  const weekdayOrder = (day: number) => (day + 6) % 7;
  // When the class has a weekly pattern, one-off (make-up) dates are dropped.
  const recurring = [...meetingCounts.values()].some(({ count }) => count > 1);
  const meetingEntries = [...meetingCounts.values()]
    .filter(({ count }) => !recurring || count > 1)
    .map(({ meeting, count }) => [meeting, count] as [ClassMeeting, number]);
  const meetings = byCount(meetingEntries)
    .slice(0, MAX_SUMMARY_MEETINGS)
    .sort((a, b) => weekdayOrder(a.day) - weekdayOrder(b.day) || a.start.localeCompare(b.start));
  return { teachers, meetings };
}

const BOCONNI_SCHEDULE_URL =
  "https://didattica.unibocconi.it/aule/lista_orario.php";

// Schedule changes are relatively infrequent. This cache is intentionally much
// longer than the live room-availability cache used elsewhere in the app.
export const SUBSCRIPTION_REVALIDATE_SECONDS = 6 * 60 * 60;
export const SUBSCRIPTION_STALE_SECONDS = 7 * 24 * 60 * 60;

// Bocconi is a slow, flaky university server. Every upstream request is bounded
// so failures are fast and cacheable-as-miss instead of wedging the stack.
export const UPSTREAM_TIMEOUT_MS = 10_000;

const NAMED_ENTITIES: Record<string, string> = {
  amp: "&",
  apos: "'",
  gt: ">",
  lt: "<",
  nbsp: " ",
  quot: '"',
  agrave: "à",
  aacute: "á",
  acirc: "â",
  atilde: "ã",
  auml: "ä",
  aring: "å",
  ae: "æ",
  egrave: "è",
  eacute: "é",
  ecirc: "ê",
  euml: "ë",
  igrave: "ì",
  iacute: "í",
  icirc: "î",
  iuml: "ï",
  ntilde: "ñ",
  ograve: "ò",
  oacute: "ó",
  ocirc: "ô",
  otilde: "õ",
  ouml: "ö",
  oslash: "ø",
  ugrave: "ù",
  uacute: "ú",
  ucirc: "û",
  uuml: "ü",
  ccedil: "ç",
  szlig: "ß",
  yacute: "ý",
  yuml: "ÿ",
  euro: "€",
  sect: "§",
  deg: "°",
};

// Out-of-range code points (e.g. &#x7FFFFFFF;) must not throw and abort the
// whole parse; keep the raw match instead.
const safeCodePoint = (codePoint: number, fallback: string) =>
  codePoint >= 0 && codePoint <= 0x10ffff
    ? String.fromCodePoint(codePoint)
    : fallback;

const decodeHtmlEntities = (value: string) =>
  value.replace(/&(#x?[0-9a-f]+|[a-z]+);/gi, (match, entity) => {
    const normalized = String(entity).toLowerCase();
    if (normalized.startsWith("#x")) {
      return safeCodePoint(Number.parseInt(normalized.slice(2), 16), match);
    }
    if (normalized.startsWith("#")) {
      return safeCodePoint(Number.parseInt(normalized.slice(1), 10), match);
    }
    return NAMED_ENTITIES[normalized] ?? match;
  });

export const htmlToText = (html: string, preserveBreaks = false) => {
  const breaks = preserveBreaks ? "\n" : " ";
  return decodeHtmlEntities(html)
    .replace(/<br\s*\/?>/gi, breaks)
    .replace(/<\/(p|div|li)>/gi, breaks)
    .replace(/<script\b[^>]*>[\s\S]*?<\/script>/gi, "")
    .replace(/<style\b[^>]*>[\s\S]*?<\/style>/gi, "")
    .replace(/<[^>]+>/g, " ")
    .replace(/[ \t]+/g, " ")
    .replace(/\s+([,.;:])/g, "$1")
    .replace(/ *\n */g, "\n")
    .replace(/\n{2,}/g, "\n")
    .trim();
};

const parseRooms = (roomField: string): BocconiRoom[] =>
  roomField
    .split(";")
    .map((entry) => entry.trim())
    .filter(Boolean)
    .map((entry) => {
      const parts = entry.split(",").map((part) => part.trim());
      return {
        roomName: parts[0] || entry,
        building: parts.length > 1 ? parts[parts.length - 1] : "",
      };
    });

export const makeClassId = (code: string, section: string) =>
  `${code.trim()}::${section.trim()}`;

export const parseClassId = (id: string): ClassOption | null => {
  if (id.length > 100) return null;
  const separator = id.indexOf("::");
  if (separator < 1) return null;

  const code = id.slice(0, separator).trim();
  const section = id.slice(separator + 2).trim();
  if (!/^[a-z0-9._/-]{1,40}$/i.test(code)) return null;
  if (section && !/^(?:Cl\.|Classe)\s*[a-z0-9]+$/i.test(section)) return null;

  return { id: makeClassId(code, section), code, section, title: "" };
};

export function parseBocconiSchedule(html: string): BocconiEvent[] {
  const events: BocconiEvent[] = [];
  const rows = html.matchAll(/<tr\b[^>]*>([\s\S]*?)<\/tr>/gi);

  for (const row of rows) {
    const cells = Array.from(
      row[1].matchAll(/<td\b[^>]*>([\s\S]*?)<\/td>/gi),
      (match) => match[1]
    );
    if (cells.length < 8) continue;

    const dateParts = htmlToText(cells[0]).match(/(\d{1,2})\/(\d{1,2})\/(\d{4})/);
    if (!dateParts) continue;

    const codeStrong = cells[4].match(/<strong\b[^>]*>([\s\S]*?)<\/strong>/i);
    const code = htmlToText(codeStrong?.[1] ?? cells[4])
      .replace(/\s*(?:Cl\.|Classe)\s*[a-z0-9]+.*/i, "")
      .trim();
    const sectionMatch = htmlToText(cells[4]).match(/(?:Cl\.|Classe)\s*([a-z0-9]+)/i);
    const section = sectionMatch ? `Cl.${sectionMatch[1]}` : "";
    const teacherRaw = htmlToText(cells[6]);
    const roomRaw = htmlToText(cells[7]);
    const rawStart = htmlToText(cells[1]);
    const rawEnd = htmlToText(cells[2]);

    events.push({
      date: `${dateParts[3]}-${dateParts[2].padStart(2, "0")}-${dateParts[1].padStart(2, "0")}`,
      start: normalizeTime(rawStart) ?? rawStart,
      end: normalizeTime(rawEnd) ?? rawEnd,
      type: htmlToText(cells[3]),
      code,
      className: section,
      description: htmlToText(cells[5], true),
      teachers: teacherRaw
        .split(/(?<=\.)\s*-\s*/)
        .map((teacher) => teacher.trim())
        .filter(Boolean),
      rooms: parseRooms(roomRaw),
      teacherRaw,
      roomRaw,
    });
  }

  return events.sort(
    (a, b) =>
      a.date.localeCompare(b.date) || a.start.localeCompare(b.start)
  );
}

const setDateParam = (
  params: URLSearchParams,
  prefix: "ric_da" | "ric_a",
  date: Date
) => {
  params.set(`${prefix}_gg`, String(date.getUTCDate()).padStart(2, "0"));
  params.set(`${prefix}_mm`, String(date.getUTCMonth() + 1).padStart(2, "0"));
  params.set(`${prefix}_aa`, String(date.getUTCFullYear()));
};

export const buildBocconiScheduleUrl = ({
  startDate,
  endDate,
  query = "",
  room = "",
  type = "",
}: {
  startDate: Date;
  endDate: Date;
  query?: string;
  room?: string;
  type?: string;
}) => {
  const url = new URL(BOCONNI_SCHEDULE_URL);
  url.searchParams.set("ric_tipo", type);
  url.searchParams.set("ric_aula", room);
  url.searchParams.set("ric_descriz", query);
  setDateParam(url.searchParams, "ric_da", startDate);
  setDateParam(url.searchParams, "ric_a", endDate);
  url.searchParams.set("ric_da_hh", "8");
  url.searchParams.set("ric_da_ii", "00");
  url.searchParams.set("cerca", "CERCA");
  return url;
};

export async function fetchBocconiEvents(options: {
  startDate: Date;
  endDate: Date;
  query?: string;
  room?: string;
  type?: string;
  revalidateSeconds?: number;
  timeoutMs?: number;
}): Promise<BocconiEvent[]> {
  const url = buildBocconiScheduleUrl(options);
  const response = await fetch(url, {
    headers: {
      Accept: "text/html,application/xhtml+xml",
      "Accept-Language": "it-IT,it;q=0.9,en;q=0.8",
      "User-Agent": "BoLibero calendar subscription service",
    },
    signal: AbortSignal.timeout(options.timeoutMs ?? UPSTREAM_TIMEOUT_MS),
    next: {
      revalidate: options.revalidateSeconds ?? SUBSCRIPTION_REVALIDATE_SECONDS,
    },
  });

  if (!response.ok) {
    throw new Error(`Bocconi schedule returned ${response.status}`);
  }

  return parseBocconiSchedule(await response.text());
}

export const eventTitle = (event: Pick<BocconiEvent, "description">) =>
  event.description.split("\n")[0]?.trim() || "Bocconi class";
