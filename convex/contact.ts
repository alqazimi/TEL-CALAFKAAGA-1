"use node";

import { v } from "convex/values";
import { action } from "./_generated/server";
import { Resend } from "resend";
import { getResendFromAddress, requireResendApiKey } from "./lib/resendOtp";
import { DEFAULT_SUPPORT_EMAIL } from "./lib/constants";

const SUPPORT_INBOX = process.env.SUPPORT_EMAIL ?? DEFAULT_SUPPORT_EMAIL;

export const sendContactMessage = action({
  args: {
    name: v.string(),
    email: v.string(),
    subject: v.string(),
    message: v.string(),
  },
  handler: async (_ctx, args) => {
    const name = args.name.trim();
    const email = args.email.trim().toLowerCase();
    const subject = args.subject.trim();
    const message = args.message.trim();

    if (name.length < 2) throw new Error("Name is required");
    if (!email.includes("@")) throw new Error("Invalid email");
    if (subject.length < 3) throw new Error("Subject is required");
    if (message.length < 10) throw new Error("Message is too short");

    const apiKey = requireResendApiKey(process.env.AUTH_RESEND_KEY);
    const resend = new Resend(apiKey);

    const { error } = await resend.emails.send({
      from: getResendFromAddress(),
      to: [SUPPORT_INBOX],
      replyTo: email,
      subject: `[Calaf Contact] ${subject}`,
      text: [
        `Name: ${name}`,
        `Email: ${email}`,
        "",
        message,
      ].join("\n"),
    });

    if (error) {
      console.error("Contact form Resend error:", error);
      throw new Error("Could not send message. Please try WhatsApp instead.");
    }

    return { ok: true as const };
  },
});
