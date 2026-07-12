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
import { getSafeUserError } from "@/lib/safe-error";

export function PremiumUpgradeButton({
  className,
  size = "default",
  variant = "default",
  price = PREMIUM_UPGRADE_PRICE,
}: {
  className?: string;
  size?: "default" | "sm" | "lg";
  variant?: "default" | "outline";
  /** Display price for Premium upgrade ($15). */
  price?: number;
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
      const raw =
        getSafeUserError(error, t("premium.upgradeFailed"));
      if (/complete basic registration/i.test(raw)) {
        toast.error(t("premium.upgradeFailed"));
        window.location.href = "/payment";
        return;
      }
      toast.error(raw);
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
        : t("premium.upgradeCta", { price })}
    </Button>
  );
}
