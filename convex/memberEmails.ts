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

export const send = internalAction({
  args: {
    email: v.string(),
    subject: v.string(),
    body: v.string(),
    ctaLabel: v.string(),
    ctaPath: v.string(),
  },
  handler: async (_ctx, args) => {
    const apiKey = requireResendApiKey(process.env.AUTH_RESEND_KEY);
    const resend = new Resend(apiKey);
    const siteUrl = getEmailSiteUrl();
    const ctaUrl = `${siteUrl}${args.ctaPath.startsWith("/") ? args.ctaPath : `/${args.ctaPath}`}`;
    const emailArgs = {
      title: args.subject,
      body: args.body,
      preheader: args.body,
      cta: { label: args.ctaLabel, url: ctaUrl },
    };

    const { error } = await resend.emails.send({
      from: getResendFromAddress(),
      to: [args.email],
      subject: args.subject,
      text: buildBrandedEmailText(emailArgs),
      html: buildBrandedEmailHtml(emailArgs),
    });

    if (error) {
      console.error("Member email Resend error:", error);
      throw new Error("Could not send member email.");
    }

    return { ok: true as const };
  },
});
