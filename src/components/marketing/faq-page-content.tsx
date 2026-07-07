"use client";

import { MarketingPage } from "@/components/marketing/marketing-page";
import { FAQAccordion } from "@/components/marketing/faq-accordion";
import { useTranslation } from "@/lib/i18n/context";

export function FaqPageContent() {
  const { t } = useTranslation();

  return (
    <MarketingPage title={t("faq.title")} subtitle={t("faq.subtitle")}>
      <FAQAccordion />
    </MarketingPage>
  );
}
