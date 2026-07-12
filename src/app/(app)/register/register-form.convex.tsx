"use client";

import { useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { useAuthActions } from "@convex-dev/auth/react";
import { useConvex } from "convex/react";
import { toast } from "sonner";
import { api } from "../../../../convex/_generated/api";
import { getAuthErrorMessage } from "@/lib/auth-errors";
import { normalizeAuthEmail } from "@/lib/auth-email";
import { useTranslation } from "@/lib/i18n/context";
import { parsePlanPreference, savePlanPreference } from "@/lib/plan-preference";
import {
  RegisterFormShell,
  type AccountForm,
} from "./register-form-shell";

function usePlanFromSearch() {
  const searchParams = useSearchParams();
  useEffect(() => {
    const plan = parsePlanPreference(searchParams.get("plan"));
    if (plan) savePlanPreference(plan);
  }, [searchParams]);
}

export default function ConvexRegisterForm() {
  const { signIn } = useAuthActions();
  const convex = useConvex();
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const { t } = useTranslation();
  usePlanFromSearch();

  const onSubmit = async (data: AccountForm) => {
    setLoading(true);
    try {
      const email = normalizeAuthEmail(data.email);
      const alreadyRegistered = await convex.query(api.users.isEmailRegistered, {
        email,
      });
      if (alreadyRegistered) {
        toast.error(t("auth.emailAlreadyVerified"));
        router.push("/login");
        return;
      }

      const result = await Promise.race([
        signIn("password", {
          email,
          password: data.password,
          flow: "signUp",
        }),
        new Promise<never>((_, reject) =>
          setTimeout(() => reject(new Error(t("common.loadingStuck"))), 20_000)
        ),
      ]);

      if (result.signingIn === false) {
        toast.error(t("validation.registrationFailed"));
        return;
      }

      toast.success(t("auth.registerSuccess"));
      router.push("/register/details");
    } catch (error) {
      const message = error instanceof Error ? error.message : "";

      if (
        message.includes("already exists") ||
        message.includes("already in use")
      ) {
        toast.error(t("auth.emailAlreadyVerified"));
        router.push("/login");
        return;
      }

      toast.error(
        getAuthErrorMessage(error, t("validation.registrationFailed"), t)
      );
    } finally {
      setLoading(false);
    }
  };

  return <RegisterFormShell onSubmit={onSubmit} loading={loading} />;
}
