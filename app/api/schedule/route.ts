import { type NextRequest, NextResponse } from "next/server"
import * as Sentry from "@sentry/nextjs"
import { UPSTREAM_TIMEOUT_MS } from "@/lib/bocconi-calendar"

// In-memory cache for server-side caching
const cache = new Map<string, { data: string; timestamp: number }>()
const CACHE_DURATION = 5 * 60 * 1000 // 5 minutes

// A real schedule page is a dense table of 150-400 KB. A maintenance page,
// login wall, or error wall is only a few KB. Treating anything below this
// floor as a failure stops "upstream returned an empty page" from being
// cached as success and shown to students as "no rooms".
const MIN_REAL_PAGE_BYTES = 10_000

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams

  // Create cache key from search parameters
  const cacheKey = searchParams.toString()
  const now = Date.now()

  // Check cache first
  const cached = cache.get(cacheKey)
  if (cached && now - cached.timestamp < CACHE_DURATION) {
    console.log("Returning cached data for:", cacheKey)
    return new NextResponse(cached.data, {
      status: 200,
      headers: {
        "Content-Type": "text/html; charset=utf-8",
        "Access-Control-Allow-Origin": "*",
        "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS",
        "Access-Control-Allow-Headers": "Content-Type, Authorization",
        "X-Cache": "HIT",
      },
    })
  }

  // Build the Bocconi URL with parameters
  const bocconiUrl = new URL("https://didattica.unibocconi.it/aule/lista_orario.php")

  // Copy all search parameters
  searchParams.forEach((value, key) => {
    bocconiUrl.searchParams.set(key, value)
  })

  console.log("Fetching from Bocconi:", bocconiUrl.toString())

  try {
    const response = await fetch(bocconiUrl.toString(), {
      method: "GET",
      signal: AbortSignal.timeout(UPSTREAM_TIMEOUT_MS),
      headers: {
        Accept: "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8",
        "Accept-Language": "it-IT,it;q=0.9,en;q=0.8",
        "User-Agent":
          "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36",
        Referer: "https://didattica.unibocconi.it/",
        Connection: "keep-alive",
        "Upgrade-Insecure-Requests": "1",
      },
    })

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`)
    }

    const html = await response.text()

    if (html.length < MIN_REAL_PAGE_BYTES) {
      Sentry.captureMessage("Bocconi proxy: upstream served a page below the real-table size floor", "warning")
      throw new Error(`Upstream page too small (${html.length} bytes)`)
    }

    // Cache the response
    cache.set(cacheKey, { data: html, timestamp: now })

    // Clean up old cache entries (simple cleanup)
    if (cache.size > 100) {
      const oldestKey = cache.keys().next().value
      if (oldestKey) cache.delete(oldestKey)
    }

    return new NextResponse(html, {
      status: 200,
      headers: {
        "Content-Type": "text/html; charset=utf-8",
        "Access-Control-Allow-Origin": "*",
        "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS",
        "Access-Control-Allow-Headers": "Content-Type, Authorization",
        "X-Cache": "MISS",
      },
    })
  } catch (error) {
    console.error("Error fetching from Bocconi:", error)
    return NextResponse.json(
      { error: "Failed to fetch schedule data" },
      {
        status: 500,
        headers: {
          "Access-Control-Allow-Origin": "*",
          "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS",
          "Access-Control-Allow-Headers": "Content-Type, Authorization",
        },
      },
    )
  }
}

export async function OPTIONS() {
  return new NextResponse(null, {
    status: 200,
    headers: {
      "Access-Control-Allow-Origin": "*",
      "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS",
      "Access-Control-Allow-Headers": "Content-Type, Authorization",
    },
  })
}
