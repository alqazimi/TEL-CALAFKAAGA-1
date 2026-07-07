"use client";

import { useEffect } from "react";
import Link from "next/link";
import { Home, RefreshCw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useTranslation } from "@/lib/i18n/context";

export function ErrorPageContent({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  const { t } = useTranslation();

  useEffect(() => {
    console.error(error);
  }, [error]);

  return (
    <div className="gradient-hero flex min-h-[calc(100dvh-var(--app-header)-12rem)] items-center justify-center px-4 py-16">
      <div className="mx-auto max-w-lg text-center">
        <p className="text-5xl font-bold tracking-tight text-destructive/40 sm:text-6xl">!</p>
        <h1 className="mt-4 font-display text-3xl font-bold tracking-tight sm:text-4xl">
          {t("errorPage.title")}
        </h1>
        <p className="mt-4 text-muted-foreground leading-relaxed">{t("errorPage.subtitle")}</p>
        <div className="mt-8 flex flex-col items-center justify-center gap-3 sm:flex-row">
          <Button size="lg" onClick={reset}>
            <RefreshCw className="mr-2 h-4 w-4" />
            {t("errorPage.tryAgain")}
          </Button>
          <Button asChild variant="outline" size="lg">
            <Link href="/">
              <Home className="mr-2 h-4 w-4" />
              {t("errorPage.backHome")}
            </Link>
          </Button>
        </div>
      </div>
    </div>
  );
}
