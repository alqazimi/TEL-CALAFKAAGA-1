"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useAuthActions } from "@convex-dev/auth/react";
import { useConvex } from "convex/react";
import { api } from "../../../../convex/_generated/api";
import { getAuthenticatedHomeRoute } from "@/lib/routes";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { toast } from "sonner";
import { Mail, Lock } from "lucide-react";
import { AuthShell } from "@/components/auth/auth-shell";
import { GuestGate } from "@/components/auth/guest-gate";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { FormField, InputIconWrapper } from "@/components/ui/form-field";
import { APP_NAME } from "@/lib/constants";
import { getAuthErrorMessage } from "@/lib/auth-errors";
import { normalizeAuthEmail } from "@/lib/auth-email";
import { createLoginSchema } from "@/lib/form-schemas";
import { useTranslation } from "@/lib/i18n/context";

type LoginForm = z.infer<ReturnType<typeof createLoginSchema>>;

export default function LoginPage() {
  const { signIn } = useAuthActions();
  const convex = useConvex();
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const { t } = useTranslation();
  const loginSchema = useMemo(() => createLoginSchema(t), [t]);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<LoginForm>({
    resolver: zodResolver(loginSchema),
  });

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

  return (
    <GuestGate>
      <AuthShell
        title={t("auth.welcomeBack")}
        description={t("auth.signInDesc", { name: APP_NAME })}
        eyebrow={t("auth.signInEyebrow")}
        footer={
          <p className="text-center text-sm text-muted-foreground">
            {t("auth.noAccount")}{" "}
            <Link href="/register" className="font-semibold text-primary hover:underline">
              {t("auth.createAccount")}
            </Link>
          </p>
        }
      >
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
            <FormField label={t("auth.email")} htmlFor="email" error={errors.email?.message}>
              <InputIconWrapper icon={<Mail className="h-4 w-4" />}>
                <Input
                  id="email"
                  type="email"
                  className="h-13 rounded-2xl pl-11 text-[15px]"
                  {...register("email")}
                  placeholder={t("auth.emailPlaceholder")}
                  autoComplete="email"
                />
              </InputIconWrapper>
            </FormField>

            <FormField
              label={t("auth.password")}
              htmlFor="password"
              error={errors.password?.message}
              labelAction={
                <Link
                  href="/forgot-password"
                  className="text-xs font-semibold text-primary hover:underline"
                >
                  {t("auth.forgotPassword")}
                </Link>
              }
            >
              <InputIconWrapper icon={<Lock className="h-4 w-4" />}>
                <Input
                  id="password"
                  type="password"
                  className="h-13 rounded-2xl pl-11 text-[15px]"
                  {...register("password")}
                  placeholder={t("auth.passwordPlaceholder")}
                  autoComplete="current-password"
                />
              </InputIconWrapper>
            </FormField>

            <Button
              type="submit"
              className="mt-1 h-13 w-full rounded-2xl text-base font-semibold shadow-md shadow-primary/20"
              size="lg"
              disabled={loading}
            >
              {loading ? t("auth.signingIn") : t("auth.signIn")}
            </Button>
          </form>
      </AuthShell>
    </GuestGate>
  );
}
