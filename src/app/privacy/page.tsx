import { Metadata } from "next";
import { MarketingPage } from "@/components/marketing/marketing-page";
import { APP_NAME } from "@/lib/constants";

export const metadata: Metadata = {
  title: "Privacy Policy",
};

export default function PrivacyPage() {
  return (
    <MarketingPage title="Privacy Policy" subtitle={`Last updated: ${new Date().toLocaleDateString()}`}>
      <div className="prose prose-gray dark:prose-invert max-w-3xl mx-auto space-y-6 text-gray-600 dark:text-gray-400">
        <section>
          <h2 className="text-xl font-bold text-foreground">1. Information We Collect</h2>
          <p>When you use {APP_NAME}, we collect information you provide directly, including your name, email, profile details, questionnaire responses, and messages.</p>
        </section>
        <section>
          <h2 className="text-xl font-bold text-foreground">2. How We Use Your Information</h2>
          <p>We use your information to provide our matchmaking services, calculate compatibility scores, facilitate communication between matches, and improve our platform.</p>
        </section>
        <section>
          <h2 className="text-xl font-bold text-foreground">3. Data Protection</h2>
          <p>We implement industry-standard security measures including encryption, secure servers, and regular security audits to protect your personal information.</p>
        </section>
        <section>
          <h2 className="text-xl font-bold text-foreground">4. Data Sharing</h2>
          <p>We never sell your personal data. Profile information is only visible to other users according to your privacy settings and match status.</p>
        </section>
        <section>
          <h2 className="text-xl font-bold text-foreground">5. Your Rights</h2>
          <p>You have the right to access, update, or delete your personal data at any time through your account settings or by contacting us.</p>
        </section>
        <section>
          <h2 className="text-xl font-bold text-foreground">6. Contact</h2>
          <p>For privacy-related inquiries, please contact us at privacy@calaf.com.</p>
        </section>
      </div>
    </MarketingPage>
  );
}
