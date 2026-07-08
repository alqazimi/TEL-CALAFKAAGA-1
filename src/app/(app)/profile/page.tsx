"use client";

import { useQuery } from "convex/react";
import { api } from "../../../../convex/_generated/api";
import type { CurrentUser, Profile } from "@/types";
import { DashboardLayout } from "@/components/layout/dashboard-layout";
import { Skeleton } from "@/components/ui/skeleton";
import { ProfileCompletionCard } from "@/components/profile/profile-completion-card";
import { ProfileEditScreen } from "@/components/profile/profile-edit-screen";
import type { Preferences } from "@/lib/profile-progress";
import { isOwnerRole, isStaffRole } from "@/lib/access";
import { useTranslation } from "@/lib/i18n/context";

export default function ProfilePage() {
  const { t } = useTranslation();
  const currentUser = useQuery(api.users.currentUser) as CurrentUser | null | undefined;
  const profile = useQuery(api.profiles.getProfile, {}) as
    | (Profile & { imageUrl?: string | null; additionalImageUrls?: string[] })
    | null
    | undefined;
  const preferences = useQuery(api.profiles.getPreferences) as Preferences | null | undefined;

  if (profile === undefined || currentUser === undefined) {
    return (
      <DashboardLayout>
        <Skeleton className="h-96 w-full max-w-2xl mx-auto" />
      </DashboardLayout>
    );
  }

  if (!profile || !currentUser) {
    return (
      <DashboardLayout>
        <Skeleton className="h-96 w-full max-w-2xl mx-auto" />
      </DashboardLayout>
    );
  }

  const isStaff = isStaffRole(profile.role);
  const roleLabel = isOwnerRole(profile.role)
    ? t("profilePage.roleOwner")
    : profile.role === "admin"
      ? t("profilePage.roleAdmin")
      : t("profilePage.roleMember");

  return (
    <DashboardLayout>
      <div className="max-w-2xl mx-auto space-y-6">
        {profile && !profile.questionnaireComplete && !isStaff && (
          <ProfileCompletionCard profile={profile} preferences={preferences} />
        )}

        <ProfileEditScreen
          profile={profile}
          currentUser={currentUser}
          isStaff={isStaff}
          roleLabel={roleLabel}
        />
      </div>
    </DashboardLayout>
  );
}
