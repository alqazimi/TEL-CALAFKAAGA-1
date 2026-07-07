import { Metadata } from "next";
import { CheckCircle2 } from "lucide-react";
import { MarketingPage } from "@/components/marketing/marketing-page";
import { AuthRegisterCta } from "@/components/auth/auth-register-cta";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { REGISTRATION_PRICE } from "@/lib/constants";

export const metadata: Metadata = {
  title: "Pricing",
};

const features = [
  "Create your account & complete your profile",
  "Compatibility-based match discovery",
  "Unlimited messaging with your matches",
  "Image sharing in chat",
  "Typing indicators & read receipts",
  "Priority member support",
];

export default function PricingPage() {
  return (
    <MarketingPage
      title="Simple, Transparent Pricing"
      subtitle={`One-time $${REGISTRATION_PRICE} registration — full access to Calaf.`}
    >
      <div className="max-w-lg mx-auto">
        <Card className="ring-2 ring-emerald-500 shadow-xl shadow-emerald-500/10">
          <CardHeader className="text-center">
            <CardTitle className="text-2xl">Calaf Membership</CardTitle>
            <div className="mt-2">
              <span className="text-4xl font-bold">${REGISTRATION_PRICE}</span>
              <span className="text-muted-foreground ml-2">one-time</span>
            </div>
            <p className="text-muted-foreground mt-2">
              Pay once when you join. No free tier — serious members only.
            </p>
          </CardHeader>
          <CardContent>
            <ul className="space-y-3 mb-8">
              {features.map((feature) => (
                <li key={feature} className="flex items-center gap-2 text-sm">
                  <CheckCircle2 className="h-4 w-4 text-emerald-500 shrink-0" />
                  {feature}
                </li>
              ))}
            </ul>
            <AuthRegisterCta
              registerLabel={`Join Now – $${REGISTRATION_PRICE}`}
              className="w-full"
              size="lg"
            />
          </CardContent>
        </Card>
      </div>
    </MarketingPage>
  );
}
