"use client";

import { useAction } from "convex/react";
import { useState } from "react";
import { toast } from "sonner";
import { CreditCard, Lock, ShieldCheck, Sparkles } from "lucide-react";
import { api } from "../../../convex/_generated/api";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { REGISTRATION_PRICE } from "@/lib/constants";

export function PaymentCheckoutButton({
  className,
  size = "lg",
}: {
  className?: string;
  size?: "default" | "sm" | "lg";
}) {
  const createCheckout = useAction(api.stripeActions.createRegistrationCheckout);
  const [loading, setLoading] = useState(false);

  const handlePay = async () => {
    setLoading(true);
    try {
      const { url } = await createCheckout({});
      window.location.href = url;
    } catch (error) {
      const raw =
        error instanceof Error ? error.message : "Payment failed. Please try again.";
      const message = /invalid api key/i.test(raw)
        ? "Payment is not configured yet. The Stripe secret key on Convex must be fixed."
        : raw;
      toast.error(message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Button
      onClick={handlePay}
      disabled={loading}
      size={size}
      className={className}
    >
      <CreditCard className="h-4 w-4 mr-2" />
      {loading ? "Redirecting to Stripe..." : `Pay $${REGISTRATION_PRICE}`}
    </Button>
  );
}

interface PaymentGateProps {
  title?: string;
  description?: string;
}

export function PaymentGate({
  title = "Complete Your Registration",
  description = `Pay the one-time $${REGISTRATION_PRICE} registration fee to activate your account. After payment, you'll complete your profile questionnaire.`,
}: PaymentGateProps) {
  return (
    <div className="max-w-lg mx-auto py-8 px-2">
      <Card className="overflow-hidden text-center border-gray-100 dark:border-gray-800 shadow-xl shadow-emerald-500/5">
        <div className="h-1.5 bg-gradient-to-r from-emerald-400 via-emerald-500 to-teal-500" />
        <CardContent className="p-8 space-y-6">
          <div className="relative mx-auto w-fit">
            <div className="flex h-20 w-20 items-center justify-center rounded-full bg-gradient-to-br from-emerald-100 to-emerald-50 text-emerald-600 dark:from-emerald-900/60 dark:to-emerald-950/40 dark:text-emerald-300">
              <Lock className="h-9 w-9" />
            </div>
          </div>

          <div className="space-y-2">
            <h1 className="text-2xl font-bold tracking-tight">{title}</h1>
            <p className="text-muted-foreground leading-relaxed">{description}</p>
          </div>

          <div className="rounded-2xl bg-gray-50 dark:bg-gray-900/50 p-5 space-y-3 text-left">
            <div className="flex items-baseline gap-2">
              <span className="text-4xl font-bold text-primary">${REGISTRATION_PRICE}</span>
              <span className="text-sm text-muted-foreground">one-time</span>
            </div>
            <ul className="space-y-2 text-sm text-muted-foreground">
              <li className="flex items-center gap-2">
                <Sparkles className="h-4 w-4 text-emerald-500 shrink-0" />
                Activate your Calaf account
              </li>
              <li className="flex items-center gap-2">
                <Sparkles className="h-4 w-4 text-emerald-500 shrink-0" />
                Complete your profile questionnaire
              </li>
              <li className="flex items-center gap-2">
                <Sparkles className="h-4 w-4 text-emerald-500 shrink-0" />
                Browse matches and message
              </li>
              <li className="flex items-center gap-2">
                <ShieldCheck className="h-4 w-4 text-emerald-500 shrink-0" />
                Secure payment via Stripe
              </li>
            </ul>
          </div>

          <PaymentCheckoutButton className="w-full" />

          <p className="text-xs text-muted-foreground">
            Secure checkout powered by Stripe. One payment, lifetime access.
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
