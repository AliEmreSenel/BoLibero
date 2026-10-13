import { isStudyRoomEvent, normalizeEntity } from "@/lib/constants";
import type { BocconiEvent, BocconiRoom } from "@/lib/bocconi-calendar";

// JSON shape consumed by the room/professor pages and the home grid. Mirrors
// the old client-parsed ScheduleEvent field names so UI components keep
// working; `class` (not className) is deliberate for JSON payloads.
export interface ClientEvent {
  date: string;
  start: string;
  end: string;
  type: string;
  code: string;
  class: string;
  description: string;
  teachers: string[];
  rooms: BocconiRoom[];
  teacher_raw: string;
  room_raw: string;
  isStudyRoom: boolean;
}

const normalize = normalizeEntity;

// The scraped room/professor fields list several entities per row; matching
// must be whole-entity (case/whitespace-insensitive) so "Aula 1" never
// matches "Aula 11".
export const exactRoomMatch = (targetRoom: string, rooms: BocconiRoom[]) =>
  rooms.some(({ roomName }) => normalize(roomName) === normalize(targetRoom));

export const exactProfMatch = (targetName: string, teachers: string[]) =>
  teachers.some((teacher) => normalize(teacher) === normalize(targetName));

export const toClientEvent = (event: BocconiEvent): ClientEvent => ({
  date: event.date,
  start: event.start,
  end: event.end,
  type: event.type,
  code: event.code,
  class: event.className,
  description: event.description,
  teachers: event.teachers,
  rooms: event.rooms,
  teacher_raw: event.teacherRaw,
  room_raw: event.roomRaw,
  isStudyRoom: isStudyRoomEvent(event),
});
