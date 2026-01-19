// app/room/[building]/[room]/page.tsx
import type { Metadata } from "next";
import RoomCalendar from "./RoomCalendar";
import { BUILDING_CONFIG } from "@/lib/constants";

type Props = {
    params: Promise<{ building: string, room: string }>
    searchParams: Promise<{ [key: string]: string | string[] | undefined }>
}

export async function generateMetadata(
    { params, searchParams }: Props,
): Promise<Metadata> {
    let { building, room } = await params;

    let p_building = decodeURIComponent(building);
    let p_room = decodeURIComponent(room);

    let data = BUILDING_CONFIG[p_building];

    const building_name = data.displayName;
    const room_name = p_room;
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

export default function RoomPage() {
    // This component is a SERVER component (no 'use client')
    return <RoomCalendar />
}
