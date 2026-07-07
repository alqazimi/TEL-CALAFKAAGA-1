import { RandomReader, generateRandomString } from "@oslojs/crypto/random";

export function generateEmailOtp(length = 8): string {
  const random: RandomReader = {
    read(bytes) {
      crypto.getRandomValues(bytes);
    },
  };

  return generateRandomString(random, "0123456789", length);
}

export function getResendFromAddress(): string {
  return process.env.AUTH_EMAIL_FROM ?? "Calaf <onboarding@resend.dev>";
}

export function requireResendApiKey(apiKey: string | undefined): string {
  if (!apiKey) {
    throw new Error("AUTH_RESEND_KEY is not configured on Convex");
  }
  return apiKey;
}
