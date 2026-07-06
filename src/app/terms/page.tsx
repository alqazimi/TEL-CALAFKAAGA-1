import { Metadata } from "next";
import { MarketingPage } from "@/components/marketing/marketing-page";
import { APP_NAME } from "@/lib/constants";

export const metadata: Metadata = {
  title: "Terms of Service",
};

export default function TermsPage() {
  return (
    <MarketingPage title="Terms of Service" subtitle={`Last updated: ${new Date().toLocaleDateString()}`}>
      <div className="prose prose-gray dark:prose-invert max-w-3xl mx-auto space-y-6 text-gray-600 dark:text-gray-400">
        <section>
          <h2 className="text-xl font-bold text-foreground">1. Acceptance of Terms</h2>
          <p>By accessing and using {APP_NAME}, you agree to be bound by these Terms of Service and all applicable laws and regulations.</p>
        </section>
        <section>
          <h2 className="text-xl font-bold text-foreground">2. Eligibility</h2>
          <p>You must be at least 18 years old and legally able to enter into marriage to use our services. {APP_NAME} is exclusively for individuals seeking marriage.</p>
        </section>
        <section>
          <h2 className="text-xl font-bold text-foreground">3. User Conduct</h2>
          <p>Users must interact respectfully and in accordance with Islamic principles. Harassment, inappropriate content, or misuse of the platform will result in account termination.</p>
        </section>
        <section>
          <h2 className="text-xl font-bold text-foreground">4. Payments</h2>
          <p>Chat unlock requires a one-time payment of $15. All payments are processed securely through Stripe. Refunds are handled on a case-by-case basis.</p>
        </section>
        <section>
          <h2 className="text-xl font-bold text-foreground">5. Account Termination</h2>
          <p>We reserve the right to suspend or terminate accounts that violate these terms. You may delete your account at any time.</p>
        </section>
        <section>
          <h2 className="text-xl font-bold text-foreground">6. Limitation of Liability</h2>
          <p>{APP_NAME} facilitates connections but does not guarantee marriage outcomes. We are not responsible for interactions between users outside our platform.</p>
        </section>
      </div>
    </MarketingPage>
  );
}
