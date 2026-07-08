import { ImageResponse } from "next/og";

export const runtime = "edge";

export async function GET() {
  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          background: "linear-gradient(135deg, #2a0512 0%, #4a0d1f 45%, #E91E63 100%)",
        }}
      >
        <div
          style={{
            width: 220,
            height: 220,
            background: "#ffffff",
            borderRadius: "50% 50% 50% 0",
            transform: "rotate(-45deg)",
          }}
        />
      </div>
    ),
    {
      width: 512,
      height: 512,
      headers: {
        "Cache-Control": "public, max-age=604800, immutable",
      },
    }
  );
}
