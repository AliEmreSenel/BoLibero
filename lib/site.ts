// Single source of truth for the site's identity and canonical origin.
// Set NEXT_PUBLIC_URL in deployment (Vercel provides it automatically).
export const SITE_NAME = "BoLibero";

export const SITE_TITLE = `${SITE_NAME} - Bocconi Empty Room Finder`;

export const SITE_URL = process.env.NEXT_PUBLIC_URL ?? "https://bolibero.it";
