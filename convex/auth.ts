import { convexAuth } from "@convex-dev/auth/server";
import { Password } from "@convex-dev/auth/providers/Password";
import { createUserProfile } from "./lib/createProfile";
import { MutationCtx } from "./_generated/server";

export const { auth, signIn, signOut, store } = convexAuth({
  providers: [
    Password({
      profile(params) {
        return {
          email: params.email as string,
          ...(params.name ? { name: params.name as string } : {}),
          ...(params.phone ? { phone: params.phone as string } : {}),
          ...(params.gender
            ? { gender: params.gender as "male" | "female" }
            : {}),
        };
      },
    }),
  ],
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

      await createUserProfile(mutationCtx, userId, { name, gender, phone });
    },
  },
});
