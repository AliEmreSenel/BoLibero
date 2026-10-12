import { ImageResponse } from "next/og";

export const alt = "BoLibero — Bocconi room finder & class calendar";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

export default function OpenGraphImage() {
  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          justifyContent: "center",
          padding: 80,
          background: "#020617",
          color: "#f8fafc",
        }}
      >
        <div style={{ fontSize: 84, fontWeight: 700, display: "flex" }}>
          BoLibero
        </div>
        <div style={{ fontSize: 40, marginTop: 24, color: "#94a3b8", display: "flex" }}>
          Find free study rooms at Bocconi University
        </div>
        <div style={{ fontSize: 40, marginTop: 12, color: "#94a3b8", display: "flex" }}>
          and subscribe to your class schedule
        </div>
      </div>
    ),
    size
  );
}
