"use client";

import Link from "next/link";
import { useConvexAuth } from "convex/react";
import { Heart } from "lucide-react";
import { Button } from "@/components/ui/button";
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
  const { t } = useTranslation();
  const dashboardText = dashboardLabel ?? t("common.goToDashboard");
  const href = registerHref ?? registerHrefForPlan(plan);

  const handleRegisterClick = () => {
    if (plan) savePlanPreference(plan);
  };

  if (isLoading) {
    return (
      <Button size={size} variant={variant} className={className} disabled>
        {t("common.loading")}
      </Button>
    );
  }

  if (isAuthenticated) {
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
