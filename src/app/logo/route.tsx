import { ImageResponse } from "next/og";
import { SITE_BRAND_NAME } from "@/lib/constants";

/** Square brand logo for Google Organization schema (min ~112×112). */
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
          background: "linear-gradient(135deg, #064e3b 0%, #047857 55%, #059669 100%)",
        }}
      >
        <div
          style={{
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            justifyContent: "center",
            color: "#ffffff",
            fontFamily: "Georgia, 'Times New Roman', serif",
          }}
        >
          <div
            style={{
              fontSize: 72,
              fontWeight: 700,
              letterSpacing: -1,
              lineHeight: 1,
            }}
          >
            HC
          </div>
          <div
            style={{
              marginTop: 12,
              fontSize: 22,
              fontWeight: 600,
              letterSpacing: 0.5,
              opacity: 0.95,
            }}
          >
            {SITE_BRAND_NAME}
          </div>
        </div>
      </div>
    ),
    {
      width: 512,
      height: 512,
      headers: {
        "Cache-Control": "public, max-age=86400, immutable",
      },
    }
  );
}
