import type { Metadata } from "next";
import { APP_NAME, PRODUCTION_SITE_URL, SITE_BRAND_NAME } from "@/lib/constants";

/** Primary SEO copy — Somali first (default site language). */
export const SEO_SO = {
  siteTitle: APP_NAME,
  siteDescription:
    "Waxaan isku xirnaa rag iyo dumar dhab u ah guurka iyadoo lagu saleynayo qiyamka Islaamka, kalsoonida, iyo ixtiraam. Diiwaangeli, dhammaystir profile-kaaga, oo hel lammaane xalaal ah.",
  keywords: [
    "guur",
    "guurka",
    "isbarbardhig",
    "xalaal",
    "muslim",
    "islaam",
    "hel calafkaaga",
    "lammaane",
    "lamaanahaaga",
    "soomaali",
  ],
  pages: {
    home: {
      title: `${APP_NAME}`,
      description:
        "Hel lammaanaha noloshaada iyadoo lagu saleynayo diinta, iswaafajinta, iyo ixtiraamka. Diiwaangeli laga bilaabo $10.",
    },
    about: {
      title: "Naga Saabsan",
      description:
        "Hel Calafkaaga waxay ka caawisaa Muslimiinta inay helaan lammaane xalaal ah iyadoo la ilaalinayo qarsoodiga iyo qiyamka Islaamka.",
    },
    howItWorks: {
      title: "Sida Uu U Shaqeeyo",
      description:
        "Is diiwaangeli, dhammaystir profile-kaaga, hel isbarbardhigyo ku habboon, oo si ixtiraam leh ula xiriir lammaanayaasha Hel Calafkaaga.",
    },
    pricing: {
      title: "Qiimaha",
      description:
        "Diiwaangelinta Hel Calafkaaga: $10 caadi ama $20 taageero shakhsi ah. Hal lacag, helitaan buuxa oo isbarbardhig guur xalaal ah.",
    },
    faq: {
      title: "Su'aalaha Inta Badan La Isweydiiyo",
      description:
        "Jawaabo ku saabsan Hel Calafkaaga — guur xalaal, qiimaha ($10 / $20), qarsoodiga, iyo sida isbarbardhiggu u shaqeeyo.",
    },
    contact: {
      title: "Nala Soo Xiriir",
      description:
        "La xiriir Hel Calafkaaga — email ama WhatsApp caawinta diiwaangelinta iyo taageerada shakhsi ahaaneed.",
    },
    privacy: {
      title: "Siyaasadda Qarsoodiga",
      description:
        "Sida Hel Calafkaaga u ilaaliso xogtaada shakhsi ahaaneed iyo sida aan u maamulno macluumaadka xubnaha.",
    },
    terms: {
      title: "Shuruudaha Adeegga",
      description:
        "Shuruudaha isticmaalka Hel Calafkaaga — diiwaangelinta, dhaqanka xubnaha, iyo mabaadi'da guurka xalaal ah.",
    },
  },
} as const;

export function siteUrl(): string {
  return (process.env.NEXT_PUBLIC_APP_URL ?? PRODUCTION_SITE_URL).replace(/\/$/, "");
}

export function rootMetadata(): Metadata {
  const base = siteUrl();
  const { siteTitle, siteDescription, keywords } = SEO_SO;

  return {
    applicationName: SITE_BRAND_NAME,
    title: {
      default: siteTitle,
      template: `%s | ${SITE_BRAND_NAME}`,
    },
    description: siteDescription,
    keywords: [...keywords],
    metadataBase: new URL(base),
    creator: SITE_BRAND_NAME,
    publisher: SITE_BRAND_NAME,
    category: "lifestyle",
    alternates: {
      canonical: "/",
      languages: {
        so: `${base}/`,
        en: `${base}/`,
      },
    },
    icons: {
      icon: [{ url: "/icon", type: "image/png", sizes: "48x48" }],
      apple: [{ url: "/apple-icon", type: "image/png", sizes: "180x180" }],
    },
    openGraph: {
      type: "website",
      locale: "so_SO",
      alternateLocale: ["en_US"],
      url: `${base}/`,
      siteName: SITE_BRAND_NAME,
      title: SITE_BRAND_NAME,
      description: siteDescription,
      images: [
        {
          url: "/opengraph-image",
          width: 1200,
          height: 630,
          alt: SITE_BRAND_NAME,
        },
      ],
    },
    twitter: {
      card: "summary_large_image",
      title: SITE_BRAND_NAME,
      description: siteDescription,
      images: ["/opengraph-image"],
    },
    robots: { index: true, follow: true },
    appleWebApp: {
      capable: true,
      title: SITE_BRAND_NAME,
      statusBarStyle: "black-translucent",
    },
    manifest: "/manifest.webmanifest",
    formatDetection: { telephone: false },
    other: {
      "og:site_name": SITE_BRAND_NAME,
    },
  };
}

export function pageMetadata(
  page: keyof typeof SEO_SO.pages,
  path: string
): Metadata {
  const { title, description } = SEO_SO.pages[page];
  const canonical = `${siteUrl()}${path}`;
  const isHome = path === "/";

  return {
    title: isHome ? { absolute: SITE_BRAND_NAME } : title,
    description,
    applicationName: SITE_BRAND_NAME,
    alternates: {
      canonical,
      languages: { so: canonical, en: canonical },
    },
    openGraph: {
      title: isHome ? SITE_BRAND_NAME : title,
      description,
      url: canonical,
      locale: "so_SO",
      alternateLocale: ["en_US"],
      siteName: SITE_BRAND_NAME,
      type: "website",
    },
    twitter: {
      card: "summary_large_image",
      title: isHome ? SITE_BRAND_NAME : title,
      description,
    },
  };
}
