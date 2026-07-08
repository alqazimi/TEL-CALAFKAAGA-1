import { ImageResponse } from "next/og";
import { APP_DESCRIPTION, APP_NAME } from "@/lib/constants";

export const alt = `${APP_NAME} — Islamic Matchmaking`;
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

export default function OpenGraphImage() {
  return new ImageResponse(
    (
      <div
        style={{
          height: "100%",
          width: "100%",
          display: "flex",
          flexDirection: "column",
          justifyContent: "center",
          padding: "72px 80px",
          background:
            "linear-gradient(135deg, #2a0512 0%, #4a0d1f 35%, #8a1230 70%, #E91E63 100%)",
          color: "#ffffff",
          fontFamily: "system-ui, sans-serif",
        }}
      >
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: 20,
            marginBottom: 28,
          }}
        >
          <div
            style={{
              width: 72,
              height: 72,
              borderRadius: 18,
              background: "#E91E63",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            <div
              style={{
                width: 28,
                height: 28,
                background: "#ffffff",
                borderRadius: "50% 50% 50% 0",
                transform: "rotate(-45deg)",
              }}
            />
          </div>
          <div style={{ fontSize: 72, fontWeight: 700, letterSpacing: -2 }}>
            {APP_NAME}
          </div>
        </div>
        <div style={{ fontSize: 40, fontWeight: 600, opacity: 0.95 }}>
          Islamic Matchmaking Service
        </div>
        <div
          style={{
            marginTop: 32,
            fontSize: 28,
            lineHeight: 1.45,
            opacity: 0.85,
            maxWidth: 900,
          }}
        >
          {APP_DESCRIPTION}
        </div>
        <div
          style={{
            marginTop: "auto",
            fontSize: 22,
            opacity: 0.7,
          }}
        >
          helcalafkaaga.com
        </div>
      </div>
    ),
    { ...size }
  );
}
