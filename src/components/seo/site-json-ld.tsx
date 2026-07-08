import {
  APP_DESCRIPTION,
  PRODUCTION_SITE_URL,
  SITE_BRAND_NAME,
  SUPPORT_EMAIL,
  WHATSAPP_DISPLAY,
} from "@/lib/constants";

function getCanonicalSiteUrl() {
  const base = (
    process.env.NEXT_PUBLIC_APP_URL ?? PRODUCTION_SITE_URL
  ).replace(/\/$/, "");
  return `${base}/`;
}

export function SiteJsonLd() {
  const siteUrl = getCanonicalSiteUrl();
  const siteOrigin = siteUrl.replace(/\/$/, "");
  const logoUrl = `${siteOrigin}/logo`;

  const structuredData = {
    "@context": "https://schema.org",
    "@graph": [
      {
        "@type": "Organization",
        "@id": `${siteOrigin}/#organization`,
        name: SITE_BRAND_NAME,
        alternateName: ["Hel Calafkaaga Matchmaking"],
        url: siteOrigin,
        logo: {
          "@type": "ImageObject",
          url: logoUrl,
          width: 512,
          height: 512,
        },
        image: logoUrl,
        email: SUPPORT_EMAIL,
        description: APP_DESCRIPTION,
        contactPoint: {
          "@type": "ContactPoint",
          contactType: "customer support",
          telephone: WHATSAPP_DISPLAY,
          availableLanguage: ["English", "Somali"],
        },
      },
      {
        "@type": "WebSite",
        "@id": `${siteOrigin}/#website`,
        name: SITE_BRAND_NAME,
        alternateName: [
          "Hel Calafkaaga Matchmaking",
          "helcalafkaaga.com",
          "www.helcalafkaaga.com",
        ],
        url: siteUrl,
        description: APP_DESCRIPTION,
        inLanguage: ["en", "so"],
        publisher: { "@id": `${siteOrigin}/#organization` },
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
