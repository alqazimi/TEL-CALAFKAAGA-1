"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { getAuthenticatedHomeRoute } from "@/lib/routes";
import { getAuthErrorMessage } from "@/lib/auth-errors";
import { normalizeAuthEmail } from "@/lib/auth-email";
import { useTranslation } from "@/lib/i18n/context";
import { useUnifiedAuth } from "@/data/auth/hooks";
import { auth } from "@/data/auth";
import { LoginFormShell, type LoginForm } from "./login-form-shell";

export default function ApiLoginForm() {
  const { login, refresh } = useUnifiedAuth();
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const { t } = useTranslation();

  const onSubmit = async (data: LoginForm) => {
    setLoading(true);
    try {
      await Promise.race([
        login!(normalizeAuthEmail(data.email), data.password),
        new Promise<never>((_, reject) =>
          setTimeout(() => reject(new Error(t("common.loadingStuck"))), 20_000)
        ),
      ]);
      await refresh?.();
      const user = await auth.getCurrentUser();
      toast.success(t("auth.welcomeBackToast"));
      router.push(
        getAuthenticatedHomeRoute(
          (user?.profile as Parameters<typeof getAuthenticatedHomeRoute>[0]) ??
            undefined
        )
      );
    } catch (error) {
      toast.error(getAuthErrorMessage(error, t("validation.invalidCredentials"), t));
    } finally {
      setLoading(false);
    }
  };

  return <LoginFormShell onSubmit={onSubmit} loading={loading} />;
}
