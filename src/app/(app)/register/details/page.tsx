"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useConvexAuth } from "convex/react";
import { useSafeQuery } from "@/lib/use-safe-query";
import { useMutation } from "convex/react";
import { toast } from "sonner";
import { ChevronLeft } from "lucide-react";
import { api } from "../../../../../convex/_generated/api";
import { AuthShell } from "@/components/auth/auth-shell";
import { RegisterStepIndicator } from "@/components/auth/register-step-indicator";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import {
  GenderSelectCards,
  type GenderValue,
} from "@/components/questionnaire/gender-select-cards";
import { getAuthenticatedHomeRoute } from "@/lib/routes";
import { useTranslation } from "@/lib/i18n/context";
import { getSafeUserError } from "@/lib/safe-error";

export default function RegisterDetailsPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const isEditGender = searchParams.get("editGender") === "1";
  const { t } = useTranslation();
  const { isAuthenticated, isLoading: authLoading } = useConvexAuth();
  const user = useSafeQuery(api.users.currentUser);
  const completeGender = useMutation(api.profiles.completeRegistrationGender);
  const [gender, setGender] = useState<GenderValue | "">("");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (authLoading) return;
    if (!isAuthenticated) {
      router.replace("/register");
      return;
    }
    // Wait for profile to load — do not treat "loading" as "already done".
    if (user === undefined) return;

    if (!isEditGender && user?.profile?.registrationComplete === true) {
      router.replace(getAuthenticatedHomeRoute(user.profile));
      return;
    }
    if (
      isEditGender &&
      (user?.profile?.hasPaid === true || user?.profile?.genderLocked === true)
    ) {
      toast.error(
        "Gender cannot be changed after payment. Contact support if this was a mistake."
      );
      router.replace("/profile");
    }
  }, [authLoading, isAuthenticated, isEditGender, user, router]);

  // Only pre-select when editing an existing choice. New signups start blank
  // so the silent male profile default cannot skip the man/woman choice.
  useEffect(() => {
    if (!isEditGender) return;
    const profileGender = user?.profile?.gender;
    if (profileGender === "male" || profileGender === "female") {
      setGender(profileGender);
    }
  }, [isEditGender, user?.profile?.gender]);

  const onContinue = async () => {
    if (!gender) {
      toast.error(t("validation.genderRequired"));
      return;
    }

    setLoading(true);
    try {
      await completeGender({ gender });
      toast.success(
        isEditGender ? t("auth.genderUpdated") : t("auth.registerGenderSuccess")
      );
      if (isEditGender) {
        router.push("/questionnaire?edit=1");
      } else {
        router.push("/questionnaire?welcome=true");
      }
    } catch (error) {
      toast.error(getSafeUserError(error, t("validation.saveDetailsFailed"))
      );
    } finally {
      setLoading(false);
    }
  };

  if (authLoading || user === undefined || !isAuthenticated) {
    return (
      <div className="auth-bg flex min-h-[calc(100dvh-var(--app-header))] items-center justify-center px-4">
        <div className="w-full max-w-md space-y-4 text-center">
          <Skeleton className="h-72 w-full rounded-2xl" aria-hidden />
          <p className="text-sm text-muted-foreground" role="status">
            {t("common.loadingData")}
          </p>
        </div>
      </div>
    );
  }

  if (!isEditGender && user?.profile?.registrationComplete === true) {
    return (
      <div className="auth-bg flex min-h-[calc(100dvh-var(--app-header))] items-center justify-center px-4">
        <div className="w-full max-w-md space-y-4 text-center">
          <Skeleton className="h-72 w-full rounded-2xl" aria-hidden />
          <p className="text-sm text-muted-foreground" role="status">
            {t("common.loadingData")}
          </p>
        </div>
      </div>
    );
  }

  return (
    <AuthShell
      title={isEditGender ? t("auth.changeGenderTitle") : t("auth.registerStep2Title")}
      description={
        isEditGender ? t("auth.changeGenderDesc") : t("auth.registerStep2Desc")
      }
      eyebrow={isEditGender ? undefined : t("auth.registerEyebrow")}
      footer={
        <p className="text-center text-sm text-muted-foreground">
          {t("auth.wrongAccount")}{" "}
          <Link href="/login" className="font-semibold text-primary hover:underline">
            {t("auth.signInLink")}
          </Link>
        </p>
      }
    >
      {!isEditGender && <RegisterStepIndicator step={2} />}

      <div className="space-y-6">
        {isEditGender && (
          <Button
            type="button"
            variant="ghost"
            className="px-0 -mt-2 text-muted-foreground hover:text-foreground"
            onClick={() => router.back()}
          >
            <ChevronLeft className="h-4 w-4 mr-1" />
            {t("common.back")}
          </Button>
        )}

        <GenderSelectCards
          value={gender}
          maleLabel={t("auth.male")}
          femaleLabel={t("auth.female")}
          disabled={loading}
          onChange={setGender}
        />

        <p className="text-sm text-center text-muted-foreground">
          {t("auth.genderChangeHint")}
        </p>

        <Button
          type="button"
          className="h-13 w-full rounded-2xl text-base font-semibold shadow-md shadow-primary/20"
          size="lg"
          disabled={loading || !gender}
          onClick={() => void onContinue()}
        >
          {loading
            ? t("auth.savingDetails")
            : isEditGender
              ? t("auth.saveGender")
              : t("auth.continueToQuestionnaire")}
        </Button>
      </div>
    </AuthShell>
  );
}
