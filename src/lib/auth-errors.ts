import type { TranslationPath } from "@/lib/i18n/translations";

type TranslateFn = (key: TranslationPath) => string;

export function isUnknownAccountError(error: unknown): boolean {
  if (!(error instanceof Error)) return false;
  return error.message.includes("InvalidAccountId");
}

/** Extract a user-facing message from Convex Auth / Convex client errors. */
export function getAuthErrorMessage(
  error: unknown,
  fallback: string,
  t?: TranslateFn
): string {
  if (error instanceof Error) {
    const msg = error.message;
    if (msg.includes("InvalidAccountId")) {
      return t?.("auth.errorNoAccount") ?? fallback;
    }
    if (msg.includes("Invalid credentials") || msg.includes("InvalidSecret")) {
      return t?.("validation.invalidCredentials") ?? fallback;
    }
    if (
      msg.includes("already exists") ||
      msg.includes("already in use") ||
      (msg.includes("Account ") && msg.includes("already exists"))
    ) {
      return t?.("auth.errorAccountExists") ?? fallback;
    }
    if (msg.includes("Could not send reset email")) {
      return t?.("auth.errorResetEmail") ?? fallback;
    }
    if (msg.includes("AUTH_RESEND_KEY is not configured")) {
      return t?.("auth.errorResetEmail") ?? fallback;
    }
    if (msg.includes("TooManyFailedAttempts")) {
      return t?.("auth.errorTooManyAttempts") ?? fallback;
    }
    if (msg.includes("Missing environment variable")) {
      return t?.("auth.errorServerNotConfigured") ?? fallback;
    }
    if (msg && !msg.includes("[Request ID:")) {
      return msg;
    }
  }
  return fallback;
}
