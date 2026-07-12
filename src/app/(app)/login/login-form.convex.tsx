"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useAuthActions } from "@convex-dev/auth/react";
import { useConvex } from "convex/react";
import { toast } from "sonner";
import { api } from "../../../../convex/_generated/api";
import { getAuthenticatedHomeRoute } from "@/lib/routes";
import { getAuthErrorMessage } from "@/lib/auth-errors";
import { normalizeAuthEmail } from "@/lib/auth-email";
import { useTranslation } from "@/lib/i18n/context";
import { LoginFormShell, type LoginForm } from "./login-form-shell";

export default function ConvexLoginForm() {
  const { signIn } = useAuthActions();
  const convex = useConvex();
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const { t } = useTranslation();

  const completeSignIn = async () => {
    const user = await convex.query(api.users.currentUser, {});
    toast.success(t("auth.welcomeBackToast"));
    router.push(getAuthenticatedHomeRoute(user?.profile ?? undefined));
  };

  const onSubmit = async (data: LoginForm) => {
    setLoading(true);
    try {
      const result = await Promise.race([
        signIn("password", {
          email: normalizeAuthEmail(data.email),
          password: data.password,
          flow: "signIn",
        }),
        new Promise<never>((_, reject) =>
          setTimeout(() => reject(new Error(t("common.loadingStuck"))), 20_000)
        ),
      ]);

      if (result.signingIn === false) {
        toast.error(t("validation.invalidCredentials"));
        return;
      }

      await completeSignIn();
    } catch (error) {
      toast.error(getAuthErrorMessage(error, t("validation.invalidCredentials"), t));
    } finally {
      setLoading(false);
    }
  };

  return <LoginFormShell onSubmit={onSubmit} loading={loading} />;
}
