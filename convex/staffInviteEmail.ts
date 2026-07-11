"use node";

import { v } from "convex/values";
import { internalAction } from "./_generated/server";
import { Resend } from "resend";
import { getResendFromAddress, requireResendApiKey } from "./lib/resendOtp";
import {
  buildBrandedEmailHtml,
  buildBrandedEmailText,
  getEmailSiteUrl,
} from "./lib/emailTemplate";

function getInviteUrl(token: string): string {
  return `${getEmailSiteUrl()}/admin/invite?token=${encodeURIComponent(token)}`;
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
    const subject = "You've been invited to Hel Calafkaaga admin";
    const emailArgs = {
      title: "Admin invite",
      body: "You've been invited to join Hel Calafkaaga as an admin. Open the link below to sign in or create your account and accept the invite.",
      preheader: "Accept your Hel Calafkaaga admin invite",
      cta: { label: "Accept invite", url: inviteUrl },
      footerNote: "This invite expires in 7 days. If you did not expect this email, you can ignore it.",
    };

    const { error } = await resend.emails.send({
      from: getResendFromAddress(),
      to: [args.email],
      subject,
      text: buildBrandedEmailText(emailArgs),
      html: buildBrandedEmailHtml(emailArgs),
    });

    if (error) {
      console.error("Staff invite Resend error:", error);
      throw new Error("Could not send invite email.");
    }

    return { ok: true as const };
  },
});
