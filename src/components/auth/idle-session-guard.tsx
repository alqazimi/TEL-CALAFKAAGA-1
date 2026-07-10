"use client";

import { useEffect, useRef } from "react";
import { useAuthActions } from "@convex-dev/auth/react";
import { useConvexAuth } from "convex/react";
import { toast } from "sonner";

/** Must match `session.inactiveDurationMs` in `convex/auth.ts`. */
export const IDLE_LOGOUT_MS = 3 * 60 * 60 * 1000;

const WINDOW_ACTIVITY_EVENTS: (keyof WindowEventMap)[] = [
  "mousemove",
  "mousedown",
  "keydown",
  "touchstart",
  "scroll",
];

/**
 * Signs the user out after 3 hours with no interaction on this device.
 * Server sessions also expire after the same idle window via Convex Auth.
 */
export function IdleSessionGuard() {
  const { isAuthenticated } = useConvexAuth();
  const { signOut } = useAuthActions();
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const signingOutRef = useRef(false);

  useEffect(() => {
    if (!isAuthenticated) return;

    const clearTimer = () => {
      if (timerRef.current) {
        clearTimeout(timerRef.current);
        timerRef.current = null;
      }
    };

    const logout = () => {
      if (signingOutRef.current) return;
      signingOutRef.current = true;
      clearTimer();
      void signOut()
        .then(() => {
          toast.message("Signed out after 3 hours of inactivity.");
        })
        .finally(() => {
          signingOutRef.current = false;
        });
    };

    const resetTimer = () => {
      if (document.visibilityState === "hidden") return;
      clearTimer();
      timerRef.current = setTimeout(logout, IDLE_LOGOUT_MS);
    };

    resetTimer();

    for (const event of WINDOW_ACTIVITY_EVENTS) {
      window.addEventListener(event, resetTimer, { passive: true });
    }
    document.addEventListener("visibilitychange", resetTimer);

    return () => {
      clearTimer();
      for (const event of WINDOW_ACTIVITY_EVENTS) {
        window.removeEventListener(event, resetTimer);
      }
      document.removeEventListener("visibilitychange", resetTimer);
    };
  }, [isAuthenticated, signOut]);

  return null;
}
