import { v } from "convex/values";
import {
  getAuthUserId,
  modifyAccountCredentials,
  retrieveAccount,
} from "@convex-dev/auth/server";
import { action } from "./_generated/server";
import { internal } from "./_generated/api";

export const changePassword = action({
  args: {
    currentPassword: v.string(),
    newPassword: v.string(),
  },
  handler: async (ctx, args) => {
    if (args.newPassword.length < 8) {
      throw new Error("Password must be at least 8 characters");
    }

    const userId = await getAuthUserId(ctx);
    if (!userId) {
      throw new Error("Not authenticated");
    }

    const rawEmail = await ctx.runQuery(internal.users.getEmailForUser, { userId });
    if (!rawEmail) {
      throw new Error("No email on account");
    }
    const email = rawEmail.trim().toLowerCase();

    try {
      await retrieveAccount(ctx, {
        provider: "password",
        account: { id: email, secret: args.currentPassword },
      });
    } catch {
      throw new Error("Current password is incorrect");
    }

    await modifyAccountCredentials(ctx, {
      provider: "password",
      account: { id: email, secret: args.newPassword },
    });

    return { success: true };
  },
});
