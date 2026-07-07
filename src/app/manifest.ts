import type { MetadataRoute } from "next";
import {
  APP_DESCRIPTION,
  APP_NAME,
  BRAND_NAVY,
  BRAND_PINK,
} from "@/lib/constants";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: `${APP_NAME} — Islamic Matchmaking`,
    short_name: APP_NAME,
    description: APP_DESCRIPTION,
    start_url: "/",
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
        src: "/icon",
        sizes: "32x32",
        type: "image/png",
      },
      {
        src: "/apple-icon",
        sizes: "180x180",
        type: "image/png",
      },
    ],
  };
}
