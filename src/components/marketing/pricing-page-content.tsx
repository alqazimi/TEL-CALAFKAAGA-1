"use client";

import Link from "next/link";
import { Check, Headphones, ShieldCheck, Sparkles } from "lucide-react";
import { MarketingPage } from "@/components/marketing/marketing-page";
import { AuthRegisterCta } from "@/components/auth/auth-register-cta";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { PERSONAL_SUPPORT_PRICE, REGISTRATION_PRICE } from "@/lib/constants";
import { useTranslation } from "@/lib/i18n/context";
import { cn } from "@/lib/utils";

export function PricingPageContent() {
  const { t } = useTranslation();

  const basicFeatures = [
    t("pricing.feature1"),
    t("pricing.feature2"),
    t("pricing.feature3"),
    t("pricing.feature4"),
    t("pricing.feature5"),
  ];

  const premiumFeatures = [
    t("pricing.premiumFeature1"),
    t("pricing.premiumFeature2"),
    t("pricing.premiumFeature3"),
    t("pricing.premiumFeature4"),
  ];

  return (
    <MarketingPage
      title={t("pricing.title")}
      subtitle={t("pricing.subtitle")}
    >
      <div className="grid gap-6 md:grid-cols-2 max-w-4xl mx-auto">
        <Card className="rounded-3xl border-border/80 shadow-lg">
          <CardContent className="p-8">
            <h2 className="text-xl font-bold text-center">{t("pricing.membership")}</h2>
            <div className="mt-3 text-center">
              <span className="text-4xl font-bold">${REGISTRATION_PRICE}</span>
              <span className="text-muted-foreground ml-2">{t("common.oneTime")}</span>
            </div>
            <p className="text-muted-foreground mt-3 text-center text-sm leading-relaxed">
              {t("pricing.basicDesc")}
            </p>
            <ul className="mt-8 space-y-3">
              {basicFeatures.map((feature) => (
                <li key={feature} className="flex items-start gap-3 text-sm">
                  <Check className="mt-0.5 h-4 w-4 shrink-0 text-primary" />
                  <span>{feature}</span>
                </li>
              ))}
            </ul>
            <AuthRegisterCta
              registerLabel={t("auth.joinNowPrice", { price: REGISTRATION_PRICE })}
              className="mt-8 w-full"
              size="lg"
              variant="outline"
            />
          </CardContent>
        </Card>

        <Card
          className={cn(
            "rounded-3xl border-primary/30 bg-gradient-to-b from-primary/10 via-card to-card shadow-xl shadow-primary/10 ring-2 ring-primary/40"
          )}
        >
          <CardContent className="p-8">
            <div className="flex items-center justify-center gap-2 flex-wrap">
              <Sparkles className="h-5 w-5 text-primary" />
              <h2 className="text-xl font-bold text-center">{t("pricing.premiumMembership")}</h2>
              <Badge>{t("payment.recommended")}</Badge>
            </div>
            <div className="mt-3 text-center">
              <span className="text-4xl font-bold">${PERSONAL_SUPPORT_PRICE}</span>
              <span className="text-muted-foreground ml-2">{t("common.oneTime")}</span>
            </div>
            <p className="text-muted-foreground mt-3 text-center text-sm leading-relaxed">
              {t("pricing.premiumDesc")}
            </p>
            <ul className="mt-8 space-y-3">
              {premiumFeatures.map((feature) => (
                <li key={feature} className="flex items-start gap-3 text-sm">
                  <Check className="mt-0.5 h-4 w-4 shrink-0 text-primary" />
                  <span>{feature}</span>
                </li>
              ))}
            </ul>
            <AuthRegisterCta
              registerLabel={t("auth.joinNowPrice", { price: PERSONAL_SUPPORT_PRICE })}
              className="mt-8 w-full"
              size="lg"
            />
          </CardContent>
        </Card>
      </div>

      <p className="mx-auto mt-10 max-w-2xl text-center text-sm text-muted-foreground leading-relaxed">
        {t("pricing.payOnce")}
      </p>

      <div className="mx-auto mt-8 flex max-w-xl flex-wrap items-center justify-center gap-6 text-sm text-muted-foreground">
        <span className="flex items-center gap-2">
          <ShieldCheck className="h-4 w-4 text-primary" />
          {t("payment.secureStripe")}
        </span>
        <span className="flex items-center gap-2">
          <Headphones className="h-4 w-4 text-primary" />
          {t("pricing.premiumSupportHint")}
        </span>
      </div>

      <p className="mt-10 text-center text-sm text-muted-foreground">
        {t("pricing.questions")}{" "}
        <Link href="/faq" className="font-medium text-primary hover:underline">
          {t("pricing.viewFaq")}
        </Link>
        {" · "}
        <Link href="/contact" className="font-medium text-primary hover:underline">
          {t("pricing.contactUs")}
        </Link>
      </p>
    </MarketingPage>
  );
}
