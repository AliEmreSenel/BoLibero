import { type NextRequest, NextResponse } from "next/server"
import * as Sentry from "@sentry/nextjs"
import { UPSTREAM_TIMEOUT_MS } from "@/lib/bocconi-calendar"

// A real schedule page is a dense table of 150-400 KB. A maintenance page,
// login wall, or error wall is only a few KB. Treating anything below this
// floor as a failure stops "upstream returned an empty page" from being
// cached as success and shown to students as "no rooms".
const MIN_REAL_PAGE_BYTES = 10_000

// Only the query parameters the app itself sends are forwarded. This turns the
// route from an open scraping relay into a bounded proxy.
const ALLOWED_PARAMS = [
  "ric_tipo",
  "ric_aula",
  "ric_descriz",
  "ric_da_gg",
  "ric_da_mm",
  "ric_da_aa",
  "ric_da_hh",
  "ric_da_ii",
  "ric_a_gg",
  "ric_a_mm",
  "ric_a_aa",
  "cerca",
]

// Five-minute freshness is the product promise. A per-instance in-memory Map
// cannot keep that promise on serverless (cold starts, per-isolate), so the
// CDN enforces it: every distinct query hits origin at most once per 5 minutes
// globally, and serves stale for a day while refreshing.
const CACHE_CONTROL = "public, s-maxage=300, stale-while-revalidate=86400"

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams

  const bocconiUrl = new URL("https://didattica.unibocconi.it/aule/lista_orario.php")
  for (const key of ALLOWED_PARAMS) {
    const value = searchParams.get(key)
    if (value !== null) {
      bocconiUrl.searchParams.set(key, value)
    }
  }

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
      next: { revalidate: 300 },
    })

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`)
    }

    const html = await response.text()

    if (html.length < MIN_REAL_PAGE_BYTES) {
      Sentry.captureMessage("Bocconi proxy: upstream served a page below the real-table size floor", "warning")
      throw new Error(`Upstream page too small (${html.length} bytes)`)
    }

    return new NextResponse(html, {
      status: 200,
      headers: {
        "Content-Type": "text/html; charset=utf-8",
        "Cache-Control": CACHE_CONTROL,
      },
    })
  } catch (error) {
    console.error("Error fetching from Bocconi:", error)
    return NextResponse.json(
      { error: "Failed to fetch schedule data" },
      {
        status: 502,
        headers: { "Cache-Control": "no-store" },
      },
    )
  }
}
