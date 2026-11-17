import { endOfMonth, endOfWeek, format, startOfMonth, startOfWeek } from "date-fns";

// Include complete weeks so the strip has data on both sides of a month boundary.
export function calendarRange(month: Date) {
  return {
    from: format(startOfWeek(startOfMonth(month), { weekStartsOn: 1 }), "yyyy-MM-dd"),
    to: format(endOfWeek(endOfMonth(month), { weekStartsOn: 1 }), "yyyy-MM-dd"),
  };
}
