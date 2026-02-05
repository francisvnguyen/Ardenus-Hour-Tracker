import { ImageResponse } from "next/og";

export const runtime = "edge";

export const alt = "Ardenus Nexus";
export const size = {
  width: 1200,
  height: 630,
};
export const contentType = "image/png";

export default async function Image() {
  return new ImageResponse(
    (
      <div
        style={{
          background: "#000000",
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          gap: "20px",
        }}
      >
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src="https://nexus.ardenus.com/assets/ArdenusIcon3.png"
          alt=""
          width={120}
          height={120}
        />
        <div
          style={{
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            gap: "8px",
          }}
        >
          <div
            style={{
              fontSize: 24,
              letterSpacing: "0.2em",
              color: "rgba(255, 255, 255, 0.6)",
              textTransform: "uppercase",
            }}
          >
            Ardenus
          </div>
          <div
            style={{
              fontSize: 72,
              fontWeight: 700,
              color: "#ffffff",
            }}
          >
            Nexus
          </div>
        </div>
        <div
          style={{
            fontSize: 22,
            color: "rgba(255, 255, 255, 0.4)",
            marginTop: "12px",
          }}
        >
          Team time tracking and management
        </div>
      </div>
    ),
    {
      ...size,
    }
  );
}
