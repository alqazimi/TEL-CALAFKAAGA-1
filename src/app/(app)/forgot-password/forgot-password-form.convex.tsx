"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useAuthActions } from "@convex-dev/auth/react";
import { useConvex } from "convex/react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { toast } from "sonner";
import { Mail, Lock, ArrowLeft, KeyRound } from "lucide-react";
import { api } from "../../../../convex/_generated/api";
import { AuthShell } from "@/components/auth/auth-shell";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { FormField, InputIconWrapper } from "@/components/ui/form-field";
import { getAuthErrorMessage, isUnknownAccountError } from "@/lib/auth-errors";
import { normalizeAuthEmail } from "@/lib/auth-email";
import {
  createForgotEmailSchema,
  createResetPasswordSchema,
} from "@/lib/form-schemas";
import { useTranslation } from "@/lib/i18n/context";
import { getAuthenticatedHomeRoute } from "@/lib/routes";

type EmailForm = z.infer<ReturnType<typeof createForgotEmailSchema>>;
type ResetForm = z.infer<ReturnType<typeof createResetPasswordSchema>>;

const RESEND_COOLDOWN_S = 15;

export default function ConvexForgotPasswordForm() {
  const { signIn } = useAuthActions();
  const convex = useConvex();
  const router = useRouter();
  const { t } = useTranslation();

  const emailSchema = useMemo(() => createForgotEmailSchema(t), [t]);
  const resetSchema = useMemo(() => createResetPasswordSchema(t), [t]);

  const [step, setStep] = useState<"email" | "reset">("email");
  const [email, setEmail] = useState("");
  const [sending, setSending] = useState(false);
  const [resending, setResending] = useState(false);
  const [resendCooldown, setResendCooldown] = useState(0);
  const [resetting, setResetting] = useState(false);

  useEffect(() => {
    if (resendCooldown <= 0) return;
    const timer = window.setInterval(() => {
      setResendCooldown((seconds) => (seconds <= 1 ? 0 : seconds - 1));
    }, 1000);
    return () => window.clearInterval(timer);
  }, [resendCooldown]);

  const emailForm = useForm<EmailForm>({
    resolver: zodResolver(emailSchema),
  });

  const resetForm = useForm<ResetForm>({
    resolver: zodResolver(resetSchema),
    defaultValues: { code: "", newPassword: "", confirmPassword: "" },
  });

  const requestResetCode = async (address: string) => {
    await signIn("password", {
      email: normalizeAuthEmail(address),
      flow: "reset",
    });
  };

  const onRequestReset = async (data: EmailForm) => {
    setSending(true);
    try {
      const normalized = normalizeAuthEmail(data.email);
      await requestResetCode(normalized);
      setEmail(normalized);
      resetForm.reset({ code: "", newPassword: "", confirmPassword: "" });
      setResendCooldown(RESEND_COOLDOWN_S);
      setStep("reset");
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

  const onResetPassword = async (data: ResetForm) => {
    setResetting(true);
    try {
      await signIn("password", {
        email: normalizeAuthEmail(email),
        code: data.code.trim(),
        newPassword: data.newPassword,
        flow: "reset-verification",
      });
      toast.success(t("auth.resetSuccess"));
      const user = await convex.query(api.users.currentUser, {});
      router.replace(getAuthenticatedHomeRoute(user?.profile ?? undefined));
    } catch (error) {
      toast.error(getAuthErrorMessage(error, t("auth.resetFailed"), t));
      resetForm.setValue("code", "");
    } finally {
      setResetting(false);
    }
  };

  return (
    <AuthShell
      title={step === "email" ? t("auth.resetTitle") : t("auth.resetCodeTitle")}
      description={
        step === "email"
          ? t("auth.resetDesc")
          : t("auth.resetCodeDesc", { email })
      }
      footer={
        <div className="text-center">
          {step === "reset" ? (
            <button
              type="button"
              onClick={() => {
                resetForm.reset({ code: "", newPassword: "", confirmPassword: "" });
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
      {step === "email" ? (
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
                className="h-13 rounded-2xl pl-11 text-[15px]"
                {...emailForm.register("email")}
                placeholder={t("auth.emailPlaceholder")}
                autoComplete="email"
              />
            </InputIconWrapper>
          </FormField>

          <Button
            type="submit"
            className="h-13 w-full rounded-2xl text-base font-semibold shadow-md shadow-primary/20"
            size="lg"
            disabled={sending}
          >
            {sending ? t("auth.sendingReset") : t("auth.sendResetCode")}
          </Button>
        </form>
      ) : (
        <form onSubmit={resetForm.handleSubmit(onResetPassword)} className="space-y-5">
          <FormField
            label={t("auth.resetCode")}
            htmlFor="code"
            error={resetForm.formState.errors.code?.message}
          >
            <InputIconWrapper icon={<KeyRound className="h-4 w-4" />}>
              <Input
                id="code"
                type="text"
                inputMode="numeric"
                maxLength={6}
                className="h-13 rounded-2xl pl-11 tracking-[0.35em] text-center text-lg"
                {...resetForm.register("code")}
                placeholder={t("auth.codePlaceholder")}
                autoComplete="one-time-code"
              />
            </InputIconWrapper>
          </FormField>

          <FormField
            label={t("auth.newPassword")}
            htmlFor="newPassword"
            error={resetForm.formState.errors.newPassword?.message}
          >
            <InputIconWrapper icon={<Lock className="h-4 w-4" />}>
              <Input
                id="newPassword"
                type="password"
                className="h-13 rounded-2xl pl-11 text-[15px]"
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
                className="h-13 rounded-2xl pl-11 text-[15px]"
                {...resetForm.register("confirmPassword")}
                placeholder={t("auth.passwordConfirmPlaceholder")}
                autoComplete="new-password"
              />
            </InputIconWrapper>
          </FormField>

          <Button
            type="submit"
            className="h-13 w-full rounded-2xl text-base font-semibold shadow-md shadow-primary/20"
            size="lg"
            disabled={resetting}
          >
            {resetting ? t("auth.resetting") : t("auth.setNewPassword")}
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
    </AuthShell>
  );
}
