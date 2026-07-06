"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useConvexAuth } from "convex/react";
import { APP_NAME, APP_TAGLINE, FOOTER_MENU_LINKS } from "@/lib/constants";
import { isAppShellRoute } from "@/lib/routes";
import { cn } from "@/lib/utils";
import { BrandLogo } from "@/components/layout/brand-logo";

export function Footer() {
  const pathname = usePathname();
  const { isAuthenticated, isLoading } = useConvexAuth();

  if (isAppShellRoute(pathname)) {
    return null;
  }

  const isActive = (href: string) =>
    href === "/" ? pathname === "/" : pathname === href;

  return (
    <footer className="border-t border-border bg-muted/40">
      <div className="mx-auto max-w-7xl px-4 py-10 sm:px-6 lg:px-8">
        <div className="flex flex-col gap-8 lg:flex-row lg:items-start lg:justify-between">
          <div className="space-y-3 max-w-sm">
            <BrandLogo size="sm" />
            <p className="text-sm text-muted-foreground">{APP_TAGLINE}</p>
          </div>

          <div className="flex-1 lg:max-w-2xl">
            <h3 className="text-sm font-semibold mb-4">Menu</h3>
            <ul className="grid grid-cols-2 gap-x-6 gap-y-2 sm:grid-cols-3">
              {FOOTER_MENU_LINKS.map((link) => (
                <li key={link.href}>
                  <Link
                    href={link.href}
                    className={cn(
                      "text-sm transition-colors hover:text-primary",
                      isActive(link.href)
                        ? "text-primary font-medium"
                        : "text-muted-foreground"
                    )}
                  >
                    {link.label}
                  </Link>
                </li>
              ))}
              {!isLoading && isAuthenticated ? (
                <li>
                  <Link
                    href="/dashboard"
                    className={cn(
                      "text-sm transition-colors hover:text-primary",
                      pathname === "/dashboard"
                        ? "text-primary font-medium"
                        : "text-muted-foreground"
                    )}
                  >
                    Dashboard
                  </Link>
                </li>
              ) : !isLoading ? (
                <>
                  <li>
                    <Link
                      href="/login"
                      className="text-sm text-muted-foreground transition-colors hover:text-primary"
                    >
                      Log in
                    </Link>
                  </li>
                  <li>
                    <Link
                      href="/register"
                      className="text-sm text-muted-foreground transition-colors hover:text-primary"
                    >
                      Register
                    </Link>
                  </li>
                </>
              ) : null}
            </ul>
          </div>
        </div>

        <div className="mt-8 border-t border-border pt-6">
          <p className="text-center text-sm text-muted-foreground">
            &copy; {new Date().getFullYear()} {APP_NAME}. All rights reserved.
          </p>
        </div>
      </div>
    </footer>
  );
}
