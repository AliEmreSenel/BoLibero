// This file configures the initialization of Sentry on the client.
// The added config here will be used whenever a users loads a page in their browser.
// https://docs.sentry.io/platforms/javascript/guides/nextjs/

import * as Sentry from "@sentry/nextjs";

function encodeEnvelope(envelope: string | Uint8Array) {
    const bytes = typeof envelope === "string"
        ? new TextEncoder().encode(envelope)
        : envelope;
    let binary = "";

    for (const byte of bytes) {
        binary += String.fromCharCode(byte);
    }

    return btoa(binary);
}

function makeOpaqueTransport(options: Parameters<typeof Sentry.createTransport>[0]) {
    return Sentry.createTransport(options, async ({ body }) => {
        const response = await fetch("/api/client-events", {
            method: "POST",
            headers: { "content-type": "text/plain" },
            body: encodeEnvelope(body),
        });

        return {
            statusCode: response.status,
            headers: {
                "x-sentry-rate-limits": response.headers.get("x-sentry-rate-limits"),
                "retry-after": response.headers.get("retry-after"),
            },
        };
    });
}

Sentry.init({
    dsn: "https://0bbc394747dec3e3ac0609076b53bb78@o4509701983174656.ingest.de.sentry.io/4510102691381328",
    transport: makeOpaqueTransport,

    // This is a hobby-tier project: dev traffic must not consume quota, and
    // every trace/log shipped from this client costs a relay invocation.
    enabled: process.env.NODE_ENV === "production",
    environment: process.env.NEXT_PUBLIC_VERCEL_ENV ?? "production",

    // Add optional integrations for additional features
    integrations: [
        Sentry.replayIntegration(),
        Sentry.consoleLoggingIntegration({
            // Console "log" calls contain scraped schedules and professor
            // names; only warnings and errors belong in telemetry.
            levels: ["warn", "error"],
        }),
    ],

    // 100% of traces at student-app traffic burns the quota and multiplies
    // relay invocations. Errors and on-error replays stay at 100%.
    tracesSampleRate: 0.1,

    // Define how likely Replay events are sampled.
    // This sets the sample rate to be 10%. You may want this to be 100% while
    // in development and sample at a lower rate in production
    replaysSessionSampleRate: 0.1,

    // Define how likely Replay events are sampled when an error occurs.
    replaysOnErrorSampleRate: 1.0,

    // Setting this option to true will print useful information to the console while you're setting up Sentry.
    debug: false,
});

export const onRouterTransitionStart = Sentry.captureRouterTransitionStart;
