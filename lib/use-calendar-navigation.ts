"use client";

import { useState } from "react";
import { isSameMonth, startOfDay, startOfMonth } from "date-fns";

/** Room and professor views share one selection across week and month modes. */
export function useCalendarNavigation() {
  const [selectedDate, setSelectedDate] = useState(() => startOfDay(new Date()));
  const [currentMonth, setCurrentMonth] = useState(() => startOfMonth(new Date()));

  const selectDate = (date: Date) => {
    setSelectedDate(startOfDay(date));
    setCurrentMonth((current) => (isSameMonth(current, date) ? current : startOfMonth(date)));
  };
  const moveMonth = (month: Date) => {
    selectDate(isSameMonth(month, new Date()) ? new Date() : startOfMonth(month));
  };

  return { selectedDate, currentMonth, selectDate, moveMonth };
}
