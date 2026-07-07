"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Menu, X, LayoutDashboard, User } from "lucide-react";
import { useConvexAuth } from "convex/react";
import { Button } from "@/components/ui/button";
import { isAppShellRoute } from "@/lib/routes";
import { useNavLinks } from "@/lib/i18n/hooks";
import { useTranslation } from "@/lib/i18n/context";
import { cn } from "@/lib/utils";
import { BrandLogo } from "@/components/layout/brand-logo";
import { LanguageToggle } from "@/components/layout/language-toggle";
import { ThemeToggle } from "@/components/layout/theme-toggle";

export function Navbar() {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);
  const { isAuthenticated, isLoading } = useConvexAuth();

  useEffect(() => {
    setOpen(false);
  }, [pathname]);

  const inAppShell = isAppShellRoute(pathname);
  const navLinks = useNavLinks();
  const { t } = useTranslation();

  const isActive = (href: string) => {
    if (href.startsWith("/#")) return false;
    return href === "/" ? pathname === "/" : pathname === href;
  };

  return (
    <header
      className={cn(
        "sticky top-0 z-50 w-full border-b border-border bg-card/95 backdrop-blur-xl pt-[env(safe-area-inset-top)]",
        inAppShell && "hidden lg:block"
      )}
    >
      <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">
        <BrandLogo href="/" showTagline />

        <nav className="hidden lg:flex items-center gap-0.5">
          {navLinks.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              className={cn(
                "relative px-3 py-2 text-sm font-medium transition-colors",
                isActive(link.href)
                  ? "text-primary"
                  : "text-muted-foreground hover:text-foreground"
              )}
            >
              {link.label}
              {isActive(link.href) && (
                <span className="absolute bottom-0 left-3 right-3 h-0.5 rounded-full bg-primary" />
              )}
            </Link>
          ))}
        </nav>

        <div className="flex items-center gap-2">
          <LanguageToggle className="rounded-xl h-10 px-3" />

          <ThemeToggle />

          <div className="hidden sm:flex items-center gap-2">
            {isLoading ? (
              <div className="h-10 w-32 rounded-xl bg-muted animate-pulse" aria-hidden />
            ) : isAuthenticated ? (
              <Button asChild>
                <Link href="/dashboard">
                  <LayoutDashboard className="h-4 w-4" />
                  {t("nav.dashboard")}
                </Link>
              </Button>
            ) : (
              <Button variant="outline" asChild className="border-primary text-primary hover:bg-accent">
                <Link href="/login">
                  <User className="h-4 w-4" />
                  {t("nav.memberLogin")}
                </Link>
              </Button>
            )}
          </div>

          <Button
            variant="ghost"
            size="icon"
            className="lg:hidden rounded-xl h-10 w-10"
            onClick={() => setOpen(!open)}
            aria-label={open ? t("common.a11yCloseMenu") : t("common.a11yOpenMenu")}
          >
            {open ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
          </Button>
        </div>
      </div>

      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            className="lg:hidden border-t border-border"
          >
            <div className="px-4 py-4 space-y-1">
              {navLinks.map((link) => (
                <Link
                  key={link.href}
                  href={link.href}
                  onClick={() => setOpen(false)}
                  className={cn(
                    "block px-4 py-3 text-sm font-medium rounded-xl transition-colors",
                    isActive(link.href)
                      ? "bg-accent text-primary"
                      : "hover:bg-muted"
                  )}
                >
                  {link.label}
                </Link>
              ))}
              <div className="flex flex-col gap-2 pt-3">
                <LanguageToggle className="w-full justify-center" />
                {isLoading ? (
                  <div className="h-10 w-full rounded-xl bg-muted animate-pulse" aria-hidden />
                ) : isAuthenticated ? (
                  <Button asChild className="w-full">
                    <Link href="/dashboard" onClick={() => setOpen(false)}>
                      <LayoutDashboard className="h-4 w-4" />
                      {t("nav.dashboard")}
                    </Link>
                  </Button>
                ) : (
                  <Button variant="outline" asChild className="w-full border-primary text-primary">
                    <Link href="/login" onClick={() => setOpen(false)}>
                      <User className="h-4 w-4" />
                      {t("nav.memberLogin")}
                    </Link>
                  </Button>
                )}
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </header>
  );
}
