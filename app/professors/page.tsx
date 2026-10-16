import type { Metadata } from "next";
import { ProfessorsIndex } from "./ProfessorsIndex";
import { fetchProfessorNames } from "@/lib/schedule-fetcher";

export const revalidate = 86_400;

export const metadata: Metadata = {
  title: "Professors",
  description:
    "Search the professors teaching at Bocconi University and open each one's class schedule with rooms and times.",
  alternates: { canonical: "/professors" },
};

export default async function ProfessorsPage() {
  // A total scrape failure throws so Next keeps serving the last-good ISR
  // page instead of caching the empty state for a full day.
  const professors = await fetchProfessorNames();

  return (
    <ProfessorsIndex professors={professors} />
  );
}
