"use client";

import { useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { useAction } from "convex/react";
import { Check, Loader2 } from "lucide-react";
import { api } from "../../../../../convex/_generated/api";
import { DashboardLayout } from "@/components/layout/dashboard-layout";
import { Button } from "@/components/ui/button";

export default function PaymentSuccessPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const sessionId = searchParams.get("session_id");
  const verifyCheckout = useAction(api.stripeActions.verifyCheckoutSession);
  const [status, setStatus] = useState<"loading" | "success" | "error">("loading");
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!sessionId) {
      setStatus("error");
      setError("Missing payment session.");
      return;
    }

    let cancelled = false;

    async function verify() {
      try {
        await verifyCheckout({ sessionId: sessionId! });
        if (!cancelled) setStatus("success");
      } catch (err) {
        if (!cancelled) {
          setStatus("error");
          setError(
            err instanceof Error ? err.message : "Could not verify payment."
          );
        }
      }
    }

    void verify();
    return () => {
      cancelled = true;
    };
  }, [sessionId, verifyCheckout]);

  return (
    <DashboardLayout>
      <div className="max-w-lg mx-auto text-center py-16 px-4">
        {status === "loading" && (
          <>
            <Loader2 className="h-10 w-10 animate-spin text-primary mx-auto mb-4" />
            <h1 className="text-2xl font-bold mb-2">Confirming payment...</h1>
            <p className="text-muted-foreground">
              Please wait while we verify your payment with Stripe.
            </p>
          </>
        )}

        {status === "success" && (
          <>
            <div className="flex h-16 w-16 items-center justify-center rounded-full bg-emerald-100 text-emerald-600 mx-auto mb-4">
              <Check className="h-8 w-8" />
            </div>
            <h1 className="text-2xl font-bold mb-2">Payment successful</h1>
            <p className="text-muted-foreground mb-6">
              Thank you! Now complete your profile questionnaire to start matching.
            </p>
            <Button onClick={() => router.push("/questionnaire")}>
              Continue to Profile Setup
            </Button>
          </>
        )}

        {status === "error" && (
          <>
            <h1 className="text-2xl font-bold mb-2">Payment verification failed</h1>
            <p className="text-muted-foreground mb-6">{error}</p>
            <div className="flex flex-col sm:flex-row gap-3 justify-center">
              <Button onClick={() => router.push("/payment")}>Try Again</Button>
              <Button variant="outline" onClick={() => router.push("/dashboard")}>
                Go to Dashboard
              </Button>
            </div>
          </>
        )}
      </div>
    </DashboardLayout>
  );
}
