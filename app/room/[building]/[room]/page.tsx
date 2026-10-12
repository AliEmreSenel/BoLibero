// app/room/[building]/[room]/page.tsx
import type { Metadata } from "next";
import { notFound } from "next/navigation";
import RoomCalendar from "./RoomCalendar";
import { BUILDING_CONFIG } from "@/lib/constants";

type Props = {
    params: Promise<{ building: string, room: string }>
    searchParams: Promise<{ [key: string]: string | string[] | undefined }>
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
    if (!data || !data.rooms.includes(roomName)) {
        notFound();
    }
    return { buildingKey, roomName, data };
}

export async function generateMetadata(
    { params, searchParams }: Props,
): Promise<Metadata> {
    let { building, room } = await params;

    const { buildingKey, roomName, data } = resolveRoom(building, room);

    const building_name = data.displayName;
    const room_name = roomName;
    const title = `${building_name} - ${room_name} Schedule | BoLibero`
    const description = `Live schedule and real-time availability for ${room_name} in ${building_name} at Bocconi University. See when this room is free and plan your time on campus.`

    return {
        title,
        description,
        openGraph: {
            title,
            description,
            url: `https://bolibero.it/room/${building}/${room}`,
        },
    }
}

export default async function RoomPage({ params }: Props) {
    // This component is a SERVER component (no 'use client')
    const { building, room } = await params;
    resolveRoom(building, room);
    return <RoomCalendar />
}
