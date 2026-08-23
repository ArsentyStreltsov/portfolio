import { readFile } from "node:fs/promises";
import { join } from "node:path";
import { ImageResponse } from "next/og";

export const size = { width: 180, height: 180 };
export const contentType = "image/png";

export default async function AppleIcon() {
  const syne = await readFile(join(process.cwd(), "src/assets/Syne-Bold.ttf"));

  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          background: "#1a1a1a",
          borderRadius: 34,
          color: "#c8ff00",
          fontSize: 90,
          fontWeight: 700,
          letterSpacing: "0.08em",
          fontFamily: "Syne",
          lineHeight: 1,
          paddingLeft: "0.08em",
        }}
      >
        AS
      </div>
    ),
    {
      ...size,
      fonts: [
        {
          name: "Syne",
          data: syne,
          style: "normal",
          weight: 700,
        },
      ],
    },
  );
}
