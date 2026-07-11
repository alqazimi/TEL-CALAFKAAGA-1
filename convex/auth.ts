import { convexAuth } from "@convex-dev/auth/server";
import { createUserProfile } from "./lib/createProfile";
import { MutationCtx } from "./_generated/server";
import { ResendOTPPasswordReset } from "./ResendOTPPasswordReset";
import { UniquePassword } from "./lib/uniquePassword";
import { normalizeAuthEmail } from "./lib/authEmail";

/** Log out after 3 hours without activity (refresh token / session idle). */
const SESSION_INACTIVE_MS = 3 * 60 * 60 * 1000;
/** Absolute max session length even with activity. */
const SESSION_TOTAL_MS = 7 * 24 * 60 * 60 * 1000;

export const { auth, signIn, signOut, store } = convexAuth({
  providers: [
    UniquePassword({
      reset: ResendOTPPasswordReset,
      profile(params) {
        const rawEmail = params.email;
        const email =
          typeof rawEmail === "string" ? normalizeAuthEmail(rawEmail) : "";
        return {
          email,
          ...(params.name ? { name: params.name as string } : {}),
          ...(params.phone ? { phone: params.phone as string } : {}),
          ...(params.gender
            ? { gender: params.gender as "male" | "female" }
            : {}),
        };
      },
    }),
  ],
  session: {
    inactiveDurationMs: SESSION_INACTIVE_MS,
    totalDurationMs: SESSION_TOTAL_MS,
  },
  jwt: {
    // Short-lived access tokens; refreshed while the user stays active.
    durationMs: 60 * 60 * 1000,
  },
  callbacks: {
    async afterUserCreatedOrUpdated(ctx, { userId, profile }) {
      const mutationCtx = ctx as MutationCtx;

      const existing = await mutationCtx.db
        .query("profiles")
        .withIndex("by_userId", (q) => q.eq("userId", userId))
        .unique();

      if (existing) return;

      const name = (profile.name as string) || "User";
      const gender = (profile.gender as "male" | "female") ?? "male";
      const phone = profile.phone as string | undefined;

      try {
        await createUserProfile(mutationCtx, userId, { name, gender, phone });
      } catch (error) {
        // Another request may have created the profile (e.g. ensureProfile race).
        const again = await mutationCtx.db
          .query("profiles")
          .withIndex("by_userId", (q) => q.eq("userId", userId))
          .unique();
        if (again) return;
        throw error;
      }
    },
  },
});
