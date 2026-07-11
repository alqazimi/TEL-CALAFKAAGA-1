"use client";

import { useAction } from "convex/react";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import {
  Check,
  CreditCard,
  Headphones,
  Lock,
  Search,
  ShieldCheck,
  Sparkles,
} from "lucide-react";
import { api } from "../../../convex/_generated/api";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { PERSONAL_SUPPORT_PRICE, REGISTRATION_PRICE } from "@/lib/constants";
import { useTranslation } from "@/lib/i18n/context";
import { getPlanPreference, type PlanPreference } from "@/lib/plan-preference";
import { cn } from "@/lib/utils";

type RegistrationTier = "basic" | "premium";

export function PaymentCheckoutButton({
  tier,
  className,
  size = "lg",
  variant = "default",
  labelPrice,
}: {
  tier: RegistrationTier;
  className?: string;
  size?: "default" | "sm" | "lg";
  variant?: "default" | "outline";
  labelPrice?: number;
}) {
  const createCheckout = useAction(api.stripeActions.createRegistrationCheckout);
  const [loading, setLoading] = useState(false);
  const { t } = useTranslation();
  const price =
    labelPrice ??
    (tier === "premium" ? PERSONAL_SUPPORT_PRICE : REGISTRATION_PRICE);

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
      className={cn("font-semibold", className)}
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
  showProgress?: boolean;
  /** When true, Basic is free — only show Premium upsell. */
  freeBasic?: boolean;
}

function PaymentProgress() {
  const { t } = useTranslation();
  const steps = [
    { label: t("payment.stepAccount"), done: true },
    { label: t("payment.stepProfile"), done: true },
    { label: t("payment.stepPayment"), done: false },
  ];

  return (
    <div className="flex items-center justify-center gap-2 sm:gap-3 mb-8">
      {steps.map((step, i) => (
        <div key={step.label} className="flex items-center gap-2 sm:gap-3">
          <div className="flex items-center gap-1.5">
            <div
              className={cn(
                "flex h-7 w-7 items-center justify-center rounded-full text-xs font-bold",
                step.done
                  ? "bg-primary text-primary-foreground"
                  : "bg-primary/15 text-primary ring-2 ring-primary/40"
              )}
            >
              {step.done ? <Check className="h-3.5 w-3.5" /> : i + 1}
            </div>
            <span
              className={cn(
                "text-xs font-semibold hidden sm:inline",
                step.done ? "text-muted-foreground" : "text-foreground"
              )}
            >
              {step.label}
            </span>
          </div>
          {i < steps.length - 1 && (
            <div className={cn("h-px w-6 sm:w-10", step.done ? "bg-primary/40" : "bg-border")} />
          )}
        </div>
      ))}
    </div>
  );
}

const BASIC_FEATURES = [
  "payment.featureProfile",
  "payment.featureBrowse",
  "payment.featureMatch",
  "payment.featureChat",
  "payment.featureTools",
] as const;

const PREMIUM_FEATURES = [
  "payment.featureEverythingBasic",
  "payment.featureWhatsApp",
  "payment.featureSearchHelp",
] as const;

export function PaymentGate({
  title,
  description,
  showProgress = true,
  freeBasic = false,
}: PaymentGateProps) {
  const { t } = useTranslation();
  const [preferredPlan, setPreferredPlan] = useState<PlanPreference | null>(null);

  useEffect(() => {
    setPreferredPlan(getPlanPreference());
  }, []);

  return (
    <div className="max-w-4xl mx-auto py-6 sm:py-8 px-2">
      {showProgress && !freeBasic && <PaymentProgress />}

      <div className="text-center mb-8 space-y-3">
        <div className="relative mx-auto w-fit mb-2">
          <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-gradient-to-br from-primary/20 to-primary/5 text-primary shadow-md shadow-primary/10">
            <Lock className="h-7 w-7" />
          </div>
        </div>
        <h1 className="text-2xl sm:text-3xl font-bold tracking-tight">
          {title ??
            (freeBasic
              ? t("payment.womenPremiumTitle")
              : t("payment.completeRegistration"))}
        </h1>
        <p className="text-muted-foreground leading-relaxed max-w-2xl mx-auto text-sm sm:text-base">
          {description ??
            (freeBasic
              ? t("payment.womenPremiumDesc", { premium: PERSONAL_SUPPORT_PRICE })
              : t("payment.choosePlan", {
                  premium: PERSONAL_SUPPORT_PRICE,
                  basic: REGISTRATION_PRICE,
                }))}
        </p>
      </div>

      <div
        className={cn(
          "grid gap-6",
          freeBasic ? "md:grid-cols-1 max-w-lg mx-auto" : "md:grid-cols-2"
        )}
      >
        {!freeBasic && (
          <Card
            className={cn(
              "overflow-hidden rounded-3xl border-border shadow-md hover:shadow-lg transition-shadow",
              preferredPlan === "basic" && "ring-2 ring-primary shadow-lg shadow-primary/10"
            )}
          >
            <CardContent className="p-6 sm:p-7 space-y-5 flex flex-col h-full">
              <div className="space-y-2">
                <div className="flex items-center gap-2 flex-wrap">
                  <h2 className="text-xl font-bold">{t("payment.basicPlan")}</h2>
                  {preferredPlan === "basic" && (
                    <Badge variant="outline" className="border-primary/40 text-primary">
                      {t("payment.preselectedPlan")}
                    </Badge>
                  )}
                </div>
                <div className="flex items-baseline gap-2">
                  <span className="text-4xl font-bold text-primary">
                    ${REGISTRATION_PRICE}
                  </span>
                  <span className="text-sm text-muted-foreground font-medium">
                    {t("common.oneTime")}
                  </span>
                </div>
                <p className="text-sm text-muted-foreground leading-relaxed">
                  {t("payment.basicPlanDesc")}
                </p>
                <p className="text-xs text-muted-foreground">
                  {t("payment.menPriceNote", { price: REGISTRATION_PRICE })}
                </p>
              </div>

              <ul className="space-y-2.5 text-sm text-muted-foreground flex-1">
                {BASIC_FEATURES.map((key) => (
                  <li key={key} className="flex items-center gap-2.5">
                    <Sparkles className="h-4 w-4 text-primary shrink-0" />
                    <span className="font-medium text-foreground/80">{t(key)}</span>
                  </li>
                ))}
              </ul>

              <PaymentCheckoutButton tier="basic" className="w-full" variant="outline" />
            </CardContent>
          </Card>
        )}

        <Card
          className={cn(
            "overflow-hidden rounded-3xl border-primary shadow-xl shadow-primary/10 ring-2 ring-primary/30 hover:shadow-2xl transition-shadow",
            preferredPlan === "premium" && "ring-primary shadow-2xl shadow-primary/15"
          )}
        >
          <div className="h-1.5 bg-gradient-to-r from-primary/80 via-primary to-primary/60" />
          <CardContent className="p-6 sm:p-7 space-y-5 flex flex-col h-full">
            <div className="space-y-2">
              <div className="flex items-center gap-2 flex-wrap">
                <h2 className="text-xl font-bold">{t("payment.premiumPlan")}</h2>
                <Badge className="font-semibold">{t("payment.recommended")}</Badge>
                {preferredPlan === "premium" && (
                  <Badge variant="outline" className="border-primary/40 text-primary bg-primary/5">
                    {t("payment.preselectedPlan")}
                  </Badge>
                )}
              </div>
              <div className="flex items-baseline gap-2">
                <span className="text-4xl font-bold text-primary">
                  ${PERSONAL_SUPPORT_PRICE}
                </span>
                <span className="text-sm text-muted-foreground font-medium">
                  {t("common.oneTime")}
                </span>
              </div>
              <p className="text-sm text-muted-foreground leading-relaxed">
                {t("payment.premiumPlanDesc")}
              </p>
            </div>

            <ul className="space-y-2.5 text-sm text-muted-foreground flex-1">
              {PREMIUM_FEATURES.map((key) => (
                <li key={key} className="flex items-center gap-2.5">
                  {key === "payment.featureWhatsApp" ? (
                    <Headphones className="h-4 w-4 text-primary shrink-0" />
                  ) : key === "payment.featureSearchHelp" ? (
                    <Search className="h-4 w-4 text-primary shrink-0" />
                  ) : (
                    <Sparkles className="h-4 w-4 text-primary shrink-0" />
                  )}
                  <span className="font-medium text-foreground/80">{t(key)}</span>
                </li>
              ))}
            </ul>

            <PaymentCheckoutButton
              tier="premium"
              className="w-full"
              labelPrice={PERSONAL_SUPPORT_PRICE}
            />
          </CardContent>
        </Card>
      </div>

      <div className="mt-8 flex flex-wrap items-center justify-center gap-3 rounded-2xl border border-border bg-muted/40 px-4 py-3 text-xs text-muted-foreground">
        <ShieldCheck className="h-4 w-4 text-primary shrink-0" />
        <span className="font-medium">{t("payment.stripeNote")}</span>
        <span className="hidden sm:inline text-border">|</span>
        <span className="font-semibold tracking-wide">VISA</span>
        <span className="font-semibold tracking-wide">MC</span>
        <span className="font-semibold tracking-wide">AMEX</span>
      </div>
    </div>
  );
}
