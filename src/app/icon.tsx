import { ImageResponse } from "next/og";

export const size = { width: 32, height: 32 };
export const contentType = "image/png";

export default function Icon() {
  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          background: "linear-gradient(135deg, #4a0d1f, #E91E63)",
          borderRadius: 8,
        }}
      >
        <div
          style={{
            width: 14,
            height: 14,
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
