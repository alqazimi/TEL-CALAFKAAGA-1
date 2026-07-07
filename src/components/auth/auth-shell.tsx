"use client";

import type { ReactNode } from "react";
import Link from "next/link";
import { Heart, Shield, Users, Sparkles } from "lucide-react";
import { APP_NAME } from "@/lib/constants";
import { useTranslation } from "@/lib/i18n/context";

interface AuthShellProps {
  title: string;
  description: string;
  children: ReactNode;
  footer?: ReactNode;
}

export function AuthShell({ title, description, children, footer }: AuthShellProps) {
  const { t } = useTranslation();

  const features = [
    { icon: Shield, text: t("auth.feature1") },
    { icon: Users, text: t("auth.feature2") },
    { icon: Sparkles, text: t("auth.feature3") },
  ];

  return (
    <div className="auth-bg min-h-[calc(100dvh-var(--app-header))]">
      <div className="mx-auto flex min-h-[calc(100dvh-var(--app-header)-2rem)] max-w-6xl flex-col lg:flex-row py-6">
        <div className="hidden lg:flex lg:w-[44%] flex-col justify-between p-12 xl:p-16">
          <Link href="/" className="inline-flex items-center gap-2.5 w-fit">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary text-primary-foreground shadow-md">
              <Heart className="h-5 w-5" />
            </div>
            <span className="font-display text-xl font-semibold tracking-tight">{APP_NAME}</span>
          </Link>

          <div className="space-y-8">
            <div>
              <h1 className="font-display text-3xl xl:text-4xl font-semibold tracking-tight leading-[1.15]">
                {t("auth.findMatch")}
              </h1>
              <p className="mt-4 text-muted-foreground text-lg leading-relaxed max-w-md">
                {t("auth.findMatchDesc")}
              </p>
            </div>

            <ul className="space-y-4">
              {features.map(({ icon: Icon, text }) => (
                <li key={text} className="flex items-center gap-3 text-sm text-muted-foreground">
                  <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-accent text-accent-foreground">
                    <Icon className="h-4 w-4" />
                  </div>
                  {text}
                </li>
              ))}
            </ul>
          </div>

          <p className="text-xs text-muted-foreground">
            &copy; {new Date().getFullYear()} {APP_NAME}. {t("common.copyright")}
          </p>
        </div>

        <div className="flex flex-1 items-center justify-center px-4 py-10 sm:px-8 lg:px-12">
          <div className="form-surface w-full max-w-md rounded-2xl p-8 sm:p-10">
            <div className="mb-8 text-center lg:text-left">
              <div className="mx-auto lg:mx-0 mb-5 flex h-12 w-12 items-center justify-center rounded-xl bg-primary text-primary-foreground shadow-md lg:hidden">
                <Heart className="h-6 w-6" />
              </div>
              <h2 className="font-display text-2xl font-semibold tracking-tight">{title}</h2>
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
