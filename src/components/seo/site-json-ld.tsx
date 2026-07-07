import {
  APP_DESCRIPTION,
  APP_NAME,
  PRODUCTION_SITE_URL,
  SUPPORT_EMAIL,
  WHATSAPP_DISPLAY,
} from "@/lib/constants";

export function SiteJsonLd() {
  const siteUrl = process.env.NEXT_PUBLIC_APP_URL ?? PRODUCTION_SITE_URL;

  const organization = {
    "@context": "https://schema.org",
    "@type": "Organization",
    name: APP_NAME,
    url: siteUrl,
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
    name: APP_NAME,
    url: siteUrl,
    description: APP_DESCRIPTION,
    inLanguage: ["en", "so"],
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
