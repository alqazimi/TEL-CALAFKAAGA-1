"use client";

import { useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { useConvexAuth, useMutation } from "convex/react";
import { useSafeQuery } from "@/lib/use-safe-query";
import { toast } from "sonner";
import { api } from "../../../../../convex/_generated/api";
import { getAuthenticatedHomeRoute } from "@/lib/routes";
import { useTranslation } from "@/lib/i18n/context";
import { getSafeUserError } from "@/lib/safe-error";
import {
  LoadingDetails,
  RegisterDetailsShell,
  type GenderValue,
} from "./register-details-shell";

export default function ConvexRegisterDetailsForm() {
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
      toast.error(getSafeUserError(error, t("validation.saveDetailsFailed")));
    } finally {
      setLoading(false);
    }
  };

  if (authLoading || user === undefined || !isAuthenticated) {
    return <LoadingDetails />;
  }

  if (!isEditGender && user?.profile?.registrationComplete === true) {
    return <LoadingDetails />;
  }

  return (
    <RegisterDetailsShell
      isEditGender={isEditGender}
      gender={gender}
      setGender={setGender}
      loading={loading}
      onContinue={onContinue}
      onBack={() => router.back()}
    />
  );
}
