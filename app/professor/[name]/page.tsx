import type { Metadata } from "next";
import { notFound } from "next/navigation";
import ProfessorCalendar from "./ProfessorCalendar";
import { SITE_URL } from "@/lib/site";
import { fetchProfessorNames } from "@/lib/professors";

// The page body is a static client shell (schedule data is fetched in the
// browser), so shell renders are hourly-cached.
export const revalidate = 3600;

type Props = {
    params: Promise<{ name: string }>
}

// Generate each page on its first visit, then serve its HTML and metadata
// from the hourly ISR cache instead of rebuilding hundreds of pages on deploy.
export function generateStaticParams() {
    return [];
}

function decodePathSegment(value: string): string {
    try {
        return decodeURIComponent(value);
    } catch {
        // keep the raw segment if it is not valid percent-encoding
        return value;
    }
}

async function resolveProfessor(name: string): Promise<string> {
    const displayName = decodePathSegment(name);
    const professors = await fetchProfessorNames();
    if (!professors.includes(displayName)) {
        notFound();
    }
    return displayName;
}

export async function generateMetadata(
    { params }: Props,
): Promise<Metadata> {
    const { name } = await params;
    const displayName = await resolveProfessor(name);

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

export default async function ProfessorPage({ params }: Props) {
    // This component is a SERVER component (no 'use client')
    const { name } = await params;
    await resolveProfessor(name);
    return <ProfessorCalendar />;
}
