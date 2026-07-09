"use client";

import { useCallback, useEffect, useState } from "react";
import { usePathname } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { Download, MoreVertical, Share, Smartphone, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { useTranslation } from "@/lib/i18n/context";
import {
  clearDeferredInstallPrompt,
  getDeferredInstallPrompt,
  PWA_INSTALLABLE_EVENT,
  type BeforeInstallPromptEvent,
} from "@/lib/pwa-install";
import {
  dismissInstallPrompt,
  isAndroidDevice,
  isIosDevice,
  isStandaloneDisplay,
  wasInstallDismissed,
} from "@/lib/pwa";
import { cn } from "@/lib/utils";

const APP_ROUTE_PREFIXES = [
  "/dashboard",
  "/matches",
  "/likes",
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
  const [showManualSteps, setShowManualSteps] = useState(false);
  const [deferredPrompt, setDeferredPrompt] =
    useState<BeforeInstallPromptEvent | null>(null);
  const [installing, setInstalling] = useState(false);

  const isAppArea = APP_ROUTE_PREFIXES.some((route) =>
    pathname?.startsWith(route)
  );
  const isIos = isIosDevice();
  const isAndroid = isAndroidDevice();

  useEffect(() => {
    if (isStandaloneDisplay() || wasInstallDismissed()) return;

    const isMobile =
      isIos ||
      isAndroid ||
      window.matchMedia("(max-width: 768px)").matches;

    if (!isMobile) return;

    const syncPrompt = () => {
      const prompt = getDeferredInstallPrompt();
      if (prompt) {
        setDeferredPrompt(prompt);
        setVisible(true);
      }
    };

    syncPrompt();

    const onInstallable = () => syncPrompt();

    window.addEventListener(PWA_INSTALLABLE_EVENT, onInstallable);

    let timer: number | undefined;
    if (isIos) {
      timer = window.setTimeout(() => setVisible(true), 2000);
    } else if (isAndroid && !getDeferredInstallPrompt()) {
      timer = window.setTimeout(() => setVisible(true), 4000);
    }

    return () => {
      window.removeEventListener(PWA_INSTALLABLE_EVENT, onInstallable);
      if (timer) window.clearTimeout(timer);
    };
  }, [isAndroid, isIos]);

  const handleDismiss = useCallback(() => {
    dismissInstallPrompt();
    setVisible(false);
    setShowManualSteps(false);
  }, []);

  const handleAndroidInstall = useCallback(async () => {
    const prompt = deferredPrompt ?? getDeferredInstallPrompt();
    if (!prompt) {
      setShowManualSteps(true);
      return;
    }
    setInstalling(true);
    try {
      await prompt.prompt();
      const { outcome } = await prompt.userChoice;
      if (outcome === "accepted") {
        setVisible(false);
      }
      clearDeferredInstallPrompt();
      setDeferredPrompt(null);
    } catch {
      setShowManualSteps(true);
    } finally {
      setInstalling(false);
    }
  }, [deferredPrompt]);

  const canAndroidInstall = !!(deferredPrompt ?? getDeferredInstallPrompt());

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
            ? "bottom-[calc(var(--app-tabbar,3.5rem)+0.75rem+env(safe-area-inset-bottom))]"
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

            {isIos && showManualSteps && (
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

            {isAndroid && showManualSteps && (
              <ol className="mt-4 space-y-2.5 text-sm text-muted-foreground border-t border-border pt-4">
                <li className="flex gap-2">
                  <span className="font-semibold text-primary shrink-0">1.</span>
                  <span>{t("pwa.androidStep1")}</span>
                </li>
                <li className="flex gap-2">
                  <span className="font-semibold text-primary shrink-0">2.</span>
                  <span className="flex items-start gap-1.5">
                    <MoreVertical className="h-4 w-4 shrink-0 mt-0.5" />
                    {t("pwa.androidStep2")}
                  </span>
                </li>
                <li className="flex gap-2">
                  <span className="font-semibold text-primary shrink-0">3.</span>
                  <span>{t("pwa.androidStep3")}</span>
                </li>
              </ol>
            )}

            <div className="flex flex-col sm:flex-row gap-2 mt-4">
              {isAndroid ? (
                <Button
                  className="flex-1 rounded-xl h-11"
                  onClick={() => void handleAndroidInstall()}
                  disabled={installing}
                >
                  <Download className="h-4 w-4 mr-2" />
                  {installing
                    ? t("pwa.installing")
                    : canAndroidInstall
                      ? t("pwa.install")
                      : t("pwa.showSteps")}
                </Button>
              ) : isIos ? (
                <Button
                  className="flex-1 rounded-xl h-11"
                  variant={showManualSteps ? "secondary" : "default"}
                  onClick={() => setShowManualSteps((value) => !value)}
                >
                  <Share className="h-4 w-4 mr-2" />
                  {showManualSteps ? t("pwa.hideSteps") : t("pwa.showSteps")}
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
