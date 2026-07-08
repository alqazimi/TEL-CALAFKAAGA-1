import type { MetadataRoute } from "next";
import {
  APP_DESCRIPTION,
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
    start_url: "/dashboard?source=homescreen",
    scope: "/",
    display: "standalone",
    display_override: ["standalone", "browser"],
    orientation: "portrait",
    background_color: BRAND_NAVY,
    theme_color: BRAND_PINK,
    lang: "so",
    dir: "ltr",
    categories: ["lifestyle", "social"],
    prefer_related_applications: false,
    icons: [
      {
        src: "/icon-192",
        sizes: "192x192",
        type: "image/png",
        purpose: "any",
      },
      {
        src: "/icon-512",
        sizes: "512x512",
        type: "image/png",
        purpose: "any",
      },
      {
        src: "/icon-512",
        sizes: "512x512",
        type: "image/png",
        purpose: "maskable",
      },
      {
        src: "/apple-icon",
        sizes: "180x180",
        type: "image/png",
        purpose: "any",
      },
    ],
    shortcuts: [
      {
        name: "Dashboard",
        short_name: "Home",
        url: "/dashboard?source=shortcut",
        icons: [{ src: "/icon-192", sizes: "192x192", type: "image/png" }],
      },
      {
        name: "Matches",
        short_name: "Matches",
        url: "/matches?source=shortcut",
        icons: [{ src: "/icon-192", sizes: "192x192", type: "image/png" }],
      },
    ],
  };
}
