"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useAuthActions } from "@convex-dev/auth/react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { toast } from "sonner";
import { Mail, Lock } from "lucide-react";
import { AuthShell } from "@/components/auth/auth-shell";
import { GuestGate } from "@/components/auth/guest-gate";
import { EmailVerificationStep } from "@/components/auth/email-verification-step";
import { RegisterStepIndicator } from "@/components/auth/register-step-indicator";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { FormField, InputIconWrapper } from "@/components/ui/form-field";
import { APP_NAME } from "@/lib/constants";
import { getAuthErrorMessage } from "@/lib/auth-errors";
import { createAccountSchema } from "@/lib/form-schemas";
import { useTranslation } from "@/lib/i18n/context";

type AccountForm = z.infer<ReturnType<typeof createAccountSchema>>;

export default function RegisterPage() {
  const { signIn } = useAuthActions();
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [verifying, setVerifying] = useState(false);
  const [step, setStep] = useState<"account" | "verify">("account");
  const [pendingEmail, setPendingEmail] = useState("");
  const [pendingPassword, setPendingPassword] = useState("");
  const [resending, setResending] = useState(false);
  const { t } = useTranslation();
  const accountSchema = useMemo(() => createAccountSchema(t), [t]);

  const accountForm = useForm<AccountForm>({
    resolver: zodResolver(accountSchema),
  });

  const goToVerify = (email: string, password: string) => {
    setPendingEmail(email);
    setPendingPassword(password);
    setStep("verify");
    toast.success(t("auth.verifyCodeSent"));
  };

  const onSubmitAccount = async (data: AccountForm) => {
    setLoading(true);
    try {
      await signIn("password", {
        email: data.email,
        password: data.password,
        flow: "signUp",
      });
      goToVerify(data.email, data.password);
    } catch (error) {
      const message = error instanceof Error ? error.message : "";

      // Email already registered. If it's an unverified account with the same
      // password, resend a fresh code and continue to verification. If it's a
      // fully verified account, tell the user to sign in instead.
      if (message.includes("already exists") || message.includes("already in use")) {
        try {
          const result = await signIn("password", {
            email: data.email,
            password: data.password,
            flow: "signIn",
          });
          if (!result.signingIn) {
            goToVerify(data.email, data.password);
            return;
          }
          toast.error(t("auth.emailAlreadyVerified"));
          return;
        } catch {
          toast.error(t("auth.emailAlreadyVerified"));
          return;
        }
      }

      toast.error(
        getAuthErrorMessage(error, t("validation.registrationFailed"))
      );
    } finally {
      setLoading(false);
    }
  };

  const onVerifyEmail = async (code: string) => {
    setVerifying(true);
    try {
      const result = await signIn("password", {
        email: pendingEmail,
        code,
        flow: "email-verification",
      });
      if (!result.signingIn) {
        toast.error(t("auth.verifyFailed"));
        return;
      }
      toast.success(t("auth.registerSuccess"));
      router.push("/register/details");
    } catch (error) {
      toast.error(getAuthErrorMessage(error, t("auth.verifyFailed")));
    } finally {
      setVerifying(false);
    }
  };

  const onResendCode = async () => {
    if (!pendingEmail || !pendingPassword) return;
    setResending(true);
    try {
      await signIn("password", {
        email: pendingEmail,
        password: pendingPassword,
        flow: "signIn",
      });
      toast.success(t("auth.verifyCodeSent"));
    } catch (error) {
      toast.error(getAuthErrorMessage(error, t("auth.resendVerifyFailed")));
    } finally {
      setResending(false);
    }
  };

  return (
    <GuestGate>
      <AuthShell
        title={
          step === "account"
            ? t("auth.registerTitle", { name: APP_NAME })
            : t("auth.verifyEmailTitle")
        }
        description={
          step === "account"
            ? t("auth.registerStep1Desc")
            : t("auth.verifyEmailDesc", { email: pendingEmail })
        }
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

        {step === "account" ? (
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
        ) : (
          <EmailVerificationStep
            verifying={verifying}
            resending={resending}
            onSubmit={onVerifyEmail}
            onResend={onResendCode}
            onBack={() => setStep("account")}
            backLabel={t("auth.backToAccount")}
          />
        )}
      </AuthShell>
    </GuestGate>
  );
}
