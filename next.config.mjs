import { withSentryConfig } from '@sentry/nextjs/config';
/** @type {import('next').NextConfig} */
const nextConfig = {
    images: {
        unoptimized: true,
    },
}

export default withSentryConfig(nextConfig, {
    // For all available options, see:
    // https://www.npmjs.com/package/@sentry/webpack-plugin#options

    org: "ali-emre-senel",

    project: "bspace",

    // Only print logs for uploading source maps in CI
    silent: !process.env.CI,

    // For all available options, see:
    // https://docs.sentry.io/platforms/javascript/guides/nextjs/manual-setup/

    // Upload a larger set of source maps for prettier stack traces (increases build time)
    widenClientFileUpload: true,

});
