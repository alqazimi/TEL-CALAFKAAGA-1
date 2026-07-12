import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

/**
 * Maintenance / coming-soon gate.
 *
 * - Production (Vercel): ON by default → shows /maintenance.html
 * - Local: OFF by default
 * - Force ON:  MAINTENANCE_MODE=true
 * - Force OFF: MAINTENANCE_MODE=false  (set this on Vercel to restore the site)
 */
function isMaintenanceOn(): boolean {
  const value = (process.env.MAINTENANCE_MODE ?? "").trim().toLowerCase();
  if (value === "false" || value === "0" || value === "off" || value === "no") {
    return false;
  }
  if (value === "true" || value === "1" || value === "yes" || value === "on") {
    return true;
  }
  return process.env.VERCEL_ENV === "production";
}

export function middleware(request: NextRequest) {
  if (!isMaintenanceOn()) {
    return NextResponse.next();
  }

  const { pathname } = request.nextUrl;

  if (
    pathname === "/maintenance.html" ||
    pathname.startsWith("/_next/") ||
    pathname.startsWith("/images/") ||
    pathname === "/favicon.ico" ||
    pathname === "/icon" ||
    pathname === "/apple-icon" ||
    pathname === "/sw.js" ||
    pathname === "/robots.txt" ||
    pathname === "/sitemap.xml"
  ) {
    return NextResponse.next();
  }

  const url = request.nextUrl.clone();
  url.pathname = "/maintenance.html";
  return NextResponse.rewrite(url);
}

export const config = {
  matcher: ["/((?!_next/static|_next/image).*)"],
};
