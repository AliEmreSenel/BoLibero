# BoLibero

Find a free classroom at Bocconi University, right now or at any time of the day. Live at **[bolibero.it](https://bolibero.it)**.

BoLibero reads the public Bocconi timetable ([didattica.unibocconi.it](https://didattica.unibocconi.it)) and shows when each room in Leoni (Sarfatti 25) and Velodromo (Sraffa 13) has no class scheduled.

> Unofficial and not affiliated with Bocconi University. Only rooms with an official study session ("Aule studio") are formally open for studying. Building opening hours are approximate.

## Features

- **Rooms:** every room's day as a bar, with its free slots. The status says how long a room stays free, or when it frees up.
- **Filters:**
  - "Available now", which also lists rooms freeing up within 15 minutes
  - free ≥ 2h
  - study sessions only
  - favorites
  - building, search, and a free-from/to time range
- **Time slider:** see which rooms are free at any time of the day, not just now.
- **Room and professor pages:** a month calendar and a day view of classes and free gaps.
- **Class calendar:** pick your classes and subscribe to a calendar feed (`.ics`) that stays up to date in Google, Apple or Outlook Calendar. Each class's exams are included.
- **My Schedule:** your next 7 days, with room-change alerts and optional class reminders.
- **Exams tracker:** your own exams and deadlines, exportable to your calendar.
- English and Italian, light and dark mode, works well on phones.

## Development

Requires [Bun](https://bun.sh) and Node 22+.

```bash
bun install
bun run dev        # http://localhost:3000
bun run test       # vitest
bun run typecheck
bun run lint
bun run build
```

CI runs typecheck, lint, tests and build on every pull request.

### Environment

| Variable | Purpose |
| --- | --- |
| `NEXT_PUBLIC_URL` | Canonical site URL (defaults to `https://bolibero.it`) |
| `NEXT_PUBLIC_SENTRY_DSN` | Optional Sentry error reporting |

## How it works

- `app/api/*` fetch and parse the upstream timetable on the server, with caching:
  - `events`: by day, room, professor or class
  - `classes`: the class catalog
  - `calendar.ics`: subscription feeds
- `lib/bocconi-calendar.ts` holds the HTML scraper and the class/exam matching.
- `lib/constants.ts` lists the tracked buildings and rooms. `lib/building-hours.ts` has the approximate opening hours and closures.
- `lib/free-slots.ts` and `lib/availability.ts` turn events into free windows and a room's status. 15-minute breaks between classes don't count as free time.
- Next.js (App Router), React, Tailwind CSS. Deployed on Vercel.

## Contributing

Bug reports and room or building-hours corrections are welcome. Open an [issue](https://github.com/AliEmreSenel/BoLibero/issues).
