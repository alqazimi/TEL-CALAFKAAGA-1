"use client";

import { useMemo, useState, useEffect } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useAuthActions } from "@convex-dev/auth/react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { toast } from "sonner";
import { Mail, Lock } from "lucide-react";
import { AuthShell } from "@/components/auth/auth-shell";
import { GuestGate } from "@/components/auth/guest-gate";
import { RegisterStepIndicator } from "@/components/auth/register-step-indicator";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { FormField, InputIconWrapper } from "@/components/ui/form-field";
import { APP_NAME } from "@/lib/constants";
import { getAuthErrorMessage } from "@/lib/auth-errors";
import { createAccountSchema } from "@/lib/form-schemas";
import { useTranslation } from "@/lib/i18n/context";
import { parsePlanPreference, savePlanPreference } from "@/lib/plan-preference";

type AccountForm = z.infer<ReturnType<typeof createAccountSchema>>;

export default function RegisterPage() {
  const { signIn } = useAuthActions();
  const router = useRouter();
  const searchParams = useSearchParams();
  const [loading, setLoading] = useState(false);
  const { t } = useTranslation();
  const accountSchema = useMemo(() => createAccountSchema(t), [t]);

  const accountForm = useForm<AccountForm>({
    resolver: zodResolver(accountSchema),
  });

  useEffect(() => {
    const plan = parsePlanPreference(searchParams.get("plan"));
    if (plan) savePlanPreference(plan);
  }, [searchParams]);

  const onSubmitAccount = async (data: AccountForm) => {
    setLoading(true);
    try {
      const result = await signIn("password", {
        email: data.email,
        password: data.password,
        flow: "signUp",
      });

      if (result.signingIn === false) {
        toast.error(t("validation.registrationFailed"));
        return;
      }

      toast.success(t("auth.registerSuccess"));
      router.push("/register/details");
    } catch (error) {
      const message = error instanceof Error ? error.message : "";

      if (message.includes("already exists") || message.includes("already in use")) {
        toast.error(t("auth.emailAlreadyVerified"));
        return;
      }

      toast.error(
        getAuthErrorMessage(error, t("validation.registrationFailed"), t)
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <GuestGate>
      <AuthShell
        title={t("auth.registerTitle", { name: APP_NAME })}
        description={t("auth.registerStep1Desc")}
        footer={
          <p className="text-center text-sm text-muted-foreground">
            {t("auth.alreadyHaveAccount")}{" "}
            <Link href="/login" className="font-semibold text-primary hover:underline">
              {t("auth.signInLink")}
            </Link>
          </p>
        }
      >
        <RegisterStepIndicator step={1} />

        <form onSubmit={accountForm.handleSubmit(onSubmitAccount)} className="space-y-5">
            <FormField
              label={t("auth.email")}
              htmlFor="email"
              error={accountForm.formState.errors.email?.message}
              required
            >
              <InputIconWrapper icon={<Mail className="h-4 w-4" />}>
                <Input
                  id="email"
                  type="email"
                  className="pl-11"
                  {...accountForm.register("email")}
                  placeholder={t("auth.emailPlaceholder")}
                  autoComplete="email"
                />
              </InputIconWrapper>
            </FormField>

            <FormField
              label={t("auth.password")}
              htmlFor="password"
              error={accountForm.formState.errors.password?.message}
              required
            >
              <InputIconWrapper icon={<Lock className="h-4 w-4" />}>
                <Input
                  id="password"
                  type="password"
                  className="pl-11"
                  {...accountForm.register("password")}
                  placeholder={t("auth.passwordNewPlaceholder")}
                  autoComplete="new-password"
                />
              </InputIconWrapper>
            </FormField>

            <FormField
              label={t("auth.confirmPassword")}
              htmlFor="confirmPassword"
              error={accountForm.formState.errors.confirmPassword?.message}
              required
            >
              <InputIconWrapper icon={<Lock className="h-4 w-4" />}>
                <Input
                  id="confirmPassword"
                  type="password"
                  className="pl-11"
                  {...accountForm.register("confirmPassword")}
                  placeholder={t("auth.passwordConfirmPlaceholder")}
                  autoComplete="new-password"
                />
              </InputIconWrapper>
            </FormField>

            <Button type="submit" className="w-full font-semibold" size="lg" disabled={loading}>
              {loading ? t("auth.creatingAccount") : t("auth.continue")}
            </Button>
          </form>
      </AuthShell>
    </GuestGate>
  );
}
