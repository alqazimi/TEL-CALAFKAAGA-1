import {
  APP_DESCRIPTION,
  APP_NAME,
  PRODUCTION_SITE_URL,
  SITE_BRAND_NAME,
  SUPPORT_EMAIL,
  WHATSAPP_DISPLAY,
} from "@/lib/constants";

export function SiteJsonLd() {
  const siteUrl = (
    process.env.NEXT_PUBLIC_APP_URL ?? PRODUCTION_SITE_URL
  ).replace(/\/$/, "");
  const logoUrl = `${siteUrl}/logo`;

  const organization = {
    "@context": "https://schema.org",
    "@type": "Organization",
    name: SITE_BRAND_NAME,
    alternateName: ["Hel Calafkaaga Matchmaking"],
    url: siteUrl,
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
  };

  const website = {
    "@context": "https://schema.org",
    "@type": "WebSite",
    name: SITE_BRAND_NAME,
    alternateName: APP_NAME,
    url: siteUrl,
    description: APP_DESCRIPTION,
    inLanguage: ["en", "so"],
    publisher: {
      "@type": "Organization",
      name: SITE_BRAND_NAME,
      logo: {
        "@type": "ImageObject",
        url: logoUrl,
      },
    },
  };

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(organization) }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(website) }}
      />
    </>
  );
}
