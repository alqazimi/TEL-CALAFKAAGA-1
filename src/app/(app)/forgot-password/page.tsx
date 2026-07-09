"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useAuthActions } from "@convex-dev/auth/react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { toast } from "sonner";
import { Mail, Lock, ArrowLeft, KeyRound } from "lucide-react";
import { AuthShell } from "@/components/auth/auth-shell";
import { GuestGate } from "@/components/auth/guest-gate";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { FormField, InputIconWrapper } from "@/components/ui/form-field";
import { getAuthErrorMessage, isUnknownAccountError } from "@/lib/auth-errors";
import { normalizeAuthEmail } from "@/lib/auth-email";
import {
  createForgotEmailSchema,
  createResetCodeSchema,
  createResetPasswordSchema,
} from "@/lib/form-schemas";
import { useTranslation } from "@/lib/i18n/context";

type EmailForm = z.infer<ReturnType<typeof createForgotEmailSchema>>;
type CodeForm = z.infer<ReturnType<typeof createResetCodeSchema>>;
type ResetForm = z.infer<ReturnType<typeof createResetPasswordSchema>>;
type Step = "email" | "code" | "password";

const RESEND_COOLDOWN_S = 15;

export default function ForgotPasswordPage() {
  const { signIn } = useAuthActions();
  const router = useRouter();
  const { t } = useTranslation();
  const emailSchema = useMemo(() => createForgotEmailSchema(t), [t]);
  const codeSchema = useMemo(() => createResetCodeSchema(t), [t]);
  const resetSchema = useMemo(() => createResetPasswordSchema(t), [t]);

  const [step, setStep] = useState<Step>("email");
  const [email, setEmail] = useState("");
  const [verifiedCode, setVerifiedCode] = useState("");
  const [sending, setSending] = useState(false);
  const [resending, setResending] = useState(false);
  const [resendCooldown, setResendCooldown] = useState(0);
  const [checkingCode, setCheckingCode] = useState(false);
  const [resetting, setResetting] = useState(false);

  useEffect(() => {
    if (resendCooldown <= 0) return;
    const timer = window.setInterval(() => {
      setResendCooldown((seconds) => (seconds <= 1 ? 0 : seconds - 1));
    }, 1000);
    return () => window.clearInterval(timer);
  }, [resendCooldown]);

  const requestResetCode = async (address: string) => {
    await signIn("password", {
      email: normalizeAuthEmail(address),
      flow: "reset",
    });
  };

  const emailForm = useForm<EmailForm>({
    resolver: zodResolver(emailSchema),
  });

  const codeForm = useForm<CodeForm>({
    resolver: zodResolver(codeSchema),
    defaultValues: { code: "" },
  });

  const resetForm = useForm<ResetForm>({
    resolver: zodResolver(resetSchema),
  });

  const shellTitle =
    step === "email"
      ? t("auth.resetTitle")
      : step === "code"
        ? t("auth.resetCodeTitle")
        : t("auth.resetVerifyTitle");

  const shellDescription =
    step === "email"
      ? t("auth.resetDesc")
      : step === "code"
        ? t("auth.resetCodeDesc", { email })
        : t("auth.resetVerifyDesc", { email });

  const onRequestReset = async (data: EmailForm) => {
    setSending(true);
    try {
      await requestResetCode(data.email);
      setEmail(data.email);
      setVerifiedCode("");
      codeForm.reset({ code: "" });
      resetForm.reset();
      setResendCooldown(RESEND_COOLDOWN_S);
      setStep("code");
      toast.success(t("auth.resetCodeSent"));
    } catch (error) {
      if (isUnknownAccountError(error)) {
        toast.success(t("auth.resetCodeSent"));
        return;
      }
      toast.error(getAuthErrorMessage(error, t("auth.resetSendFailed"), t));
    } finally {
      setSending(false);
    }
  };

  const onResendCode = async () => {
    if (!email || resendCooldown > 0 || resending) return;

    setResending(true);
    try {
      await requestResetCode(email);
      setResendCooldown(RESEND_COOLDOWN_S);
      toast.success(t("auth.resetCodeResent"));
    } catch (error) {
      if (isUnknownAccountError(error)) {
        toast.success(t("auth.resetCodeSent"));
        return;
      }
      toast.error(getAuthErrorMessage(error, t("auth.resetSendFailed"), t));
    } finally {
      setResending(false);
    }
  };

  /** Unlock password step only after a well-formed 6-digit code is entered. */
  const onContinueWithCode = (data: CodeForm) => {
    setCheckingCode(true);
    try {
      const code = data.code.trim();
      if (!/^\d{6}$/.test(code)) {
        toast.error(t("validation.codeMin6"));
        return;
      }
      setVerifiedCode(code);
      setStep("password");
      toast.success(t("auth.resetCodeAccepted"));
    } finally {
      setCheckingCode(false);
    }
  };

  const onResetPassword = async (data: ResetForm) => {
    if (!/^\d{6}$/.test(verifiedCode)) {
      toast.error(t("validation.codeMin6"));
      setStep("code");
      return;
    }

    setResetting(true);
    try {
      await signIn("password", {
        email: normalizeAuthEmail(email),
        code: verifiedCode,
        newPassword: data.newPassword,
        flow: "reset-verification",
      });
      toast.success(t("auth.resetSuccess"));
      router.push("/login");
    } catch (error) {
      toast.error(getAuthErrorMessage(error, t("auth.resetFailed"), t));
      setVerifiedCode("");
      codeForm.reset({ code: "" });
      setStep("code");
    } finally {
      setResetting(false);
    }
  };

  return (
    <GuestGate>
      <AuthShell
        title={shellTitle}
        description={shellDescription}
        footer={
          <div className="text-center">
            {step === "password" ? (
              <button
                type="button"
                onClick={() => {
                  setVerifiedCode("");
                  codeForm.reset({ code: "" });
                  setStep("code");
                }}
                className="inline-flex items-center gap-1.5 text-sm font-semibold text-primary hover:underline"
              >
                <ArrowLeft className="h-4 w-4" />
                {t("auth.backToCode")}
              </button>
            ) : step === "code" ? (
              <button
                type="button"
                onClick={() => {
                  setVerifiedCode("");
                  setStep("email");
                }}
                className="inline-flex items-center gap-1.5 text-sm font-semibold text-primary hover:underline"
              >
                <ArrowLeft className="h-4 w-4" />
                {t("auth.backToReset")}
              </button>
            ) : (
              <Link
                href="/login"
                className="inline-flex items-center gap-1.5 text-sm font-semibold text-primary hover:underline"
              >
                <ArrowLeft className="h-4 w-4" />
                {t("auth.backToSignIn")}
              </Link>
            )}
          </div>
        }
      >
        {step === "email" && (
          <form onSubmit={emailForm.handleSubmit(onRequestReset)} className="space-y-5">
            <FormField
              label={t("auth.email")}
              htmlFor="email"
              error={emailForm.formState.errors.email?.message}
            >
              <InputIconWrapper icon={<Mail className="h-4 w-4" />}>
                <Input
                  id="email"
                  type="email"
                  className="pl-11"
                  {...emailForm.register("email")}
                  placeholder={t("auth.emailPlaceholder")}
                  autoComplete="email"
                />
              </InputIconWrapper>
            </FormField>

            <Button type="submit" className="w-full font-semibold" size="lg" disabled={sending}>
              {sending ? t("auth.sendingReset") : t("auth.sendResetCode")}
            </Button>
          </form>
        )}

        {step === "code" && (
          <form onSubmit={codeForm.handleSubmit(onContinueWithCode)} className="space-y-5">
            <FormField
              label={t("auth.resetCode")}
              htmlFor="code"
              error={codeForm.formState.errors.code?.message}
            >
              <InputIconWrapper icon={<KeyRound className="h-4 w-4" />}>
                <Input
                  id="code"
                  type="text"
                  inputMode="numeric"
                  maxLength={6}
                  className="pl-11 tracking-[0.35em] text-center text-lg"
                  {...codeForm.register("code")}
                  placeholder={t("auth.codePlaceholder")}
                  autoComplete="one-time-code"
                />
              </InputIconWrapper>
            </FormField>

            <Button
              type="submit"
              className="w-full font-semibold"
              size="lg"
              disabled={checkingCode}
            >
              {checkingCode ? t("auth.verifyingCode") : t("auth.verifyResetCode")}
            </Button>

            <div className="text-center">
              <Button
                type="button"
                variant="ghost"
                className="text-sm font-semibold"
                disabled={resending || resendCooldown > 0}
                onClick={onResendCode}
              >
                {resending
                  ? t("auth.sendingReset")
                  : resendCooldown > 0
                    ? t("auth.resendResetCodeIn", { seconds: resendCooldown })
                    : t("auth.resendResetCode")}
              </Button>
            </div>
          </form>
        )}

        {step === "password" && (
          <form onSubmit={resetForm.handleSubmit(onResetPassword)} className="space-y-5">
            <FormField
              label={t("auth.newPassword")}
              htmlFor="newPassword"
              error={resetForm.formState.errors.newPassword?.message}
            >
              <InputIconWrapper icon={<Lock className="h-4 w-4" />}>
                <Input
                  id="newPassword"
                  type="password"
                  className="pl-11"
                  {...resetForm.register("newPassword")}
                  placeholder={t("auth.passwordNewPlaceholder")}
                  autoComplete="new-password"
                />
              </InputIconWrapper>
            </FormField>

            <FormField
              label={t("auth.confirmPassword")}
              htmlFor="confirmPassword"
              error={resetForm.formState.errors.confirmPassword?.message}
            >
              <InputIconWrapper icon={<Lock className="h-4 w-4" />}>
                <Input
                  id="confirmPassword"
                  type="password"
                  className="pl-11"
                  {...resetForm.register("confirmPassword")}
                  placeholder={t("auth.passwordConfirmPlaceholder")}
                  autoComplete="new-password"
                />
              </InputIconWrapper>
            </FormField>

            <Button type="submit" className="w-full font-semibold" size="lg" disabled={resetting}>
              {resetting ? t("auth.resetting") : t("auth.setNewPassword")}
            </Button>
          </form>
        )}
      </AuthShell>
    </GuestGate>
  );
}
