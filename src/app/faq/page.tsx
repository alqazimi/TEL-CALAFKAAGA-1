import { Metadata } from "next";
import { FaqPageContent } from "@/components/marketing/faq-page-content";

export const metadata: Metadata = {
  title: "FAQ",
};

export default function FAQPage() {
  return <FaqPageContent />;
}
