import {
  PRODUCTION_SITE_URL,
  SITE_BRAND_NAME,
  SUPPORT_EMAIL,
  WHATSAPP_DISPLAY,
} from "@/lib/constants";
import { SEO_SO } from "@/lib/seo/metadata";

function getCanonicalSiteUrl() {
  const base = (
    process.env.NEXT_PUBLIC_APP_URL ?? PRODUCTION_SITE_URL
  ).replace(/\/$/, "");
  return `${base}/`;
}

/**
 * Google site name preference — WebSite.name on the home page.
 * @see https://developers.google.com/search/docs/appearance/site-names
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
        alternateName: ["HelCalafkaaga", "Hel Calaf"],
        url: siteUrl,
        description: SEO_SO.siteDescription,
        inLanguage: ["so", "en"],
        publisher: { "@id": `${siteOrigin}/#organization` },
      },
      {
        "@type": "Organization",
        "@id": `${siteOrigin}/#organization`,
        name: SITE_BRAND_NAME,
        alternateName: ["HelCalafkaaga", "Hel Calaf"],
        url: siteOrigin,
        logo: {
          "@type": "ImageObject",
          url: logoUrl,
          width: 512,
          height: 512,
        },
        image: logoUrl,
        email: SUPPORT_EMAIL,
        description: SEO_SO.siteDescription,
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
