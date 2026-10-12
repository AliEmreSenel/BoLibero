// app/room/[building]/[room]/page.tsx
import type { Metadata } from "next";
import RoomCalendar from "./RoomCalendar";
import { BUILDING_CONFIG } from "@/lib/constants";
import { SITE_URL } from "@/lib/site";

type Props = {
    params: Promise<{ building: string, room: string }>
}

// The page body is a static client shell (schedule data is fetched in the
// browser), so every view costs a function invocation for zero server work.
// Prerender every tracked room and revalidate hourly; the sitemap's Googlebot
// daily crawl is then served entirely from the CDN.
export const revalidate = 3600;

export function generateStaticParams() {
    return Object.entries(BUILDING_CONFIG)
        .filter(([, { visible }]) => visible)
        .flatMap(([building, { rooms }]) =>
            rooms.map((room) => ({
                building: encodeURIComponent(building),
                room: encodeURIComponent(room),
            }))
        );
}

export async function generateMetadata(
    { params }: Props,
): Promise<Metadata> {
    const { building, room } = await params;

    const p_building = decodeURIComponent(building);
    const p_room = decodeURIComponent(room);

    const data = BUILDING_CONFIG[p_building];

    const building_name = data?.displayName ?? p_building;
    const room_name = p_room;
    const title = `${room_name} · ${building_name}`
    const description = `Live schedule and real-time availability for ${room_name} in ${building_name} at Bocconi University. See when this room is free and plan your time on campus.`
    const path = `/room/${encodeURIComponent(p_building)}/${encodeURIComponent(p_room)}`;

    return {
        title,
        description,
        alternates: { canonical: path },
        openGraph: {
            title,
            description,
            url: `${SITE_URL}${path}`,
        },
    }
}

export default function RoomPage() {
    // This component is a SERVER component (no 'use client')
    return <RoomCalendar />
}
