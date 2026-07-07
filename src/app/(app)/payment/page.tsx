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
import { hasPaidAccess } from "@/lib/access";
import { toast } from "sonner";

export default function PaymentPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const canceled = searchParams.get("canceled") === "true";
  const welcome = searchParams.get("welcome") === "true";
  const profile = useQuery(api.profiles.getProfile, {}) as Profile | null | undefined;
  const { t } = useTranslation();

  useEffect(() => {
    if (canceled) {
      toast.message("Payment canceled. Complete payment to activate your account.");
    }
  }, [canceled]);

  useEffect(() => {
    if (profile?.registrationComplete === false) {
      router.replace("/register/details");
      return;
    }
    if (profile && hasPaidAccess(profile)) {
      router.replace(
        profile.questionnaireComplete ? "/dashboard" : "/questionnaire"
      );
    }
  }, [profile?.registrationComplete, profile?.hasPaid, profile?.role, profile?.questionnaireComplete, router]);

  if (profile === undefined) {
    return (
      <DashboardLayout>
        <div className="max-w-lg mx-auto space-y-4">
          <Skeleton className="h-8 w-48" />
          <Skeleton className="h-72 w-full rounded-2xl" />
        </div>
      </DashboardLayout>
    );
  }

  if (!profile) {
    return (
      <DashboardLayout>
        <p className="text-center text-muted-foreground py-16">Profile not found.</p>
      </DashboardLayout>
    );
  }

  if (hasPaidAccess(profile)) {
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
        title={welcome ? t("payment.welcome") : undefined}
        description={welcome ? t("payment.welcomeDesc") : undefined}
      />
    </DashboardLayout>
  );
}
