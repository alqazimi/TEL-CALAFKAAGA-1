"use client";

import { CheckCircle2 } from "lucide-react";
import { MarketingPage } from "@/components/marketing/marketing-page";
import { AuthRegisterCta } from "@/components/auth/auth-register-cta";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
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
        <Card className="shadow-lg">
          <CardHeader className="text-center">
            <CardTitle className="text-2xl">{t("pricing.membership")}</CardTitle>
            <div className="mt-2">
              <span className="text-4xl font-bold">${REGISTRATION_PRICE}</span>
              <span className="text-muted-foreground ml-2">{t("common.oneTime")}</span>
            </div>
            <p className="text-muted-foreground mt-2">{t("pricing.basicDesc")}</p>
          </CardHeader>
          <CardContent>
            <ul className="space-y-3 mb-8">
              {basicFeatures.map((feature) => (
                <li key={feature} className="flex items-center gap-2 text-sm">
                  <CheckCircle2 className="h-4 w-4 text-primary shrink-0" />
                  {feature}
                </li>
              ))}
            </ul>
            <AuthRegisterCta
              registerLabel={t("auth.joinNowPrice", { price: REGISTRATION_PRICE })}
              className="w-full"
              size="lg"
              variant="outline"
            />
          </CardContent>
        </Card>

        <Card
          className={cn(
            "ring-2 ring-primary shadow-xl shadow-primary/10"
          )}
        >
          <CardHeader className="text-center">
            <div className="flex items-center justify-center gap-2 flex-wrap">
              <CardTitle className="text-2xl">{t("pricing.premiumMembership")}</CardTitle>
              <Badge>{t("payment.recommended")}</Badge>
            </div>
            <div className="mt-2">
              <span className="text-4xl font-bold">${PERSONAL_SUPPORT_PRICE}</span>
              <span className="text-muted-foreground ml-2">{t("common.oneTime")}</span>
            </div>
            <p className="text-muted-foreground mt-2">{t("pricing.premiumDesc")}</p>
          </CardHeader>
          <CardContent>
            <ul className="space-y-3 mb-8">
              {premiumFeatures.map((feature) => (
                <li key={feature} className="flex items-center gap-2 text-sm">
                  <CheckCircle2 className="h-4 w-4 text-primary shrink-0" />
                  {feature}
                </li>
              ))}
            </ul>
            <AuthRegisterCta
              registerLabel={t("auth.joinNowPrice", { price: PERSONAL_SUPPORT_PRICE })}
              className="w-full"
              size="lg"
            />
          </CardContent>
        </Card>
      </div>
    </MarketingPage>
  );
}
