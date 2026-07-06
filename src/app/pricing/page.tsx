import { Metadata } from "next";
import { CheckCircle2 } from "lucide-react";
import { MarketingPage } from "@/components/marketing/marketing-page";
import { AuthRegisterCta } from "@/components/auth/auth-register-cta";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { CHAT_UNLOCK_PRICE } from "@/lib/constants";

export const metadata: Metadata = {
  title: "Pricing",
};

const plans = [
  {
    name: "Browse",
    price: "Free",
    description: "Explore profiles and discover your matches.",
    features: [
      "Create your profile",
      "Complete questionnaire",
      "View compatibility scores",
      "Like and pass on profiles",
      "Receive match notifications",
    ],
    cta: "Get Started",
    href: "/register",
    highlighted: false,
  },
  {
    name: "Connect",
    price: `$${CHAT_UNLOCK_PRICE}`,
    description: "One-time payment to unlock chat with your matches.",
    features: [
      "Everything in Browse",
      "Unlimited chat with matches",
      "Image sharing in chat",
      "Typing indicators",
      "Read receipts",
      "Priority support",
    ],
    cta: "Start Free, Pay to Chat",
    href: "/register",
    highlighted: true,
  },
];

export default function PricingPage() {
  return (
    <MarketingPage
      title="Simple, Transparent Pricing"
      subtitle="Browse for free. Pay only when you're ready to connect."
    >
      <div className="grid grid-cols-1 gap-8 md:grid-cols-2 max-w-4xl mx-auto">
        {plans.map((plan) => (
          <Card
            key={plan.name}
            className={
              plan.highlighted
                ? "ring-2 ring-emerald-500 shadow-xl shadow-emerald-500/10"
                : ""
            }
          >
            <CardHeader>
              <CardTitle className="text-2xl">{plan.name}</CardTitle>
              <div className="mt-2">
                <span className="text-4xl font-bold">{plan.price}</span>
                {plan.highlighted && (
                  <span className="text-gray-500 ml-2">one-time</span>
                )}
              </div>
              <p className="text-gray-500 dark:text-gray-400 mt-2">
                {plan.description}
              </p>
            </CardHeader>
            <CardContent>
              <ul className="space-y-3 mb-8">
                {plan.features.map((feature) => (
                  <li key={feature} className="flex items-center gap-2 text-sm">
                    <CheckCircle2 className="h-4 w-4 text-emerald-500 shrink-0" />
                    {feature}
                  </li>
                ))}
              </ul>
              <AuthRegisterCta
                registerHref={plan.href}
                registerLabel={plan.cta}
                className="w-full"
                size="lg"
                variant={plan.highlighted ? "default" : "outline"}
              />
            </CardContent>
          </Card>
        ))}
      </div>
    </MarketingPage>
  );
}
