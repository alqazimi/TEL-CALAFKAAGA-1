"use client";

import Link from "next/link";
import { Headphones, MessageCircle, Sparkles } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { WHATSAPP_URL } from "@/lib/constants";
import { useTranslation } from "@/lib/i18n/context";
import { PremiumUpgradeButton } from "@/components/premium/premium-upgrade-button";

interface PremiumSupportCardProps {
  isPremium: boolean;
  hasPaid: boolean;
  advisorReviewed?: boolean;
}

export function PremiumSupportCard({
  isPremium,
  hasPaid,
  advisorReviewed,
}: PremiumSupportCardProps) {
  const { t } = useTranslation();

  if (isPremium) {
    return (
      <Card className="border-violet-200/60 bg-gradient-to-br from-violet-50/80 to-primary/5 dark:border-violet-900/40 dark:from-violet-950/30">
        <CardContent className="p-5 sm:p-6 space-y-4">
          <div className="flex items-start gap-3">
            <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-violet-100 dark:bg-violet-950/60 text-violet-700 dark:text-violet-300">
              <Sparkles className="h-5 w-5" />
            </div>
            <div>
              <p className="font-semibold">{t("premium.activeTitle")}</p>
              <p className="text-sm text-muted-foreground mt-1 leading-relaxed">
                {advisorReviewed
                  ? t("premium.activeReviewedDesc")
                  : t("premium.activeDesc")}
              </p>
            </div>
          </div>
          <ul className="text-sm text-muted-foreground space-y-1.5">
            <li>• {t("premium.featurePriority")}</li>
            <li>• {t("premium.featureLikedYou")}</li>
            <li>• {t("premium.featureBreakdown")}</li>
            <li>• {t("premium.featurePhotos")}</li>
            <li>• {t("premium.featureWali")}</li>
          </ul>
          <Button asChild className="w-full rounded-xl">
            <a href={WHATSAPP_URL} target="_blank" rel="noopener noreferrer">
              <MessageCircle className="h-4 w-4 mr-2" />
              {t("payment.premiumWhatsApp")}
            </a>
          </Button>
        </CardContent>
      </Card>
    );
  }

  if (!hasPaid) return null;

  return (
    <Card className="border-primary/20">
      <CardContent className="p-5 sm:p-6 space-y-4">
        <div className="flex items-start gap-3">
          <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-primary/10 text-primary">
            <Headphones className="h-5 w-5" />
          </div>
          <div>
            <p className="font-semibold">{t("premium.upgradeTitle")}</p>
            <p className="text-sm text-muted-foreground mt-1 leading-relaxed">
              {t("premium.upgradeDesc")}
            </p>
          </div>
        </div>
        <PremiumUpgradeButton className="w-full rounded-xl" />
        <Button variant="link" className="w-full text-xs" asChild>
          <Link href="/pricing">{t("premium.comparePlans")}</Link>
        </Button>
      </CardContent>
    </Card>
  );
}
