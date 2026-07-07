"use client";

import type { ReactNode } from "react";
import Link from "next/link";
import { Heart, ShieldCheck, Users, Sparkles, Quote } from "lucide-react";
import { APP_NAME } from "@/lib/constants";
import { useTranslation } from "@/lib/i18n/context";
import { ThemeToggle } from "@/components/layout/theme-toggle";

interface AuthShellProps {
  title: string;
  description: string;
  children: ReactNode;
  footer?: ReactNode;
}

export function AuthShell({ title, description, children, footer }: AuthShellProps) {
  const { t } = useTranslation();

  const features = [
    { icon: ShieldCheck, text: t("auth.feature1") },
    { icon: Users, text: t("auth.feature2") },
    { icon: Sparkles, text: t("auth.feature3") },
  ];

  return (
    <div className="auth-bg min-h-[calc(100dvh-var(--app-header))]">
      <div className="mx-auto flex min-h-[calc(100dvh-var(--app-header)-2rem)] max-w-6xl flex-col lg:flex-row lg:items-stretch gap-6 px-4 py-6 sm:px-6">
        {/* Brand / value panel */}
        <div className="relative hidden lg:flex lg:w-[46%] flex-col justify-between overflow-hidden rounded-3xl bg-gradient-to-br from-primary via-primary to-brand-dark p-12 xl:p-14 text-white shadow-lg">
          <div
            className="pointer-events-none absolute inset-0 opacity-30"
            style={{
              background:
                "radial-gradient(ellipse 60% 50% at 100% 0%, rgba(255,255,255,0.25), transparent 60%), radial-gradient(ellipse 50% 40% at 0% 100%, rgba(0,0,0,0.25), transparent 60%)",
            }}
            aria-hidden
          />

          <Link href="/" className="relative inline-flex items-center gap-2.5 w-fit">
            <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-white/15 backdrop-blur-sm ring-1 ring-white/25">
              <Heart className="h-5 w-5" fill="currentColor" />
            </div>
            <span className="font-display text-2xl font-bold tracking-tight">{APP_NAME}</span>
          </Link>

          <div className="relative space-y-10">
            <div>
              <h1 className="font-display text-4xl xl:text-[2.75rem] font-bold tracking-tight leading-[1.1]">
                {t("auth.findMatch")}
              </h1>
              <p className="mt-4 text-white/80 text-lg leading-relaxed max-w-md">
                {t("auth.findMatchDesc")}
              </p>
            </div>

            <ul className="space-y-3.5">
              {features.map(({ icon: Icon, text }) => (
                <li key={text} className="flex items-center gap-3 text-[15px] font-medium text-white/90">
                  <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-white/15 ring-1 ring-white/20">
                    <Icon className="h-[18px] w-[18px]" />
                  </div>
                  {text}
                </li>
              ))}
            </ul>

            <figure className="rounded-2xl bg-white/10 p-5 ring-1 ring-white/15 backdrop-blur-sm">
              <Quote className="h-5 w-5 text-white/60" />
              <blockquote className="mt-2 text-sm leading-relaxed text-white/90">
                {t("auth.testimonialQuote")}
              </blockquote>
              <figcaption className="mt-3 text-xs font-semibold uppercase tracking-wider text-white/70">
                {t("auth.testimonialAuthor")}
              </figcaption>
            </figure>
          </div>

          <p className="relative text-xs text-white/60">
            &copy; {new Date().getFullYear()} {APP_NAME}. {t("common.copyright")}
          </p>
        </div>

        {/* Form panel */}
        <div className="relative flex flex-1 items-center justify-center px-1 py-8 sm:px-6">
          <div className="absolute top-4 right-4 sm:top-6 sm:right-6">
            <ThemeToggle />
          </div>
          <div className="form-surface w-full max-w-md rounded-3xl p-8 sm:p-10">
            <div className="mb-8 text-center lg:text-left">
              <div className="mx-auto lg:mx-0 mb-5 flex h-14 w-14 items-center justify-center rounded-2xl bg-primary text-primary-foreground shadow-md shadow-primary/25 lg:hidden">
                <Heart className="h-7 w-7" fill="currentColor" />
              </div>
              <h2 className="font-display text-3xl font-bold tracking-tight">{title}</h2>
              <p className="mt-2 text-sm text-muted-foreground leading-relaxed">{description}</p>
            </div>

            {children}

            {footer && <div className="mt-8">{footer}</div>}
          </div>
        </div>
      </div>
    </div>
  );
}
