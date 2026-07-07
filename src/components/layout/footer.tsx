"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useConvexAuth } from "convex/react";
import { Phone, Mail, MapPin } from "lucide-react";
import {
  APP_NAME,
  PERSONAL_SUPPORT_PRICE,
  REGISTRATION_PRICE,
  SUPPORT_EMAIL,
  WHATSAPP_DISPLAY,
  WHATSAPP_URL,
} from "@/lib/constants";
import { isAppShellRoute } from "@/lib/routes";
import { useTranslation } from "@/lib/i18n/context";
import { useNavLinks } from "@/lib/i18n/hooks";
import { cn } from "@/lib/utils";
import { BrandLogo } from "@/components/layout/brand-logo";
import { AuthRegisterCta } from "@/components/auth/auth-register-cta";

const SUPPORT_LINKS = [
  { href: "/faq", label: "Help Center" },
  { href: "/privacy", label: "Privacy Policy" },
  { href: "/terms", label: "Terms of Service" },
] as const;

export function Footer() {
  const pathname = usePathname();
  const { isAuthenticated, isLoading } = useConvexAuth();

  const { t } = useTranslation();
  const navLinks = useNavLinks();

  if (isAppShellRoute(pathname)) {
    return null;
  }

  const quickLinks = navLinks.filter((l) => l.href !== "/");

  return (
    <footer className="bg-brand-dark text-white">
      <div className="mx-auto max-w-7xl px-4 py-14 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 gap-10 lg:grid-cols-[1.2fr_1fr_1fr_1fr_1.2fr]">
          {/* Brand */}
          <div className="space-y-4">
            <BrandLogo variant="light" showTagline />
            <p className="text-sm text-white/70 max-w-xs">{t("brand.description")}</p>
            <a
              href={WHATSAPP_URL}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 rounded-lg bg-whatsapp/20 px-3 py-2 text-sm text-white hover:bg-whatsapp/30 transition-colors"
            >
              <span className="font-semibold">WhatsApp</span>
              <span className="text-white/80">{WHATSAPP_DISPLAY}</span>
            </a>
          </div>

          {/* Quick Links */}
          <div>
            <h3 className="text-sm font-semibold mb-4">{t("common.quickLinks")}</h3>
            <ul className="space-y-2">
              {quickLinks.map((link) => (
                <li key={link.href}>
                  <Link
                    href={link.href}
                    className="text-sm text-white/70 hover:text-primary transition-colors"
                  >
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Support */}
          <div>
            <h3 className="text-sm font-semibold mb-4">{t("common.support")}</h3>
            <ul className="space-y-2">
              {SUPPORT_LINKS.map((link) => (
                <li key={link.href}>
                  <Link
                    href={link.href}
                    className="text-sm text-white/70 hover:text-primary transition-colors"
                  >
                    {link.href === "/faq" ? t("common.helpCenter") : t(`nav.${link.href === "/privacy" ? "privacy" : "terms"}`)}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Contact */}
          <div>
            <h3 className="text-sm font-semibold mb-4">{t("common.contactUs")}</h3>
            <ul className="space-y-3">
              <li>
                <a
                  href={WHATSAPP_URL}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-2 text-sm text-white/70 hover:text-primary transition-colors"
                >
                  <Phone className="h-4 w-4 text-primary shrink-0" />
                  {WHATSAPP_DISPLAY}
                </a>
              </li>
              <li className="flex items-center gap-2 text-sm text-white/70">
                <Mail className="h-4 w-4 text-primary shrink-0" />
                {SUPPORT_EMAIL}
              </li>
              <li className="flex items-center gap-2 text-sm text-white/70">
                <MapPin className="h-4 w-4 text-primary shrink-0" />
                Somalia
              </li>
            </ul>
          </div>

          {/* CTA Box */}
          <div className="rounded-2xl bg-primary p-6 lg:p-8">
            <h3 className="text-lg font-bold text-white">
              {t("common.readyToMatch")}
            </h3>
            <p className="mt-2 text-sm text-white/90">
              {t("common.joinPlans", {
                basic: REGISTRATION_PRICE,
                premium: PERSONAL_SUPPORT_PRICE,
              })}
            </p>
            {!isLoading && isAuthenticated ? (
              <Link
                href="/dashboard"
                className={cn(
                  "mt-4 inline-flex items-center justify-center rounded-xl bg-primary-foreground px-6 py-3 text-sm font-semibold text-primary hover:bg-primary-foreground/90 transition-colors w-full"
                )}
              >
                {t("common.goToDashboard")}
              </Link>
            ) : (
              <AuthRegisterCta
                registerLabel={t("auth.joinNowPrice", { price: REGISTRATION_PRICE })}
                className="mt-4 w-full bg-primary-foreground text-primary hover:bg-primary-foreground/90"
                size="default"
              />
            )}
          </div>
        </div>

        <div className="mt-12 border-t border-white/10 pt-6">
          <p className="text-center text-sm text-white/50">
            &copy; {new Date().getFullYear()} {APP_NAME}. {t("common.copyright")}
          </p>
        </div>
      </div>
    </footer>
  );
}
