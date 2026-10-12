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

export interface ClassOption {
  id: string;
  code: string;
  section: string;
  title: string;
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

const decodeHtmlEntities = (value: string) => {
  const named: Record<string, string> = {
    amp: "&",
    apos: "'",
    gt: ">",
    lt: "<",
    nbsp: " ",
    quot: '"',
  };

  return value.replace(/&(#x?[0-9a-f]+|[a-z]+);/gi, (match, entity) => {
    const normalized = String(entity).toLowerCase();
    if (normalized.startsWith("#x")) {
      return String.fromCodePoint(Number.parseInt(normalized.slice(2), 16));
    }
    if (normalized.startsWith("#")) {
      return String.fromCodePoint(Number.parseInt(normalized.slice(1), 10));
    }
    return named[normalized] ?? match;
  });
};

const htmlToText = (html: string, preserveBreaks = false) => {
  const breaks = preserveBreaks ? "\n" : " ";
  return decodeHtmlEntities(
    html
      .replace(/<br\s*\/?>/gi, breaks)
      .replace(/<\/(p|div|li)>/gi, breaks)
      .replace(/<script\b[^>]*>[\s\S]*?<\/script>/gi, "")
      .replace(/<style\b[^>]*>[\s\S]*?<\/style>/gi, "")
      .replace(/<[^>]+>/g, " ")
  )
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
  if (section && !/^Cl\.\d+$/i.test(section)) return null;

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
      .replace(/\s*Cl\.\d+.*/i, "")
      .trim();
    const section = htmlToText(cells[4]).match(/Cl\.\d+/i)?.[0] ?? "";
    const teacherRaw = htmlToText(cells[6]);
    const roomRaw = htmlToText(cells[7]);

    events.push({
      date: `${dateParts[3]}-${dateParts[2].padStart(2, "0")}-${dateParts[1].padStart(2, "0")}`,
      start: htmlToText(cells[1]),
      end: htmlToText(cells[2]),
      type: htmlToText(cells[3]),
      code,
      className: section,
      description: htmlToText(cells[5], true),
      teachers: teacherRaw
        .split("-")
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
}: {
  startDate: Date;
  endDate: Date;
  query?: string;
}) => {
  const url = new URL(BOCONNI_SCHEDULE_URL);
  url.searchParams.set("ric_tipo", "");
  url.searchParams.set("ric_aula", "");
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
}): Promise<BocconiEvent[]> {
  const url = buildBocconiScheduleUrl(options);
  const response = await fetch(url, {
    headers: {
      Accept: "text/html,application/xhtml+xml",
      "Accept-Language": "it-IT,it;q=0.9,en;q=0.8",
      "User-Agent": "BoLibero calendar subscription service",
    },
    signal: AbortSignal.timeout(UPSTREAM_TIMEOUT_MS),
    next: { revalidate: SUBSCRIPTION_REVALIDATE_SECONDS },
  });

  if (!response.ok) {
    throw new Error(`Bocconi schedule returned ${response.status}`);
  }

  return parseBocconiSchedule(await response.text());
}

export const eventTitle = (event: Pick<BocconiEvent, "description">) =>
  event.description.split("\n")[0]?.trim() || "Bocconi class";
