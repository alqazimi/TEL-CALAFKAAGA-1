/** Extract a user-facing message from Convex Auth / Convex client errors. */
export function getAuthErrorMessage(error: unknown, fallback: string): string {
  if (error instanceof Error) {
    const msg = error.message;
    if (
      msg.includes("Invalid credentials") ||
      msg.includes("InvalidSecret")
    ) {
      return "Invalid email or password. Production uses a separate database — register again if you only had a local account.";
    }
    if (
      msg.includes("already exists") ||
      msg.includes("already in use") ||
      msg.includes("Account ") && msg.includes("already exists")
    ) {
      return "An account with this email already exists. Try signing in instead.";
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
