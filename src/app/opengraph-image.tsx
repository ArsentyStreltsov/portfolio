import { ImageResponse } from "next/og";

export const alt = "Arsenty Streltsov — Web Design & Development";
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
          justifyContent: "space-between",
          background: "#1a1a1a",
          padding: "64px 72px",
          fontFamily: "system-ui, sans-serif",
        }}
      >
        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            width: 88,
            height: 88,
            borderRadius: 20,
            background: "#c8ff00",
            color: "#1a1a1a",
            fontSize: 36,
            fontWeight: 800,
            letterSpacing: "-0.04em",
          }}
        >
          AS
        </div>

        <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
          <div
            style={{
              fontSize: 64,
              fontWeight: 800,
              color: "#f5f4f0",
              letterSpacing: "-0.03em",
              lineHeight: 1.05,
            }}
          >
            Arsenty Streltsov
          </div>
          <div style={{ fontSize: 28, color: "#9a9a9a", letterSpacing: "-0.01em" }}>
            Web design & development for small businesses
          </div>
        </div>
      </div>
    ),
    { ...size },
  );
}
