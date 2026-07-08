"use client";

import { useCallback, useEffect, useState } from "react";
import { usePathname } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { Download, Share, Smartphone, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { useTranslation } from "@/lib/i18n/context";
import {
  dismissInstallPrompt,
  isAndroidDevice,
  isIosDevice,
  isStandaloneDisplay,
  wasInstallDismissed,
} from "@/lib/pwa";
import { cn } from "@/lib/utils";

interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: "accepted" | "dismissed" }>;
}

const APP_ROUTE_PREFIXES = [
  "/dashboard",
  "/matches",
  "/chat",
  "/profile",
  "/notifications",
  "/questionnaire",
  "/payment",
];

export function InstallPrompt() {
  const pathname = usePathname();
  const { t } = useTranslation();
  const [visible, setVisible] = useState(false);
  const [showIosSteps, setShowIosSteps] = useState(false);
  const [deferredPrompt, setDeferredPrompt] =
    useState<BeforeInstallPromptEvent | null>(null);
  const [installing, setInstalling] = useState(false);

  const isAppArea = APP_ROUTE_PREFIXES.some((route) =>
    pathname?.startsWith(route)
  );

  useEffect(() => {
    if (isStandaloneDisplay() || wasInstallDismissed()) return;

    const isMobile =
      isIosDevice() ||
      isAndroidDevice() ||
      window.matchMedia("(max-width: 768px)").matches;

    if (!isMobile) return;

    if (isIosDevice()) {
      const timer = window.setTimeout(() => setVisible(true), 2500);
      return () => window.clearTimeout(timer);
    }

    const onBeforeInstall = (event: Event) => {
      event.preventDefault();
      setDeferredPrompt(event as BeforeInstallPromptEvent);
      setVisible(true);
    };

    window.addEventListener("beforeinstallprompt", onBeforeInstall);
    return () => {
      window.removeEventListener("beforeinstallprompt", onBeforeInstall);
    };
  }, []);

  const handleDismiss = useCallback(() => {
    dismissInstallPrompt();
    setVisible(false);
    setShowIosSteps(false);
  }, []);

  const handleAndroidInstall = useCallback(async () => {
    if (!deferredPrompt) return;
    setInstalling(true);
    try {
      await deferredPrompt.prompt();
      const { outcome } = await deferredPrompt.userChoice;
      if (outcome === "accepted") {
        setVisible(false);
      }
      setDeferredPrompt(null);
    } catch {
      // ignore
    } finally {
      setInstalling(false);
    }
  }, [deferredPrompt]);

  const isIos = isIosDevice();
  const canAndroidInstall = !!deferredPrompt;

  if (!visible || isStandaloneDisplay()) return null;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0, y: 24 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: 24 }}
        className={cn(
          "fixed z-[60] px-4 left-0 right-0 max-w-lg mx-auto",
          isAppArea
            ? "bottom-[calc(var(--app-tabbar,4rem)+0.75rem)]"
            : "bottom-4 sm:bottom-6"
        )}
      >
        <Card className="border-primary/20 shadow-xl shadow-primary/10 overflow-hidden">
          <CardContent className="p-4 sm:p-5">
            <div className="flex items-start gap-3">
              <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-primary/10 text-primary">
                {isIos ? (
                  <Share className="h-5 w-5" />
                ) : (
                  <Smartphone className="h-5 w-5" />
                )}
              </div>
              <div className="flex-1 min-w-0">
                <p className="font-semibold leading-snug">{t("pwa.title")}</p>
                <p className="text-sm text-muted-foreground mt-1 leading-relaxed">
                  {isIos ? t("pwa.iosDesc") : t("pwa.androidDesc")}
                </p>
              </div>
              <Button
                type="button"
                variant="ghost"
                size="icon"
                className="shrink-0 h-8 w-8 rounded-full"
                onClick={handleDismiss}
                aria-label={t("common.a11yClose")}
              >
                <X className="h-4 w-4" />
              </Button>
            </div>

            {isIos && showIosSteps && (
              <ol className="mt-4 space-y-2.5 text-sm text-muted-foreground border-t border-border pt-4">
                <li className="flex gap-2">
                  <span className="font-semibold text-primary shrink-0">1.</span>
                  <span>{t("pwa.iosStep1")}</span>
                </li>
                <li className="flex gap-2">
                  <span className="font-semibold text-primary shrink-0">2.</span>
                  <span>{t("pwa.iosStep2")}</span>
                </li>
                <li className="flex gap-2">
                  <span className="font-semibold text-primary shrink-0">3.</span>
                  <span>{t("pwa.iosStep3")}</span>
                </li>
              </ol>
            )}

            <div className="flex flex-col sm:flex-row gap-2 mt-4">
              {canAndroidInstall ? (
                <Button
                  className="flex-1 rounded-xl h-11"
                  onClick={() => void handleAndroidInstall()}
                  disabled={installing}
                >
                  <Download className="h-4 w-4 mr-2" />
                  {installing ? t("pwa.installing") : t("pwa.install")}
                </Button>
              ) : isIos ? (
                <Button
                  className="flex-1 rounded-xl h-11"
                  variant={showIosSteps ? "secondary" : "default"}
                  onClick={() => setShowIosSteps((value) => !value)}
                >
                  <Share className="h-4 w-4 mr-2" />
                  {showIosSteps ? t("pwa.hideSteps") : t("pwa.showSteps")}
                </Button>
              ) : null}
              <Button
                variant="outline"
                className="rounded-xl h-11 sm:shrink-0"
                onClick={handleDismiss}
              >
                {t("pwa.notNow")}
              </Button>
            </div>
          </CardContent>
        </Card>
      </motion.div>
    </AnimatePresence>
  );
}
