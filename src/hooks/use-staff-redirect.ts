"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useSafeQuery } from "@/lib/use-safe-query";
import { api } from "../../convex/_generated/api";
import { isStaffRole } from "@/lib/access";

/** Redirect admins/owners to the admin console; avoid member onboarding flashes. */
export function useStaffRedirect(adminPath = "/admin") {
  const router = useRouter();
  const user = useSafeQuery(api.users.currentUser);
  const isStaff = isStaffRole(user?.profile?.role);

  useEffect(() => {
    if (isStaff) {
      router.replace(adminPath);
    }
  }, [adminPath, isStaff, router]);

  return {
    user,
    isStaff,
    isLoading: user === undefined,
  };
}

/** Member-only gates (payment, questionnaire, approval) — never for staff. */
export function isMemberOnboardingProfile(
  profile: { role?: string; questionnaireComplete?: boolean } | null | undefined
): boolean {
  if (!profile || isStaffRole(profile.role)) return false;
  return !profile.questionnaireComplete;
}
