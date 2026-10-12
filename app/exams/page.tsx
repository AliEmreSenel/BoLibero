import type { Metadata } from "next";
import ExamsTracker from "./ExamsTracker";

export const metadata: Metadata = {
  title: "Exams & Deadlines",
  description:
    "Track your Bocconi exams and assignment deadlines on your device and export them to your calendar with a reminder one day before.",
  alternates: { canonical: "/exams" },
};

export default function ExamsPage() {
  return <ExamsTracker />;
}
