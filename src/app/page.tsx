import { LandingPage } from "@/components/marketing/landing-page";
import { SiteJsonLd } from "@/components/seo/site-json-ld";

export default function HomePage() {
  return (
    <>
      <SiteJsonLd />
      <LandingPage />
    </>
  );
}
