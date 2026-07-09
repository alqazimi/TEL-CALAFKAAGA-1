"use client";

import { useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { useQuery } from "convex/react";
import { api } from "../../../../convex/_generated/api";
import type { Profile } from "@/types";
import { DashboardLayout } from "@/components/layout/dashboard-layout";
import { Skeleton } from "@/components/ui/skeleton";
import { PaymentGate } from "@/components/payment/payment-gate";
import { useTranslation } from "@/lib/i18n/context";
import { hasPaidAccess, isStaffRole } from "@/lib/access";
import { isTrialExpired } from "@/lib/trial";
import { PERSONAL_SUPPORT_PRICE, REGISTRATION_PRICE } from "@/lib/constants";
import { toast } from "sonner";

export default function PaymentPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const canceled = searchParams.get("canceled") === "true";
  const profile = useQuery(api.profiles.getProfile, {}) as Profile | null | undefined;
  const { t } = useTranslation();

  useEffect(() => {
    if (canceled) {
      toast.message(t("payment.paymentCanceled"));
    }
  }, [canceled, t]);

  useEffect(() => {
    if (isStaffRole(profile?.role)) {
      router.replace("/admin");
      return;
    }
    if (profile?.registrationComplete === false) {
      router.replace("/register/details");
      return;
    }
    if (profile && !profile.questionnaireComplete) {
      router.replace("/questionnaire");
      return;
    }
    if (profile && hasPaidAccess(profile)) {
      router.replace("/dashboard");
    }
  }, [
    profile?.registrationComplete,
    profile?.questionnaireComplete,
    profile?.hasPaid,
    profile?.trialEndsAt,
    profile?.role,
    router,
  ]);

  if (profile === undefined) {
    return (
      <DashboardLayout>
        <div className="max-w-lg mx-auto space-y-4" role="status">
          <Skeleton className="h-8 w-48" aria-hidden />
          <Skeleton className="h-72 w-full rounded-2xl" aria-hidden />
          <p className="text-sm text-muted-foreground">{t("common.loadingData")}</p>
        </div>
      </DashboardLayout>
    );
  }

  if (!profile) {
    return (
      <DashboardLayout>
        <p className="text-center text-muted-foreground py-16">{t("payment.profileNotFound")}</p>
      </DashboardLayout>
    );
  }

  if (!profile.questionnaireComplete || hasPaidAccess(profile)) {
    return (
      <DashboardLayout>
        <div className="max-w-lg mx-auto text-center py-16">
          <Skeleton className="h-8 w-48 mx-auto" />
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <PaymentGate
        title={
          isTrialExpired(profile)
            ? t("payment.trialEndedTitle")
            : t("payment.profileReadyTitle")
        }
        description={
          isTrialExpired(profile)
            ? t("payment.trialEndedDesc", {
                basic: REGISTRATION_PRICE,
                premium: PERSONAL_SUPPORT_PRICE,
              })
            : t("payment.profileReadyDesc", {
                basic: REGISTRATION_PRICE,
                premium: PERSONAL_SUPPORT_PRICE,
              })
        }
      />
    </DashboardLayout>
  );
}
