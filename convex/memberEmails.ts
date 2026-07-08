"use node";

import { v } from "convex/values";
import { internalAction } from "./_generated/server";
import { Resend } from "resend";
import { getResendFromAddress, requireResendApiKey } from "./lib/resendOtp";

function getSiteUrl(): string {
  return (
    process.env.SITE_URL ??
    process.env.NEXT_PUBLIC_APP_URL ??
    "https://helcalafkaaga.com"
  ).replace(/\/$/, "");
}

function buildEmailText(args: {
  body: string;
  ctaLabel: string;
  ctaUrl: string;
}): string {
  return [
    args.body,
    "",
    `${args.ctaLabel}: ${args.ctaUrl}`,
    "",
    "— Hel Calafkaaga",
    "Halal marriage matchmaking with trust and respect.",
  ].join("\n");
}

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
    const ctaUrl = `${getSiteUrl()}${args.ctaPath.startsWith("/") ? args.ctaPath : `/${args.ctaPath}`}`;

    const { error } = await resend.emails.send({
      from: getResendFromAddress(),
      to: [args.email],
      subject: args.subject,
      text: buildEmailText({
        body: args.body,
        ctaLabel: args.ctaLabel,
        ctaUrl,
      }),
    });

    if (error) {
      console.error("Member email Resend error:", error);
      throw new Error("Could not send member email.");
    }

    return { ok: true as const };
  },
});
