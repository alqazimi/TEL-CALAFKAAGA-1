"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useConvexAuth } from "convex/react";
import { Phone, Mail, MapPin } from "lucide-react";
import {
  APP_NAME,
  APP_DESCRIPTION,
  NAV_LINKS,
  REGISTRATION_PRICE,
} from "@/lib/constants";
import { isAppShellRoute } from "@/lib/routes";
import { cn } from "@/lib/utils";
import { BrandLogo } from "@/components/layout/brand-logo";
import { AuthRegisterCta } from "@/components/auth/auth-register-cta";

const SUPPORT_LINKS = [
  { href: "/faq", label: "Help Center" },
  { href: "/privacy", label: "Privacy Policy" },
  { href: "/terms", label: "Terms of Service" },
] as const;

const SOCIAL_LINKS = [
  { label: "Facebook", href: "#" },
  { label: "Instagram", href: "#" },
  { label: "Twitter", href: "#" },
  { label: "YouTube", href: "#" },
] as const;

export function Footer() {
  const pathname = usePathname();
  const { isAuthenticated, isLoading } = useConvexAuth();

  if (isAppShellRoute(pathname)) {
    return null;
  }

  const quickLinks = NAV_LINKS.filter((l) => l.href !== "/");

  return (
    <footer className="bg-navy text-white">
      <div className="mx-auto max-w-7xl px-4 py-14 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 gap-10 lg:grid-cols-[1.2fr_1fr_1fr_1fr_1.2fr]">
          {/* Brand */}
          <div className="space-y-4">
            <BrandLogo variant="light" showTagline />
            <p className="text-sm text-white/70 max-w-xs">{APP_DESCRIPTION}</p>
            <div className="flex gap-3">
              {SOCIAL_LINKS.map((social) => (
                <a
                  key={social.label}
                  href={social.href}
                  aria-label={social.label}
                  className="flex h-9 w-9 items-center justify-center rounded-lg bg-white/10 text-white/80 hover:bg-primary hover:text-white transition-colors text-xs font-bold"
                >
                  {social.label[0]}
                </a>
              ))}
            </div>
          </div>

          {/* Quick Links */}
          <div>
            <h3 className="text-sm font-semibold mb-4">Quick Links</h3>
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
            <h3 className="text-sm font-semibold mb-4">Support</h3>
            <ul className="space-y-2">
              {SUPPORT_LINKS.map((link) => (
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

          {/* Contact */}
          <div>
            <h3 className="text-sm font-semibold mb-4">Contact Us</h3>
            <ul className="space-y-3">
              <li className="flex items-center gap-2 text-sm text-white/70">
                <Phone className="h-4 w-4 text-primary shrink-0" />
                +252 61 000 0000
              </li>
              <li className="flex items-center gap-2 text-sm text-white/70">
                <Mail className="h-4 w-4 text-primary shrink-0" />
                hello@calaf.com
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
              Ready to find your perfect match?
            </h3>
            <p className="mt-2 text-sm text-white/90">
              Join thousands of serious people on {APP_NAME}.
            </p>
            {!isLoading && isAuthenticated ? (
              <Link
                href="/dashboard"
                className={cn(
                  "mt-4 inline-flex items-center justify-center rounded-xl bg-white px-6 py-3 text-sm font-semibold text-primary hover:bg-white/90 transition-colors w-full"
                )}
              >
                Go to Dashboard
              </Link>
            ) : (
              <AuthRegisterCta
                registerLabel={`Join Now – $${REGISTRATION_PRICE} ›`}
                className="mt-4 w-full bg-white text-primary hover:bg-white/90"
                size="default"
              />
            )}
          </div>
        </div>

        <div className="mt-12 border-t border-white/10 pt-6">
          <p className="text-center text-sm text-white/50">
            &copy; {new Date().getFullYear()} {APP_NAME}. All rights reserved.
          </p>
        </div>
      </div>
    </footer>
  );
}
