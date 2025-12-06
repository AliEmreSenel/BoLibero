import { BUILDING_CONFIG } from '@/lib/schedule-fetcher';
import type { MetadataRoute } from 'next'


const BASE_URL = "https://bolibero.it";

function roomUrl(building: string, room: string) {
    // Use encodeURIComponent so it matches your [building]/[room] dynamic segments
    const buildingParam = encodeURIComponent(building)
    const roomParam = encodeURIComponent(room)

    return `${BASE_URL}/room/${buildingParam}/${roomParam}`
}

export default function sitemap(): MetadataRoute.Sitemap {
    const now = new Date()

    const rootEntries: MetadataRoute.Sitemap = [
        {
            url: BASE_URL,
            lastModified: now,
            changeFrequency: 'daily',
            priority: 1,
        },
    ]

    const roomEntries: MetadataRoute.Sitemap = Object.entries(BUILDING_CONFIG)
        .filter(([, config]) => config.visible)
        .flatMap(([building, config]) =>
            config.rooms.map((room) => ({
                url: roomUrl(building, room),
                lastModified: now,
                changeFrequency: 'daily',
                priority: 0.8,
            })),
        )

    return [...rootEntries, ...roomEntries]
}
