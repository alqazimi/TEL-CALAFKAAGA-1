/**
 * Password provider with a hard uniqueness check on sign-up.
 * Convex Auth otherwise reuses an existing account when the password matches,
 * which lets the same email "register" twice.
 */
import { Password } from "@convex-dev/auth/providers/Password";
import type { GenericDataModel } from "convex/server";
import { api } from "../_generated/api";

type PasswordOptions<DataModel extends GenericDataModel> = NonNullable<
  Parameters<typeof Password<DataModel>>[0]
>;

export function UniquePassword<DataModel extends GenericDataModel>(
  config: PasswordOptions<DataModel> = {}
) {
  const provider = Password<DataModel>(config);
  const baseAuthorize = provider.authorize;

  if (!baseAuthorize) {
    return provider;
  }

  type AuthorizeArgs = Parameters<typeof baseAuthorize>;

  return {
    ...provider,
    authorize: async (...args: AuthorizeArgs) => {
      const [params, ctx] = args;
      if (params.flow === "signUp") {
        const profile =
          config.profile?.(params, ctx) ??
          ({
            email:
              typeof params.email === "string"
                ? params.email.trim().toLowerCase()
                : "",
          } as { email: string });

        const email = profile.email;
        if (!email) {
          throw new Error("Missing email for signUp");
        }

        const taken = await ctx.runQuery(api.users.isEmailRegistered, {
          email,
        });
        if (taken) {
          throw new Error(`Account ${email} already exists`);
        }
      }

      return baseAuthorize(...args);
    },
  };
}
