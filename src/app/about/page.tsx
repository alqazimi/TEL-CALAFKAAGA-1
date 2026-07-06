import { Metadata } from "next";
import { MarketingPage } from "@/components/marketing/marketing-page";
import { APP_NAME } from "@/lib/constants";

export const metadata: Metadata = {
  title: "About",
};

export default function AboutPage() {
  return (
    <MarketingPage
      title={`About ${APP_NAME}`}
      subtitle="Building meaningful connections in the Muslim community."
    >
      <div className="prose prose-gray dark:prose-invert max-w-none space-y-6">
        <p className="text-lg text-gray-600 dark:text-gray-400 leading-relaxed">
          {APP_NAME} was founded with a simple mission: to help Muslims find their
          halal life partner in a modern, respectful, and secure environment. We
          understand that marriage is one of the most important decisions in life,
          and we are committed to making that journey as smooth and meaningful as
          possible.
        </p>
        <p className="text-gray-600 dark:text-gray-400 leading-relaxed">
          Our platform combines cutting-edge technology with Islamic values. Every
          feature — from our compatibility algorithm to our privacy controls — is
          designed with the Muslim community in mind. We believe that finding a
          spouse should be dignified, intentional, and guided by faith.
        </p>
        <h2 className="text-2xl font-bold mt-8">Our Values</h2>
        <ul className="space-y-3 text-gray-600 dark:text-gray-400">
          <li><strong>Halal:</strong> Every interaction on our platform respects Islamic principles.</li>
          <li><strong>Privacy:</strong> Your personal information is protected with industry-leading security.</li>
          <li><strong>Authenticity:</strong> We verify profiles to maintain a trustworthy community.</li>
          <li><strong>Intention:</strong> Our platform is exclusively for those seeking marriage.</li>
        </ul>
      </div>
    </MarketingPage>
  );
}
