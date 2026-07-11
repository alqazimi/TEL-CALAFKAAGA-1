"use client";

import { useEffect, useRef } from "react";
import { useMutation } from "convex/react";
import { useSafeQuery } from "@/lib/use-safe-query";
import { api } from "../../../convex/_generated/api";
import { isStaffRole } from "@/lib/access";

/** Backfill trial / profile flags for members. Staff accounts skip this. */
export function TrialAccessSync() {
  const ensureProfile = useMutation(api.profiles.ensureProfile);
  const user = useSafeQuery(api.users.currentUser);
  const syncedRef = useRef(false);

  useEffect(() => {
    if (user === undefined) return;
    if (isStaffRole(user?.profile?.role)) return;
    if (syncedRef.current) return;
    syncedRef.current = true;
    void ensureProfile().catch(() => {
      syncedRef.current = false;
    });
  }, [ensureProfile, user]);

  return null;
}
