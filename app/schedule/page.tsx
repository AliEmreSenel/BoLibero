import type { Metadata } from "next";
import ScheduleView from "./ScheduleView";

export const metadata: Metadata = {
  title: "My Schedule",
  description:
    "Your next 7 days of Bocconi classes, built from the classes you selected — rooms and times from the public timetable.",
  alternates: { canonical: "/schedule" },
};

export default function SchedulePage() {
  return <ScheduleView />;
}
