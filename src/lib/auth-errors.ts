/** Extract a user-facing message from Convex Auth / Convex client errors. */
export function getAuthErrorMessage(error: unknown, fallback: string): string {
  if (error instanceof Error) {
    const msg = error.message;
    if (msg.includes("InvalidAccountId")) {
      return "No account found with this email. Production uses a separate database — register here if you only had a local/dev account.";
    }
    if (
      msg.includes("Invalid credentials") ||
      msg.includes("InvalidSecret")
    ) {
      return "Invalid email or password.";
    }
    if (
      msg.includes("already exists") ||
      msg.includes("already in use") ||
      (msg.includes("Account ") && msg.includes("already exists"))
    ) {
      return "An account with this email already exists. Try signing in instead.";
    }
    if (msg.includes("Could not send reset email")) {
      return "We could not send the reset email. Please try again later or contact support.";
    }
    if (msg.includes("TooManyFailedAttempts")) {
      return "Too many failed sign-in attempts. Please wait a few minutes and try again.";
    }
    if (msg.includes("Missing environment variable")) {
      return "Server auth is not configured. Contact support.";
    }
    if (msg && !msg.includes("[Request ID:")) {
      return msg;
    }
  }
  return fallback;
}
