// app/room/[building]/[room]/page.tsx
import type { Metadata } from "next";
import { notFound } from "next/navigation";
import RoomCalendar from "./RoomCalendar";
import { BUILDING_CONFIG, getBuildingDisplayName, isLinkableRoomName, normalizeEntity } from "@/lib/constants";
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

function decodePathSegment(value: string): string {
    try {
        return decodeURIComponent(value);
    } catch {
        return value;
    }
}

function resolveRoom(building: string, room: string) {
    const buildingKey = decodePathSegment(building);
    const roomName = decodePathSegment(room);
    const data = BUILDING_CONFIG[buildingKey];
    // Config rooms match with the shared normalization (config Roentgen codes
    // embed U+2011, the feed sends ASCII hyphens). Rooms the feed lists but
    // the config lacks are real rooms on campus — render them; RoomCalendar
    // fetches purely by room name. Virtual attendance markers 404.
    const knownRoom = data?.rooms.some((r) => normalizeEntity(r) === normalizeEntity(roomName)) ?? false;
    if (!knownRoom && !isLinkableRoomName(roomName)) {
        notFound();
    }
    return { buildingKey, roomName };
}

export async function generateMetadata(
    { params }: Props,
): Promise<Metadata> {
    const { building, room } = await params;

    const { buildingKey, roomName } = resolveRoom(building, room);

    const building_name = getBuildingDisplayName(buildingKey);
    const room_name = roomName;
    const title = `${room_name} · ${building_name}`
    const description = `Live schedule and real-time availability for ${room_name} in ${building_name} at Bocconi University. See when this room is free and plan your time on campus.`
    const path = `/room/${encodeURIComponent(buildingKey)}/${encodeURIComponent(roomName)}`;

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

export default async function RoomPage({ params }: Props) {
    // This component is a SERVER component (no 'use client')
    const { building, room } = await params;
    resolveRoom(building, room);
    return <RoomCalendar />
}
