"use client";

import { useEffect, useRef } from "react";
import { useMutation } from "convex/react";
import { api } from "../../../convex/_generated/api";

/** Grants trial backfill to existing unpaid members on first app visit after deploy. */
export function TrialAccessSync() {
  const ensureProfile = useMutation(api.profiles.ensureProfile);
  const syncedRef = useRef(false);

  useEffect(() => {
    if (syncedRef.current) return;
    syncedRef.current = true;
    void ensureProfile().catch(() => {
      syncedRef.current = false;
    });
  }, [ensureProfile]);

  return null;
}
