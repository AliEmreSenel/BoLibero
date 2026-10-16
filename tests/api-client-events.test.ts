import { afterEach, describe, expect, it, vi } from "vitest";
import { POST } from "@/app/api/client-events/route";
import { SITE_URL } from "@/lib/site";

const SITE_ORIGIN = new URL(SITE_URL).origin;
const VALID_BODY = Buffer.from("{}", "utf8").toString("base64");

const makeRequest = ({
  origin = SITE_ORIGIN,
  contentType = "text/plain",
  contentLength,
  body = VALID_BODY,
  ip,
}: {
  origin?: string | null;
  contentType?: string | null;
  contentLength?: number;
  body?: string;
  ip?: string;
} = {}): Request => {
  const headers = new Headers();
  if (origin) headers.set("origin", origin);
  if (contentType) headers.set("content-type", contentType);
  if (contentLength !== undefined) headers.set("content-length", String(contentLength));
  if (ip) headers.set("x-real-ip", ip);
  return { headers, text: async () => body } as unknown as Request;
};

const stubFetch = () => {
  const fetchMock = vi.fn(async (_input: unknown, _init?: unknown) => new Response(null, { status: 200 }));
  vi.stubGlobal("fetch", fetchMock);
  return fetchMock;
};

afterEach(() => {
  vi.unstubAllGlobals();
  delete process.env.NEXT_PUBLIC_SENTRY_DSN;
  delete process.env.VERCEL_URL;
});

describe("POST /api/client-events", () => {
  it("rejects foreign origins with 403", async () => {
    expect((await POST(makeRequest({ origin: "https://evil.com" }))).status).toBe(403);
    expect((await POST(makeRequest({ origin: null }))).status).toBe(403);
  });

  it("rejects attacker-controlled *.vercel.app origins with 403", async () => {
    expect((await POST(makeRequest({ origin: "https://attacker.vercel.app" }))).status).toBe(403);
  });

  it("accepts the exact VERCEL_URL host", async () => {
    stubFetch();
    process.env.VERCEL_URL = "bspace-git-preview.vercel.app";
    const response = await POST(makeRequest({ origin: "https://bspace-git-preview.vercel.app" }));
    expect(response.status).toBe(200);
  });

  it("rejects oversized bodies with 413 before reading them", async () => {
    const response = await POST(makeRequest({ contentLength: 2_000_000 }));
    expect(response.status).toBe(413);
  });

  it("rejects non-text/plain bodies with 415", async () => {
    const response = await POST(makeRequest({ contentType: "application/json" }));
    expect(response.status).toBe(415);
  });

  it("returns 429 with Retry-After when over the per-IP limit", async () => {
    stubFetch();
    let response: Response = new Response();
    for (let i = 0; i <= 60; i++) {
      response = await POST(makeRequest({ ip: "203.0.113.7" }));
    }
    expect(response.status).toBe(429);
    expect(response.headers.get("retry-after")).toBe("60");
  });

  it("relays a valid envelope upstream with 200", async () => {
    const fetchMock = stubFetch();
    const response = await POST(makeRequest());
    expect(response.status).toBe(200);
    expect(fetchMock).toHaveBeenCalledOnce();
    const url = fetchMock.mock.calls[0][0] as URL;
    expect(url.searchParams.get("sentry_key")).toBe("0bbc394747dec3e3ac0609076b53bb78");
  });

  it("accepts https: DSNs and rejects ftp:", async () => {
    stubFetch();
    process.env.NEXT_PUBLIC_SENTRY_DSN = "ftp://key@o1.ingest.sentry.io/123";
    expect((await POST(makeRequest())).status).toBe(404);
    process.env.NEXT_PUBLIC_SENTRY_DSN = "https://key@o1.ingest.sentry.io/123";
    expect((await POST(makeRequest())).status).toBe(200);
  });

  it("uses NEXT_PUBLIC_SENTRY_DSN when set", async () => {
    const fetchMock = stubFetch();
    process.env.NEXT_PUBLIC_SENTRY_DSN = "https://envkey@o1.ingest.sentry.io/999";
    const response = await POST(makeRequest());
    expect(response.status).toBe(200);
    const url = fetchMock.mock.calls[0][0] as URL;
    expect(url.pathname).toBe("/api/999/envelope/");
    expect(url.searchParams.get("sentry_key")).toBe("envkey");
  });
});
