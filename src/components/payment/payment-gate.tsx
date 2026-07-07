"use client";

import { useAction } from "convex/react";
import { useState } from "react";
import { toast } from "sonner";
import {
  CreditCard,
  Headphones,
  Lock,
  ShieldCheck,
  Sparkles,
  Users,
} from "lucide-react";
import { api } from "../../../convex/_generated/api";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { PERSONAL_SUPPORT_PRICE, REGISTRATION_PRICE } from "@/lib/constants";
import { useTranslation } from "@/lib/i18n/context";
import { cn } from "@/lib/utils";

type RegistrationTier = "basic" | "premium";

export function PaymentCheckoutButton({
  tier,
  className,
  size = "lg",
  variant = "default",
}: {
  tier: RegistrationTier;
  className?: string;
  size?: "default" | "sm" | "lg";
  variant?: "default" | "outline";
}) {
  const createCheckout = useAction(api.stripeActions.createRegistrationCheckout);
  const [loading, setLoading] = useState(false);
  const { t } = useTranslation();
  const price = tier === "premium" ? PERSONAL_SUPPORT_PRICE : REGISTRATION_PRICE;

  const handlePay = async () => {
    setLoading(true);
    try {
      const { url } = await createCheckout({ tier });
      window.location.href = url;
    } catch (error) {
      const raw =
        error instanceof Error ? error.message : "Payment failed. Please try again.";
      const message = /invalid api key/i.test(raw)
        ? "Payment is not configured yet. The Stripe secret key on Convex must be fixed."
        : raw;
      toast.error(message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Button
      onClick={handlePay}
      disabled={loading}
      size={size}
      variant={variant}
      className={className}
    >
      <CreditCard className="h-4 w-4 mr-2" />
      {loading
        ? t("payment.redirecting")
        : t("payment.pay", { price })}
    </Button>
  );
}

interface PaymentGateProps {
  title?: string;
  description?: string;
}

export function PaymentGate({ title, description }: PaymentGateProps) {
  const { t } = useTranslation();

  return (
    <div className="max-w-4xl mx-auto py-8 px-2">
      <div className="text-center mb-8 space-y-2">
        <div className="relative mx-auto w-fit mb-4">
          <div className="flex h-16 w-16 items-center justify-center rounded-full bg-gradient-to-br from-accent to-accent/60 text-primary dark:from-primary/20 dark:to-primary/10 dark:text-primary">
            <Lock className="h-7 w-7" />
          </div>
        </div>
        <h1 className="text-2xl font-bold tracking-tight">
          {title ?? t("payment.completeRegistration")}
        </h1>
        <p className="text-muted-foreground leading-relaxed max-w-2xl mx-auto">
          {description ??
            t("payment.choosePlan", {
              premium: PERSONAL_SUPPORT_PRICE,
              basic: REGISTRATION_PRICE,
            })}
        </p>
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        <Card className="overflow-hidden border-border shadow-lg">
          <CardContent className="p-6 space-y-5 flex flex-col h-full">
            <div className="space-y-2">
              <h2 className="text-xl font-semibold">{t("payment.basicPlan")}</h2>
              <div className="flex items-baseline gap-2">
                <span className="text-4xl font-bold text-primary">
                  ${REGISTRATION_PRICE}
                </span>
                <span className="text-sm text-muted-foreground">
                  {t("common.oneTime")}
                </span>
              </div>
              <p className="text-sm text-muted-foreground">
                {t("payment.basicPlanDesc")}
              </p>
            </div>

            <ul className="space-y-2 text-sm text-muted-foreground flex-1">
              <li className="flex items-center gap-2">
                <Sparkles className="h-4 w-4 text-primary shrink-0" />
                {t("payment.activate")}
              </li>
              <li className="flex items-center gap-2">
                <Sparkles className="h-4 w-4 text-primary shrink-0" />
                {t("payment.completeQuestionnaire")}
              </li>
              <li className="flex items-center gap-2">
                <Sparkles className="h-4 w-4 text-primary shrink-0" />
                {t("payment.browseMatches")}
              </li>
              <li className="flex items-center gap-2">
                <ShieldCheck className="h-4 w-4 text-primary shrink-0" />
                {t("payment.secureStripe")}
              </li>
            </ul>

            <PaymentCheckoutButton tier="basic" className="w-full" variant="outline" />
          </CardContent>
        </Card>

        <Card
          className={cn(
            "overflow-hidden border-primary shadow-xl shadow-primary/10 ring-2 ring-primary/30"
          )}
        >
          <div className="h-1.5 bg-gradient-to-r from-primary/80 via-primary to-primary/60" />
          <CardContent className="p-6 space-y-5 flex flex-col h-full">
            <div className="space-y-2">
              <div className="flex items-center gap-2 flex-wrap">
                <h2 className="text-xl font-semibold">{t("payment.premiumPlan")}</h2>
                <Badge>{t("payment.recommended")}</Badge>
              </div>
              <div className="flex items-baseline gap-2">
                <span className="text-4xl font-bold text-primary">
                  ${PERSONAL_SUPPORT_PRICE}
                </span>
                <span className="text-sm text-muted-foreground">
                  {t("common.oneTime")}
                </span>
              </div>
              <p className="text-sm text-muted-foreground">
                {t("payment.premiumPlanDesc")}
              </p>
            </div>

            <ul className="space-y-2 text-sm text-muted-foreground flex-1">
              <li className="flex items-center gap-2">
                <Sparkles className="h-4 w-4 text-primary shrink-0" />
                {t("payment.premiumIncludesBasic", { price: REGISTRATION_PRICE })}
              </li>
              <li className="flex items-center gap-2">
                <Users className="h-4 w-4 text-primary shrink-0" />
                {t("payment.personalGuidance")}
              </li>
              <li className="flex items-center gap-2">
                <Headphones className="h-4 w-4 text-primary shrink-0" />
                {t("payment.expertSupport")}
              </li>
              <li className="flex items-center gap-2">
                <ShieldCheck className="h-4 w-4 text-primary shrink-0" />
                {t("payment.relationshipCoaching")}
              </li>
            </ul>

            <PaymentCheckoutButton tier="premium" className="w-full" />
          </CardContent>
        </Card>
      </div>

      <p className="text-xs text-muted-foreground text-center mt-6">
        {t("payment.stripeNote")}
      </p>
    </div>
  );
}
