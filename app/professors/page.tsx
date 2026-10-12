import type { Metadata } from "next";
import { fetchBocconiEvents } from "@/lib/bocconi-calendar";
import { ProfessorsIndex } from "./ProfessorsIndex";

export const revalidate = 86_400;

export const metadata: Metadata = {
  title: "Professors",
  description:
    "Search the professors teaching at Bocconi University and open each one's class schedule with rooms and times.",
  alternates: { canonical: "/professors" },
};

export default async function ProfessorsPage() {
  let professors: string[] = [];
  try {
    const start = new Date();
    const end = new Date(Date.now() + 13 * 30 * 86_400_000);
    const events = await fetchBocconiEvents({
      startDate: start,
      endDate: end,
      revalidateSeconds: 3600,
      timeoutMs: 25_000,
    });
    const names = new Set<string>();
    for (const event of events) {
      for (const teacher of event.teachers) names.add(teacher);
    }
    professors = Array.from(names).sort((a, b) => a.localeCompare(b, "it"));
  } catch {
    // Empty index: the page shows its own empty state and refetches next hour.
  }

  return (
    <ProfessorsIndex professors={professors} />
  );
}
