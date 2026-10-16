import { NextResponse } from "next/server";

// Fail-closed policy shared by every scrape-backed route: an incomplete
// upstream result must never reach the CDN cache, so failures answer 502 with
// no-store and the CDN keeps serving the last good response via swr.
const NO_STORE = { "Cache-Control": "no-store" };

export const upstreamJsonFailure = (message: string) =>
  NextResponse.json({ error: message }, { status: 502, headers: NO_STORE });

export const upstreamTextFailure = (message: string) =>
  new NextResponse(message, { status: 502, headers: NO_STORE });
