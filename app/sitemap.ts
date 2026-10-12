import { BUILDING_CONFIG } from "@/lib/constants";
import { SITE_URL as BASE_URL } from "@/lib/site";
import type { MetadataRoute } from "next";

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
        {
            url: `${BASE_URL}/calendar`,
            lastModified: now,
            changeFrequency: 'weekly',
            priority: 0.9,
        },
        {
            url: `${BASE_URL}/schedule`,
            lastModified: now,
            changeFrequency: 'weekly',
            priority: 0.7,
        },
        {
            url: `${BASE_URL}/exams`,
            lastModified: now,
            changeFrequency: 'weekly',
            priority: 0.7,
        },
        {
            url: `${BASE_URL}/privacy-policy`,
            lastModified: now,
            changeFrequency: 'yearly',
            priority: 0.3,
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
