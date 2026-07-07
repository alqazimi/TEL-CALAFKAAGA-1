"use client";

import { useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { useAction } from "convex/react";
import { Check, Headphones, Loader2, MessageCircle } from "lucide-react";
import { api } from "../../../../../convex/_generated/api";
import { DashboardLayout } from "@/components/layout/dashboard-layout";
import { Button } from "@/components/ui/button";
import { useTranslation } from "@/lib/i18n/context";
import { WHATSAPP_URL } from "@/lib/constants";

export default function PaymentSuccessPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const sessionId = searchParams.get("session_id");
  const verifyCheckout = useAction(api.stripeActions.verifyCheckoutSession);
  const [status, setStatus] = useState<"loading" | "success" | "error">("loading");
  const [isPremium, setIsPremium] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { t } = useTranslation();

  useEffect(() => {
    if (!sessionId) {
      setStatus("error");
      setError(t("payment.missingSession"));
      return;
    }

    let cancelled = false;

    async function verify() {
      try {
        const result = await verifyCheckout({ sessionId: sessionId! });
        if (!cancelled) {
          setIsPremium(result.isPremium);
          setStatus("success");
        }
      } catch (err) {
        if (!cancelled) {
          setStatus("error");
          setError(
            err instanceof Error ? err.message : t("payment.verifyFailed")
          );
        }
      }
    }

    void verify();
    return () => {
      cancelled = true;
    };
  }, [sessionId, verifyCheckout, t]);

  return (
    <DashboardLayout>
      <div className="max-w-lg mx-auto text-center py-16 px-4">
        {status === "loading" && (
          <>
            <Loader2 className="h-10 w-10 animate-spin text-primary mx-auto mb-4" />
            <h1 className="text-2xl font-bold mb-2">{t("payment.confirming")}</h1>
            <p className="text-muted-foreground">{t("payment.confirmingDesc")}</p>
          </>
        )}

        {status === "success" && (
          <>
            <div className="flex h-16 w-16 items-center justify-center rounded-full bg-accent text-primary mx-auto mb-4">
              {isPremium ? (
                <Headphones className="h-8 w-8" />
              ) : (
                <Check className="h-8 w-8" />
              )}
            </div>
            <h1 className="text-2xl font-bold mb-2">{t("payment.success")}</h1>
            <p className="text-muted-foreground mb-6">
              {isPremium ? t("payment.premiumSuccessDesc") : t("payment.successDesc")}
            </p>
            <div className="flex flex-col sm:flex-row gap-3 justify-center">
              {isPremium && (
                <Button asChild>
                  <a href={WHATSAPP_URL} target="_blank" rel="noopener noreferrer">
                    <MessageCircle className="h-4 w-4 mr-2" />
                    {t("payment.premiumWhatsApp")}
                  </a>
                </Button>
              )}
              <Button
                variant={isPremium ? "outline" : "default"}
                onClick={() => router.push("/questionnaire")}
              >
                {t("payment.continueSetup")}
              </Button>
            </div>
          </>
        )}

        {status === "error" && (
          <>
            <h1 className="text-2xl font-bold mb-2">{t("payment.verifyFailed")}</h1>
            <p className="text-muted-foreground mb-6">{error}</p>
            <div className="flex flex-col sm:flex-row gap-3 justify-center">
              <Button onClick={() => router.push("/payment")}>{t("payment.tryAgain")}</Button>
              <Button variant="outline" onClick={() => router.push("/dashboard")}>
                {t("common.goToDashboard")}
              </Button>
            </div>
          </>
        )}
      </div>
    </DashboardLayout>
  );
}
