import {
  getBuildingClosingTime,
  getBuildingOpeningTime,
  isBuildingOpen,
} from "./building-hours";
import { isFreeTimeEvent } from "./constants";
import { buildWindows, type RoomWindow } from "./availability";
import { computeFreeSlots } from "./free-slots";
import { toMinutes } from "./time";
import type { ClientEvent } from "./event-matching";

export interface RoomDay {
  isOpen: boolean;
  open: number;
  close: number;
  windows: RoomWindow[];
  // Events that occupy the room (classes, exams…), sorted by start time.
  classes: ClientEvent[];
}

/**
 * One room's day from its events: the same free-slot rules as the home grid
 * (study events don't block the room, 15-minute breaks aren't free time), with
 * study sessions split out as their own windows.
 */
export function roomDayFromEvents(
  events: ClientEvent[],
  building: string,
  date: Date
): RoomDay {
  const isOpen = isBuildingOpen(building, date);
  const openTime = getBuildingOpeningTime(building, date);
  const closeTime = getBuildingClosingTime(building, date);
  const classes = events
    .filter((event) => !isFreeTimeEvent(event))
    .sort((a, b) => a.start.localeCompare(b.start));
  const study = events.filter((event) => event.isStudyRoom);
  const free = isOpen ? computeFreeSlots(classes, openTime, closeTime) : [];
  return {
    isOpen,
    open: toMinutes(openTime),
    close: toMinutes(closeTime),
    windows: buildWindows(free, study),
    classes,
  };
}
