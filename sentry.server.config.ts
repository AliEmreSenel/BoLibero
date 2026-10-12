// This file configures the initialization of Sentry on the server.
// The config you add here will be used whenever the server handles a request.
// https://docs.sentry.io/platforms/javascript/guides/nextjs/

import * as Sentry from "@sentry/nextjs";

Sentry.init({
    dsn: "https://0bbc394747dec3e3ac0609076b53bb78@o4509701983174656.ingest.de.sentry.io/4510102691381328",
    environment: process.env.NODE_ENV,
    enabled: process.env.NODE_ENV === "production",

    // 10% of traces; 100% burns the free-tier quota during exam-week bursts.
    tracesSampleRate: 0.1,

    // Enable logs to be sent to Sentry
    enableLogs: false,

    // Setting this option to true will print useful information to the console while you're setting up Sentry.
    debug: false,
});
