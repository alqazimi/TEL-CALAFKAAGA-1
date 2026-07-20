import {
  PRODUCTION_SITE_URL,
  SITE_BRAND_NAME,
  SUPPORT_EMAIL,
  WHATSAPP_DISPLAY,
} from "@/lib/constants";
import { HOME_OG_DESCRIPTION } from "@/lib/seo/metadata";

function getCanonicalSiteUrl() {
  const base = (
    process.env.NEXT_PUBLIC_APP_URL ?? PRODUCTION_SITE_URL
  ).replace(/\/$/, "");
  return `${base}/`;
}

/**
 * Google site name + Organization — render once on the homepage.
 * Prefer a short, stable brand name (not domain, not slogan).
 * @see https://developers.google.com/search/docs/appearance/site-names
 * Logo: dynamically generated at /logo (512×512).
 */
export function SiteJsonLd() {
  const siteUrl = getCanonicalSiteUrl();
  const siteOrigin = siteUrl.replace(/\/$/, "");
  const logoUrl = `${siteOrigin}/logo`;

  const structuredData = {
    "@context": "https://schema.org",
    "@graph": [
      {
        "@type": "WebSite",
        "@id": `${siteOrigin}/#website`,
        name: SITE_BRAND_NAME,
        alternateName: [
          "Hel Calafkaaga",
          "HelCalafkaaga",
          "helcalafkaaga",
          "hel calafkaaga",
        ],
        url: siteUrl,
        description: HOME_OG_DESCRIPTION,
        inLanguage: ["so", "en"],
        publisher: { "@id": `${siteOrigin}/#organization` },
      },
      {
        "@type": "Organization",
        "@id": `${siteOrigin}/#organization`,
        name: SITE_BRAND_NAME,
        alternateName: ["HelCalafkaaga", "helcalafkaaga"],
        url: siteUrl,
        logo: {
          "@type": "ImageObject",
          url: logoUrl,
          width: 512,
          height: 512,
        },
        image: logoUrl,
        email: SUPPORT_EMAIL,
        description: HOME_OG_DESCRIPTION,
        contactPoint: {
          "@type": "ContactPoint",
          contactType: "customer support",
          telephone: WHATSAPP_DISPLAY,
          availableLanguage: ["Somali", "English"],
        },
      },
    ],
  };

  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(structuredData) }}
    />
  );
}
