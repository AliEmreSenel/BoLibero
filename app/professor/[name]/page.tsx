import type { Metadata } from "next";
import ProfessorCalendar from "./ProfessorCalendar";

// The page body is a static client shell (schedule data is fetched in the
// browser), so shell renders are hourly-cached.
export const revalidate = 3600;

type Props = {
    params: Promise<{ name: string }>
}

export async function generateMetadata(
    { params }: Props,
): Promise<Metadata> {
    const { name } = await params;
    let displayName = name;
    try {
        displayName = decodeURIComponent(name);
    } catch {
        // keep the raw segment if it is not valid percent-encoding
    }

    const title = `${displayName} - Class Schedule | BoLibero`;
    const description = `Class schedule for ${displayName} at Bocconi University: dates, times and classrooms from the university timetable.`;

    return {
        title,
        description,
        openGraph: {
            title,
            description,
            url: `https://bolibero.it/professor/${encodeURIComponent(displayName)}`,
        },
    };
}

export default function ProfessorPage() {
    // This component is a SERVER component (no 'use client')
    return <ProfessorCalendar />;
}
