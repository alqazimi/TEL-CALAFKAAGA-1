"use client";

import { useAction } from "convex/react";
import { useState } from "react";
import { toast } from "sonner";
import { Sparkles } from "lucide-react";
import { api } from "../../../convex/_generated/api";
import { Button } from "@/components/ui/button";
import { PREMIUM_UPGRADE_PRICE } from "@/lib/constants";
import { useTranslation } from "@/lib/i18n/context";
import { cn } from "@/lib/utils";

export function PremiumUpgradeButton({
  className,
  size = "default",
  variant = "default",
}: {
  className?: string;
  size?: "default" | "sm" | "lg";
  variant?: "default" | "outline";
}) {
  const createUpgrade = useAction(api.stripeActions.createPremiumUpgradeCheckout);
  const [loading, setLoading] = useState(false);
  const { t } = useTranslation();

  const handleUpgrade = async () => {
    setLoading(true);
    try {
      const { url } = await createUpgrade({});
      window.location.href = url;
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : t("premium.upgradeFailed")
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <Button
      onClick={() => void handleUpgrade()}
      disabled={loading}
      size={size}
      variant={variant}
      className={cn("font-semibold", className)}
    >
      <Sparkles className="h-4 w-4 mr-2" />
      {loading
        ? t("payment.redirecting")
        : t("premium.upgradeCta", { price: PREMIUM_UPGRADE_PRICE })}
    </Button>
  );
}
