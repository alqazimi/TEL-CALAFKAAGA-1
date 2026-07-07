"use client";

import { useTranslation } from "@/lib/i18n/context";

interface RegisterStepIndicatorProps {
  step: 1 | 2;
}

export function RegisterStepIndicator({ step }: RegisterStepIndicatorProps) {
  const { t } = useTranslation();

  return (
    <div className="mb-6 space-y-2">
      <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
        {t("auth.stepOf", { step: String(step), total: "2" })}
      </p>
      <div className="flex gap-2">
        <div
          className={`h-1.5 flex-1 rounded-full ${
            step >= 1 ? "bg-primary" : "bg-muted"
          }`}
        />
        <div
          className={`h-1.5 flex-1 rounded-full ${
            step >= 2 ? "bg-primary" : "bg-muted"
          }`}
        />
      </div>
    </div>
  );
}
