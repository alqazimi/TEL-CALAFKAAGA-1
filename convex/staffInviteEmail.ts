"use node";

import { v } from "convex/values";
import { internalAction } from "./_generated/server";
import { Resend } from "resend";
import { getResendFromAddress, requireResendApiKey } from "./lib/resendOtp";

function getInviteUrl(token: string): string {
  const siteUrl = (process.env.SITE_URL ?? "https://helcalafkaaga.com").replace(
    /\/$/,
    ""
  );
  return `${siteUrl}/admin/invite?token=${encodeURIComponent(token)}`;
}

export const send = internalAction({
  args: {
    email: v.string(),
    token: v.string(),
  },
  handler: async (_ctx, args) => {
    const apiKey = requireResendApiKey(process.env.AUTH_RESEND_KEY);
    const resend = new Resend(apiKey);
    const inviteUrl = getInviteUrl(args.token);

    const { error } = await resend.emails.send({
      from: getResendFromAddress(),
      to: [args.email],
      subject: "You've been invited to Hel Calafkaaga admin",
      text: [
        "You've been invited to join Hel Calafkaaga as an admin.",
        "",
        "Open this link to set your password and accept the invite:",
        inviteUrl,
        "",
        "This link expires in 7 days. If you did not expect this email, you can ignore it.",
      ].join("\n"),
    });

    if (error) {
      console.error("Staff invite Resend error:", error);
      throw new Error("Could not send invite email.");
    }

    return { ok: true as const };
  },
});
