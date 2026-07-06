/** Routes that use the in-app dashboard shell (no marketing navbar/footer). */
export const APP_SHELL_ROUTES = [
  "/dashboard",
  "/profile",
  "/matches",
  "/chat",
  "/questionnaire",
  "/notifications",
  "/admin",
] as const;

export const AUTH_ROUTES = ["/login", "/register", "/forgot-password"] as const;

export function isAppShellRoute(pathname: string): boolean {
  return APP_SHELL_ROUTES.some(
    (route) => pathname === route || pathname.startsWith(`${route}/`)
  );
}

export function isAuthRoute(pathname: string): boolean {
  return AUTH_ROUTES.some(
    (route) => pathname === route || pathname.startsWith(`${route}/`)
  );
}

export function isMarketingRoute(pathname: string): boolean {
  return !isAppShellRoute(pathname) && !isAuthRoute(pathname);
}

/** Where signed-in users should land instead of the marketing homepage. */
export function getAuthenticatedHomeRoute(
  profile: { questionnaireComplete?: boolean } | null | undefined
): string {
  if (!profile?.questionnaireComplete) {
    return "/questionnaire";
  }
  return "/dashboard";
}
