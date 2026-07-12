"use node";

import { v } from "convex/values";
import { action } from "./_generated/server";
import { internal } from "./_generated/api";
import { Resend } from "resend";
import { getResendFromAddress, requireResendApiKey } from "./lib/resendOtp";
import { DEFAULT_SUPPORT_EMAIL } from "./lib/constants";
import {
  buildBrandedEmailHtml,
  escapeHtml,
  EMAIL_BRAND,
} from "./lib/emailTemplate";

const SUPPORT_INBOX = process.env.SUPPORT_EMAIL ?? DEFAULT_SUPPORT_EMAIL;

const MAX_NAME = 100;
const MAX_SUBJECT = 200;
const MAX_MESSAGE = 5000;
/** 5 contact submissions per email per hour */
const CONTACT_LIMIT = 5;
const CONTACT_WINDOW_MS = 60 * 60 * 1000;

export const sendContactMessage = action({
  args: {
    name: v.string(),
    email: v.string(),
    subject: v.string(),
    message: v.string(),
    /** Honeypot — must stay empty. Bots that fill it get a fake success. */
    companyWebsite: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    // Layer 2: silent bot trap (do not reveal detection)
    if (args.companyWebsite && args.companyWebsite.trim().length > 0) {
      return { ok: true as const };
    }

    const name = args.name.trim();
    const email = args.email.trim().toLowerCase();
    const subject = args.subject.trim();
    const message = args.message.trim();

    if (name.length < 2 || name.length > MAX_NAME) {
      throw new Error("Name is required");
    }
    if (!email.includes("@") || email.length > 254) {
      throw new Error("Invalid email");
    }
    if (subject.length < 3 || subject.length > MAX_SUBJECT) {
      throw new Error("Subject is required");
    }
    if (message.length < 10 || message.length > MAX_MESSAGE) {
      throw new Error("Message is too short");
    }

    const rate = await ctx.runMutation(internal.rateLimit.checkAndIncrement, {
      key: `contact:${email}`,
      limit: CONTACT_LIMIT,
      windowMs: CONTACT_WINDOW_MS,
    });
    if (!rate.allowed) {
      throw new Error("Too many messages. Please try again later or use WhatsApp.");
    }

    // Always store for the admin Contacts inbox (email is secondary).
    await ctx.runMutation(internal.supportContacts.insertPublicContact, {
      name,
      email,
      subject,
      message,
    });

    const apiKey = requireResendApiKey(process.env.AUTH_RESEND_KEY);
    const resend = new Resend(apiKey);

    const detailHtml = `<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="margin:0 0 16px;border:1px solid ${EMAIL_BRAND.border};border-radius:12px;overflow:hidden;">
      <tr><td style="padding:10px 14px;background:${EMAIL_BRAND.bg};font-size:12px;color:${EMAIL_BRAND.muted};text-transform:uppercase;letter-spacing:0.08em;font-weight:600;">Name</td></tr>
      <tr><td style="padding:10px 14px;font-size:15px;color:${EMAIL_BRAND.ink};">${escapeHtml(name)}</td></tr>
      <tr><td style="padding:10px 14px;background:${EMAIL_BRAND.bg};font-size:12px;color:${EMAIL_BRAND.muted};text-transform:uppercase;letter-spacing:0.08em;font-weight:600;">Email</td></tr>
      <tr><td style="padding:10px 14px;font-size:15px;color:${EMAIL_BRAND.ink};"><a href="mailto:${escapeHtml(email)}" style="color:${EMAIL_BRAND.primary};text-decoration:none;">${escapeHtml(email)}</a></td></tr>
      <tr><td style="padding:10px 14px;background:${EMAIL_BRAND.bg};font-size:12px;color:${EMAIL_BRAND.muted};text-transform:uppercase;letter-spacing:0.08em;font-weight:600;">Message</td></tr>
      <tr><td style="padding:10px 14px;font-size:15px;line-height:1.6;color:${EMAIL_BRAND.ink};">${escapeHtml(message).replace(/\n/g, "<br />")}</td></tr>
    </table>`;

    const emailArgs = {
      title: subject,
      body: "A visitor sent a message from the contact form.",
      preheader: `${name}: ${subject}`,
      extraHtml: detailHtml,
      footerNote: `Reply directly to this email to respond to ${name}.`,
    };

    const { error } = await resend.emails.send({
      from: getResendFromAddress(),
      to: [SUPPORT_INBOX],
      replyTo: email,
      subject: `[Hel Calafkaaga Contact] ${subject}`,
      text: [
        `Subject: ${subject}`,
        `Name: ${name}`,
        `Email: ${email}`,
        "",
        message,
        "",
        `— ${EMAIL_BRAND.name}`,
      ].join("\n"),
      html: buildBrandedEmailHtml(emailArgs),
    });

    if (error) {
      console.error("Contact form Resend error:", error);
      // Message is already saved for admin — don't fail the visitor.
    }

    return { ok: true as const };
  },
});
