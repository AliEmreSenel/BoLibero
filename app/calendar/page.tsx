import type { Metadata } from "next";
import CalendarBuilder from "./CalendarBuilder";

export const metadata: Metadata = {
  title: "Class Calendar | BoLibero",
  description:
    "Select your Bocconi classes and subscribe to one automatically updated calendar.",
};

export default function CalendarPage() {
  return <CalendarBuilder />;
}
