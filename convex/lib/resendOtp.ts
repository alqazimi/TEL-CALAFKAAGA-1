import { RandomReader, generateRandomString } from "@oslojs/crypto/random";
import { DEFAULT_AUTH_EMAIL_FROM } from "./constants";

export function generateEmailOtp(length = 8): string {
  const random: RandomReader = {
    read(bytes) {
      crypto.getRandomValues(bytes);
    },
  };

  return generateRandomString(random, "0123456789", length);
}

export function getResendFromAddress(): string {
  return process.env.AUTH_EMAIL_FROM ?? DEFAULT_AUTH_EMAIL_FROM;
}

export function requireResendApiKey(apiKey: string | undefined): string {
  if (!apiKey) {
    throw new Error("AUTH_RESEND_KEY is not configured on Convex");
  }
  return apiKey;
}

/** Send email via Resend HTTP API (works in Convex actions without Node.js). */
export async function sendResendEmail(args: {
  apiKey: string;
  to: string;
  subject: string;
  text: string;
  html?: string;
}): Promise<void> {
  const response = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${args.apiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      from: getResendFromAddress(),
      to: [args.to],
      subject: args.subject,
      text: args.text,
      ...(args.html ? { html: args.html } : {}),
    }),
  });

  if (!response.ok) {
    const body = await response.text();
    console.error("Resend API error:", response.status, body);
    throw new Error(formatResendSendError(response.status, body));
  }
}

function formatResendSendError(status: number, body: string): string {
  const lower = body.toLowerCase();
  if (
    status === 403 &&
    (lower.includes("not authorized") ||
      lower.includes("validation") ||
      lower.includes("domain"))
  ) {
    return "Could not send reset email: verify your domain in Resend (AUTH_EMAIL_FROM)";
  }
  if (status === 401) {
    return "Could not send reset email: invalid Resend API key";
  }
  return "Could not send reset email";
}
