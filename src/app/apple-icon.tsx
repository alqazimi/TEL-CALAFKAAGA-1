import { ImageResponse } from "next/og";

export const size = { width: 180, height: 180 };
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
          background: "linear-gradient(135deg, #2a0512, #4a0d1f 40%, #E91E63 100%)",
          borderRadius: 36,
        }}
      >
        <div
          style={{
            width: 72,
            height: 72,
            background: "#ffffff",
            borderRadius: "50% 50% 50% 0",
            transform: "rotate(-45deg)",
          }}
        />
      </div>
    ),
    { ...size }
  );
}
