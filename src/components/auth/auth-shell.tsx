"use client";

import type { ReactNode } from "react";
import Link from "next/link";
import { motion } from "framer-motion";
import { Heart, ShieldCheck, Sparkles, Users } from "lucide-react";
import { APP_NAME } from "@/lib/constants";
import { useTranslation } from "@/lib/i18n/context";
import { ThemeToggle } from "@/components/layout/theme-toggle";
import { LanguageToggle } from "@/components/layout/language-toggle";
import { cn } from "@/lib/utils";

interface AuthShellProps {
  title: string;
  description: string;
  children: ReactNode;
  footer?: ReactNode;
  /** Optional eyebrow above the form title (e.g. step label). */
  eyebrow?: string;
}

export function AuthShell({
  title,
  description,
  children,
  footer,
  eyebrow,
}: AuthShellProps) {
  const { t } = useTranslation();

  const features = [
    { icon: ShieldCheck, text: t("auth.feature1") },
    { icon: Users, text: t("auth.feature2") },
    { icon: Sparkles, text: t("auth.feature3") },
  ];

  return (
    <div className="auth-bg relative min-h-[calc(100dvh-var(--app-header))] overflow-hidden">
      {/* Soft atmospheric mesh — not a flat fill */}
      <div
        className="pointer-events-none absolute inset-0 opacity-70"
        aria-hidden
        style={{
          backgroundImage:
            "radial-gradient(ellipse 55% 45% at 12% 18%, rgba(166,27,43,0.14), transparent 60%), radial-gradient(ellipse 45% 40% at 88% 12%, rgba(201,162,39,0.12), transparent 55%), radial-gradient(ellipse 50% 45% at 70% 90%, rgba(107,18,32,0.08), transparent 60%)",
        }}
      />
      <div
        className="pointer-events-none absolute inset-0 opacity-[0.035] mix-blend-multiply dark:opacity-[0.06] dark:mix-blend-soft-light"
        aria-hidden
        style={{
          backgroundImage:
            "url(\"data:image/svg+xml,%3Csvg viewBox='0 0 256 256' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.85' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)'/%3E%3C/svg%3E\")",
        }}
      />

      <div className="relative mx-auto grid min-h-[calc(100dvh-var(--app-header))] max-w-6xl lg:grid-cols-2 lg:items-stretch">
        {/* Brand plane — hero signal */}
        <aside className="relative hidden overflow-hidden lg:flex lg:flex-col lg:justify-between px-10 py-12 xl:px-14 xl:py-14">
          <div
            className="absolute inset-4 rounded-[2rem] bg-gradient-to-br from-brand-dark via-primary to-[#7a1520]"
            aria-hidden
          />
          <div
            className="absolute inset-4 rounded-[2rem] opacity-40"
            aria-hidden
            style={{
              background:
                "radial-gradient(ellipse 70% 55% at 100% 0%, rgba(201,162,39,0.35), transparent 55%), radial-gradient(ellipse 55% 50% at 0% 100%, rgba(0,0,0,0.35), transparent 60%)",
            }}
          />
          {/* Subtle geometric line work */}
          <div
            className="absolute inset-4 rounded-[2rem] opacity-[0.12]"
            aria-hidden
            style={{
              backgroundImage:
                "linear-gradient(rgba(255,255,255,0.35) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.35) 1px, transparent 1px)",
              backgroundSize: "48px 48px",
              maskImage:
                "radial-gradient(ellipse 80% 70% at 50% 40%, black, transparent)",
            }}
          />

          <div className="relative z-10 flex h-full flex-col justify-between p-4 text-white">
            <Link
              href="/"
              className="inline-flex w-fit items-center gap-3 transition-opacity hover:opacity-90"
            >
              <span className="flex h-12 w-12 items-center justify-center rounded-2xl bg-white/15 ring-1 ring-white/25 backdrop-blur-sm">
                <Heart className="h-5 w-5" fill="currentColor" />
              </span>
              <span className="font-display text-3xl font-semibold tracking-tight">
                {APP_NAME}
              </span>
            </Link>

            <div className="max-w-md space-y-8 py-10">
              <motion.div
                initial={{ opacity: 0, y: 16 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.55, ease: [0.22, 1, 0.36, 1] }}
              >
                <p className="mb-4 text-[11px] font-semibold uppercase tracking-[0.22em] text-gold/90">
                  {t("brand.tagline")}
                </p>
                <h1 className="font-display text-[2.65rem] xl:text-5xl font-semibold leading-[1.05] tracking-tight text-white">
                  {t("auth.findMatch")}
                </h1>
                <p className="mt-5 text-base leading-relaxed text-white/75 xl:text-lg">
                  {t("auth.findMatchDesc")}
                </p>
              </motion.div>

              <motion.ul
                className="space-y-3"
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: 0.12, ease: [0.22, 1, 0.36, 1] }}
              >
                {features.map(({ icon: Icon, text }) => (
                  <li
                    key={text}
                    className="flex items-center gap-3 text-[15px] font-medium text-white/90"
                  >
                    <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-white/12 ring-1 ring-white/15">
                      <Icon className="h-4 w-4" />
                    </span>
                    {text}
                  </li>
                ))}
              </motion.ul>
            </div>

            <p className="relative text-xs text-white/55">
              &copy; {new Date().getFullYear()} {APP_NAME}. {t("common.copyright")}
            </p>
          </div>
        </aside>

        {/* Form plane */}
        <section className="relative flex flex-col justify-center px-5 py-10 sm:px-8 lg:px-12 xl:px-16">
          <div className="absolute right-4 top-4 z-20 flex items-center gap-2 sm:right-6 sm:top-6">
            <LanguageToggle className="h-9 rounded-xl px-2.5" />
            <ThemeToggle />
          </div>

          <motion.div
            className="mx-auto w-full max-w-[26rem]"
            initial={{ opacity: 0, y: 18 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
          >
            {/* Mobile brand — must remain hero-level */}
            <div className="mb-8 lg:hidden">
              <Link href="/" className="inline-flex items-center gap-2.5">
                <span className="flex h-11 w-11 items-center justify-center rounded-2xl bg-primary text-primary-foreground shadow-md shadow-primary/20">
                  <Heart className="h-5 w-5" fill="currentColor" />
                </span>
                <span className="font-display text-2xl font-semibold tracking-tight text-foreground">
                  {APP_NAME}
                </span>
              </Link>
              <p className="mt-3 max-w-sm text-sm leading-relaxed text-muted-foreground">
                {t("auth.findMatchDesc")}
              </p>
            </div>

            <div className={cn("auth-form-panel space-y-8 p-6 sm:p-8")}>
              <header className="space-y-2">
                {eyebrow ? (
                  <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-primary">
                    {eyebrow}
                  </p>
                ) : null}
                <h2 className="font-display text-[1.85rem] sm:text-[2.1rem] font-semibold tracking-tight text-foreground leading-tight">
                  {title}
                </h2>
                <p className="text-[15px] leading-relaxed text-muted-foreground">
                  {description}
                </p>
              </header>

              {children}

              {footer ? (
                <div className="border-t border-border/70 pt-6">{footer}</div>
              ) : null}
            </div>
          </motion.div>
        </section>
      </div>
    </div>
  );
}
