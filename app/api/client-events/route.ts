import { NextResponse } from "next/server";
import { SITE_URL } from "@/lib/site";

export const runtime = "nodejs";

const MAX_ENCODED_ENVELOPE_SIZE = 1_350_000;
const RATE_LIMIT_PER_MINUTE = 60;

// Env-driven first (set NEXT_PUBLIC_SENTRY_DSN on Vercel to rotate without a
// code change); fall back to the same public DSN the client SDK ships with.
const DEFAULT_DSN =
    "https://0bbc394747dec3e3ac0609076b53bb78@o4509701983174656.ingest.de.sentry.io/4510102691381328";

interface RelayTarget {
    envelopeUrl: string;
    publicKey: string;
}

const parseDsn = (dsn: string): RelayTarget | null => {
    try {
        const url = new URL(dsn);
        const projectId = url.pathname.split("/").filter(Boolean).pop();
        if (!url.username || !projectId || !/^https?:$/.test(url.protocol)) return null;
        return {
            envelopeUrl: `${url.protocol}//${url.host}/api/${projectId}/envelope/`,
            publicKey: url.username,
        };
    } catch {
        return null;
    }
};

// Per-instance best-effort flood brake; on serverless this is per-isolate,
// which is enough to cap a single abuser.
const buckets = new Map<string, { count: number; windowStart: number }>();

const RATE_LIMIT_BUCKET_CAP = 10_000;

const isRateLimited = (ip: string): boolean => {
    const now = Date.now();
    const bucket = buckets.get(ip);
    if (!bucket || now - bucket.windowStart > 60_000) {
        if (buckets.size >= RATE_LIMIT_BUCKET_CAP) {
            const oldest = buckets.keys().next().value;
            if (oldest !== undefined) buckets.delete(oldest);
        }
        buckets.set(ip, { count: 1, windowStart: now });
        return false;
    }
    bucket.count += 1;
    return bucket.count > RATE_LIMIT_PER_MINUTE;
};

const clientIp = (request: Request): string =>
    request.headers.get("x-real-ip") ??
    request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ??
    "unknown";

const isAllowedOrigin = (origin: string): boolean => {
    try {
        const host = new URL(origin).host;
        return host === new URL(SITE_URL).host || host === process.env.VERCEL_URL;
    } catch {
        return false;
    }
};

export async function POST(request: Request) {
    const relay = parseDsn(process.env.NEXT_PUBLIC_SENTRY_DSN ?? DEFAULT_DSN);
    if (!relay) return new NextResponse(null, { status: 404 });

    // The relay exists only for this app's own browser clients.
    const origin = request.headers.get("origin");
    if (!origin || !isAllowedOrigin(origin)) {
        return new NextResponse(null, { status: 403 });
    }

    if (isRateLimited(clientIp(request))) {
        return new NextResponse(null, { status: 429, headers: { "retry-after": "60" } });
    }

    if (!(request.headers.get("content-type") ?? "").startsWith("text/plain")) {
        return new NextResponse(null, { status: 415 });
    }

    if (Number(request.headers.get("content-length")) > MAX_ENCODED_ENVELOPE_SIZE) {
        return new NextResponse(null, { status: 413 });
    }

    const encodedEnvelope = await request.text();

    if (
        encodedEnvelope.length === 0 ||
        encodedEnvelope.length > MAX_ENCODED_ENVELOPE_SIZE ||
        !/^[A-Za-z0-9+/]+={0,2}$/.test(encodedEnvelope)
    ) {
        return new NextResponse(null, { status: 400 });
    }

    const envelopeUrl = new URL(relay.envelopeUrl);
    // The SDK normally puts this public key in the browser request URL. Keep
    // it on the server side so the browser request has neither a Sentry URL
    // nor envelope JSON.
    envelopeUrl.searchParams.set("sentry_version", "7");
    envelopeUrl.searchParams.set("sentry_key", relay.publicKey);

    let sentryResponse: Response;
    try {
        sentryResponse = await fetch(envelopeUrl, {
            method: "POST",
            headers: { "content-type": "application/x-sentry-envelope" },
            body: Buffer.from(encodedEnvelope, "base64"),
            signal: AbortSignal.timeout(5_000),
        });
    } catch {
        // A failed relay must not make the SDK retry in a burst: accept and
        // drop. Forwarding raw 5xx here would trigger endless client retries.
        return new NextResponse(null, { status: 200 });
    }

    const status = sentryResponse.ok
        ? 200
        : sentryResponse.status === 429 || sentryResponse.status === 400
            ? sentryResponse.status
            : 200;

    return new NextResponse(null, {
        status,
        headers: {
            "x-sentry-rate-limits": sentryResponse.headers.get("x-sentry-rate-limits") ?? "",
            "retry-after": sentryResponse.headers.get("retry-after") ?? "",
        },
    });
}
