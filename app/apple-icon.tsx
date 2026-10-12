import { ImageResponse } from "next/og";

export const size = { width: 512, height: 512 };
export const contentType = "image/png";

export default function AppleIcon() {
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
          fontSize: 300,
          fontWeight: 700,
        }}
      >
        B
      </div>
    ),
    { width: 180, height: 180 }
  );
}
