"use client";

import { Clock } from "lucide-react";
import { useTranslation } from "@/lib/i18n/context";
import { Card, CardContent } from "@/components/ui/card";

export function PendingApprovalCard() {
  const { t } = useTranslation();

  return (
    <Card className="border-amber-200/60 bg-amber-50/80 dark:border-amber-900/40 dark:bg-amber-950/20">
      <CardContent className="flex items-start gap-4 p-6">
        <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-amber-100 dark:bg-amber-950/60">
          <Clock className="h-5 w-5 text-amber-700 dark:text-amber-400" />
        </div>
        <div>
          <p className="font-semibold">{t("dashboard.pendingApproval")}</p>
          <p className="mt-1 text-sm text-muted-foreground">
            {t("dashboard.pendingApprovalDesc")}
          </p>
        </div>
      </CardContent>
    </Card>
  );
}
