import { NextResponse } from "next/server";

export const runtime = "nodejs";

const MAX_ENCODED_ENVELOPE_SIZE = 1_500_000;
const SENTRY_ENVELOPE_URL = new URL(
    "https://o4509701983174656.ingest.de.sentry.io/api/4510102691381328/envelope/",
);

// The SDK normally puts this public key in the browser request URL. Keep it on
// the server side so the browser request has neither a Sentry URL nor envelope JSON.
SENTRY_ENVELOPE_URL.searchParams.set("sentry_version", "7");
SENTRY_ENVELOPE_URL.searchParams.set("sentry_key", "0bbc394747dec3e3ac0609076b53bb78");

export async function POST(request: Request) {
    const encodedEnvelope = await request.text();

    if (
        encodedEnvelope.length === 0 ||
        encodedEnvelope.length > MAX_ENCODED_ENVELOPE_SIZE ||
        !/^[A-Za-z0-9+/]+={0,2}$/.test(encodedEnvelope)
    ) {
        return new NextResponse(null, { status: 400 });
    }

    const envelope = Buffer.from(encodedEnvelope, "base64");
    const sentryResponse = await fetch(SENTRY_ENVELOPE_URL, {
        method: "POST",
        headers: { "content-type": "application/x-sentry-envelope" },
        body: envelope,
        signal: AbortSignal.timeout(5_000),
    });

    return new NextResponse(null, {
        status: sentryResponse.status,
        headers: {
            "x-sentry-rate-limits": sentryResponse.headers.get("x-sentry-rate-limits") ?? "",
            "retry-after": sentryResponse.headers.get("retry-after") ?? "",
        },
    });
}
