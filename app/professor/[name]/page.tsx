import type { Metadata } from "next";
import ProfessorCalendar from "./ProfessorCalendar";
import { SITE_URL } from "@/lib/site";

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

    const title = `${displayName} · Class Schedule`;
    const description = `Class schedule for ${displayName} at Bocconi University: dates, times and classrooms from the university timetable.`;
    const path = `/professor/${encodeURIComponent(displayName)}`;

    return {
        title,
        description,
        alternates: { canonical: path },
        openGraph: {
            title,
            description,
            url: `${SITE_URL}${path}`,
        },
    };
}

export default function ProfessorPage() {
    // This component is a SERVER component (no 'use client')
    return <ProfessorCalendar />;
}
