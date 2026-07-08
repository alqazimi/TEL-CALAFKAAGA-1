import type { MetadataRoute } from "next";
import {
  APP_DESCRIPTION,
  APP_NAME,
  BRAND_NAVY,
  BRAND_PINK,
  SITE_BRAND_NAME,
} from "@/lib/constants";

export default function manifest(): MetadataRoute.Manifest {
  return {
    id: "/",
    name: `${SITE_BRAND_NAME} — Islamic Matchmaking`,
    short_name: SITE_BRAND_NAME,
    description: APP_DESCRIPTION,
    start_url: "/dashboard",
    scope: "/",
    display: "standalone",
    orientation: "portrait",
    background_color: BRAND_NAVY,
    theme_color: BRAND_PINK,
    lang: "so",
    dir: "ltr",
    categories: ["lifestyle", "social"],
    icons: [
      {
        src: "/logo",
        sizes: "512x512",
        type: "image/png",
        purpose: "any",
      },
      {
        src: "/logo",
        sizes: "512x512",
        type: "image/png",
        purpose: "maskable",
      },
      {
        src: "/logo",
        sizes: "192x192",
        type: "image/png",
        purpose: "any",
      },
      {
        src: "/apple-icon",
        sizes: "180x180",
        type: "image/png",
        purpose: "any",
      },
    ],
  };
}
