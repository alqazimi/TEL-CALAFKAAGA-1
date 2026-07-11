"use client";

import { Suspense, useMemo, useState } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useAuthActions } from "@convex-dev/auth/react";
import { useConvexAuth, useMutation, useQuery } from "convex/react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { toast } from "sonner";
import { Lock, Mail, Shield } from "lucide-react";
import { api } from "../../../../../convex/_generated/api";
import { AuthShell } from "@/components/auth/auth-shell";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { FormField, InputIconWrapper } from "@/components/ui/form-field";
import { Skeleton } from "@/components/ui/skeleton";
import { APP_NAME } from "@/lib/constants";
import { getAuthErrorMessage } from "@/lib/auth-errors";
import { createAccountSchema, createLoginSchema } from "@/lib/form-schemas";
import { useTranslation } from "@/lib/i18n/context";
import { isStaffRole } from "@/lib/access";
import { useSignOut } from "@/hooks/use-sign-out";

type AccountForm = z.infer<ReturnType<typeof createAccountSchema>>;
type LoginForm = z.infer<ReturnType<typeof createLoginSchema>>;

function AdminInviteContent() {
  const searchParams = useSearchParams();
  const token = searchParams.get("token") ?? "";
  const router = useRouter();
  const { t } = useTranslation();
  const { isAuthenticated, isLoading: authLoading } = useConvexAuth();
  const { signIn } = useAuthActions();
  const { signOut } = useSignOut();
  const acceptInvite = useMutation(api.staffInvites.accept);

  const invite = useQuery(api.staffInvites.getByToken, token ? { token } : "skip");
  const currentUser = useQuery(
    api.users.currentUser,
    isAuthenticated ? {} : "skip"
  );

  const [mode, setMode] = useState<"signup" | "signin">("signup");
  const [loading, setLoading] = useState(false);

  const accountSchema = useMemo(() => createAccountSchema(t), [t]);
  const loginSchema = useMemo(() => createLoginSchema(t), [t]);

  const accountForm = useForm<AccountForm>({
    resolver: zodResolver(accountSchema),
    values: invite?.valid
      ? {
          email: invite.email,
          password: "",
          confirmPassword: "",
        }
      : undefined,
  });

  const loginForm = useForm<LoginForm>({
    resolver: zodResolver(loginSchema),
    values: invite?.valid
      ? {
          email: invite.email,
          password: "",
        }
      : undefined,
  });

  const finishAcceptance = async () => {
    await acceptInvite({ token });
    toast.success(t("adminInvite.accepted"));
    router.push("/admin");
  };

  const handleAcceptSignedIn = async () => {
    setLoading(true);
    try {
      await finishAcceptance();
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : t("adminInvite.acceptFailed")
      );
    } finally {
      setLoading(false);
    }
  };

  const onSignUp = async (data: AccountForm) => {
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

      await finishAcceptance();
    } catch (error) {
      const message = error instanceof Error ? error.message : "";
      if (message.includes("already exists") || message.includes("already in use")) {
        toast.error(t("adminInvite.accountExists"));
        setMode("signin");
        return;
      }
      toast.error(getAuthErrorMessage(error, t("validation.registrationFailed"), t));
    } finally {
      setLoading(false);
    }
  };

  const onSignIn = async (data: LoginForm) => {
    setLoading(true);
    try {
      const result = await signIn("password", {
        email: data.email,
        password: data.password,
        flow: "signIn",
      });

      if (result.signingIn === false) {
        toast.error(t("validation.invalidCredentials"));
        return;
      }

      await finishAcceptance();
    } catch (error) {
      toast.error(getAuthErrorMessage(error, t("validation.invalidCredentials"), t));
    } finally {
      setLoading(false);
    }
  };

  if (!token) {
    return (
      <AuthShell
        title={t("adminInvite.invalidTitle")}
        description={t("adminInvite.invalidDesc")}
      >
        <Button asChild className="w-full">
          <Link href="/login">{t("auth.signInLink")}</Link>
        </Button>
      </AuthShell>
    );
  }

  if (invite === undefined || authLoading) {
    return (
      <div className="auth-bg flex min-h-[calc(100dvh-var(--app-header))] items-center justify-center px-4">
        <Skeleton className="h-72 w-full max-w-md rounded-2xl" />
      </div>
    );
  }

  if (!invite.valid) {
    const reasonKey =
      invite.reason === "expired"
        ? "adminInvite.reasonExpired"
        : invite.reason === "revoked"
          ? "adminInvite.reasonRevoked"
          : invite.reason === "accepted"
            ? "adminInvite.reasonAccepted"
            : "adminInvite.reasonNotFound";

    return (
      <AuthShell title={t("adminInvite.invalidTitle")} description={t(reasonKey)}>
        <Button asChild className="w-full" variant="outline">
          <Link href="/login">{t("auth.signInLink")}</Link>
        </Button>
      </AuthShell>
    );
  }

  if (isAuthenticated && currentUser !== undefined) {
    const userEmail = currentUser?.email?.toLowerCase();
    const inviteEmail = invite.email.toLowerCase();
    const emailMatches = userEmail === inviteEmail;
    const alreadyStaff = isStaffRole(currentUser?.profile?.role);

    return (
      <AuthShell
        title={t("adminInvite.acceptTitle")}
        description={t("adminInvite.acceptDesc", { email: invite.email })}
      >
        <div className="space-y-5">
          <div className="rounded-2xl border border-primary/20 bg-primary/5 p-4 text-sm">
            <p className="flex items-center gap-2 font-medium text-primary">
              <Shield className="h-4 w-4" />
              {t("adminInvite.roleAdmin")}
            </p>
            <p className="mt-1 text-muted-foreground">{invite.email}</p>
          </div>

          {!emailMatches && (
            <div className="space-y-3 rounded-2xl border border-destructive/30 bg-destructive/5 p-4 text-sm">
              <p>{t("adminInvite.wrongAccount", { email: invite.email })}</p>
              <p className="text-muted-foreground">
                {t("adminInvite.signedInAs", { email: currentUser?.email ?? "—" })}
              </p>
              <Button
                variant="outline"
                className="w-full"
                onClick={() => void signOut()}
              >
                {t("adminInvite.signOut")}
              </Button>
            </div>
          )}

          {emailMatches && (
            <Button
              className="w-full"
              size="lg"
              disabled={loading}
              onClick={() => void handleAcceptSignedIn()}
            >
              {loading
                ? t("adminInvite.accepting")
                : alreadyStaff
                  ? t("adminInvite.confirmAccess")
                  : t("adminInvite.acceptButton")}
            </Button>
          )}
        </div>
      </AuthShell>
    );
  }

  return (
    <AuthShell
      title={t("adminInvite.joinTitle", { name: APP_NAME })}
      description={t("adminInvite.joinDesc", { email: invite.email })}
      footer={
        <p className="text-center text-sm text-muted-foreground">
          {t("adminInvite.notForYou")}{" "}
          <Link href="/" className="font-medium text-primary hover:underline">
            {t("adminInvite.backHome")}
          </Link>
        </p>
      }
    >
      <div className="mb-5 rounded-2xl border border-primary/20 bg-primary/5 p-4 text-sm">
        <p className="font-medium text-primary">{t("adminInvite.roleAdmin")}</p>
        <p className="mt-1 text-muted-foreground">{invite.email}</p>
      </div>

      <div className="mb-5 flex rounded-xl bg-muted/60 p-1">
        <Button
          type="button"
          variant={mode === "signup" ? "default" : "ghost"}
          className="flex-1 rounded-lg"
          onClick={() => setMode("signup")}
        >
          {t("adminInvite.newAccount")}
        </Button>
        <Button
          type="button"
          variant={mode === "signin" ? "default" : "ghost"}
          className="flex-1 rounded-lg"
          onClick={() => setMode("signin")}
        >
          {t("adminInvite.existingAccount")}
        </Button>
      </div>

      {mode === "signup" ? (
        <form onSubmit={accountForm.handleSubmit(onSignUp)} className="space-y-5">
          <FormField
            label={t("auth.email")}
            htmlFor="invite-email"
            error={accountForm.formState.errors.email?.message}
            required
          >
            <InputIconWrapper icon={<Mail className="h-4 w-4" />}>
              <Input
                id="invite-email"
                type="email"
                className="pl-11"
                readOnly
                {...accountForm.register("email")}
              />
            </InputIconWrapper>
          </FormField>

          <FormField
            label={t("auth.password")}
            htmlFor="invite-password"
            error={accountForm.formState.errors.password?.message}
            required
          >
            <InputIconWrapper icon={<Lock className="h-4 w-4" />}>
              <Input
                id="invite-password"
                type="password"
                className="pl-11"
                autoComplete="new-password"
                {...accountForm.register("password")}
                placeholder={t("auth.passwordNewPlaceholder")}
              />
            </InputIconWrapper>
          </FormField>

          <FormField
            label={t("auth.confirmPassword")}
            htmlFor="invite-confirm-password"
            error={accountForm.formState.errors.confirmPassword?.message}
            required
          >
            <InputIconWrapper icon={<Lock className="h-4 w-4" />}>
              <Input
                id="invite-confirm-password"
                type="password"
                className="pl-11"
                autoComplete="new-password"
                {...accountForm.register("confirmPassword")}
                placeholder={t("auth.passwordConfirmPlaceholder")}
              />
            </InputIconWrapper>
          </FormField>

          <Button type="submit" className="w-full font-semibold" size="lg" disabled={loading}>
            {loading ? t("adminInvite.settingUp") : t("adminInvite.createAndAccept")}
          </Button>
        </form>
      ) : (
        <form onSubmit={loginForm.handleSubmit(onSignIn)} className="space-y-5">
          <FormField
            label={t("auth.email")}
            htmlFor="invite-login-email"
            error={loginForm.formState.errors.email?.message}
            required
          >
            <InputIconWrapper icon={<Mail className="h-4 w-4" />}>
              <Input
                id="invite-login-email"
                type="email"
                className="pl-11"
                readOnly
                {...loginForm.register("email")}
              />
            </InputIconWrapper>
          </FormField>

          <FormField
            label={t("auth.password")}
            htmlFor="invite-login-password"
            error={loginForm.formState.errors.password?.message}
            required
          >
            <InputIconWrapper icon={<Lock className="h-4 w-4" />}>
              <Input
                id="invite-login-password"
                type="password"
                className="pl-11"
                autoComplete="current-password"
                {...loginForm.register("password")}
                placeholder={t("auth.passwordPlaceholder")}
              />
            </InputIconWrapper>
          </FormField>

          <Button type="submit" className="w-full font-semibold" size="lg" disabled={loading}>
            {loading ? t("adminInvite.accepting") : t("adminInvite.signInAndAccept")}
          </Button>
        </form>
      )}
    </AuthShell>
  );
}

export default function AdminInvitePage() {
  return (
    <Suspense
      fallback={
        <div className="auth-bg flex min-h-[calc(100dvh-var(--app-header))] items-center justify-center px-4">
          <Skeleton className="h-72 w-full max-w-md rounded-2xl" />
        </div>
      }
    >
      <AdminInviteContent />
    </Suspense>
  );
}
