"use client";

import Link from "next/link";
import { Heart } from "lucide-react";
import { useConvexAuth } from "convex/react";
import { Button } from "@/components/ui/button";
import { useLoadingTimeout } from "@/hooks/use-loading-timeout";
import { useTranslation } from "@/lib/i18n/context";
import {
  type PlanPreference,
  registerHrefForPlan,
  savePlanPreference,
} from "@/lib/plan-preference";

type AuthRegisterCtaProps = {
  registerHref?: string;
  registerLabel: string;
  plan?: PlanPreference;
  dashboardLabel?: string;
  className?: string;
  size?: "default" | "sm" | "lg" | "icon";
  variant?: "default" | "secondary" | "outline" | "ghost";
};

/** Never leave Join/Register buttons disabled forever while auth initializes. */
const AUTH_CTA_WAIT_MS = 2_000;

export function AuthRegisterCta({
  registerHref,
  registerLabel,
  plan,
  dashboardLabel,
  className,
  size = "lg",
  variant = "default",
}: AuthRegisterCtaProps) {
  const { isAuthenticated, isLoading } = useConvexAuth();
  const authStuck = useLoadingTimeout(isLoading, AUTH_CTA_WAIT_MS);
  const { t } = useTranslation();
  const dashboardText = dashboardLabel ?? t("common.goToDashboard");
  const href = registerHref ?? registerHrefForPlan(plan);

  const handleRegisterClick = () => {
    if (plan) savePlanPreference(plan);
  };

  // Brief pulse only — after timeout treat as guest so CTAs stay clickable.
  if (isLoading && !authStuck) {
    return (
      <Button size={size} variant={variant} className={className} disabled>
        {t("common.loading")}
      </Button>
    );
  }

  if (isAuthenticated && !isLoading) {
    return (
      <Button size={size} variant={variant} className={className} asChild>
        <Link href="/matches">
          <Heart className="mr-2 h-4 w-4" />
          {dashboardText}
        </Link>
      </Button>
    );
  }

  return (
    <Button size={size} variant={variant} className={className} asChild>
      <Link href={href} onClick={handleRegisterClick}>
        {registerLabel}
      </Link>
    </Button>
  );
}
