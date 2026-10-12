import type { Metadata } from "next";
import { Suspense } from "react";
import CalendarBuilder from "./CalendarBuilder";

export const metadata: Metadata = {
  title: "Class Calendar | BoLibero",
  description:
    "Select your Bocconi classes once and subscribe to one automatically updated calendar in Google, Apple, or Outlook Calendar. No account required.",
  openGraph: {
    title: "Class Calendar | BoLibero",
    description:
      "Select your Bocconi classes once and subscribe to one automatically updated calendar in Google, Apple, or Outlook Calendar.",
  },
};

export default function CalendarPage() {
  return (
    <Suspense>
      <CalendarBuilder />
    </Suspense>
  );
}
