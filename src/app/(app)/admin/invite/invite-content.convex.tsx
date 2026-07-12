"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useAuthActions } from "@convex-dev/auth/react";
import { useConvexAuth, useMutation } from "convex/react";
import { useSafeQuery } from "@/lib/use-safe-query";
import { toast } from "sonner";
import { api } from "../../../../../convex/_generated/api";
import { AuthShell } from "@/components/auth/auth-shell";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { getAuthErrorMessage } from "@/lib/auth-errors";
import { useTranslation } from "@/lib/i18n/context";
import { isStaffRole } from "@/lib/access";
import { useSignOut } from "@/hooks/use-sign-out";
import { getSafeUserError } from "@/lib/safe-error";
import {
  InviteForms,
  SignedInAccept,
  type AccountForm,
  type LoginForm,
} from "./invite-shared";

export default function ConvexAdminInviteContent() {
  const searchParams = useSearchParams();
  const token = searchParams.get("token") ?? "";
  const router = useRouter();
  const { t } = useTranslation();
  const { isAuthenticated, isLoading: authLoading } = useConvexAuth();
  const { signIn } = useAuthActions();
  const { signOut } = useSignOut();
  const acceptInvite = useMutation(api.staffInvites.accept);

  const invite = useSafeQuery(api.staffInvites.getByToken, token ? { token } : "skip");
  const currentUser = useSafeQuery(
    api.users.currentUser,
    isAuthenticated ? {} : "skip"
  );

  const [mode, setMode] = useState<"signup" | "signin">("signup");
  const [loading, setLoading] = useState(false);

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
      toast.error(getSafeUserError(error, t("adminInvite.acceptFailed")));
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
    return (
      <SignedInAccept
        inviteEmail={invite.email}
        userEmail={currentUser?.email}
        alreadyStaff={isStaffRole(currentUser?.profile?.role)}
        loading={loading}
        onAccept={handleAcceptSignedIn}
        onSignOut={signOut}
      />
    );
  }

  return (
    <InviteForms
      invite={invite}
      mode={mode}
      setMode={setMode}
      loading={loading}
      onSignUp={onSignUp}
      onSignIn={onSignIn}
    />
  );
}
