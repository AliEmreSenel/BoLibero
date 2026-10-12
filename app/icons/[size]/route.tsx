import { ImageResponse } from "next/og";
import type { NextRequest } from "next/server";

// Serves the PWA manifest icons: 192/512 plain and maskable (safe-zone
// padded) as generated PNGs, so the repo stays free of binary assets.
export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ size: string }> }
) {
  const { size: sizeParam } = await params;
  const maskable = sizeParam.startsWith("maskable-");
  const px = Number(sizeParam.replace(/^maskable-/, ""));
  if (px !== 192 && px !== 512) {
    return new Response("Not found", { status: 404 });
  }
  const fontSize = maskable ? px * 0.4 : px * 0.62;

  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          background: "#020617",
          color: "#f8fafc",
          fontSize,
          fontWeight: 700,
        }}
      >
        B
      </div>
    ),
    { width: px, height: px }
  );
}
