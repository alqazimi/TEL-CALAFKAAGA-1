import { Metadata } from "next";
import { AboutPageContent } from "@/components/marketing/about-page-content";

export const metadata: Metadata = {
  title: "About",
  description:
    "Calaf helps Muslims find a halal life partner through respectful matchmaking, privacy-first profiles, and Islamic values.",
};

export default function AboutPage() {
  return <AboutPageContent />;
}
