"use client";

import { useMemo, useState } from "react";
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
import { getAuthErrorMessage } from "@/lib/auth-errors";
import {
  createForgotEmailSchema,
  createResetPasswordSchema,
} from "@/lib/form-schemas";
import { useTranslation } from "@/lib/i18n/context";

type EmailForm = z.infer<ReturnType<typeof createForgotEmailSchema>>;
type ResetForm = z.infer<ReturnType<typeof createResetPasswordSchema>>;

export default function ForgotPasswordPage() {
  const { signIn } = useAuthActions();
  const router = useRouter();
  const { t } = useTranslation();
  const emailSchema = useMemo(() => createForgotEmailSchema(t), [t]);
  const resetSchema = useMemo(() => createResetPasswordSchema(t), [t]);
  const [step, setStep] = useState<"email" | "reset">("email");
  const [email, setEmail] = useState("");
  const [sending, setSending] = useState(false);
  const [resetting, setResetting] = useState(false);

  const emailForm = useForm<EmailForm>({
    resolver: zodResolver(emailSchema),
  });

  const resetForm = useForm<ResetForm>({
    resolver: zodResolver(resetSchema),
  });

  const onRequestReset = async (data: EmailForm) => {
    setSending(true);
    try {
      await signIn("password", {
        email: data.email,
        flow: "reset",
      });
      setEmail(data.email);
      setStep("reset");
      toast.success(t("auth.resetCodeSent"));
    } catch (error) {
      toast.error(getAuthErrorMessage(error, t("auth.resetSendFailed")));
    } finally {
      setSending(false);
    }
  };

  const onResetPassword = async (data: ResetForm) => {
    setResetting(true);
    try {
      await signIn("password", {
        email,
        code: data.code,
        newPassword: data.newPassword,
        flow: "reset-verification",
      });
      toast.success(t("auth.resetSuccess"));
      router.push("/login");
    } catch (error) {
      toast.error(getAuthErrorMessage(error, t("auth.resetFailed")));
    } finally {
      setResetting(false);
    }
  };

  return (
    <GuestGate>
      <AuthShell
        title={step === "email" ? t("auth.resetTitle") : t("auth.resetVerifyTitle")}
        description={
          step === "email"
            ? t("auth.resetDesc")
            : t("auth.resetVerifyDesc", { email })
        }
        footer={
          <div className="text-center">
            {step === "reset" ? (
              <button
                type="button"
                onClick={() => setStep("email")}
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
                  className="pl-11 tracking-widest"
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
                  className="pl-11"
                  {...resetForm.register("newPassword")}
                  placeholder={t("auth.passwordNewPlaceholder")}
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
